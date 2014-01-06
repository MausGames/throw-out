

// ****************************************************************
var GL;                           // WebGL context
var TEX;                          // texture canvas 2d context

var C_CAMERA_OFF   = 22.0;        // Y camera offset
var C_INTRO_BLOCKS = 5.8;         // moment when blocks are active in the intro
var C_BALLS        = 20;          // max number of balls

var C_TRANSITION_START  = -2.0;   // start-value for level transition
var C_TRANSITION_CHANGE = -1.0;   // point to apply visual changes (add paddles, remove shield)
var C_TRANSITION_LEVEL  =  0.0;   // point to load the level and reset border
var C_TRANSITION_END    =  5.0;   // end-value for level transition

// application states
var C_STATUS_INTRO = 0;
var C_STATUS_MAIN  = 1;
var C_STATUS_GAME  = 2;
var C_STATUS_PAUSE = 3;
var C_STATUS_FAIL  = 4;

// menu type
var C_MENU_MAIN  = 0;
var C_MENU_PAUSE = 1;
var C_MENU_FAIL  = 2;


// ****************************************************************
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

// check for IE user agent (currently(=2014-01-06) does not support antialiasing, stencil buffer and byte-indices)
var IsIE = function() {return navigator.userAgent.match(/Trident/) ? true : false;}();

// check if embedded on Game Jolt
var IsGJ = function() {return window.location.hostname.match(/gamejolt/) ? true : false;}();


// ****************************************************************
var g_pCanvas  = null;                // main canvas
var g_pTexture = null;                // texture canvas

// menu elements
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
var g_pMenuVolume1 = null;
var g_pMenuVolume2 = null;
var g_pMenuLevel   = null;
var g_pMenuScore   = null;

var g_mProjection = mat4.create();    // global projection matrix
var g_mCamera     = mat4.create();    // global camera matrix
var g_vView       = vec2.create();    // current postion and view of the camera

var g_vMousePos = vec2.create();      // current position of the cursor [-V/2, V/2]

var g_fSaveTime  = 0.0;               // saved time value to calculate last frame time
var g_fTotalTime = 0.0;               // total time since start of the application
var g_fTime      = 0.0;               // last frame time
var g_fBlockTime = 0.0;               // own frame time for block-explosion on fail
var g_fLevelTime = 0.0;               // total time since start of the current level (begins with negative full transition time for an intro-animation)

var g_iStatus = C_STATUS_INTRO;       // application status
var g_iLevel  = 0;                    // current level number
var g_iScore  = 0;                    // current player score

var g_fFade       = 1.0;              // time for main menu fade-out and fail menu fade-in
var g_fTransition = 0.0;              // time for level transitions
var g_fFail       = 0.0;              // total time in fail menu

var g_fStatMulti   = 1.0;             // current score multiplier
var g_fStatTime    = 0.0;             // total time since starting the game
var g_iActiveMulti = 1;               // status of displaying the score multiplier (0 = off, 1 = ready, 2 = on)
var g_iActiveTime  = 0;               // status of displaying the total time

var g_bQuality      = true;           // current quality level
var g_bGameJolt     = false;          // logged in on Game Jolt
var g_fGameJoltPing = 0.0;            // timer for Game Jolt user session ping

var g_iRequestID = 0;                 // ID from requestAnimationFrame()

var g_mMatrix      = mat4.create();   // pre-allocated general purpose matrix
var g_vWeightedPos = vec2.create();   // pre-allocated weighted position for camera calculation
var g_vAveragePos  = vec2.create();   // pre-allocated average position for camera calculation

var g_pPlane  = null;                 // plane object
var g_pPaddle = null;                 // paddle/wall object array
var g_pBall   = null;                 // ball object array
var g_pBlock  = null;                 // block object array


