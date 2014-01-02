

// ****************************************************************
var GL;
var TEX;

var C_BLOCKS_X   = 16;
var C_BLOCKS_Y   = 16;
var C_BLOCKS_B   = 64;
var C_BLOCKS_CEN = C_BLOCKS_X*C_BLOCKS_Y;
var C_BLOCKS_ALL = C_BLOCKS_CEN + C_BLOCKS_B;

var C_CAMERA_OFF = 22.0;

var C_BALLS = 10;

var C_STATUS_INTRO = 0;
var C_STATUS_MAIN  = 1;
var C_STATUS_GAME  = 2;
var C_STATUS_PAUSE = 3;
var C_STATUS_LOSE  = 4;
var C_STATUS_WIN   = 5;

// get URL parameters (not very solid, but good enough)
var QueryString = function()
{
    var asOutput = {};
    var asVar = window.location.search.substring(1).split("&");

    for(var i = 0; i < asVar.length; ++i)
    {
        var asPair = asVar[i].split("=");

        if(typeof asOutput[asPair[0]] === "undefined")
            asOutput[asPair[0]] = asPair[1];
        else if(typeof asOutput[asPair[0]] === "string")
            asOutput[asPair[0]] = [asOutput[asPair[0]], asPair[1]];
        else
            asOutput[asPair[0]].push(asPair[1]);
    }

    return asOutput;
}();


// ****************************************************************
var g_pCanvas  = null;
var g_pTexture = null;

var g_pMenuLogo    = null;
var g_pMenuJolt    = null;
var g_pMenuHeader  = null;
var g_pMenuOption1 = null;
var g_pMenuOption2 = null;
var g_pMenuLeft    = null;
var g_pMenuRight   = null;
var g_pMenuTop     = null;
var g_pMenuStart   = null;
var g_pMenuEnd     = null;
var g_pMenuFull    = null;
var g_pMenuQuality = null;
var g_pMenuLevel   = null;
var g_pMenuScore   = null;

var g_mProjection = mat4.create();
var g_mCamera     = mat4.create();
var g_vView       = vec2.fromValues(0.0, C_BALL_START[1] + C_CAMERA_OFF);

var g_vMousePos = vec2.create();

var g_fSaveTime  = 0.0;
var g_fTotalTime = 0.0;
var g_fTime      = 0.0;

var g_iStatus = C_STATUS_INTRO;
var g_iLevel  = 0;
var g_iScore  = 0;

var g_fFade       = 1.0;
var g_fTransition = 0.0;

var g_bQuality  = true;
var g_bGameJolt = false;

var g_pPlane  = null;
var g_pPaddle = null;
var g_pBall   = null;
var g_pBlock  = null;


