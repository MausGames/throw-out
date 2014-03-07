/////////////////////////////////////////////////////
//*-----------------------------------------------*//
//| Part of Throw Out (http://www.maus-games.at)  |//
//*-----------------------------------------------*//
//| Released under the zlib License               |//
//| More information available in the readme file |//
//*-----------------------------------------------*//
/////////////////////////////////////////////////////


// ****************************************************************
var cShadow = {};

cShadow.s_sVertexShaderObject = // #OBJECT
"attribute vec3  a_v3Position;"                                  +
"uniform   mat4  u_m4ModelViewProj;"                             +
"uniform   mat3  u_m3Normal;"                                    +
"varying   float v_fHeight;"                                     +
""                                                               +
"void main()"                                                    +
"{"                                                              +
"    v_fHeight   = (u_m3Normal * a_v3Position).z;"               +
"    gl_Position = u_m4ModelViewProj * vec4(a_v3Position, 1.0);" +
"}";

cShadow.s_sFragmentShaderObject = // #OBJECT
"precision mediump float;"                     +
""                                             +
"varying float v_fHeight;"                     +
""                                             +
"void main()"                                  +
"{"                                            +
"    if(v_fHeight >= -0.001) discard;"         +
"    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);" +
"}";

cShadow.s_sVertexShaderLayer = // #LAYER
"attribute vec3 a_v3Position;"               +
""                                           +
"void main()"                                +
"{"                                          +
"    gl_Position = vec4(a_v3Position, 1.0);" +
"}";

cShadow.s_sFragmentShaderLayer = // #LAYER
"precision mediump float;"                     +
""                                             +
"void main()"                                  +
"{"                                            +
"    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.2);" +
"}";

var C_SHADOW_SCALE = vec3.fromValues(1.0, 1.0, 40.0);
var C_SHADOW_IDENTITY = mat3.create();


// ****************************************************************
cShadow.s_pShaderObject = null;
cShadow.s_pShaderLayer  = null;

// saved uniform values
cShadow.s_mSaveNormal = mat3.create();

// pre-allocated function variables
cShadow.s_vPreViewProj = mat4.create();
cShadow.s_vPreScale    = mat4.create();


// ****************************************************************
cShadow.Init = function()
{
    if(IsExp) return;

    // define shader-program
    cShadow.s_pShaderObject = new cShader(cShadow.s_sVertexShaderObject, cShadow.s_sFragmentShaderObject);
    cShadow.s_pShaderLayer  = new cShader(cShadow.s_sVertexShaderLayer,  cShadow.s_sFragmentShaderLayer);

    // pre-calculate scale matrix
    mat4.identity(cShadow.s_vPreScale);
    mat4.scale(cShadow.s_vPreScale, cShadow.s_vPreScale, C_SHADOW_SCALE);

    // force update
    cShadow.s_mSaveNormal[0] = 0.0;
};


// ****************************************************************
cShadow.Exit = function()
{
    if(IsExp) return;
    
    // clear shader-program
    cShadow.s_pShaderObject.Clear();
    cShadow.s_pShaderLayer.Clear();
};


