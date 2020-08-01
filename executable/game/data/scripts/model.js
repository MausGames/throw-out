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
cModel.s_iCurVertexBuffer = 0;


// ****************************************************************
cModel.Init = function()
{
    // enable attributes
    GL.enableVertexAttribArray(0);
    GL.enableVertexAttribArray(1);
};


// ****************************************************************
cModel.PackSnorm32to8 = function(fValue)
{
    // compress float32 to -1.0/+1.0 uint8
    return Math.floor((fValue < 0.0) ? (256.0 + fValue*128.0) : fValue*127.0);
}


// ****************************************************************
function cModel(afVertexData, aiIndexData)
{
    var bAllowByteIndices = false;   // # desktop is much faster with SHORT

    // save size values
    this.m_iNumVertices = afVertexData.length / 6;
    this.m_iNumIndices  = aiIndexData.length;
    this.m_iIndexFormat = (bAllowByteIndices && (this.m_iNumVertices < 256)) ? GL.UNSIGNED_BYTE : GL.UNSIGNED_SHORT;

    // compress vertex data
    var pData      = new ArrayBuffer(this.m_iNumVertices * 4 * 4);
    var pViewFloat = new Float32Array(pData);
    var pViewByte  = new Uint8Array  (pData);

    for(var i = 0; i < this.m_iNumVertices; ++i)
    {
        pViewFloat[i*4 + 0]  = afVertexData[i*6 + 0];
        pViewFloat[i*4 + 1]  = afVertexData[i*6 + 1];
        pViewFloat[i*4 + 2]  = afVertexData[i*6 + 2];

        pViewByte[i*16 + 12] = cModel.PackSnorm32to8(afVertexData[i*6 + 3]);
        pViewByte[i*16 + 13] = cModel.PackSnorm32to8(afVertexData[i*6 + 4]);
        pViewByte[i*16 + 14] = cModel.PackSnorm32to8(afVertexData[i*6 + 5]);
        pViewByte[i*16 + 15] = 0;   // # 4-byte alignment for max performance
    }

    // create vertex buffer
    this.m_iVertexBuffer = GL.createBuffer();
    GL.bindBuffer(GL.ARRAY_BUFFER, this.m_iVertexBuffer);
    GL.bufferData(GL.ARRAY_BUFFER, pData, GL.STATIC_DRAW);

    // create index buffer
    this.m_iIndexBuffer = GL.createBuffer();
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.m_iIndexBuffer);
    GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, (bAllowByteIndices && (this.m_iNumVertices < 256)) ? new Uint8Array(aiIndexData) : new Uint16Array(aiIndexData), GL.STATIC_DRAW);

    // reset current vertex buffer
    cModel.s_iCurVertexBuffer = 0;
}


// ****************************************************************
cModel.prototype.Clear = function()
{
    // delete vertex and index buffer
    GL.deleteBuffer(this.m_iVertexBuffer);
    GL.deleteBuffer(this.m_iIndexBuffer);
};


// ****************************************************************
cModel.prototype.Render = function()
{
    if(cModel.s_iCurVertexBuffer !== this.m_iVertexBuffer)
    {
        // enable vertex and index buffer
        cModel.s_iCurVertexBuffer = this.m_iVertexBuffer;
        GL.bindBuffer(GL.ARRAY_BUFFER,         this.m_iVertexBuffer);
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.m_iIndexBuffer);

        // set attributes
        GL.vertexAttribPointer(0, 3, GL.FLOAT, false, 4*4, 0);
        GL.vertexAttribPointer(1, 4, GL.BYTE,  true,  4*4, 3*4);
    }

    // draw the model
    GL.drawElements(GL.TRIANGLES, this.m_iNumIndices, this.m_iIndexFormat, 0);
};