// ****************************************************************
function Init()
{
    // retrieve main canvas
    g_pCanvas = document.getElementById("canvas");

    // retrieve WebGL context
    GL = g_pCanvas.getContext("webgl") || g_pCanvas.getContext("experimental-webgl");
    if(!GL)
    {
        document.body.style.background = "#FAFAFF";
        document.body.innerHTML = "<p style='font: bold 16px sans-serif; width: 400px; height: 140px; position: absolute; left: 50%; top: 50%; margin: -70px 0 0 -200px; text-align: center;'>" +
                                  "<img src='data/images/webgl_logo.png'/><br/>" +
                                  "Your browser sucks and doesn't support WebGL.<br/>" +
                                  "Visit <a href='http://get.webgl.org/' style='color: blue;'>http://get.webgl.org/</a> for more information.</p>";
        return;
    }

    // retrieve texture canvas and 2d context
    g_pTexture = document.getElementById("texture");
    TEX = g_pTexture.getContext("2d");
    
    // setup system components
    SetupMenu();
    SetupRefresh();
    SetupInput();

    // resize dynamically
    document.body.onresize = Resize;
    Resize();

    // enable depth testing
    GL.enable(GL.DEPTH_TEST);
    GL.depthFunc(GL.LEQUAL);
    GL.polygonOffset(1.1, 4.0);
    GL.clearDepth(1.0);

    // enable culling
    GL.enable(GL.CULL_FACE);
    GL.cullFace(GL.BACK);
    GL.frontFace(GL.CCW);

    // enable alpha blending
    GL.enable(GL.BLEND);
    GL.blendFunc(GL.SRC_ALPHA, GL.ONE_MINUS_SRC_ALPHA);

    // enable flipped texture loading
    GL.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, true);

    // reset scene
    GL.clearColor(0.333, 0.333, 0.333, 1.0);
    GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    // init object interfaces
    cPlane.Init(true);
    cPaddle.Init(true);
    cBall.Init();
    cBlock.Init(true);

    // create plane
    g_pPlane = new cPlane();

    // create paddles (and walls)
    g_pPaddle = new Array(4);
    g_pPaddle[0] = new cPaddle([ 0.0,  1.0]);
    g_pPaddle[1] = new cPaddle([ 0.0, -1.0]);
    g_pPaddle[2] = new cPaddle([ 1.0,  0.0]);
    g_pPaddle[3] = new cPaddle([-1.0,  0.0]);
    g_pPaddle[0].m_bWall = false;
    
    // create balls
    g_pBall = new Array(C_BALLS);
    for(var i = 0; i < C_BALLS; ++i)
        g_pBall[i] = new cBall();

    // load first level and border
    LoadLevel(0);
    LoadBorder();
    
    // pre-calculate application
    Move();
    for(var i = 0; i < C_BLOCKS_ALL; ++i)
        g_pBlock[i].Move();

    // begin application
    requestAnimationFrame(Render);
}


// ****************************************************************
function Render(iNewTime)
{
    // calculate elapsed and total time
    var fNewSaveTime = iNewTime * 0.001;
    var fNewTime = fNewSaveTime - g_fSaveTime;
    g_fSaveTime = fNewSaveTime;

    // smooth out inconsistent framerates
    if(fNewTime > 0.125) g_fTime = 0.0;
    else g_fTime = 0.85*g_fTime + 0.15*fNewTime;
    g_fTotalTime += g_fTime;

    // clear the framebuffer
    GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    // render game
    if(g_iStatus >= C_STATUS_GAME)
    {
        // render paddles (and walls)
        for(var i = 0; i < 4; ++i)
            g_pPaddle[i].Render();

        // render balls
        for(var i = 0; i < C_BALLS; ++i)
            g_pBall[i].Render();

        // render outside blocks
        for(var i = C_BLOCKS_ALL-1; i >= C_BLOCKS_CEN; --i)
            g_pBlock[i].Render();
    }
    if(g_fTotalTime >= 6.5)
    {
        // render inside blocks
        for(var i = C_BLOCKS_CEN-1; i >= 0; --i)
            g_pBlock[i].Render();
    }

    // render plane
    cPlane.UpdateTexture(0, g_iScore, 0);
    g_pPlane.Render();

    // move application
    Move();
}


