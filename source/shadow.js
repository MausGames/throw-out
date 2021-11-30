/////////////////////////////////////////////////////
//*-----------------------------------------------*//
//| Part of Throw Out (https://www.maus-games.at) |//
//*-----------------------------------------------*//
//| Released under the zlib License               |//
//| More information available in the readme file |//
//*-----------------------------------------------*//
/////////////////////////////////////////////////////
"use strict";
const cShadow = {};


// ****************************************************************
const C_SHADOW_SCALE    = vec3.fromValues(1.0, 1.0, 40.0);
const C_SHADOW_IDENTITY = mat3.create();


// ****************************************************************
cShadow.s_pShaderObject = null;
cShadow.s_pShaderLayer  = null;

// pre-allocated function variables
cShadow.s_vPreViewProj = mat4.create();
cShadow.s_vPreScale    = mat4.create();


// ****************************************************************
cShadow.Init = function()
{
    // define shader-program
    cShadow.s_pShaderObject = new windShader().Create(RES.cShadow.s_sVertexShaderObject, RES.cShadow.s_sFragmentShaderObject);
    cShadow.s_pShaderLayer  = new windShader().Create(RES.cShadow.s_sVertexShaderLayer,  RES.cShadow.s_sFragmentShaderLayer);

    // pre-calculate scale matrix
    mat4.identity(cShadow.s_vPreScale);
    mat4.scale   (cShadow.s_vPreScale, cShadow.s_vPreScale, C_SHADOW_SCALE);
};


// ****************************************************************
cShadow.Exit = function()
{
    // clear shader-program
    cShadow.s_pShaderObject.Destructor();
    cShadow.s_pShaderLayer .Destructor();
};


// ****************************************************************
cShadow.Apply = function()
{
    // pre-calculate projection and camera matrix
    mat4.mul(cShadow.s_vPreViewProj, WIND.g_mProjection, WIND.g_mCamera);

    // disable culling and enable stencil test
    GL.disable(GL.CULL_FACE);
    GL.enable(GL.STENCIL_TEST);

    // disable color and depth buffer writings
    GL.colorMask(false, false, false, false);
    GL.depthMask(false);

    // set stencil operations to always increment on successful backface writing and
    // decrement on successful frontface writing, combined with depth testing to "map" shadow onto intersecting surfaces
    GL.stencilOpSeparate(GL.BACK,  GL.KEEP, GL.KEEP, GL.INCR_WRAP);
    GL.stencilOpSeparate(GL.FRONT, GL.KEEP, GL.KEEP, GL.DECR_WRAP);
    GL.stencilFunc(GL.ALWAYS, 0, 255);

    // enable shadow-object shader-program
    cShadow.s_pShaderObject.Enable();

    if(!g_bDepthSort && (WIND.g_fTotalTime >= C_INTRO_BLOCKS))   // don't create block-shadow on invisible level
    {
        // create block-shadow
        for(let i = C_LEVEL_CENTER-1; i >= 0; --i)
        {
            const pBlock = g_pBlock[i];
            if(!pBlock.m_bActive) continue;

            // adapt the transformation matrix
            cShadow.AdaptMatrix(g_mMatrix, pBlock.m_mTransform);

            // update model-view matrix
            mat4.mul(g_mMatrix, cShadow.s_vPreViewProj, g_mMatrix);
            cShadow.s_pShaderObject.SendUniformMat4("u_m4ModelViewProj", g_mMatrix, false);

            // update current normal/rotation matrix
            cShadow.s_pShaderObject.SendUniformMat3("u_m3Normal", pBlock.m_mNormal, false);

            // draw the model (# performance hotspot)
            cBlock.s_pModel.Draw();
        }
    }

    // reset normal/rotation matrix
    cShadow.s_pShaderObject.SendUniformMat3("u_m3Normal", C_SHADOW_IDENTITY, false);

    // create ball-shadow (# fading balls cut out the not-fading shadow)
    for(let i = 0; i < C_BALLS; ++i)
    {
        const pBall = g_pBall[i];
        if(!pBall.m_bActive) continue;

        // adapt the transformation matrix
        cShadow.AdaptMatrix(g_mMatrix, pBall.m_mTransform);

        // update model-view matrix
        mat4.mul(g_mMatrix, cShadow.s_vPreViewProj, g_mMatrix);
        cShadow.s_pShaderObject.SendUniformMat4("u_m4ModelViewProj", g_mMatrix, false);

        // draw the model
        cBall.s_pModel.Draw();
    }

    // create paddle-shadow (# deformed (too thin) at the ends of walls)
    for(let i = 0; i < 4; ++i)
    {
        const pPaddle = g_pPaddle[i];

        // adapt the transformation matrix
        cShadow.AdaptMatrix(g_mMatrix, pPaddle.m_mTransform);
        g_mMatrix[4] = g_mMatrix[4] * 0.96;
        g_mMatrix[5] = g_mMatrix[5] * 0.96;
        g_mMatrix[6] = g_mMatrix[6] * 0.96;
        g_mMatrix[7] = g_mMatrix[7] * 0.96;

        // update model-view matrix
        mat4.mul(g_mMatrix, cShadow.s_vPreViewProj, g_mMatrix);
        cShadow.s_pShaderObject.SendUniformMat4("u_m4ModelViewProj", g_mMatrix, false);

        // draw the model
        cPaddle.s_pModel.Draw();
    }

    // re-enable color and depth buffer writings
    GL.colorMask(true, true, true, true);
    GL.depthMask(true);

    // set stencil operations to draw shadow where the new value is different from its original value (128)
    GL.stencilOp(GL.KEEP, GL.KEEP, GL.KEEP);
    GL.stencilFunc(GL.NOTEQUAL, 0, 255);

    // enable shadow-overlay shader-program
    cShadow.s_pShaderLayer.Enable();

    // draw the shadow overlay (from plane)
    GL.disable(GL.DEPTH_TEST);
    cPlane.s_pModel.Draw();
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