

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
"    v_v2TexCoord = (a_v3Position.xy/70.0)*3.0 + 0.5;"                    +
""                                                                  +
"    gl_Position  = u_m4ModelViewProj * vec4(a_v3Position, 1.0);"   +
""                                                                  +
"}";

cPlane.s_sFragmentShader =
"precision mediump float;"                                            +
""                                                                    +
"uniform sampler2D u_s2Texture;" +
"varying vec3 v_v3Relative;"                                          +
"varying vec2 v_v2Border;"                                            +
"varying vec2 v_v2TexCoord;"                                          +
""                                                                    +
"void main()"                                                         +
"{"                                                                   +
"    const vec3 v3Camera = vec3(0.0, 0.447213650, -0.894427299);"     +
""                                                                    +
"    float fIntensity = 40.0 / length(v_v3Relative);"                 +
"    fIntensity      *= dot(normalize(v_v3Relative), v3Camera);"      +
"    fIntensity       = (fIntensity + 0.25)*1.05;"                    +
""                                                                    +
"    vec2 v2Border = vec2(35.0, 35.0) - abs(v_v2Border);"             +
"    float fValue  = min(min(v2Border.x, v2Border.y)*0.5+0.25, 1.0);" +
""                                                                    +
"    vec3 v3Texel = texture2D(u_s2Texture, v_v2TexCoord).rgb;"        +
"    gl_FragColor = vec4(v3Texel*fIntensity*fValue, 1.0);"            +
"}";


// ****************************************************************
cPlane.s_pModel   = null;
cPlane.s_pShader  = null;
cPlane.s_pTexture = null;

cPlane.s_iDisplayTop    = -1;
cPlane.s_iDisplayMiddle = -1;
cPlane.s_iDisplayBottom = -1;


// ****************************************************************
cPlane.Init = function(bHigh)
{
    // clear old texture
    if(cPlane.s_pTexture !== null) cPlane.s_pTexture.Clear();

    // define model and shader-program
    cPlane.s_pModel  = new cModel(cPlane.s_afVertexData, cPlane.s_aiIndexData);
    cPlane.s_pShader = new cShader(cPlane.s_sVertexShader, cPlane.s_sFragmentShader);
    
    // define texture
    if(bHigh) {g_pTexture.width = 256; g_pTexture.height = 256;}
         else {g_pTexture.width = 128; g_pTexture.height = 128;}
    cPlane.s_pTexture = new cTexture(g_pTexture);

    // set texture canvas properties
    TEX.textAlign    = "center";
    TEX.textBaseline = "middle";
    TEX.font         = (bHigh ? 56 : 28) + "px square";

    // force texture update
    cPlane.s_iDisplayMiddle = -1;
};


// ****************************************************************
cPlane.UpdateTexture = function(iNewValueTop, iNewValueMiddle, iNewValueBottom)
{
    if(cPlane.s_iDisplayTop    !== iNewValueTop    ||
       cPlane.s_iDisplayMiddle !== iNewValueMiddle ||
       cPlane.s_iDisplayBottom !== iNewValueBottom)
    {
        cPlane.s_iDisplayTop    = iNewValueTop;      // multiplier
        cPlane.s_iDisplayMiddle = iNewValueMiddle;   // score
        cPlane.s_iDisplayBottom = iNewValueBottom;   // time

        var vPos = vec2.fromValues(g_pTexture.width/2, g_pTexture.height/4);

        // clear background
        TEX.fillStyle = "#FFFFFF";
        TEX.fillRect(0, 0, TEX.canvas.width, TEX.canvas.height);

        // draw values
        TEX.fillStyle = "#BBBBBB";
        if(iNewValueTop)    TEX.fillText("x " + iNewValueTop + ".0",                                                                vPos[0], vPos[1]*1);
        if(iNewValueMiddle) TEX.fillText(IntToString(iNewValueMiddle, 6),                                                           vPos[0], vPos[1]*2);
        if(iNewValueBottom) TEX.fillText(IntToString(Math.floor(iNewValueBottom/60), 2) + ":" + IntToString(iNewValueBottom%60, 2), vPos[0], vPos[1]*3);

        // update texture
        cPlane.s_pTexture.Enable();
        cPlane.s_pTexture.Update(g_pTexture);
        cPlane.s_pTexture.Disable();
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

    // calculate model-view matrices
    var mModelViewProj = mat4.create();
    mat4.mul(mModelViewProj, g_mProjection, g_mCamera);

    // update all object uniforms
    GL.uniformMatrix4fv(cPlane.s_pShader.m_iUniformModelViewProj, false, mModelViewProj);
    GL.uniformMatrix4fv(cPlane.s_pShader.m_iUniformModelView,     false, g_mCamera);

    // set texture and render the model
    cPlane.s_pTexture.Enable();
    cPlane.s_pModel.Render();
    cPlane.s_pTexture.Disable();
};


// ****************************************************************
cPlane.prototype.Move = function()
{
};