// ****************************************************************
function Move()
{
    var fCameraZ = 0.0;

    // update intro
    if(g_iStatus === C_STATUS_INTRO)
    {
        // skip intro
        if(QueryString["skip_intro"]) g_fTotalTime = 20.0;

        // control logo opacity
        g_pMenuLogo.style.opacity = Math.sin(Math.PI * Clamp((g_fTotalTime-1.0)*0.22, 0.0, 1.0));

        // control menu opacity
        var fMenuOpacity = Clamp((g_fTotalTime-7.5)*0.4, 0.0, 1.0);
        SetMenuOpacity(fMenuOpacity);
        if(fMenuOpacity >  0.0) SetMenuEnable(true);
        if(fMenuOpacity >= 1.0) g_iStatus = C_STATUS_MAIN;

        // control camera flip
        fCameraZ = (1.0-Math.sin(0.5*Math.PI*Clamp((g_fTotalTime-1.5)*0.15, 0.0, 1.0)))*80.0;
    }

    // update game
    if(g_iStatus === C_STATUS_GAME)
    {
        // fade out menu on game start
        if(g_fFade > 0.0)
        {
            g_fFade -= g_fTime;
            SetMenuOpacity(g_fFade);
        }

        if(g_fTransition < 5.0)
        {
            g_fTransition += g_fTime;
            if(g_fTransition >= 5.0)
                CreateBall(C_BALL_START, [-0.707, 0.707]);
        }

        // move paddles (and walls)
        for(var i = 0; i < 4; ++i)
            g_pPaddle[i].Move();

        // move balls
        for(var i = 0; i < C_BALLS; ++i)
            g_pBall[i].Move();

        // move outside blocks
        for(var i = C_BLOCKS_CEN; i < C_BLOCKS_ALL; ++i)
            g_pBlock[i].Move();
    }
    if(g_iStatus !== C_STATUS_PAUSE && g_fTotalTime >= 6.5)
    {
        // move inside blocks
        for(var i = 0; i < C_BLOCKS_CEN; ++i)
            g_pBlock[i].Move();
    }

    // move plane
    g_pPlane.Move();

    
    var vMidPos = vec2.create();
    var fMin = 100.0;
    var iNum = 0;
    for(var i = 0; i < C_BALLS; ++i)
    {
        if(g_pBall[i].m_bActive)
        {
            vec2.add(vMidPos, vMidPos, g_pBall[i].m_vPosition);
            fMin = Math.min(fMin, g_pBall[i].m_vPosition[1]);
            ++iNum;
        }
    }

    if(!iNum) vec2.set(vMidPos, C_BALL_START[0], C_BALL_START[1] + C_CAMERA_OFF);
    else
    {
        vec2.div(vMidPos, vMidPos, [iNum, iNum]);
        vMidPos[1] = vMidPos[1]*0.4 + fMin*0.6 + C_CAMERA_OFF;
    }

    g_vView[0] += (vMidPos[0] - g_vView[0])*g_fTime*10.0;
    g_vView[1] += (vMidPos[1] - g_vView[1])*g_fTime*10.0;

    mat4.lookAt(g_mCamera, [0.0+g_vView[0]*0.3, -25.0*1.5+g_vView[1]*0.5-5.0, 30.0*1.5], [0.0+g_vView[0]*0.5, -11.5+g_vView[1]*0.5, 0.0+fCameraZ], [0.0, 0.0, 1.0]);

    // request next frame
    GL.finish();
    requestAnimationFrame(Render);
}


// ****************************************************************
function SetupRefresh()
{
    var iLastTime = 0;
    var asVendor  = ['webkit', 'moz'];

    // unify different animation functions
    for(var i = 0; i < asVendor.length && !window.requestAnimationFrame; ++i)
    {
        window.requestAnimationFrame = window[asVendor[i]+'RequestAnimationFrame'];
        window.cancelAnimationFrame  = window[asVendor[i]+'CancelAnimationFrame'] || window[asVendor[i]+'CancelRequestAnimationFrame'];
    }

    // implement alternatives on missing animation functions
    if(!window.requestAnimationFrame)
    {
        window.requestAnimationFrame = function(pCallback)
        {
            var iCurTime = new Date().getTime();
            var iTime    = Math.max(0, 16 - (iCurTime - iLastTime));

            iLastTime = iCurTime + iTime;
            return window.setTimeout(function() {pCallback(iLastTime);}, iTime);
        };
    }
    if(!window.cancelAnimationFrame)
    {
        window.cancelAnimationFrame = function(iID) {clearTimeout(iID);};
    }
}


