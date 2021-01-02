/////////////////////////////////////////////////////
//*-----------------------------------------------*//
//| Part of Throw Out (https://www.maus-games.at) |//
//*-----------------------------------------------*//
//| Released under the zlib License               |//
//| More information available in the readme file |//
//*-----------------------------------------------*//
/////////////////////////////////////////////////////
"use strict";


// ****************************************************************
const C_PADDLE_RANGE = 0.3;


// ****************************************************************
cPaddle.s_pModel  = null;
cPaddle.s_pShader = null;


// ****************************************************************
cPaddle.Init = function(bHigh)
{
    // define model
    if(cPaddle.s_pModel !== null) cPaddle.s_pModel.Destructor();
    if(bHigh) cPaddle.s_pModel = new windModel().Create(RES.cPaddle.s_afVertexData,    RES.cPaddle.s_aiIndexData);
         else cPaddle.s_pModel = new windModel().Create(RES.cPaddle.s_afVertexDataLow, RES.cPaddle.s_aiIndexDataLow);

    // define shader-program
    if(cPaddle.s_pShader === null) cPaddle.s_pShader = new windShader().Create(RES.cPaddle.s_sVertexShader, RES.cPaddle.s_sFragmentShader);
};


// ****************************************************************
cPaddle.Exit = function()
{
    // clear model and shader-program
    cPaddle.s_pModel .Destructor();
    cPaddle.s_pShader.Destructor();
};


// ****************************************************************
function cPaddle(vDirX, vDirY)
{
    // create properties
    this.m_vPosition   = vec3.fromValues(0.0, 0.0, 1.25);
    this.m_vDirection  = vec3.fromValues(vDirX, vDirY, 0.0);
    this.m_vSize       = vec3.fromValues(0.0, 0.0, 1.2);
    this.m_mTransform  = mat4.create();

    this.m_vColor      = vec3.fromValues(1.0, 1.0, 1.0);
    this.m_fBump       = 0.0;
    this.m_bWall       = true;
    this.m_bShield     = false;
    this.m_bTeleporter = false;

    // (for cleaner bump animation)
    this.m_avAnimSize  = [vec2.create(), vec2.create()];
    this.m_avAnimColor = [vec3.fromValues(1.0, 1.0, 1.0), vec3.fromValues(1.0, 1.0, 1.0)];
}


// ****************************************************************
cPaddle.prototype.Render = function()
{
    // calculate non-linear scaling value
    const fLength = Math.max(this.m_vSize[0]-1.8, 0.0)*0.5;

    // enable the shader-program
    cPaddle.s_pShader.Enable();

    // update all object uniforms
    cPaddle.s_pShader.SendUniformMat4 ("u_m4ModelView",     mat4.mul(g_mMatrix, WIND.g_mCamera,     this.m_mTransform), false);
    cPaddle.s_pShader.SendUniformMat4 ("u_m4ModelViewProj", mat4.mul(g_mMatrix, WIND.g_mProjection, g_mMatrix),         false);
    cPaddle.s_pShader.SendUniformVec3 ("u_v3Color",         this.m_vColor);
    cPaddle.s_pShader.SendUniformFloat("u_fLength",              3.6*fLength);
    cPaddle.s_pShader.SendUniformFloat("u_fLengthDiv",      1.0/(1.0+fLength));

    // draw the model
    cPaddle.s_pModel.Draw();
};


// ****************************************************************
cPaddle.prototype.Move = function()
{
    const fTime  = WIND.g_fTime*2.0;
    const fSpeed = WIND.g_fTime*30.0;
    const iX     = this.m_vDirection[0] ? 0 : 1;
    const iY     = this.m_vDirection[0] ? 1 : 0;

    // set paddle position
    if(this.m_bWall) this.m_vPosition[iY] *= 1.0 - fTime;
    else
    {
        // move paddle with the mouse cursor
        const fSmooth = UTILS.Clamp((9.0 - this.m_vSize[0])*0.25, 0.0, 1.0);
        const fWide   = 33.5 - this.m_vSize[0] * 3.6;
        this.m_vPosition[iY] = UTILS.Clamp(WIND.g_vMousePos[iY] * (iY ? 92.4 : 66.0), -fWide, fWide) * fSmooth * (iY ? -1.0 : 1.0);
    }
    this.m_vPosition[iX] = -33.0*this.m_vDirection[iX];

    // update bump-effect
    this.m_fBump = Math.max(this.m_fBump-fTime, 0.0);

    // update size
    this.m_avAnimSize[0][0] += ((this.m_bWall ? 9.2  : (this.m_bShield ? 2.2 : 1.2)) - this.m_avAnimSize[0][0]) * fTime;
    this.m_avAnimSize[0][1] += (1.25                                                 - this.m_avAnimSize[0][1]) * fTime;
    this.m_avAnimSize[1][0] += ((this.m_fBump*0.300)                                 - this.m_avAnimSize[1][0]) * fSpeed;
    this.m_avAnimSize[1][1] += ((this.m_fBump*0.375)                                 - this.m_avAnimSize[1][1]) * fSpeed;
    vec2.add(this.m_vSize, this.m_avAnimSize[0], this.m_avAnimSize[1]);

    // update color
    if(this.m_bTeleporter)  vec3.set(g_vVector, 0.888, 0.416, 1.250);
    else if(this.m_bShield) vec3.set(g_vVector, 0.871, 0.983, 0.049);
                       else vec3.set(g_vVector, 0.102, 0.702, 1.000);

    let fFactor = (this.m_bWall ? 0.7 : 1.0);
    this.m_avAnimColor[0][0] += (g_vVector[0]*fFactor - this.m_avAnimColor[0][0])*fTime;
    this.m_avAnimColor[0][1] += (g_vVector[1]*fFactor - this.m_avAnimColor[0][1])*fTime;
    this.m_avAnimColor[0][2] += (g_vVector[2]*fFactor - this.m_avAnimColor[0][2])*fTime;

    fFactor = Math.max(this.m_fBump-0.4, 0.0)*0.7;
    this.m_avAnimColor[1][0] += (g_vVector[0]*fFactor - this.m_avAnimColor[1][0])*fSpeed;
    this.m_avAnimColor[1][1] += (g_vVector[1]*fFactor - this.m_avAnimColor[1][1])*fSpeed;
    this.m_avAnimColor[1][2] += (g_vVector[2]*fFactor - this.m_avAnimColor[1][2])*fSpeed;

    vec3.add(this.m_vColor, this.m_avAnimColor[0], this.m_avAnimColor[1]);

    // update transformation matrix
    mat4.identity (this.m_mTransform);
    mat4.translate(this.m_mTransform, this.m_mTransform, this.m_vPosition);
    mat4.rotateZ  (this.m_mTransform, this.m_mTransform, this.m_vDirection[0] ? Math.PI*0.5 : 0.0);
    mat4.scale    (this.m_mTransform, this.m_mTransform, this.m_vSize);
};