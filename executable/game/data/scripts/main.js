/////////////////////////////////////////////////////
//*-----------------------------------------------*//
//| Part of Throw Out (http://www.maus-games.at)  |//
//*-----------------------------------------------*//
//| Released under the zlib License               |//
//| More information available in the readme file |//
//*-----------------------------------------------*//
/////////////////////////////////////////////////////
"use strict";


// ****************************************************************
// ## Press M on the title screen to receive a platinum trophy. ##
// ****************************************************************


// ****************************************************************
var GL;                           // WebGL context
var TEX;                          // texture canvas 2d context

var C_CAMERA_OFF    = 22.0;       // Y camera offset
var C_INTRO_BLOCKS  = 5.8;        // moment when blocks are active in the intro
var C_BALLS         = 10;         // max number of balls
var C_LEVEL_TIME    = 90.0;       // maximum time in a level
var C_BORDER_HEALTH = 0.6;        // health of all the border blocks (difficulty value)

var C_HIT_RANGE  = 33.0;          // block-affect range of the ball (impact radius)
var C_HIT_INVERT = 1.0/33.0;      // inverted range

var C_TRANSITION_START  = -3.0;   // start-value for level transition
var C_TRANSITION_CHANGE = -1.0;   // point to apply visual changes (add paddles, remove shield)
var C_TRANSITION_LEVEL  =  0.0;   // point to load the level and reset border
var C_TRANSITION_SCORE  =  1.0;   // point to switch plane text back to current score
var C_TRANSITION_END    =  5.0;   // end-value for level transition

// application states
var C_STATUS_INTRO = 0;
var C_STATUS_MAIN  = 1;
var C_STATUS_GAME  = 2;
var C_STATUS_PAUSE = 3;
var C_STATUS_FAIL  = 4;

// menu types
var C_MENU_MAIN  = 0;
var C_MENU_PAUSE = 1;
var C_MENU_FAIL  = 2;

// message types
var C_MSG_BONUS  = 1;
var C_MSG_TIME   = 2;
var C_MSG_CHANCE = 3;

// music files
var C_MUSIC_FILE =
["data/music/Catch_My_Fall.ogg",
 "data/music/Fifth_World.ogg",
 "data/music/Nocturnia.ogg"];


// ****************************************************************
// get URL parameters (not very solid, but good enough)
var asQueryParam = function()
{
    var asOutput = {};
    var asList   = window.location.search.substring(1).split("&");

    // loop through all parameters
    for(var i = 0; i < asList.length; ++i)
    {
        // seperate key from value
        var asPair = asList[i].split("=");

        // insert value into map
        if(typeof asOutput[asPair[0]] === "undefined")
            asOutput[asPair[0]] = asPair[1];                          // create new entry
        else if(typeof asOutput[asPair[0]] === "string")
            asOutput[asPair[0]] = [asOutput[asPair[0]], asPair[1]];   // extend into array
        else
            asOutput[asPair[0]].push(asPair[1]);                      // append to array
    }

    return asOutput;
}();

// check for IE user agent
var IsIE = function() {return navigator.userAgent.match(/Trident/) ? true : false;}();

// check if embedded on Game Jolt
var IsGJ = function() {return window.location.hostname.match(/gamejolt/) ? true : false;}();

// save experimental WebGL context status
var IsExp = false;


// ****************************************************************
var g_pCanvas  = null;                          // main canvas
var g_pTexture = null;                          // texture canvas
var g_pAudio   = null;                          // audio stream

// menu elements
var g_pMenuLogo    = null;
var g_pMenuJolt    = null;
var g_pMenuHeader  = null;
var g_pMenuOption1 = null;
var g_pMenuOption2 = null;
var g_pMenuLeft    = null;
var g_pMenuRight   = null;
var g_pMenuTop     = null;
var g_pMenuVolume  = null;
var g_pMenuStart   = null;
var g_pMenuEnd     = null;
var g_pMenuFull    = null;
var g_pMenuQuality = null;
var g_pMenuMusic   = null;
var g_pMenuSound   = null;
var g_pMenuWarning = null;
var g_pMenuLevel   = null;
var g_pMenuScore   = null;