// ****************************************************************
function SetupInput()
{
    // implement mouse movement function
    document.body.onmousemove = function(pCursor)
    {
        var oRect = g_pCanvas.getBoundingClientRect();

        // set mouse position relative to the canvas
        g_vMousePos[0] = pCursor.clientX - oRect.left - (oRect.right  - oRect.left)/2;
        g_vMousePos[1] = pCursor.clientY - oRect.top  - (oRect.bottom - oRect.top)/2;

        return true;
    };

    // implement touch event function
    document.addEventListener('touchmove', function(pEvent)
    {
        var oRect = g_pCanvas.getBoundingClientRect();

        // get touch input
        pEvent.preventDefault();
        var pTouch = pEvent.touches[0];

        // set mouse position relative to the canvas
        g_vMousePos[0] = pTouch.pageX - oRect.left - (oRect.right  - oRect.left)/2;
        g_vMousePos[1] = pTouch.pageY - oRect.top  - (oRect.bottom - oRect.top)/2;
    }, false);

    // implement pause function
    document.body.onkeypress = function(pEvent)
    {
        pEvent   = window.event || pEvent;
        var iKey = pEvent.charCode || pEvent.keyCode;

        // check for whitespace and escape key
        if(iKey === 32 || iKey === 27)
            SetPause(true);

        return true;
    };
}


// ****************************************************************
function Resize()
{
    // resize canvas
    g_pCanvas.width  = window.innerWidth;
    g_pCanvas.height = window.innerHeight;

    // resize font
    document.body.style.fontSize = (window.innerHeight/800.0)*100.0 + "%";

    // resize logo
    g_pMenuLogo.style.width      =  window.innerWidth*0.32 + "px";
    g_pMenuLogo.style.marginLeft = -window.innerWidth*0.16 + "px";

    // resize menu
    var sWidth = window.innerWidth + "px";
    g_pMenuHeader.style.width  = sWidth;
    g_pMenuOption1.style.width = sWidth;
    g_pMenuOption2.style.width = sWidth;
    g_pMenuLevel.style.width   = sWidth;
    g_pMenuScore.style.width   = sWidth;

    var sMargin = -window.innerWidth*0.5 + "px";
    g_pMenuHeader.style.marginLeft  = sMargin;
    g_pMenuOption1.style.marginLeft = sMargin;
    g_pMenuOption2.style.marginLeft = sMargin;
    g_pMenuLevel.style.marginLeft   = sMargin;
    g_pMenuScore.style.marginLeft   = sMargin;

    // set viewport and view matrices
    GL.viewport(0, 0, window.innerWidth, window.innerHeight);
    mat4.perspective(g_mProjection, Math.PI*0.35, window.innerWidth / window.innerHeight, 0.1, 1000.0);
    mat4.lookAt(g_mCamera, [0.0, -25.0*1.5, 30.0*1.5], [0.0, -6.5, 0.0], [0.0, 0.0, 1.0]);
}


// ****************************************************************
function SetupMenu()
{
    // get all menu elements
    g_pMenuLogo    = document.getElementById("logo");
    g_pMenuJolt    = document.getElementById("jolt");
    g_pMenuHeader  = document.getElementById("text-header");
    g_pMenuOption1 = document.getElementById("text-option-1");
    g_pMenuOption2 = document.getElementById("text-option-2");
    g_pMenuLeft    = document.getElementById("text-bottom-left");
    g_pMenuRight   = document.getElementById("text-bottom-right");
    g_pMenuTop     = document.getElementById("text-top-right");
    g_pMenuStart   = document.getElementById("start");
    g_pMenuEnd     = document.getElementById("end");
    g_pMenuFull    = document.getElementById("fullscreen");
    g_pMenuQuality = document.getElementById("quality");
    g_pMenuLevel   = document.getElementById("text-level");
    g_pMenuScore   = document.getElementById("text-score");

    // implement start button
    g_pMenuStart.onmousedown = function()
    {
        if(g_iStatus === C_STATUS_MAIN)
        {
            // disable menu and start game
            SetMenuEnable(false);
            g_iStatus = C_STATUS_GAME;
        }
    };

    // implement quality button
    g_pMenuQuality.onmousedown = function()
    {
        // change video quality
        g_bQuality = !g_bQuality;
        cPlane.Init(g_bQuality);
        cPaddle.Init(g_bQuality);
        cBlock.Init(g_bQuality);
    };

    // implement fullscreen button
    g_pMenuFull.onmousedown = function()
    {
        var pDoc = document.documentElement;

        // enable fullscreen mode
             if(pDoc.requestFullscreen)       pDoc.requestFullscreen();
        else if(pDoc.mozRequestFullScreen)    pDoc.mozRequestFullScreen();
        else if(pDoc.webkitRequestFullscreen) pDoc.webkitRequestFullscreen();
        else if(pDoc.msRequestFullscreen)     pDoc.msRequestFullscreen();
    };

    // set Game Jolt user string
    if(QueryString["gjapi_username"] && QueryString["gjapi_token"])
    {
        g_pMenuRight.innerHTML = "<font>Logged in as " + QueryString["gjapi_username"] + "</font>";
        g_bGameJolt = true;
    }
}