// ****************************************************************
function Init()
{
    // retrieve main canvas
    g_pCanvas = document.getElementById("canvas");

    // define WebGL context attributes
    var abAttributes = {alpha : true, depth : true, stencil : false, antialias : true,
                        premultipliedAlpha : true, preserveDrawingBuffer : false};

    // retrieve WebGL context
    GL = g_pCanvas.getContext("webgl", abAttributes) || g_pCanvas.getContext("experimental-webgl", abAttributes);
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

    // resize everything dynamically
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

    // disable dithering
    GL.disable(GL.DITHER);

    // reset scene
    GL.clearColor(0.333, 0.333, 0.333, 1.0);
    GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    // reset current camera view
    g_vView[1] = C_BALL_START[1] + C_CAMERA_OFF;

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
    for(var i = 0; i < 4; ++i)
        g_pPaddle[i].m_bWall = cLevel.s_aabPaddle[0][i] ? false : true;
    
    // create balls
    g_pBall = new Array(C_BALLS);
    for(var i = 0; i < C_BALLS; ++i)
        g_pBall[i] = new cBall();

    // create blocks and load first level with border
    g_pBlock = new Array(C_LEVEL_ALL);
    LoadLevel(0);
    
    // pre-calculate and start application (requestAnimationFrame in Move())
    Move();
    for(var i = 0; i < C_LEVEL_ALL; ++i)
        g_pBlock[i].UpdateTransform();
}


// ****************************************************************
window.addEventListener("beforeunload", function()   // Exit()
{
    if(!GL) return;
    
    // cancel last animation frame
    window.cancelAnimationFrame(g_iRequestID);

    // exit object interfaces
    cPlane.Exit();
    cPaddle.Exit();
    cBall.Exit();
    cBlock.Exit();

    // exit the Game Jolt user session
    if(g_bGameJolt)
    {
        // may not work
        SendGameJolt("/sessions/close/"                             +
                     "?username="   + QueryString["gjapi_username"] +
                     "&user_token=" + QueryString["gjapi_token"], true);
    }
}, false);


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

    if(g_iStatus === C_STATUS_GAME)
    {
        // move paddles (placed here to reduce input-lag)
        for(var i = 0; i < 4; ++i)
            g_pPaddle[i].Move();
    }
    if(g_iStatus >= C_STATUS_GAME)
    {
        // render paddles
        for(var i = 0; i < 4; ++i)
            g_pPaddle[i].Render();

        // render outside blocks
        for(var i = C_LEVEL_CENTER; i < C_LEVEL_ALL; ++i)
            g_pBlock[i].Render();
    }
    if(g_fTotalTime >= C_INTRO_BLOCKS)
    {
        // render inside blocks (reverse because of depth testing, index 0 is top-left)
        for(var i = C_LEVEL_CENTER-1; i >= 0; --i)
            g_pBlock[i].Render();
    }

    // render plane (after blocks and paddles because of depth testing)
    cPlane.UpdateTexture((g_iActiveTime === 2) ? Math.floor(g_fStatTime) : 0, g_iScore, (g_iActiveMulti === 2) ? g_fStatMulti : 0);
    g_pPlane.Render();

    if(g_iStatus >= C_STATUS_GAME)
    {
        // render balls (after plane because of transparency)
        for(var i = 0; i < C_BALLS; ++i)
            g_pBall[i].Render();
    }

    // move application
    Move();
}