var g_pSoundBump = null;                        // simple bump sound effect

var g_iMusicCurrent = 2;                        // current music file (Math.floor(Math.random()*2.999);)
var g_bMusicStatus  = false;                    // music activated in the level (not to be confused with g_bMusic)

var g_mProjection = mat4.create();              // global projection matrix
var g_mCamera     = mat4.create();              // global camera matrix
var g_vView       = vec2.clone(C_BALL_START);   // current position and view of the camera
var g_fCamAngle   = 0.0;                        // azimuth of the camera
var g_fCamAcc     = 1.0;                        // camera move acceleration (to enable smoother targeting when creating new balls)

var g_vMousePos   = vec2.create();              // current position of the cursor [-V/2, V/2]
var g_fMouseRect  = vec2.create();              // transformed canvas-rect values required for mouse position calculations
var g_fMouseRange = 0.0;                        // range factor

var g_fSaveTime  = 0.0;                         // saved time value to calculate last frame time
var g_fTotalTime = 0.0;                         // total time since start of the application
var g_fTime      = 0.0;                         // last frame time
var g_fBlockTime = 0.0;                         // own frame time for block-explosion on fail
var g_fLevelTime = -C_TRANSITION_END;           // total time since start of the current level (begins with negative full transition time for an intro-animation)

var g_iStatus  = C_STATUS_INTRO;                // application status
var g_iLevel   = 0;                             // current level number
var g_iScore   = 0;                             // current player score (handled as float)
var g_iChances = 2;                             // number of remaining chances

var g_bDepthSort = false;                       // render blocks depth-sorted

var g_fFade       = 1.0;                        // time for main menu fade-out and fail menu fade-in
var g_fTransition = 0.0;                        // time for level transitions
var g_fFail       = 0.0;                        // total time in fail menu

var g_fStatMulti   = 1.0;                       // current score multiplier
var g_fStatTime    = 0.0;                       // total time since starting the game
var g_iActiveMulti = 0;                         // status of displaying the score multiplier (0 = off, 1 = ready, 2 = on)
var g_iActiveTime  = 0;                         // status of displaying the total time

var g_iMessage = 0;                             // message type displayed on the plane (1 = bonus, 2 = time was up, 3 = second chance used)
var g_fBonus   = 0.0;                           // time bonus of the last level

var g_bQuality = true;                          // current quality level
var g_bMusic   = true;                          // current music status
var g_bSound   = true;                          // current sound status

var g_fGameJoltNeg = 0.0;                       // negative points accumulated in the current level
var g_fGameJoltFly = 0.0;                       // time since the last paddle bump

var g_iRequestID = 0;                           // ID from requestAnimationFrame()

var g_mMatrix = mat4.create();                  // pre-allocated general purpose matrix
var g_vVector = vec4.create();                  // pre-allocated general purpose vector

var g_vWeightedPos = vec2.create();             // pre-allocated weighted position for camera calculation
var g_vAveragePos  = vec2.create();             // pre-allocated average position for camera calculation
var g_vCamPos      = vec3.create();             // pre-allocated camera position
var g_vCamTar      = vec3.create();             // pre-allocated camera target

var g_pBackground = null;
var g_pPlane      = null;                       // plane object
var g_pPaddle     = null;                       // paddle/wall object array
var g_pBall       = null;                       // ball object array
var g_pBlock      = null;                       // block object array