// ****************************************************************
function SetMenuOpacity(fOpacity)
{
    // set menu opacity
    g_pMenuJolt.style.opacity    = fOpacity;
    g_pMenuHeader.style.opacity  = fOpacity;
    g_pMenuOption1.style.opacity = fOpacity;
    g_pMenuOption2.style.opacity = fOpacity;
    g_pMenuLeft.style.opacity    = fOpacity;
    g_pMenuRight.style.opacity   = fOpacity;
    g_pMenuTop.style.opacity     = fOpacity;
}


// ****************************************************************
function SetMenuEnable(bEnabled)
{
    var sValue = bEnabled ? "auto" : "none";

    // enable or disable menu interaction
    g_pMenuOption1.style.pointerEvents = sValue;
    g_pMenuOption2.style.pointerEvents = sValue;
    g_pMenuLeft.style.pointerEvents    = sValue;
    g_pMenuRight.style.pointerEvents   = sValue;
    g_pMenuTop.style.pointerEvents     = sValue;
}


// ****************************************************************
function SetPause(bPaused)
{
    if(bPaused && g_iStatus === C_STATUS_GAME)
    {
        g_iStatus = C_STATUS_PAUSE;

        g_pCanvas.style.opacity      = 0.5;
        g_pMenuHeader.style.opacity  = 1.0;
        g_pMenuOption1.style.opacity = 1.0;
        g_pMenuOption2.style.opacity = 1.0;
        g_pMenuTop.style.opacity     = 1.0;

        g_pMenuHeader.innerHTML  = "<font class='header'>PAUSE</font>";
        g_pMenuOption1.innerHTML = "<font id='start' class='button'>Resume</font>";
        g_pMenuOption2.innerHTML = "<font id='end' class='button'>Restart</font>";

        g_pMenuOption1.style.pointerEvents = "auto";
        g_pMenuOption2.style.pointerEvents = "auto";
        g_pMenuTop.style.pointerEvents     = "auto";

        g_pMenuStart = document.getElementById("start");
        g_pMenuEnd   = document.getElementById("end");

        g_pMenuStart.onmousedown = function() {SetPause(false);};
        g_pMenuEnd.onmousedown = function()
        {
            var sSkip = (window.location.href.indexOf("skip_intro") < 0) ? (window.location + (window.location.search ? "&" : "?") + "skip_intro=1") : window.location;
            g_pMenuOption2.innerHTML = "<font class='button'><a href='" + sSkip + "'>Restart complete game ?</a></font>";
        };
    }
    else if(!bPaused && g_iStatus === C_STATUS_PAUSE)
    {
        g_iStatus = C_STATUS_GAME;

        g_pCanvas.style.opacity = 1.0;
        SetMenuOpacity(0.0);
        SetMenuEnable(false);
    }
}


