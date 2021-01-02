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
cBackground.s_pShader = null;


// ****************************************************************
cBackground.Init = function()
{
    // define shader-program
    cBackground.s_pShader = new windShader().Create(RES.cBackground.s_sVertexShader, RES.cBackground.s_sFragmentShader);
};


// ****************************************************************
cBackground.Exit = function()
{
    // clear shader-program
    cBackground.s_pShader.Destructor();
};


// ****************************************************************
function cBackground()
{
    // create properties
    this.m_fAlpha = 0.0;
}


// ****************************************************************
cBackground.prototype.Render = function()
{
    // enable the shader-program
    cBackground.s_pShader.Enable();

    // update all object uniforms
    cBackground.s_pShader.SendUniformFloat("u_fAlpha", this.m_fAlpha);

    // clear framebuffer and set alpha blending
    if(this.m_fAlpha >= 1.0)
    {
        GL.disable(GL.BLEND);
        GL.clear(GL.DEPTH_BUFFER_BIT | GL.STENCIL_BUFFER_BIT);
    }
    else
    {
        GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT | GL.STENCIL_BUFFER_BIT);
    }

    // draw the model (from plane)
    GL.disable(GL.DEPTH_TEST);
    cPlane.s_pModel.Draw();
    GL.enable(GL.DEPTH_TEST);

    // reset alpha blending
    if(this.m_fAlpha >= 1.0)
    {
        GL.enable(GL.BLEND);
    }
};