// ****************************************************************
function Init()
{
    // retrieve main canvas
    g_pCanvas = document.getElementById("canvas");

    // define WebGL context properties (with stencil buffer)
    var abProperty = {alpha : true, depth : true, stencil : true, antialias : true,
                      premultipliedAlpha : true, preserveDrawingBuffer : false};

    // retrieve WebGL context
    GL = g_pCanvas.getContext("webgl", abProperty);
    if(!GL)
    {
        GL = g_pCanvas.getContext("experimental-webgl", abProperty);
        IsExp = true;

        if(!GL)
        {
            // show error page
            document.body.style.background = "#FAFAFF";
            document.body.innerHTML = "<p style='font: bold 16px sans-serif; position: absolute; left: 50%; top: 49%; width: 400px; height: 140px; margin: -70px 0 0 -200px; text-align: center;'>" +
                                      "<img src='data/images/webgl_logo.png' alt='WebGL' /><br/>" +
                                      "Your browser sucks and doesn't support WebGL.<br/>" +
                                      "Visit <a href='http://get.webgl.org/' style='color: blue;'>http://get.webgl.org/</a> for more information.</p>";
            return;
        }
    }

    // retrieve texture canvas and 2d context
    g_pTexture = document.getElementById("texture");
    TEX = g_pTexture.getContext("2d");

    // setup system components
    SetupVideo();
    SetupAudio();
    SetupInput();
    SetupMenu();
    SetupRefresh();

    // resize everything dynamically
    document.body.onresize = Resize;
    Resize();

    // init object interfaces
    cShadow.Init();
    cBackground.Init();
    cPlane.Init(true);
    cPaddle.Init(true);
    cBall.Init();
    cBlock.Init(true);

    // create background and plane
    g_pBackground = new cBackground();
    g_pPlane      = new cPlane();

    // create paddles (and walls)
    g_pPaddle    = new Array(4);
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
    cShadow.Exit();
    cBackground.Exit();
    cPlane.Exit();
    cPaddle.Exit();
    cBall.Exit();
    cBlock.Exit();
}, false);


// ****************************************************************
function Render(iNewTime)
{
    // calculate elapsed and total time
    var fNewSaveTime = iNewTime * 0.001;
    var fNewTime = Math.abs(fNewSaveTime - g_fSaveTime); // hope the ABS fixes a weird FF bug where time stutters backwards sometimes
    g_fSaveTime = fNewSaveTime;

    // smooth out inconsistent framerates
    if(fNewTime > 0.125) g_fTime = 0.0;
    else g_fTime = 0.85*g_fTime + 0.15*fNewTime;
    g_fTotalTime += g_fTime;

    // render background
    if(g_bQuality) g_pBackground.Render();
    else GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

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

    if(!g_bDepthSort && g_fTotalTime >= C_INTRO_BLOCKS) // #1
    {
        // render inside blocks (reversed because of depth testing, index 0 is top-left)
        for(var i = C_LEVEL_CENTER-1; i >= 0; --i)
            g_pBlock[i].Render();
    }

    // update plane texture
    if(g_fTransition >= C_TRANSITION_SCORE || !g_iMessage)
    {
        cPlane.UpdateTextureValues((g_iActiveTime === 2) ? Math.floor(C_LEVEL_TIME - Clamp(g_fLevelTime, 0.0, C_LEVEL_TIME)) : -1.0,
                                    g_iScore,
                                   (g_iActiveMulti === 2) ? g_fStatMulti : -1.0);
    }
    else
    {
             if(g_iMessage === C_MSG_BONUS)  cPlane.UpdateTextureText("BONUS", g_fBonus.toFixed(0));
        else if(g_iMessage === C_MSG_TIME)   cPlane.UpdateTextureText("TIME UP");
        else if(g_iMessage === C_MSG_CHANCE) cPlane.UpdateTextureText((g_iChances > 0) ? "SECOND" : "LAST", "CHANCE");
    }

    // render plane (after reverse blocks and paddles because of depth testing)
    g_pPlane.Render();

    if(g_iStatus >= C_STATUS_GAME)
    {
        // render balls (after plane because of transparency)
        for(var i = 0; i < C_BALLS; ++i)
            g_pBall[i].Render();
    }

    if(g_bDepthSort && g_fTotalTime >= C_INTRO_BLOCKS) // #2
    {
        // render inside blocks (sorted and after plane and balls for transparency effects)
        for(var i = 0; i < C_LEVEL_CENTER; ++i)
            g_pBlock[i].Render();
    }

    // apply shadow effect
    if(g_bQuality) cShadow.Apply();

    // move application
    Move();
}


