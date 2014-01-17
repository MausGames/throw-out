

// ****************************************************************
cBackground.s_sVertexShader =
"attribute vec3 a_v3Position;"                +
"varying   vec2 v_v2Relative;"                +
""                                            +
"void main()"                                 +
"{"                                           +
"    gl_Position  = vec4(a_v3Position, 1.0);" +
"    v_v2Relative = a_v3Position.xy;"         +
""                                            +
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

    // check and update current alpha (check to reduce video brandwidth)
    if(cBackground.s_iSaveAlpha !== this.m_fAlpha) {cBackground.s_iSaveAlpha = this.m_fAlpha; GL.uniform1f(cBackground.s_pShader.m_iUniformAlpha, this.m_fAlpha);}

    // render the model (from plane)
    cPlane.s_pModel.Render();
};