// ****************************************************************
function Move()
{
    var fCameraZ = 0.0;

    // update block time (own time because of block-explosion on fail)
     g_fBlockTime = g_fTime * Math.max(1.0-g_fFail*2.0, 0.0);

    // update intro
    if(g_iStatus === C_STATUS_INTRO)
    {
        // skip intro
        if(QueryString["skip_intro"])
        {
            g_fTotalTime = 20.0;
            g_fBlockTime = 1.3;
        }

        // control logo opacity
        var fLogoOpacity = Math.sin(Math.PI * Clamp((g_fTotalTime-1.0)*0.22, 0.0, 1.0));
        SetOpacity(g_pMenuLogo, fLogoOpacity);

        // control menu opacity and intro status
        var fMenuOpacity = Clamp((g_fTotalTime-7.5)*0.4, 0.0, 1.0);
        SetMenuOpacity(C_MENU_MAIN, fMenuOpacity);
        if(fMenuOpacity >  0.0) SetMenuEnable(C_MENU_MAIN, true);
        if(fMenuOpacity >= 1.0) g_iStatus = C_STATUS_MAIN;

        // control camera flip
        fCameraZ = (1.0-Math.sin(0.5*Math.PI*Clamp((g_fTotalTime-1.5)*0.15, 0.0, 1.0)))*80.0;
    }

    // update fail and win
    if(g_iStatus === C_STATUS_FAIL)
    {
        // fade-in fail menu
        if(g_fFade < 1.0)
        {
            g_fFade = Math.min(g_fFade + g_fTime*0.5, 1.0);
            SetOpacity(g_pCanvas, 1.0 - g_fFade*0.5);
            SetMenuOpacity(C_MENU_FAIL, g_fFade);
        }

        // update total time in fail menu
        g_fFail += g_fTime;
    }

    // update game
    if(g_iStatus === C_STATUS_GAME)
    {
        // fade-out main menu on game start
        if(g_fFade > 0.0)
        {
            g_fFade = Math.max(g_fFade - g_fTime, 0.0);
            SetMenuOpacity(C_MENU_MAIN, g_fFade);
        }

        if(InTransition())
        {
            // update the transition between two levels
            var fOldTransition = g_fTransition;
            g_fTransition += g_fTime;

            // create first ball on transitions end
            if(!InTransition()) cBall.CreateBall(C_BALL_START, cLevel.s_avBallDir[g_iLevel], true);

            // show title of the next level (if defined)
            var fLevelOpacity = Math.sin(Math.PI*Clamp(g_fTransition, 0.0, C_TRANSITION_END-1.0)/(C_TRANSITION_END-1.0));
            SetOpacity(g_pMenuLevel, fLevelOpacity);

            if(fOldTransition < C_TRANSITION_CHANGE && g_fTransition >= C_TRANSITION_CHANGE)
            {
                // set walls and reset shield (but not on last level)
                if(g_iLevel+1 < C_LEVEL_NUM)
                {
                    for(var i = 0; i < 4; ++i)
                    {
                        g_pPaddle[i].m_bWall = cLevel.s_aabPaddle[g_iLevel][i] ? false : true;
                        g_pPaddle[i].m_bShield = false;
                    }
                }
            }
            else if(fOldTransition < C_TRANSITION_LEVEL && g_fTransition >= C_TRANSITION_LEVEL)
            {
                // load level
                LoadLevel(g_iLevel);
            }
        }

        // update total level time
        g_fLevelTime += g_fTime;
        
        // apply level-specific function
        if(cLevel.s_apFunction[g_iLevel]) cLevel.s_apFunction[g_iLevel]();

        // move balls
        for(var i = 0; i < C_BALLS; ++i)
            g_pBall[i].Move();

        // move outside blocks
        for(var i = C_LEVEL_CENTER; i < C_LEVEL_ALL; ++i)
            g_pBlock[i].Move();
    }
    if(g_iStatus !== C_STATUS_PAUSE && g_fTotalTime >= C_INTRO_BLOCKS && g_fBlockTime)
    {
        // move inside blocks
        for(var i = 0; i < C_LEVEL_CENTER; ++i)
            g_pBlock[i].Move();
    }

    // move plane
    g_pPlane.Move();

    // use ball-positions to define the camera
    var fMin = 1000.0;
    var fNum = 0.0;
    vec2.set(g_vAveragePos, 0.0, 0.0);
    for(var i = 0; i < C_BALLS; ++i)
    {
        if(g_pBall[i].m_bActive)
        {
            // use ball alpha-value to smooth camera movement
            g_vWeightedPos[0] = g_pBall[i].m_vPosition[0] * g_pBall[i].m_fAlpha;
            g_vWeightedPos[1] = g_pBall[i].m_vPosition[1] * g_pBall[i].m_fAlpha;

            // sum up ball alpha-values
            fNum += g_pBall[i].m_fAlpha;

            // sum up all ball-positions and get minimum height
            vec2.add(g_vAveragePos, g_vAveragePos, g_vWeightedPos);
            fMin = Math.min(fMin, g_vWeightedPos[1]);
        }
    }

    if(!fNum) // no balls
    {
        // currently no ball active, set camera to spawn-point
        vec2.set(g_vAveragePos, C_BALL_START[0], C_BALL_START[1] + C_CAMERA_OFF);
        if(g_iStatus === C_STATUS_GAME)
        {
            // no ball active and no level transition means player failed (game ends!)
            if(!InTransition()) ActivateFail();
        }
    }
    else // at least one ball
    {
        // calculate average ball-position
        vec2.div(g_vAveragePos, g_vAveragePos, [fNum, fNum]);
        if(fNum > 1.0) g_vAveragePos[1] = g_vAveragePos[1]*0.1 + fMin*0.9;
        g_vAveragePos[1] += C_CAMERA_OFF;

        // set current play time
        if(g_iActiveTime === 1) g_iActiveTime = 2;
        if(g_iStatus === C_STATUS_GAME) g_fStatTime += g_fTime;

        // set current score multiplicator
        if(g_iActiveMulti === 1) g_iActiveMulti = 2;
        g_fStatMulti = Math.max(Math.floor(fNum), 1.0) * (1.0 + g_iLevel*0.2);
    }

    // calculate new camera attributes
    var fCamSpeed = g_fTime * ((g_iStatus === C_STATUS_GAME && !InTransition()) ? ((fNum > 1.0) ? 7.5 : 10.0) : 0.5);
    g_vView[0] += (g_vAveragePos[0] - g_vView[0])*fCamSpeed;
    g_vView[1] += (g_vAveragePos[1] - g_vView[1])*fCamSpeed;

    // create new camera matrix
    mat4.lookAt(g_mCamera, [g_vView[0]*0.3, g_vView[1]*0.5-42.5, 45.0], [g_vView[0]*0.5, g_vView[1]*0.5-11.5, fCameraZ], [0.0, 0.0, 1.0]);

    // rotate camera on final screen
    if(g_iStatus === C_STATUS_FAIL) mat4.rotateZ(g_mCamera, g_mCamera, g_fFail*0.2);

    if(g_bGameJolt)
    {
        // ping the Game Jolt user session
        g_fGameJoltPing += g_fTime;
        if(g_fGameJoltPing >= 30.0)
        {
            var sStatus = C_STATUS_GAME ? "active" : "idle";
            SendGameJolt("/sessions/ping/"                              +
                         "?username="   + QueryString["gjapi_username"] +
                         "&user_token=" + QueryString["gjapi_token"]    +
                         "&status="     + sStatus, true);
        }
    }

    // request next frame
    GL.flush();
    g_iRequestID = requestAnimationFrame(Render, g_pCanvas);
}


