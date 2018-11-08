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
cTexture.s_iCurTexture = 0;


// ****************************************************************
function cTexture(pTextureData)
{
    // create texture
    this.m_iTexture = GL.createTexture();
    GL.bindTexture(GL.TEXTURE_2D, this.m_iTexture);

    // load texture data
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S,     GL.CLAMP_TO_EDGE);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T,     GL.CLAMP_TO_EDGE);
    GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, pTextureData);

    // reset current texture
    cTexture.s_iCurTexture = null;
    GL.bindTexture(GL.TEXTURE_2D, null);
}


// ****************************************************************
cTexture.prototype.Clear = function()
{
    // delete texture
    GL.deleteTexture(this.m_iTexture);
};


// ****************************************************************
cTexture.prototype.Enable = function()
{
    if(cTexture.s_iCurTexture !== this.m_iTexture)
    {
        // enable texture
        cTexture.s_iCurTexture = this.m_iTexture;
        GL.bindTexture(GL.TEXTURE_2D, this.m_iTexture);
    }
};


// ****************************************************************
cTexture.prototype.Disable = function()
{
    if(cTexture.s_iCurTexture !== null)
    {
        // disable texture
        cTexture.s_iCurTexture = null;
        GL.bindTexture(GL.TEXTURE_2D, null);
    }
};


// ****************************************************************
cTexture.prototype.Update = function(pTextureData)
{
    // this.Enable();
    GL.texSubImage2D(GL.TEXTURE_2D, 0, 0, 0, GL.RGBA, GL.UNSIGNED_BYTE, pTextureData);
    // this.Disable();
};