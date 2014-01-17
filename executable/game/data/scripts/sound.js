

// ****************************************************************
cSound.s_pContext = null;   // audio context


// ****************************************************************
cSound.Init = function()
{
    // create audio context
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    if(window.AudioContext) cSound.s_pContext = new AudioContext();
};


// ****************************************************************
function cSound(sURL)
{
    if(!cSound.s_pContext) return;

    // create asynchron request to load a sound file
    var pRequest = new XMLHttpRequest();
    pRequest.open("GET", sURL, true);
    pRequest.responseType = "arraybuffer";

    // decode asynchronously when finished
    var pThis = this;
    pRequest.onload = function()
    {
        cSound.s_pContext.decodeAudioData(pRequest.response, function(pBuffer)
        {
            // save finished sound buffer
            pThis.m_pBuffer = pBuffer;
        }, function(){});
    };

    // send request
    pRequest.send();
}


// ****************************************************************
cSound.prototype.Play = function(fPitch)
{
    if(!cSound.s_pContext) return;

    // create new sound source (# tried to create a source pool, but somehow they can only be used once)
    var pSource = cSound.s_pContext.createBufferSource();

    // set buffer and connect to context destination
    pSource.buffer = this.m_pBuffer;
    pSource.connect(cSound.s_pContext.destination);

    // play the sound
    pSource.playbackRate.value = (fPitch ? fPitch : 1.0) + 0.05*(Math.random()-0.5);
    pSource.start(0);
    
};