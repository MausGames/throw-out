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
cPlane.s_afVertexData =
[-35.0, -35.0, 0.0, 0.0, 0.0, 0.0,
 -35.0,  35.0, 0.0, 0.0, 0.0, 0.0,
  35.0, -35.0, 0.0, 0.0, 0.0, 0.0,
  35.0,  35.0, 0.0, 0.0, 0.0, 0.0];
                      
cPlane.s_aiIndexData =
[0, 2, 1, 1, 2, 3];

cPlane.s_sVertexShader = 
"attribute vec3 a_v3Position;"                                      +
"uniform   mat4 u_m4ModelViewProj;"                                 +
"uniform   mat4 u_m4ModelView;"                                     +
"varying   vec3 v_v3Relative;"                                      +
"varying   vec2 v_v2Border;"                                        +
"varying   vec2 v_v2TexCoord;"                                      +
""                                                                  +
"void main()"                                                       +
"{"                                                                 +
"    v_v3Relative = (u_m4ModelView * vec4(a_v3Position, 1.0)).xyz;" +
"    v_v2Border   = a_v3Position.xy;"                               +
"    v_v2TexCoord = a_v3Position.xy*0.042857143 + 0.5;"             + // 3.0/70.0 = 0.042857143
""                                                                  +
"    gl_Position = u_m4ModelViewProj * vec4(a_v3Position, 1.0);"    +
"}";

cPlane.s_sFragmentShader =
"precision mediump float;"                                                    +
""                                                                            +
"uniform sampler2D u_s2Texture;"                                              +
"varying vec3 v_v3Relative;"                                                  +
"varying vec2 v_v2Border;"                                                    +
"varying vec2 v_v2TexCoord;"                                                  +
""                                                                            +
"void main()"                                                                 +
"{"                                                                           +
"    const vec3 v3Camera = vec3(0.0, 0.447213650, -0.894427299);"             +
""                                                                            +
"    vec2 v2Border = vec2(35.0, 35.0) - abs(v_v2Border);"                     +
"    float fMin    = min(v2Border.x, v2Border.y);"                            +
""                                                                            +
"    vec3 v3Texel = vec3(1.0);"                                               +
"    if(fMin > 24.0) v3Texel = texture2D(u_s2Texture, v_v2TexCoord).rgb;"     +
""                                                                            +
"    float fIntensity = 59.0 * inversesqrt(dot(v_v3Relative, v_v3Relative));" +
"    fIntensity      *= dot(normalize(v_v3Relative), v3Camera);"              +
""                                                                            +
"    float fValue = min(fMin*0.5 + 0.25, 1.0);"                               +
""                                                                            +
"    gl_FragColor = vec4(v3Texel*fIntensity*fValue, 1.0);"                    +
"}";


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
    if(cPlane.s_pModel  === null) cPlane.s_pModel  = new cModel(cPlane.s_afVertexData, cPlane.s_aiIndexData);
    if(cPlane.s_pShader === null) cPlane.s_pShader = new cShader(cPlane.s_sVertexShader, cPlane.s_sFragmentShader);
    
    // define texture
    if(cPlane.s_pTexture !== null) cPlane.s_pTexture.Clear();
    if(bHigh) {g_pTexture.width = 256; g_pTexture.height = 256;}
         else {g_pTexture.width = 128; g_pTexture.height = 128;}
    cPlane.s_pTexture = new cTexture(g_pTexture);

    // set texture canvas properties
    TEX.textAlign    = "center";
    TEX.textBaseline = "middle";
    TEX.font         = (bHigh ? "56" : "28") + "px square";

    // force texture update
    cPlane.s_fDisplayMiddle = -1.0;
    cPlane.s_sDisplayText   = "";
};


// ****************************************************************
cPlane.Exit = function()
{
    // clear model, shader-program and texture
    cPlane.s_pModel.Clear();
    cPlane.s_pShader.Clear();
    cPlane.s_pTexture.Clear();
};


// ****************************************************************
cPlane.UpdateTextureValues = function(fNewValueTop, fNewValueMiddle, fNewValueBottom)
{
    if(cPlane.s_fDisplayTop    !== fNewValueTop    ||
       cPlane.s_fDisplayMiddle !== fNewValueMiddle ||
       cPlane.s_fDisplayBottom !== fNewValueBottom)
    {
        cPlane.s_fDisplayTop    = fNewValueTop;      // time
        cPlane.s_fDisplayMiddle = fNewValueMiddle;   // score
        cPlane.s_fDisplayBottom = fNewValueBottom;   // multiplier
        cPlane.s_sDisplayText   = "";                // text

        vec2.set(cPlane.s_vPrePos, g_pTexture.width/2, g_pTexture.height/4);

        // clear background
        TEX.fillStyle = "#FFFFFF";
        TEX.fillRect(0, 0, TEX.canvas.width, TEX.canvas.height);

        // draw values
        TEX.fillStyle = "#BBBBBB";
        if(fNewValueMiddle) TEX.fillText(IntToString(fNewValueMiddle.toFixed(0), 6),                                               cPlane.s_vPrePos[0], cPlane.s_vPrePos[1]*2.0);
        TEX.fillStyle = "#DDDDDD";
        if(fNewValueTop    >= 0) TEX.fillText(IntToString(Math.floor(fNewValueTop/60), 2) + ":" + IntToString(fNewValueTop%60, 2), cPlane.s_vPrePos[0], cPlane.s_vPrePos[1]*1.0);
        if(fNewValueBottom >= 0) TEX.fillText("x " + fNewValueBottom.toFixed(1),                                                   cPlane.s_vPrePos[0], cPlane.s_vPrePos[1]*3.0);
 
        // update texture
        cPlane.s_pTexture.Enable();
        cPlane.s_pTexture.Update(g_pTexture);
        //cPlane.s_pTexture.Disable();   // render function is called afterwards
    }
};

cPlane.UpdateTextureText = function(sNewText1, sNewText2)
{
    var sBoth = sNewText1+sNewText2;
    if(cPlane.s_sDisplayText !== sBoth)
    {
        cPlane.s_fDisplayMiddle = -1.0;    // score
        cPlane.s_sDisplayText   = sBoth;   // text

        vec2.set(cPlane.s_vPrePos, g_pTexture.width/2, g_pTexture.height/4);

        // clear background
        TEX.fillStyle = "#FFFFFF";
        TEX.fillRect(0, 0, TEX.canvas.width, TEX.canvas.height);

        // draw text
        TEX.fillStyle = "#BBBBBB";
        TEX.fillText(sNewText1, cPlane.s_vPrePos[0], cPlane.s_vPrePos[1]*(sNewText2 ? 1.5 : 2.0));
        if(sNewText2) TEX.fillText(sNewText2, cPlane.s_vPrePos[0], cPlane.s_vPrePos[1]*2.5);

        // update texture
        cPlane.s_pTexture.Enable();
        cPlane.s_pTexture.Update(g_pTexture);
        //cPlane.s_pTexture.Disable();   // render function is called afterwards
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

    // update model-view matrices
    mat4.mul(g_mMatrix, g_mProjection, g_mCamera);
    GL.uniformMatrix4fv(cPlane.s_pShader.m_iUniformModelViewProj, false, g_mMatrix);
    GL.uniformMatrix4fv(cPlane.s_pShader.m_iUniformModelView,     false, g_mCamera);

    // set texture and render the model
    GL.disable(GL.BLEND);
    cPlane.s_pTexture.Enable();
    cPlane.s_pModel.Render();
    cPlane.s_pTexture.Disable();
    GL.enable(GL.BLEND);
};