// ****************************************************************
function Move()
{
    var fCameraZ = 0.0;

    // update block time (own time because of block-explosion on fail)
    g_fBlockTime = g_fTime * Math.max(1.0-g_fFail*2.0, 0.0);
    
    // update session status
    if(GJAPI.bActive) GJAPI.bSessionActive = (g_iStatus === C_STATUS_GAME) ? true : false;

    // update intro
    if(g_iStatus === C_STATUS_INTRO)
    {
        // skip intro
        if(asQueryParam["skip_intro"])
        {
            g_fTotalTime = 20.0;
            g_fBlockTime = 1.3;
        }

        // control logo opacity
        var fLogoOpacity = Math.sin(Math.PI * Clamp((g_fTotalTime-1.0)*0.22, 0.0, 1.0));
        SetOpacity(g_pMenuLogo, fLogoOpacity);

        // control background opacity
        g_pBackground.m_fAlpha = Clamp((g_fTotalTime-5.5)*0.4, 0.0, 1.0);

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

        // rotate camera
        g_fCamAngle += g_fTime*0.2;
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
            g_fTransition = Math.min(g_fTransition+g_fTime, C_TRANSITION_END);

            // create first ball on transitions end
            if(!InTransition()) cBall.CreateBall(C_BALL_START, cLevel.s_avBallDir[g_iLevel], true);

            // show title of the next level (if defined)
            var fLevelOpacity = Math.sin(Math.PI*Clamp(g_fTransition, 0.0, C_TRANSITION_END-1.0)/(C_TRANSITION_END-1.0));
            SetOpacity(g_pMenuLevel, fLevelOpacity);

            // reset camera rotation smoothly
            g_fCamAngle = InTransition() ? g_fCamAngle*(1.0 - g_fTime) : 0.0;

            if(fOldTransition < C_TRANSITION_CHANGE && g_fTransition >= C_TRANSITION_CHANGE)
            {
                // set walls and reset shield
                for(var i = 0; i < 4; ++i)
                {
                    g_pPaddle[i].m_bWall   = cLevel.s_aabPaddle[g_iLevel][i] ? false : true;
                    g_pPaddle[i].m_bShield = false;
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

        // check current time and finish level early
        if(g_fLevelTime >= C_LEVEL_TIME && g_iActiveTime === 2)
        {
            // add time out trophy (but not on speed-level)
            if(GJAPI.bActive && g_iLevel !== 10) GJAPI.TrophyAchieve(5741);

            // finish level
            NextLevel(false);
        }
        
        // apply level-specific function
        if(cLevel.s_apFunction[g_iLevel] && g_fTransition >= C_TRANSITION_LEVEL)
            cLevel.s_apFunction[g_iLevel]();

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
        // currently no ball active, set camera to center or spawn-point
        vec2.copy(g_vAveragePos, C_BALL_START);
        if(g_iStatus === C_STATUS_GAME)
        {
            // no ball active and no level transition means player failed (game ends!)
            if(!InTransition())
            {
                if(GJAPI.bActive && g_iLevel < 13)   // not on barrier and final level
                {
                    // get number of active blocks
                    var iBlocks = 0;
                    for(var i = 0; i < C_LEVEL_CENTER; ++i) 
                        if(!g_pBlock[i].m_bFlying) ++iBlocks;

                    // check and add trophy
                    if(0 < iBlocks && iBlocks <= 5) GJAPI.TrophyAchieve(5778);
                }
                
                // reduce chances, skip level or activate fail screen
                NextLevel(true);
            }
        }
    }
    else // at least one ball
    {
        // calculate average ball-position
        var fInvNum = 1.0/fNum;
        g_vAveragePos[0] *= fInvNum;
        g_vAveragePos[1] *= fInvNum;
        if(fNum > 1.0) g_vAveragePos[1] = g_vAveragePos[1]*0.1 + fMin*0.9;

        // set current play time
        if(g_iActiveTime === 1) g_iActiveTime = 2;
        if(g_iStatus === C_STATUS_GAME) g_fStatTime += g_fTime;

        // set current score multiplicator
        if(g_iActiveMulti === 1) g_iActiveMulti = 2;
        g_fStatMulti = (1.0 + Math.max(Math.floor(fNum-1.0), 0.0)*0.5) * (1.0 + Math.max(g_iLevel-2, 0)*0.1);

        if(GJAPI.bActive)
        {
            // increase paddle-hit time
            var fOldFly = g_fGameJoltFly;
            g_fGameJoltFly += g_fTime;

            // long time not touched, add trophy (only-1-send switch behind function)
            if(g_fGameJoltFly >= 15.0 && fOldFly < 20.0)
                GJAPI.TrophyAchieve(5779);
        }
    }
    if(g_iStatus === C_STATUS_FAIL) vec2.set(g_vAveragePos, 0.0, 0.0);

    // accelerate camera
    g_fCamAcc = Math.min(g_fCamAcc + g_fTime*1.0, 1.0);

    // calculate new camera view
    var fCamSpeed = g_fTime * ((g_iStatus === C_STATUS_GAME && !InTransition()) ? ((fNum > 1.0) ? 7.0 : 10.0) : 0.5) * g_fCamAcc;
    g_vView[0] += (g_vAveragePos[0] - g_vView[0])*fCamSpeed;
    g_vView[1] += (g_vAveragePos[1] - g_vView[1])*fCamSpeed;

    // begin camera creation, move camera away from the center
    var fAway = (C_CAMERA_OFF + (g_fFail ? (1.0-(1.0/(1.0+g_fFail)))*C_BALL_START[1] : 0.0))*0.5;
    vec3.set(g_vCamPos, 0.0, -42.5+fAway, 0.0);
    vec3.set(g_vCamTar, 0.0, -11.5+fAway, 0.0);

    // set camera view strength (X < Y for a mild side-turn)
    vec2.set(g_vVector, 0.3, 0.5);

    if(g_fCamAngle)
    {
        // create rotation matrix
        mat4.identity(g_mMatrix);
        mat4.rotateZ(g_mMatrix, g_mMatrix, g_fCamAngle);
        
        // rotate camera position around the center
        vec2.transformMat4(g_vCamPos, g_vCamPos, g_mMatrix);
        vec2.transformMat4(g_vCamTar, g_vCamTar, g_mMatrix);

        // rotate camera view strength
        vec2.transformMat4(g_vVector, g_vVector, g_mMatrix);
        g_vVector[0] = Math.abs(g_vVector[0]);
        g_vVector[1] = Math.abs(g_vVector[1]);
    }

    // add view and create new camera matrix (# quite over-engineered, dunno how this happened)
    vec3.add(g_vCamPos, g_vCamPos, [g_vView[0]*g_vVector[0], g_vView[1]*g_vVector[1], 45.0]);
    vec3.add(g_vCamTar, g_vCamTar, [g_vView[0]*0.5,          g_vView[1]*0.5,          fCameraZ]);
    mat4.lookAt(g_mCamera, g_vCamPos, g_vCamTar, [0.0, 0.0, 1.0]);
    
    // request next frame
    GL.flush(); // just in case, but not required
    g_iRequestID = requestAnimationFrame(Render, g_pCanvas);
}


// ****************************************************************
function InTransition()
{
    // check, if currently in level transition
    return g_fTransition < C_TRANSITION_END;
}


// ****************************************************************
function SetupVideo()
{
    // enable depth testing
    GL.enable(GL.DEPTH_TEST);
    GL.depthFunc(GL.LEQUAL);
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

    // init model class
    cModel.Init();
}
    
    
// ****************************************************************
function SetupAudio()
{
    // retrieve audio stream and load first music file
    g_pAudio = document.getElementById("stream");
    g_pAudio.src = C_MUSIC_FILE[g_iMusicCurrent];
    g_pAudio.addEventListener("ended", function()
    {
        // play next music file
        if(++g_iMusicCurrent >= C_MUSIC_FILE.length) g_iMusicCurrent = 0;
        this.src = C_MUSIC_FILE[g_iMusicCurrent];
        this.play();
    });
    
    // try to resume an unintentional pause (just check for everything which may cause it)
    var pResume = function()
    {
        if(g_bMusicStatus && g_bMusic) g_pAudio.play();
    };
    g_pAudio.addEventListener("abort",   pResume);
    g_pAudio.addEventListener("error",   pResume);
    g_pAudio.addEventListener("pause",   pResume);
    g_pAudio.addEventListener("stalled", pResume);
    g_pAudio.addEventListener("suspend", pResume);
    g_pAudio.addEventListener("waiting", pResume);
    
    // init sound class and sound files
    cSound.Init();
    g_pSoundBump = new cSound("data/sounds/bump.wav");
    g_pSoundBump.SetVolume(0.25);
}


// ****************************************************************
function SetupInput()
{
    // implement mouse event movement
    document.addEventListener("mousemove", function(pCursor)
    {
        // set mouse position relative to the canvas
        g_vMousePos[0] = pCursor.clientX*g_fMouseRange - g_fMouseRect[0];
        g_vMousePos[1] = pCursor.clientY*g_fMouseRange - g_fMouseRect[1];

        return true;
    }, false);

    // implement touch event movement
    document.addEventListener("touchmove", function(pEvent)
    {
        // get touch input
        pEvent.preventDefault();
        var pTouch = pEvent.touches[0];
        if(pEvent.touches.length >= 2) ActivatePause(true);

        // set mouse position relative to the canvas
        g_vMousePos[0] = pTouch.pageX*g_fMouseRange - g_fMouseRect[0];
        g_vMousePos[1] = pTouch.pageY*g_fMouseRange - g_fMouseRect[1];
    }, false);

    // implement pause (# onkeypress doesn't get all keys)
    document.addEventListener("keydown", function(pEvent)
    {
        pEvent   = window.event || pEvent;
        var iKey = pEvent.charCode || pEvent.keyCode;

        // add hidden trophy
        if(GJAPI.bActive && g_iStatus <= C_STATUS_MAIN)
        {
            // check for M key
            if(iKey === 77) GJAPI.TrophyAchieve(5739);
        }

        // check for enter, escape and whitespace
        if(iKey === 13 || iKey === 27 || iKey === 32)
            ActivatePause(true);
    }, false);

    // implement auto-pause if window-focus is lost
    window.addEventListener("blur", function() {ActivatePause(true);}, false);
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
    g_pMenuVolume  = document.getElementById("text-top-left");
    g_pMenuStart   = document.getElementById("start");
    g_pMenuEnd     = document.getElementById("end");
    g_pMenuFull    = document.getElementById("fullscreen");
    g_pMenuQuality = document.getElementById("quality");
    g_pMenuMusic   = document.getElementById("music");
    g_pMenuSound   = document.getElementById("sound");
    g_pMenuWarning = document.getElementById("warning");
    g_pMenuLevel   = document.getElementById("text-level");
    g_pMenuScore   = document.getElementById("text-score");

    // implement start button
    g_pMenuStart.addEventListener("mousedown", function()
    {
        if(g_iStatus === C_STATUS_MAIN)
        {
            // disable menu and start game
            SetMenuEnable(C_MENU_MAIN, false);
            SetCursor(true);
            g_iStatus = C_STATUS_GAME;
        }
    }, false);

    // implement quality button
    g_pMenuQuality.addEventListener("mousedown", function()
    {
        g_bQuality = !g_bQuality;
        this.style.color = g_bQuality ? "" : "#444444";

        // change video quality
        cPlane.Init(g_bQuality);
        cPaddle.Init(true);
        cBlock.Init(true);
    }, false);

    // implement fullscreen button (# IE works only with click-event, not with onmousedown)
    g_pMenuFull.addEventListener("click", function()
    {
        if(document.fullscreenElement       || document.mozFullScreenElement ||
           document.webkitFullscreenElement || document.msFullscreenElement)
        {
            // disable fullscreen mode
                 if(document.exitFullscreen)       document.exitFullscreen();
            else if(document.mozCancelFullScreen)  document.mozCancelFullScreen();
            else if(document.webkitExitFullscreen) document.webkitExitFullscreen();
            else if(document.msExitFullscreen)     document.msExitFullscreen();
        }
        else
        {
            var pDoc = document.documentElement;
            
            // enable fullscreen mode
                 if(pDoc.requestFullscreen)       pDoc.requestFullscreen();
            else if(pDoc.mozRequestFullScreen)    pDoc.mozRequestFullScreen();
            else if(pDoc.webkitRequestFullscreen) pDoc.webkitRequestFullscreen();
            else if(pDoc.msRequestFullscreen)     pDoc.msRequestFullscreen();
        }
    }, false);

    // implement volume buttons (# hope the color-effect is clear, had some troubles with range-element and unicode support)
    g_pMenuMusic.addEventListener("mousedown", function()
    {
        g_bMusic = !g_bMusic;
        this.style.color = g_bMusic ? "" : "#444444";

        // play sound effect
        if(g_bMusic) g_pSoundBump.Play(1.3);

        // show warning
        g_pMenuWarning.innerHTML = g_bMusic ? "" : "not recommended";

        // play or pause the current music stream
        if(g_bMusicStatus)
        {
            if(g_bMusic) g_pAudio.play();
                    else g_pAudio.pause();
        }
    }, false);
    g_pMenuSound.addEventListener("mousedown", function()
    {
        g_bSound = !g_bSound;
        this.style.color = g_bSound ? "" : "#444444";

        // play sound effect
        if(g_bSound) g_pSoundBump.Play(1.0);
    }, false);

    // adjust back button
    g_pMenuOption2.innerHTML = "<font id='end'><a href='javascript:history.go(-" + (asQueryParam["launcher"] ? 2 : 1) + ")'>Go Back</a></font>";

    if(GJAPI.bActive)
    {
        // set Game Jolt user string
        g_pMenuRight.innerHTML = "<font>Logged in as " + GJAPI.sUserName + "</font>";
    }
}


// ****************************************************************
function SetupRefresh()
{
    var iLastTime = 0;
    var asVendor  = ['moz', 'webkit', 'ms', 'o'];

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
function Resize()
{
    // resize canvas
    g_pCanvas.width  = window.innerWidth  - (asQueryParam["launcher"] ? 2 : 0);
    g_pCanvas.height = window.innerHeight - (asQueryParam["launcher"] ? 2 : 0);
    if(asQueryParam["launcher"] ) g_pCanvas.style.marginTop = "1px";

    // resize font
    document.body.style.fontSize = (g_pCanvas.height/800.0)*100.0 + "%";

    // center logo
    g_pMenuLogo.style.marginLeft = -g_pMenuLogo.naturalWidth/g_pMenuLogo.naturalHeight * g_pCanvas.height*0.18*0.5 + "px";

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

    // calculate mouse values
    var oRect = g_pCanvas.getBoundingClientRect();
    g_fMouseRange   = 1.0 / g_pCanvas.height;
    g_fMouseRect[0] = (oRect.left + (oRect.right  - oRect.left)/2) * g_fMouseRange;
    g_fMouseRect[1] = (oRect.top  + (oRect.bottom - oRect.top )/2) * g_fMouseRange;
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
    SetOpacity(g_pMenuTop,     fOpacity);
    SetOpacity(g_pMenuVolume,  fOpacity);

    if(iType === C_MENU_MAIN)
    {
        // set main menu opacity
        if(GJAPI.bActive) SetOpacity(g_pMenuJolt, fOpacity);
        SetOpacity(g_pMenuHeader, fOpacity);
        SetOpacity(g_pMenuLeft,   fOpacity);
        SetOpacity(g_pMenuRight,  fOpacity);
        SetOpacity(g_pMenuTop,    fOpacity);
        SetOpacity(g_pMenuVolume, fOpacity);
    }
    else if(iType === C_MENU_PAUSE)
    {
        // set pause menu opacity
        SetOpacity(g_pMenuHeader, fOpacity);
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
    g_pMenuTop.style.pointerEvents     = sValue;
    g_pMenuVolume.style.pointerEvents  = sValue;

    if(iType === C_MENU_MAIN)
    {
        // enable or disable main menu interaction
        g_pMenuLeft.style.pointerEvents   = sValue;
        g_pMenuRight.style.pointerEvents  = sValue;
        g_pMenuTop.style.pointerEvents    = sValue;
        g_pMenuVolume.style.pointerEvents = sValue;
    }
    else if(iType === C_MENU_PAUSE)
    {
        // enable or disable pause menu interaction
        // # nothing to see here
    }
    else if(iType === C_MENU_FAIL)
    {
        // enable or disable fail menu interaction
        // # nothing to see here either
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
            var sSkip = (window.location.href.indexOf("skip_intro") < 0) ? (window.location + (window.location.search ? "&" : "?") + "skip_intro=1") : window.location; // "javascript:window.location.reload(false)";
            g_pMenuOption2.innerHTML = "<font id='end' class='button'><a href='" + sSkip + "'>Restart complete game ?</a></font>";
        };

        // enable the pause menu
        SetOpacity(g_pCanvas, 0.5);
        SetMenuOpacity(C_MENU_PAUSE, 1.0);
        SetMenuEnable(C_MENU_PAUSE, true);
        SetCursor(false);

        // set music volume
        g_pAudio.volume = 0.5;
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

        // set music volume
        g_pAudio.volume = 1.0;
    }
}


// ****************************************************************
function ActivateFail()
{
    // change application status
    g_iStatus = C_STATUS_FAIL;

    // set final score
    g_pMenuScore.innerHTML = "<font>Thank you for playing!<br /><br />Final Score<br />" + IntToString(g_iScore.toFixed(0), 6) +"</font>";

    // send score to Game Jolt
    if(GJAPI.bActive) GJAPI.ScoreAdd(21033, g_iScore.toFixed(0), g_iScore.toFixed(0) + " Points (L" + ((g_iLevel >= C_LEVEL_NUM-1) ? "!" : (g_iLevel+1)) + ")", g_fTotalTime.toFixed(2));

    // set option elements and implement application restart and return
    var sSkip = (window.location.href.indexOf("skip_intro") < 0) ? (window.location + (window.location.search ? "&" : "?") + "skip_intro=1") : window.location;
    g_pMenuOption1.innerHTML = "<font id='start' class='button'><a href='" + sSkip + "'>Restart</a></font>";
    g_pMenuOption2.innerHTML = "<font id='end'><a href='javascript:history.go(-" + (asQueryParam["launcher"] ? 2 : 1) + ")'>Go Back</a></font>";

    // enable the fail menu (opacity is faded in Move())
    SetMenuEnable(C_MENU_FAIL, true);
    SetCursor(false);

    // throw out all missing blocks (as special effect)
    for(var i = 0; i < C_LEVEL_ALL; ++i)
    {
        vec3.sub(g_vVector, g_pBlock[i].m_vPosition, [0.0, 0.0, -10.0]);
        var fStrength = Math.max(40.0 - vec3.length(g_vVector), 0.0)*0.05;
        
        vec3.normalize(g_vVector, g_vVector);
        g_vVector[0] *= fStrength;
        g_vVector[1] *= fStrength;
        g_vVector[2] *= fStrength*70.0;

        g_pBlock[i].Throw(g_vVector, g_vVector[2]);
    }
    
    // set music volume
    g_pAudio.volume = 0.5;
}


// ****************************************************************
function ReadFile(sURL)
{
    // create synchronous request to read a file
    var pRequest = new XMLHttpRequest();
    pRequest.open("GET", sURL, false);
    pRequest.send();

    // return file content
    return pRequest.response;
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
function TimeBits(n, o)   // o = new Array(13)
{
    // 00 01 02
    // 03    04
    // 05 06 07
    // 08    09
    // 10 11 12

    for(var i = 0; i < 13; ++i) o[i] = false;

    o[ 2] = true;
    o[ 7] = true;
    o[12] = true;
    if(n === 2 || n === 6 || n === 8 || n === 0) o[ 8] = true;
    if(n !== 5 && n !== 6)                       o[ 4] = true;
    if(n !== 2)                                  o[ 9] = true;
    if(n !== 1)
    {
        o[ 0] = true;
        if(n !== 4) o[ 1] = true;
        if(n !== 7)
        {
            o[ 5] = true;
            if(n !== 0)            o[ 6] = true;
            if(n !== 2 && n !== 3) o[ 3] = true;
            if(n !== 4)
            {
                o[10] = true;
                o[11] = true;
            }
        }
    }
}


// ****************************************************************
function Signf(fValue)              {return (fValue < 0.0) ? -1.0 : 1.0;}
function Clamp(fValue, fFrom, fTo)  {return Math.min(Math.max(fValue, fFrom), fTo);}
function IntToString(iValue, iSize) {return ('000000000' + iValue).substr(-iSize);}
function CompareArray(a, b, s)      {for(var i = 0; i < s; ++i) if(a[i] !== b[i]) return false; return true;}