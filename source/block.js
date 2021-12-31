/////////////////////////////////////////////////////
//*-----------------------------------------------*//
//| Part of Throw Out (https://www.maus-games.at) |//
//*-----------------------------------------------*//
//| Copyright (c) 2014 Martin Mauersics           |//
//| Released under the zlib License               |//
//*-----------------------------------------------*//
/////////////////////////////////////////////////////
"use strict";


// ****************************************************************
const C_BLOCK_SIZE     = 1.3;
const C_BLOCK_DIST     = 3.0;
const C_BLOCK_BALL_OFF = C_BLOCK_SIZE+C_BALL_SIZE;


// ****************************************************************
cBlock.s_pModel  = null;
cBlock.s_pShader = null;

// size vector
cBlock.s_vSize = vec3.fromValues(2.1, 2.1, 2.0);


// ****************************************************************
cBlock.Init = function(bHigh)
{
    // define model
    if(cBlock.s_pModel !== null) cBlock.s_pModel.Destructor();
    if(bHigh) cBlock.s_pModel = new windModel().Create(RES.cBlock.s_afVertexData,    RES.cBlock.s_aiIndexData);
         else cBlock.s_pModel = new windModel().Create(RES.cBlock.s_afVertexDataLow, RES.cBlock.s_aiIndexDataLow);

    // define shader-program
    if(cBlock.s_pShader === null) cBlock.s_pShader = new windShader().Create(RES.cBlock.s_sVertexShader, RES.cBlock.s_sFragmentShader);
};


// ****************************************************************
cBlock.Exit = function()
{
    // clear model and shader-program
    cBlock.s_pModel .Destructor();
    cBlock.s_pShader.Destructor();
};


// ****************************************************************
function cBlock()
{
    // create properties
    this.m_vPosition  = vec3.create();
    this.m_mTransform = mat4.create();
    this.m_mNormal    = mat3.create();

    this.m_vColor     = vec4.create();
    this.m_iType      = 0;

    this.m_vFlyDir    = vec3.create();
    this.m_vFlyAxis   = vec3.create();
    this.m_fFlyTime   = 0.0;

    this.m_bActive    = false;
    this.m_bFlying    = true;
    this.m_fHealth    = 0.0;
}


// ****************************************************************
cBlock.prototype.Render = function()
{
    if(!this.m_bActive) return;

    // enable the shader-program
    cBlock.s_pShader.Enable();

    // update all object uniforms
    cBlock.s_pShader.SendUniformMat4("u_m4ModelView",     mat4.mul(g_mMatrix, WIND.g_mCamera,     this.m_mTransform), false);
    cBlock.s_pShader.SendUniformMat4("u_m4ModelViewProj", mat4.mul(g_mMatrix, WIND.g_mProjection, g_mMatrix),         false);
    cBlock.s_pShader.SendUniformMat3("u_m3Normal",        this.m_mNormal, false);
    cBlock.s_pShader.SendUniformVec4("u_v4Color",         this.m_vColor);
    cBlock.s_pShader.SendUniformInt ("u_iType",           this.m_iType);

    // draw the model (# performance hotspot)
    cBlock.s_pModel.Draw();
};


// ****************************************************************
cBlock.prototype.Move = function()
{
    if(!this.m_bActive) return;

    if(this.m_bFlying)
    {
        // fly through the air
        this.m_vPosition[0] += this.m_vFlyDir[0]*g_fBlockTime;
        this.m_vPosition[1] += this.m_vFlyDir[1]*g_fBlockTime;
        this.m_vPosition[2] += this.m_vFlyDir[2]*g_fBlockTime;

        // reduce fly-speed and fly-angle
        const fFactor = 1.0-g_fBlockTime*0.2;
        this.m_vFlyDir[0] *= fFactor;
        this.m_vFlyDir[1] *= fFactor;
        this.m_vFlyDir[2] -= 50.0*g_fBlockTime;

        // increase current fly-time for rotation
        this.m_fFlyTime += g_fBlockTime*5.0;

        // fade out the object
        if(this.m_vPosition[2] < 0.0) this.m_vColor[3] = 1.0 + this.m_vPosition[2]*0.01;
        if(this.m_vColor[3] <= 0.0) this.m_bActive = false;

        // update transformation matrix
        this.UpdateTransform();

        // add rotation
        mat4.identity(g_mMatrix);
        mat4.rotate  (g_mMatrix, g_mMatrix, this.m_fFlyTime, this.m_vFlyAxis);
        mat4.mul     (this.m_mTransform, this.m_mTransform, g_mMatrix);

        // set normal matrix (only rotation inverted and transposed)
        mat3.fromMat4 (this.m_mNormal, g_mMatrix);
        mat3.invert   (this.m_mNormal, this.m_mNormal);
        mat3.transpose(this.m_mNormal, this.m_mNormal);
    }
    else if(this.m_vPosition[2] > 1.0)
    {
        // glide down
        this.m_vPosition[2] = Math.max(this.m_vPosition[2] - Math.min((this.m_vPosition[2]-0.8)*4.0, 130.0)*g_fBlockTime, 1.0);

        // update transformation matrix
        this.UpdateTransform();
    }
};


// ****************************************************************
cBlock.prototype.UpdateTransform = function()
{
    // update transformation matrix
    mat4.identity (this.m_mTransform);
    mat4.translate(this.m_mTransform, this.m_mTransform, this.m_vPosition);
    mat4.scale    (this.m_mTransform, this.m_mTransform, cBlock.s_vSize);
};

cBlock.prototype.UpdateTransformRotated = function(fAngle)
{
    // update transformation matrix
    mat4.identity (this.m_mTransform);
    mat4.translate(this.m_mTransform, this.m_mTransform, this.m_vPosition);
    mat4.rotateZ  (this.m_mTransform, this.m_mTransform, fAngle);
    mat4.scale    (this.m_mTransform, this.m_mTransform, cBlock.s_vSize);
};


// ****************************************************************
cBlock.prototype.Activate = function()
{
    this.m_vColor[3] = 1.0;
    this.m_bActive   = true;
    this.m_bFlying   = false;
};


// ****************************************************************
cBlock.prototype.Reset = function()
{
    vec3.set(this.m_vPosition, 0.0, 0.0, 1.0);
    mat3.identity(this.m_mNormal);

    vec3.set(this.m_vFlyDir,  0.0, 0.0, 0.0);
    vec3.set(this.m_vFlyAxis, 0.0, 0.0, 0.0);
    this.m_fFlyTime = 0.0;
};


// ****************************************************************
cBlock.prototype.Throw = function(vDirection, fHeight)
{
    // set block flying
    this.m_bFlying = true;

    // kick block away
    this.m_vFlyDir[0] = vDirection[0]*70.0;
    this.m_vFlyDir[1] = vDirection[1]*70.0;
    this.m_vFlyDir[2] = fHeight;

    // spin block randomly
    vec3.random(this.m_vFlyAxis);
};


// ****************************************************************
cBlock.prototype.IsHit = function()
{
    const bHit = this.m_bFlying && this.m_bActive && (this.m_fHealth < 0.0);
    this.m_fHealth = Math.max(this.m_fHealth, 0.0);
    return bHit;
};


// ****************************************************************
cBlock.IsHitAny = function(iFrom, iTo)
{
    for(let i = iFrom; i < iTo; ++i)
    {
        if(g_pBlock[i].IsHit())
            return true;
    }
    return false;
};