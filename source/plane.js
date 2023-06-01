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
cPlane.s_pModel   = null;
cPlane.s_pShader  = null;
cPlane.s_pTexture = null;

// saved texture text values
cPlane.s_fDisplayTop    = -1.0;
cPlane.s_fDisplayMiddle = -1.0;
cPlane.s_fDisplayBottom = -1.0;
cPlane.s_sDisplayText   = "";

// pre-allocated function variables
cPlane.s_vPrePos = vec2.create();


// ****************************************************************
cPlane.Init = function(bHigh)
{
    // define model and shader-program
    if(cPlane.s_pModel  === null) cPlane.s_pModel  = new windModel ().Create(RES.cPlane.s_afVertexData,  RES.cPlane.s_aiIndexData);
    if(cPlane.s_pShader === null) cPlane.s_pShader = new windShader().Create(RES.cPlane.s_sVertexShader, RES.cPlane.s_sFragmentShader);

    // define texture
    const iRes = bHigh ? 256 : 128;
    if(cPlane.s_pTexture !== null) cPlane.s_pTexture.Destructor();
    cPlane.s_pTexture = new windTexture().Create(iRes, iRes, false);

    // set texture canvas properties
    TEX.width             = iRes;
    TEX.height            = iRes;
    TEX.DRAW.textAlign    = "center";
    TEX.DRAW.textBaseline = "middle";
    TEX.DRAW.font         = (bHigh ? "56" : "28") + "px square";

    // force texture update
    cPlane.s_fDisplayMiddle = -1.0;
    cPlane.s_sDisplayText   = "";
};


// ****************************************************************
cPlane.Exit = function()
{
    // clear model, shader-program and texture
    cPlane.s_pModel  .Destructor();
    cPlane.s_pShader .Destructor();
    cPlane.s_pTexture.Destructor();
};


// ****************************************************************
cPlane.UpdateTextureValues = function(fNewValueTop, fNewValueMiddle, fNewValueBottom)
{
    if((cPlane.s_fDisplayTop    !== fNewValueTop)    ||
       (cPlane.s_fDisplayMiddle !== fNewValueMiddle) ||
       (cPlane.s_fDisplayBottom !== fNewValueBottom))
    {
        cPlane.s_fDisplayTop    = fNewValueTop;      // time
        cPlane.s_fDisplayMiddle = fNewValueMiddle;   // score
        cPlane.s_fDisplayBottom = fNewValueBottom;   // multiplier
        cPlane.s_sDisplayText   = "";                // text

        vec2.set(cPlane.s_vPrePos, TEX.width/2, TEX.height/4);

        // clear background
        TEX.DRAW.fillStyle = "#FFFFFF";
        TEX.DRAW.fillRect(0, 0, TEX.width, TEX.height);

        // draw values
        TEX.DRAW.fillStyle = "#BBBBBB";
        if(fNewValueMiddle)      TEX.DRAW.fillText(IntToString(fNewValueMiddle.toFixed(0), 6),                                            cPlane.s_vPrePos[0], cPlane.s_vPrePos[1]*2.0);
        TEX.DRAW.fillStyle = "#DDDDDD";
        if(fNewValueTop    >= 0) TEX.DRAW.fillText(IntToString(UTILS.ToUint(fNewValueTop/60), 2) + ":" + IntToString(fNewValueTop%60, 2), cPlane.s_vPrePos[0], cPlane.s_vPrePos[1]*1.0);
        if(fNewValueBottom >= 0) TEX.DRAW.fillText("x " + fNewValueBottom.toFixed(1),                                                     cPlane.s_vPrePos[0], cPlane.s_vPrePos[1]*3.0);

        // update texture
        cPlane.s_pTexture.Modify(TEX);
    }
};

cPlane.UpdateTextureText = function(sNewText1, sNewText2)
{
    const sBoth = sNewText1 + sNewText2;
    if(cPlane.s_sDisplayText !== sBoth)
    {
        cPlane.s_fDisplayMiddle = -1.0;    // score
        cPlane.s_sDisplayText   = sBoth;   // text

        vec2.set(cPlane.s_vPrePos, TEX.width/2, TEX.height/4);

        // clear background
        TEX.DRAW.fillStyle = "#FFFFFF";
        TEX.DRAW.fillRect(0, 0, TEX.width, TEX.height);

        // draw text
        TEX.DRAW.fillStyle = "#BBBBBB";
        TEX.DRAW.fillText(sNewText1, cPlane.s_vPrePos[0], cPlane.s_vPrePos[1]*(sNewText2 ? 1.5 : 2.0));
        if(sNewText2) TEX.DRAW.fillText(sNewText2, cPlane.s_vPrePos[0], cPlane.s_vPrePos[1]*2.5);

        // update texture
        cPlane.s_pTexture.Modify(TEX);
    }
};


// ****************************************************************
function cPlane()
{
}


// ****************************************************************
cPlane.prototype.Render = function()
{
    // enable the shader-program
    cPlane.s_pShader.Enable();

    // update all object uniforms
    mat4.mul(g_mMatrix, WIND.g_mProjection, WIND.g_mCamera);
    cPlane.s_pShader.SendUniformMat4("u_m4ModelView",     WIND.g_mCamera, false);
    cPlane.s_pShader.SendUniformMat4("u_m4ModelViewProj", g_mMatrix,      false);

    // enable the texture
    cPlane.s_pTexture.Enable(0);

    // draw the model
    GL.disable(GL.BLEND);
    cPlane.s_pModel.Draw();
    GL.enable(GL.BLEND);
};