// ****************************************************************
function InTransition()
{
    // check, if currently in level transition
    return g_fTransition < C_TRANSITION_END;
}


// ****************************************************************
function SetupRefresh()
{
    var iLastTime = 0;
    var asVendor  = ['moz', 'webkit', 'ms'];

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
        window.cancelAnimationFrame = function(iID) {clearTimeout(iID);};
    }
}


// ****************************************************************
function SetupInput()
{
    // implement mouse movement
    document.body.onmousemove = function(pCursor)
    {
        var oRect = g_pCanvas.getBoundingClientRect();

        // set mouse position relative to the canvas
        g_vMousePos[0] = pCursor.clientX - oRect.left - (oRect.right  - oRect.left)/2;
        g_vMousePos[1] = pCursor.clientY - oRect.top  - (oRect.bottom - oRect.top)/2;

        return true;
    };

    // implement touch event movement
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

    // implement pause with any keyboard key
    document.body.onkeypress = function() {ActivatePause(true);};

    // implement auto-pause if window-focus is lost
    window.onblur = document.body.onkeypress;
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
    g_pMenuVolume1 = document.getElementById("volume-1");
    g_pMenuVolume2 = document.getElementById("volume-2");
    g_pMenuLevel   = document.getElementById("text-level");
    g_pMenuScore   = document.getElementById("text-score");

    // implement start button
    g_pMenuStart.onmousedown = function()
    {
        if(g_iStatus === C_STATUS_MAIN)
        {
            // disable menu and start game
            SetMenuEnable(C_MENU_MAIN, false);
            SetCursor(true);
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

        // init the Game Jolt user session (ignore check for valid credentials)
        SendGameJolt("/sessions/open/"                              +
                     "?username="   + QueryString["gjapi_username"] +
                     "&user_token=" + QueryString["gjapi_token"], true);
    }
}


// ****************************************************************
function Resize()
{
    // resize canvas
    g_pCanvas.width  = window.innerWidth  - (IsGJ ? 2 : 0);
    g_pCanvas.height = window.innerHeight - (IsGJ ? 2 : 0);
    if(IsGJ) g_pCanvas.style.marginTop = "1px";

    // resize font
    document.body.style.fontSize = (g_pCanvas.height/800.0)*100.0 + "%";

    // resize logo
    g_pMenuLogo.style.width      =  g_pCanvas.width*0.32 + "px";
    g_pMenuLogo.style.marginLeft = -g_pCanvas.width*0.16 + "px";

    // resize menu
    var sWidth = g_pCanvas.width + "px";
    g_pMenuHeader.style.width  = sWidth;
    g_pMenuOption1.style.width = sWidth;
    g_pMenuOption2.style.width = sWidth;
    g_pMenuLevel.style.width   = sWidth;
    g_pMenuScore.style.width   = sWidth;

    var sMargin = -g_pCanvas.width*0.5 + "px";
    g_pMenuHeader.style.marginLeft  = sMargin;
    g_pMenuOption1.style.marginLeft = sMargin;
    g_pMenuOption2.style.marginLeft = sMargin;
    g_pMenuLevel.style.marginLeft   = sMargin;
    g_pMenuScore.style.marginLeft   = sMargin;

    // set viewport and projection matrix
    GL.viewport(0, 0, g_pCanvas.width, g_pCanvas.height);
    mat4.perspective(g_mProjection, Math.PI*0.35, g_pCanvas.width / g_pCanvas.height, 0.1, 1000.0);
}


// ****************************************************************
function SetCursor(bStatus)
{
    // change cursor to crosshair
    document.body.style.cursor = bStatus ? "crosshair" : "auto";
}


// ****************************************************************
function SetOpacity(pElement, fOpacity)
{
    // set opacity of element and remove it completely when low
    pElement.style.opacity = fOpacity;
    pElement.style.display = (fOpacity <= 0.01) ? "none" : "block";
}


// ****************************************************************
function SetMenuOpacity(iType, fOpacity)
{
    // set option element opacity
    SetOpacity(g_pMenuOption1, fOpacity);
    SetOpacity(g_pMenuOption2, fOpacity);

    if(iType === C_MENU_MAIN)
    {
        // set main menu opacity
        SetOpacity(g_pMenuJolt,   fOpacity);
        SetOpacity(g_pMenuHeader, fOpacity);
        SetOpacity(g_pMenuLeft,   fOpacity);
        SetOpacity(g_pMenuRight,  fOpacity);
        SetOpacity(g_pMenuTop,    fOpacity);
    }
    else if(iType === C_MENU_PAUSE)
    {
        // set pause menu opacity
        SetOpacity(g_pMenuHeader, fOpacity);
        SetOpacity(g_pMenuTop,    fOpacity);
    }
    else if(iType === C_MENU_FAIL)
    {
        // set fail menu opacity
        SetOpacity(g_pMenuScore, fOpacity);
    }
}


// ****************************************************************
function SetMenuEnable(iType, bEnabled)
{
    var sValue = bEnabled ? "auto" : "none";

    // enable or disable option element interaction
    g_pMenuOption1.style.pointerEvents = sValue;
    g_pMenuOption2.style.pointerEvents = sValue;

    if(iType === C_MENU_MAIN)
    {
        // enable or disable main menu interaction
        g_pMenuLeft.style.pointerEvents  = sValue;
        g_pMenuRight.style.pointerEvents = sValue;
        g_pMenuTop.style.pointerEvents   = sValue;
    }
    else if(iType === C_MENU_PAUSE)
    {
        // enable or disable pause menu interaction
        g_pMenuTop.style.pointerEvents = sValue;
    }
    else if(iType === C_MENU_FAIL)
    {
        // enable or disable fail menu interaction
        // # nothing to see here
    }
}


// ****************************************************************
function ActivatePause(bPaused)
{
    if(bPaused && g_iStatus === C_STATUS_GAME)
    {
        // change application status
        g_iStatus = C_STATUS_PAUSE;

        // set pause header and option elements
        g_pMenuHeader.innerHTML  = "<font class='header'>PAUSE</font>";
        g_pMenuOption1.innerHTML = "<font id='start' class='button'>Resume</font>";
        g_pMenuOption2.innerHTML = "<font id='end' class='button'>Restart</font>";

        // re-get all option elements
        g_pMenuStart = document.getElementById("start");
        g_pMenuEnd   = document.getElementById("end");

        // implement pause exit and application restart
        g_pMenuStart.onmousedown = function() {ActivatePause(false);};
        g_pMenuEnd.onmousedown = function()
        {
            var sSkip = (window.location.href.indexOf("skip_intro") < 0) ? (window.location + (window.location.search ? "&" : "?") + "skip_intro=1") : window.location;
            g_pMenuOption2.innerHTML = "<font id='end' class='button'><a href='" + sSkip + "'>Restart complete game ?</a></font>";
        };

        // enable the pause menu
        SetOpacity(g_pCanvas, 0.5);
        SetMenuOpacity(C_MENU_PAUSE, 1.0);
        SetMenuEnable(C_MENU_PAUSE, true);
        SetCursor(false);
    }
    else if(!bPaused && g_iStatus === C_STATUS_PAUSE)
    {
        // change application status
        g_iStatus = C_STATUS_GAME;

        // disable the pause menu
        SetOpacity(g_pCanvas, 1.0);
        SetMenuOpacity(C_MENU_PAUSE, 0.0);
        SetMenuEnable(C_MENU_PAUSE, false);
        SetCursor(true);
    }
}


// ****************************************************************
function ActivateFail()
{
    // change application status
    g_iStatus = C_STATUS_FAIL;

    // set final score
    g_pMenuScore.innerHTML = "<font>Thank you for playing!<br /><br />Final Score:<br />" + IntToString(g_iScore.toFixed(0), 6) +"</font>";

    // send score to Game Jolt
    if(g_bGameJolt)
    {
        SendGameJolt("/scores/add/"                                   +
                     "?username="   + QueryString["gjapi_username"]   +
                     "&user_token=" + QueryString["gjapi_token"]      +
                     "&table_id="   + 21033                           +
                     "&score="      + g_iScore.toFixed(0) + " Points" +
                     "&sort="       + g_iScore.toFixed(0), true);
    }

    // set option elements and implement application restart and return
    var sSkip = (window.location.href.indexOf("skip_intro") < 0) ? (window.location + (window.location.search ? "&" : "?") + "skip_intro=1") : window.location;
    g_pMenuOption1.innerHTML = "<font id='start' class='button'><a href='" + sSkip + "'>Restart</a></font>";
    g_pMenuOption2.innerHTML = "<font id='end'><a href='javascript:history.go(-1)'>Go Back</a></font>";

    // enable the pause menu (opacity is faded in Move())
    SetMenuEnable(C_MENU_FAIL, true);
    SetCursor(false);

    // throw out all missing blocks (as special effect)
    var vDir = vec2.create();
    for(var i = 0; i < C_LEVEL_ALL; ++i)
    {
        vec2.copy(vDir, g_pBlock[i].m_vPosition);
        vec2.normalize(vDir, vDir);
        g_pBlock[i].Throw(vDir);
    }
}


// ****************************************************************
function SendGameJolt(sString, bAsync)
{
    // -HIDDEN-
}


// ****************************************************************
function Reflect(vOutput, vVelocity, vNormal)
{
    var fDot = vec2.dot(vVelocity, vNormal);
    if(fDot > 0.0) return;

    fDot *= 2.0;
    vOutput[0] = vVelocity[0] - vNormal[0]*fDot;
    vOutput[1] = vVelocity[1] - vNormal[1]*fDot;
}


// ****************************************************************
function Signf(fValue)              {return (fValue < 0.0) ? -1.0 : 1.0;}
function Clamp(fValue, fFrom, fTo)  {return Math.min(Math.max(fValue, fFrom), fTo);}
function IntToString(iValue, iSize) {return ('000000000' + iValue).substr(-iSize);}
function CompareArray(a, b, s)      {for(var i = 0; i < s; ++i) if(a[i] !== b[i]) return false; return true;}