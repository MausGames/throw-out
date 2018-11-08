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
cBackground.s_sVertexShader =
"attribute vec3 a_v3Position;"                +
"varying   vec2 v_v2Relative;"                +
""                                            +
"void main()"                                 +
"{"                                           +
"    gl_Position  = vec4(a_v3Position, 1.0);" +
"    v_v2Relative = a_v3Position.xy;"         +
"}";

cBackground.s_sFragmentShader =
"precision mediump float;"                                                    +
""                                                                            +
"uniform float u_fAlpha;"                                                     +
"varying vec2  v_v2Relative;"                                                 +
""                                                                            +
"void main()"                                                                 +
"{"                                                                           +
"    float fIntensity = 0.25 * inversesqrt(dot(v_v2Relative, v_v2Relative));" +
"    gl_FragColor = vec4(vec3(fIntensity), u_fAlpha);"                        +
"}";


// ****************************************************************
cBackground.s_pShader = null;

// saved uniform values
cBackground.s_iSaveAlpha = 0.0;


// ****************************************************************
cBackground.Init = function()
{
    // define shader-program
    cBackground.s_pShader = new cShader(cBackground.s_sVertexShader, cBackground.s_sFragmentShader);
};


// ****************************************************************
cBackground.Exit = function()
{
    // clear shader-program
    cBackground.s_pShader.Clear();
};


// ****************************************************************
function cBackground()
{
    // create attributes
    this.m_fAlpha = 0.0;
}


// ****************************************************************
cBackground.prototype.Render = function()
{
    // enable the shader-program
    cBackground.s_pShader.Enable();

    // check and update current alpha (check to reduce video bandwidth)
    if(cBackground.s_iSaveAlpha !== this.m_fAlpha) {cBackground.s_iSaveAlpha = this.m_fAlpha; GL.uniform1f(cBackground.s_pShader.m_iUniformAlpha, this.m_fAlpha);}

    // clear framebuffer and set alpha blending
    if(this.m_fAlpha === 1.0)
    {
        GL.disable(GL.BLEND);
        GL.clear(GL.DEPTH_BUFFER_BIT | GL.STENCIL_BUFFER_BIT);
    }
    else GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT | GL.STENCIL_BUFFER_BIT);

    // render the model (from plane)
    GL.disable(GL.DEPTH_TEST);
    cPlane.s_pModel.Render();
    GL.enable(GL.DEPTH_TEST);

    // reset alpha blending
    if(this.m_fAlpha === 1.0) GL.enable(GL.BLEND);
};