// ****************************************************************
function LoadLevel(iLevelNum)
{
    g_pBlock = new Array(C_BLOCKS_ALL);
    for(var i = 0; i < C_BLOCKS_Y; ++i)
    {
        for(var j = 0; j < C_BLOCKS_X; ++j)
        {
            var iCur = i*C_BLOCKS_X + j;

            g_pBlock[iCur] = new cBlock();

            vec3.set(g_pBlock[iCur].m_vPosition, (j - C_BLOCKS_X/2)*3.0+1.5, -((i - C_BLOCKS_Y/2)*3.0+1.5), 180.0-i*12+j*18);

            if(aaiLevelValue[iLevelNum][iCur] > 0)
            {
                vec4.copy(g_pBlock[iCur].m_vColor, aavLevelColor[iLevelNum][aaiLevelValue[iLevelNum][iCur]-1]);
                g_pBlock[iCur].m_vColor[3] = 1.0;
            }
            else g_pBlock[iCur].m_vColor[3] = 0.0;
        }
    }

    for(var i = 0; i < aaiLevelTyped[iLevelNum].length; ++i)
    {
        g_pBlock[aaiLevelTyped[iLevelNum][i].iNum].m_iType = aaiLevelTyped[iLevelNum][i].iType;
    }
}


// ****************************************************************
function LoadBorder()
{
    for(var i = 0; i < C_BLOCKS_B; ++i)
    {
        var iCur = i + C_BLOCKS_CEN;
        var iVal = i % C_BLOCKS_X;

                       if(!g_pBlock[iCur]) g_pBlock[iCur] = new cBlock();
        else if(!g_pBlock[iCur].m_iActive) g_pBlock[iCur] = new cBlock();

        if(i < 2*C_BLOCKS_Y) vec3.set(g_pBlock[iCur].m_vPosition, ((iVal - C_BLOCKS_Y/2)*3.0+1.5)*1.5 * ((i < C_BLOCKS_Y) ? 1.0 : -1.0), (i < C_BLOCKS_Y) ? -40.0 : 40.0, 180.0+i*15);
                        else vec3.set(g_pBlock[iCur].m_vPosition, (i < 2*C_BLOCKS_Y+C_BLOCKS_X) ? -40.0 : 40.0, ((iVal - C_BLOCKS_X/2)*3.0+1.5)*1.5 * ((i < 2*C_BLOCKS_Y+C_BLOCKS_X) ? 1.0 : -1.0), 180.0+i*15);

        vec4.set(g_pBlock[iCur].m_vColor, 0.2, 0.2, 0.2, 1.0);
    }
}


// ****************************************************************
function CreateBall(vPosition, vDirection)
{
    for(var i = 0; i < C_BALLS; ++i)
    {
        if(!g_pBall[i].m_bActive)
        {
            // activate and init new ball
            g_pBall[i].m_fSpeed  = 35.0 + g_iLevel*1.0;
            g_pBall[i].m_bActive = true;
            vec2.set(g_pBall[i].m_vPosition,  vPosition[0],  vPosition[1]);
            vec2.set(g_pBall[i].m_vDirection, vDirection[0], vDirection[1]);

            // hide him on start
            mat4.scale(g_pBall[i].m_mTransform, g_pBall[i].m_mTransform, [0.0, 0.0, 0.0]);

            return;
        }
    }
}


// ****************************************************************
function Reflect(vVelocity, vNormal)
{
    var fDot = vec2.dot(vVelocity, vNormal);
    if(fDot > 0.0) return vVelocity;

    var vDotNormal = vec2.clone(vNormal);
    vec2.mul(vDotNormal, vDotNormal, [2.0*fDot, 2.0*fDot]);
    vec2.sub(vDotNormal, vVelocity, vDotNormal);

    return vDotNormal;
}


// ****************************************************************
function Signf(fValue)
{
    return (fValue < 0.0) ? -1.0 : 1.0;
}


// ****************************************************************
function Clamp(fValue, fFrom, fTo)
{
    return Math.min(Math.max(fValue, fFrom), fTo);
}


// ****************************************************************
function IntToString(iValue, iSize)
{
    return ('000000000' + iValue).substr(-iSize);
}


// ****************************************************************
function CompareArray(a, b, s)   // .length
{
    for(var i = 0; i < s; ++i)
        if(a[i] !== b[i]) return false;
    return true;
}