// ****************************************************************
cShadow.Apply = function()
{
    if(IsExp) return;

    // pre-calculate projection and camera matrix
    mat4.mul(cShadow.s_vPreViewProj, g_mProjection, g_mCamera);

    // disable culling and enable stencil test
    GL.disable(GL.CULL_FACE);
    GL.enable(GL.STENCIL_TEST);

    // disable color and depth buffer writings
    GL.colorMask(false, false, false, false);
    GL.depthMask(false);

    // set stencil operations to always increase on successful backface writing and
    // decrease on successful frontface writing, combined with depth testing to "map" shadow onto intersecting surfaces
    GL.stencilOpSeparate(GL.BACK,  GL.KEEP, GL.KEEP, GL.INCR);
    GL.stencilOpSeparate(GL.FRONT, GL.KEEP, GL.KEEP, GL.DECR);
    GL.stencilFunc(GL.ALWAYS, 0, 255);

    // enable shadow-object shader-program
    cShadow.s_pShaderObject.Enable();

    if(!g_bDepthSort && g_fTotalTime >= C_INTRO_BLOCKS)   // don't create block-shadow on invisible level
    {
        // create block-shadow
        for(var i = C_LEVEL_CENTER-1; i >= 0; --i)
        {
            var pBlock = g_pBlock[i];
            if(!pBlock.m_bActive) continue;

            // adapt the transformation matrix
            cShadow.AdaptMatrix(g_mMatrix, pBlock.m_mTransform);

            // update model-view matrices
            mat4.mul(g_mMatrix, cShadow.s_vPreViewProj, g_mMatrix);
            GL.uniformMatrix4fv(cShadow.s_pShaderObject.m_iUniformModelViewProj, false, g_mMatrix);

            // check and update current normal/rotation matrix
            if(!CompareArray(cShadow.s_mSaveNormal, pBlock.m_mNormal, 9)) {mat3.copy(cShadow.s_mSaveNormal, pBlock.m_mNormal); GL.uniformMatrix3fv(cShadow.s_pShaderObject.m_iUniformNormal, false, cShadow.s_mSaveNormal);}

            // render the model (# performance hotspot)
            cBlock.s_pModel.Render();
        }
    }

    // reset normal/rotation matrix
    if(!CompareArray(cShadow.s_mSaveNormal, C_SHADOW_IDENTITY, 9)) GL.uniformMatrix3fv(cShadow.s_pShaderObject.m_iUniformNormal, false, C_SHADOW_IDENTITY);

    // create ball-shadow (# fading balls cut out the not-fading shadow)
    for(var i = 0; i < C_BALLS; ++i)
    {
        var pBall = g_pBall[i];
        if(!pBall.m_bActive) continue;

        // adapt the transformation matrix
        cShadow.AdaptMatrix(g_mMatrix, pBall.m_mTransform);

        // update model-view matrices
        mat4.mul(g_mMatrix, cShadow.s_vPreViewProj, g_mMatrix);
        GL.uniformMatrix4fv(cShadow.s_pShaderObject.m_iUniformModelViewProj, false, g_mMatrix);

        // render the model
        cBall.s_pModel.Render();
    }

    // create paddle-shadow (# deformed (too thin) at the ends of walls)
    for(var i = 0; i < 4; ++i)
    {
        var pPaddle = g_pPaddle[i];

        // adapt the transformation matrix
        cShadow.AdaptMatrix(g_mMatrix, pPaddle.m_mTransform);

        // update model-view matrices
        mat4.mul(g_mMatrix, cShadow.s_vPreViewProj, g_mMatrix);
        GL.uniformMatrix4fv(cShadow.s_pShaderObject.m_iUniformModelViewProj, false, g_mMatrix);

        // render the model
        cPaddle.s_pModel.Render();
    }

    // re-enable color and depth buffer writings
    GL.colorMask(true, true, true, true);
    GL.depthMask(true);

    // set stencil operations to draw shadow where the new value is different from his original value (128)
    GL.stencilOp(GL.KEEP, GL.KEEP, GL.KEEP);
    GL.stencilFunc(GL.NOTEQUAL, 128, 255);

    // enable shadow-overlay shader-program
    cShadow.s_pShaderLayer.Enable();

    // render the shadow overlay (from plane)
    GL.disable(GL.DEPTH_TEST);
    cPlane.s_pModel.Render();
    GL.enable(GL.DEPTH_TEST);

    // reset culling and stencil test
    GL.enable(GL.CULL_FACE);
    GL.disable(GL.STENCIL_TEST);
};


// ****************************************************************
cShadow.AdaptMatrix = function(mOut, mIn)
{
    mat4.mul(mOut, cShadow.s_vPreScale, mIn);
    mOut[14] = mIn[14];
};