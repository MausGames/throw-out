//////////////////////////////////////////////////////////////////////////////////
//*----------------------------------------------------------------------------*//
//| Throw Out v1.3.0 (https://www.maus-games.at)                               |//
//*----------------------------------------------------------------------------*//
//| Copyright (c) 2014 Martin Mauersics                                        |//
//|                                                                            |//
//| This software is provided 'as-is', without any express or implied          |//
//| warranty. In no event will the authors be held liable for any damages      |//
//| arising from the use of this software.                                     |//
//|                                                                            |//
//| Permission is granted to anyone to use this software for any purpose,      |//
//| including commercial applications, and to alter it and redistribute it     |//
//| freely, subject to the following restrictions:                             |//
//|                                                                            |//
//| 1. The origin of this software must not be misrepresented; you must not    |//
//|    claim that you wrote the original software. If you use this software    |//
//|    in a product, an acknowledgment in the product documentation would be   |//
//|    appreciated but is not required.                                        |//
//|                                                                            |//
//| 2. Altered source versions must be plainly marked as such, and must not be |//
//|    misrepresented as being the original software.                          |//
//|                                                                            |//
//| 3. This notice may not be removed or altered from any source distribution. |//
//*----------------------------------------------------------------------------*//
//////////////////////////////////////////////////////////////////////////////////
"use strict";
const APP = {};

// TODO: press M on the title screen to receive a platinum trophy


// ****************************************************************
APP.SETTINGS = {};
APP.SETTINGS.Alpha   = true;
APP.SETTINGS.Depth   = true;
APP.SETTINGS.Stencil = true;


// ****************************************************************
let C_CAMERA_OFF    = 22.0;       // Y camera offset
let C_INTRO_BLOCKS  = 5.8;        // moment when blocks are active in the intro
let C_BALLS         = 10;         // max number of balls
let C_LEVEL_TIME    = 90.0;       // maximum time in a level
let C_BORDER_HEALTH = 0.6;        // health of all the border blocks (difficulty value)

let C_HIT_RANGE  = 33.0;          // block-affect range of the ball (impact radius)
let C_HIT_INVERT = 1.0/33.0;      // inverted range

let C_TRANSITION_START  = -3.0;   // start-value for level transition
let C_TRANSITION_CHANGE = -1.0;   // point to apply visual changes (add paddles, remove shield)
let C_TRANSITION_LEVEL  =  0.0;   // point to load the level and reset border
let C_TRANSITION_SCORE  =  1.0;   // point to switch plane text back to current score
let C_TRANSITION_END    =  5.0;   // end-value for level transition

// application states
const C_STATUS_INTRO = 0;
const C_STATUS_MAIN  = 1;
const C_STATUS_GAME  = 2;
const C_STATUS_PAUSE = 3;
const C_STATUS_FAIL  = 4;

// menu types
const C_MENU_MAIN  = 0;
const C_MENU_PAUSE = 1;
const C_MENU_FAIL  = 2;

// message types
const C_MSG_BONUS  = 1;
const C_MSG_TIME   = 2;
const C_MSG_CHANCE = 3;

// music files
const C_MUSIC_LIST =
["data/music/Catch_My_Fall",
 "data/music/Fifth_World",
 "data/music/Nocturnia"];


// ****************************************************************
let g_pMenuJolt    = null;
let g_pMenuWarning = null;
let g_pMenuLevel   = null;
let g_pMenuScore   = null;

let g_pSoundBump    = null;                     // simple bump sound effect
let g_iMusicCurrent = 2;                        // current music file (Math.floor(Math.random()*2.999);)
let g_bMusicStatus  = false;                    // music activated in the level

let g_vView      = vec2.clone(C_BALL_START);    // current position and view of the camera
let g_fCamAngle  = 0.0;                         // azimuth of the camera
let g_fCamAcc    = 1.0;                         // camera move acceleration (to enable smoother targeting when creating new balls)
let g_bCamActive = true;                        // camera movement status (toggle with C)

let g_fBlockTime = 0.0;                         // own frame time for block-explosion on fail
let g_fLevelTime = -C_TRANSITION_END;           // total time since start of the current level (begins with negative full transition time for an intro-animation)

let g_iStatus  = C_STATUS_INTRO;                // application status
let g_iLevel   = 0;                             // current level number
let g_iScore   = 0;                             // current player score (handled as float)
let g_iChances = 2;                             // number of remaining chances

let g_bDepthSort = false;                       // render blocks depth-sorted

let g_fFade       = 1.0;                        // time for main menu fade-out and fail menu fade-in
let g_fTransition = 0.0;                        // time for level transitions
let g_fFail       = 0.0;                        // total time in fail menu

let g_fStatMulti   = 1.0;                       // current score multiplier
let g_fStatTime    = 0.0;                       // total time since starting the game
let g_iActiveMulti = 0;                         // status of displaying the score multiplier (0 = off, 1 = ready, 2 = on)
let g_iActiveTime  = 0;                         // status of displaying the total time

let g_iMessage = 0;                             // message type displayed on the plane (1 = bonus, 2 = time was up, 3 = second chance used)
let g_fBonus   = 0.0;                           // time bonus of the last level

let g_fGameJoltNeg = 0.0;                       // negative points accumulated in the current level
let g_fGameJoltFly = 0.0;                       // time since the last paddle bump

let g_vWeightedPos = vec2.create();             // pre-allocated weighted position for camera calculation
let g_vAveragePos  = vec2.create();             // pre-allocated average position for camera calculation

let g_mMatrix = mat4.create();                  // pre-allocated general purpose matrix
let g_vVector = vec4.create();                  // pre-allocated general purpose vector

let g_pBackground = null;                       // background object
let g_pPlane      = null;                       // plane object
let g_pPaddle     = null;                       // paddle/wall object array
let g_pBall       = null;                       // ball object array
let g_pBlock      = null;                       // block object array


// ****************************************************************
APP.Init = function()
{
    // get all menu elements
    g_pMenuJolt    = document.getElementById("jolt");
    g_pMenuWarning = document.getElementById("warning");
    g_pMenuLevel   = document.getElementById("text-level");
    g_pMenuScore   = document.getElementById("text-score");

    // load sound file
    g_pSoundBump = new windSound().Load("data/sounds/bump.wav");
    g_pSoundBump.SetVolume(0.25);

    // load first music file
    WIND.g_pAudioStream.Load(C_MUSIC_LIST[g_iMusicCurrent]);

    // add event for endless music loop
    WIND.g_pAudioStream.addEventListener("ended", function()
    {
        if(++g_iMusicCurrent >= C_MUSIC_LIST.length) g_iMusicCurrent = 0;
        this.Load(C_MUSIC_LIST[g_iMusicCurrent]);
        this.Play();
    });

    // init object interfaces
    cShadow    .Init();
    cBackground.Init();
    cPlane     .Init(true);
    cPaddle    .Init(true);
    cBall      .Init();
    cBlock     .Init(true);

    // create background and plane
    g_pBackground = new cBackground();
    g_pPlane      = new cPlane();

    // create paddles (and walls)
    g_pPaddle    = new Array(4);
    g_pPaddle[0] = new cPaddle( 0.0,  1.0);
    g_pPaddle[1] = new cPaddle( 0.0, -1.0);
    g_pPaddle[2] = new cPaddle( 1.0,  0.0);
    g_pPaddle[3] = new cPaddle(-1.0,  0.0);
    for(let i = 0; i < 4; ++i)
        g_pPaddle[i].m_bWall = !cLevel.s_aabPaddle[0][i];

    // create balls
    g_pBall = new Array(C_BALLS);
    for(let i = 0; i < C_BALLS; ++i)
        g_pBall[i] = new cBall();

    // create blocks and load first level with border
    g_pBlock = new Array(C_LEVEL_ALL);
    LoadLevel(0);

    // prevent flickering on startup
    for(let i = 0; i < C_LEVEL_ALL; ++i)
        g_pBlock[i].UpdateTransform();

    // set Game Jolt user string
    if(GJAPI.bActive) WIND.g_pMenuRight.innerHTML = "<p>Logged in as " + GJAPI.sUserName + "</p>";

    // set default clear color
    GL.clearColor(0.333, 0.333, 0.333, 1.0);
};


// ****************************************************************
APP.Exit = function()
{
    // exit object interfaces
    cShadow    .Exit();
    cBackground.Exit();
    cPlane     .Exit();
    cPaddle    .Exit();
    cBall      .Exit();
    cBlock     .Exit();
};


// ****************************************************************
APP.Render = function()
{
    // render background
    if(WIND.g_bOptionQuality) g_pBackground.Render();
    else GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    if(g_iStatus === C_STATUS_GAME)
    {
        // move paddles (placed here to reduce input-lag)
        for(let i = 0; i < 4; ++i)
            g_pPaddle[i].Move();
    }
    if(g_iStatus >= C_STATUS_GAME)
    {
        // render paddles
        for(let i = 0; i < 4; ++i)
            g_pPaddle[i].Render();

        // render outside blocks
        for(let i = C_LEVEL_CENTER; i < C_LEVEL_ALL; ++i)
            g_pBlock[i].Render();
    }

    if(!g_bDepthSort && (WIND.g_fTotalTime >= C_INTRO_BLOCKS)) // #1
    {
        // render inside blocks (reversed because of depth testing, index 0 is top-left)
        for(let i = C_LEVEL_CENTER-1; i >= 0; --i)
            g_pBlock[i].Render();
    }

    // update plane texture
    if((g_fTransition >= C_TRANSITION_SCORE) || !g_iMessage)
    {
        cPlane.UpdateTextureValues((g_iActiveTime === 2) ? Math.floor(C_LEVEL_TIME - UTILS.Clamp(g_fLevelTime, 0.0, C_LEVEL_TIME)) : -1.0,
                                   (g_iScore),
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
        for(let i = 0; i < C_BALLS; ++i)
            g_pBall[i].Render();
    }

    if(g_bDepthSort && (WIND.g_fTotalTime >= C_INTRO_BLOCKS)) // #2
    {
        // render inside blocks (sorted and after plane and balls for transparency effects)
        for(let i = 0; i < C_LEVEL_CENTER; ++i)
            g_pBlock[i].Render();
    }

    // apply shadow effect
    if(WIND.g_bOptionQuality) cShadow.Apply();
};


// ****************************************************************
APP.Move = function()
{
    let fCameraZ = 0.0;

    // update block time (own time because of block-explosion on fail)
    g_fBlockTime = WIND.g_fTime * Math.max(1.0-g_fFail*2.0, 0.0);

    // update session status
    if(GJAPI.bActive) GJAPI.bSessionActive = (g_iStatus === C_STATUS_GAME);

    // update intro
    if(g_iStatus === C_STATUS_INTRO)
    {
        // skip intro
        if(UTILS.asQueryParam.has("restart"))
        {
            WIND.g_fTotalTime = 20.0;
            g_fBlockTime = 1.3;
        }

        // control logo opacity
        const fLogoOpacity = Math.sin(Math.PI * UTILS.Clamp((WIND.g_fTotalTime-1.0)*0.22, 0.0, 1.0));
        UTILS.SetElementOpacity(WIND.g_pMenuLogo, fLogoOpacity);

        // control background opacity
        g_pBackground.m_fAlpha = UTILS.Clamp((WIND.g_fTotalTime-5.5)*0.4, 0.0, 1.0);

        // control menu opacity and intro status
        const fMenuOpacity = UTILS.Clamp((WIND.g_fTotalTime-7.5)*0.4, 0.0, 1.0);
        SetMenuOpacity(C_MENU_MAIN, fMenuOpacity);
        if(fMenuOpacity >  0.0) SetMenuEnable(C_MENU_MAIN, true);
        if(fMenuOpacity >= 1.0) g_iStatus = C_STATUS_MAIN;

        // control camera flip
        fCameraZ = (1.0-Math.sin(0.5*Math.PI*UTILS.Clamp((WIND.g_fTotalTime-1.5)*0.15, 0.0, 1.0)))*80.0;
    }

    // update fail and win
    if(g_iStatus === C_STATUS_FAIL)
    {
        // fade-in fail menu
        if(g_fFade < 1.0)
        {
            g_fFade = Math.min(g_fFade + WIND.g_fTime*0.5, 1.0);
            UTILS.SetElementOpacity(WIND.g_pCanvas, 1.0 - g_fFade*0.5);
            SetMenuOpacity(C_MENU_FAIL, g_fFade);
        }

        // update total time in fail menu
        g_fFail += WIND.g_fTime;

        // rotate camera
        g_fCamAngle += WIND.g_fTime*0.2;
    }

    // update game
    if(g_iStatus === C_STATUS_GAME)
    {
        // fade-out main menu on game start
        if(g_fFade > 0.0)
        {
            g_fFade = Math.max(g_fFade - WIND.g_fTime, 0.0);
            SetMenuOpacity(C_MENU_MAIN, g_fFade);
        }

        if(InTransition())
        {
            // update the transition between two levels
            const fOldTransition = g_fTransition;
            g_fTransition = Math.min(g_fTransition+WIND.g_fTime, C_TRANSITION_END);

            // create first ball on transitions end
            if(!InTransition()) cBall.CreateBall(C_BALL_START, cLevel.s_avBallDir[g_iLevel], true);

            // show title of the next level (if defined)
            const fLevelOpacity = Math.sin(Math.PI*UTILS.Clamp(g_fTransition, 0.0, C_TRANSITION_END-1.0)/(C_TRANSITION_END-1.0));
            UTILS.SetElementOpacity(g_pMenuLevel, fLevelOpacity);

            // reset camera rotation smoothly
            g_fCamAngle = InTransition() ? g_fCamAngle*(1.0 - WIND.g_fTime) : 0.0;

            if((fOldTransition < C_TRANSITION_CHANGE) && (g_fTransition >= C_TRANSITION_CHANGE))
            {
                // set walls and reset shield
                for(let i = 0; i < 4; ++i)
                {
                    g_pPaddle[i].m_bWall   = !cLevel.s_aabPaddle[g_iLevel][i];
                    g_pPaddle[i].m_bShield = false;
                }
            }
            else if((fOldTransition < C_TRANSITION_LEVEL) && (g_fTransition >= C_TRANSITION_LEVEL))
            {
                // load level
                LoadLevel(g_iLevel);
            }
        }

        // update total level time
        g_fLevelTime += WIND.g_fTime;

        // check current time and finish level early
        if((g_fLevelTime >= C_LEVEL_TIME) && (g_iActiveTime === 2))
        {
            // add time out trophy (but not on speed-level)
            if(GJAPI.bActive && (g_iLevel !== 10)) GJAPI.TrophyAchieve(5741);

            // finish level
            NextLevel(false);
        }

        // apply level-specific function
        if(cLevel.s_apFunction[g_iLevel] && (g_fTransition >= C_TRANSITION_LEVEL))
            cLevel.s_apFunction[g_iLevel]();

        // move balls
        for(let i = 0; i < C_BALLS; ++i)
            g_pBall[i].Move();

        // move outside blocks
        for(let i = C_LEVEL_CENTER; i < C_LEVEL_ALL; ++i)
            g_pBlock[i].Move();
    }
    if((g_iStatus !== C_STATUS_PAUSE) && (WIND.g_fTotalTime >= C_INTRO_BLOCKS) && g_fBlockTime)
    {
        // move inside blocks
        for(let i = 0; i < C_LEVEL_CENTER; ++i)
            g_pBlock[i].Move();
    }

    // use ball-positions to define the camera
    let fMin = 1000.0;
    let fNum = 0.0;
    vec2.set(g_vAveragePos, 0.0, 0.0);
    for(let i = 0; i < C_BALLS; ++i)
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

    if(!fNum)   // no balls
    {
        // currently no ball active, set camera to center or spawn-point
        vec2.copy(g_vAveragePos, C_BALL_START);
        if(g_iStatus === C_STATUS_GAME)
        {
            // no ball active and no level transition means player failed (game ends!)
            if(!InTransition())
            {
                if(GJAPI.bActive && (g_iLevel < 13))   // not on barrier and final level
                {
                    // get number of active blocks
                    let iBlocks = 0;
                    for(let i = 0; i < C_LEVEL_CENTER; ++i) 
                        if(!g_pBlock[i].m_bFlying) ++iBlocks;

                    // check and add trophy
                    if((0 < iBlocks) && (iBlocks <= 5)) GJAPI.TrophyAchieve(5778);
                }

                // reduce chances, skip level or activate fail screen
                NextLevel(true);
            }
        }
    }
    else   // at least one ball
    {
        // calculate average ball-position
        const fInvNum = 1.0/fNum;
        g_vAveragePos[0] *= fInvNum;
        g_vAveragePos[1] *= fInvNum;
        if(fNum > 1.0) g_vAveragePos[1] = g_vAveragePos[1]*0.1 + fMin*0.9;

        // set current play time
        if(g_iActiveTime === 1) g_iActiveTime = 2;
        if(g_iStatus === C_STATUS_GAME) g_fStatTime += WIND.g_fTime;

        // set current score multiplier
        if(g_iActiveMulti === 1) g_iActiveMulti = 2;
        g_fStatMulti = (1.0 + Math.max(Math.floor(fNum-1.0), 0.0)*0.5) * (1.0 + Math.max(g_iLevel-2, 0)*0.1);

        if(GJAPI.bActive)
        {
            // increase paddle-hit time
            const fOldFly = g_fGameJoltFly;
            g_fGameJoltFly += WIND.g_fTime;

            // long time not touched, add trophy (only-1-send switch behind function)
            if((g_fGameJoltFly >= 15.0) && (fOldFly < 20.0))
                GJAPI.TrophyAchieve(5779);
        }
    }
    if(g_iStatus === C_STATUS_FAIL) vec2.set(g_vAveragePos, 0.0, 0.0);

    // disable camera movement
    if(!g_bCamActive)
    {
        vec2.set(g_vAveragePos, 0.0, -25.0);

        if(g_fCamAngle)
        {
            mat4.identity(g_mMatrix);
            mat4.rotateZ (g_mMatrix, g_mMatrix, g_fCamAngle);
            vec2.transformMat4(g_vAveragePos, g_vAveragePos, g_mMatrix);
        }
    }

    // accelerate camera
    g_fCamAcc = Math.min(g_fCamAcc + WIND.g_fTime*1.0, 1.0);

    // calculate new camera view
    const fCamSpeed = WIND.g_fTime * (((g_iStatus === C_STATUS_GAME) && !InTransition()) ? ((fNum > 1.0) ? 7.0 : 10.0) : 0.5) * g_fCamAcc;
    g_vView[0] += (g_vAveragePos[0] - g_vView[0])*fCamSpeed;
    g_vView[1] += (g_vAveragePos[1] - g_vView[1])*fCamSpeed;

    // begin camera creation, move camera away from the center
    const fAway = (C_CAMERA_OFF + (g_fFail ? (1.0-(1.0/(1.0+g_fFail)))*C_BALL_START[1] : 0.0))*0.5;
    vec3.set(WIND.g_vCamPosition, 0.0, -42.5+fAway, 0.0);
    vec3.set(WIND.g_vCamTarget,   0.0, -11.5+fAway, 0.0);

    // set camera view strength (X < Y for a mild side-turn)
    vec2.set(g_vVector, 0.3, 0.5);

    if(g_fCamAngle)
    {
        // create rotation matrix
        mat4.identity(g_mMatrix);
        mat4.rotateZ (g_mMatrix, g_mMatrix, g_fCamAngle);

        // rotate camera position around the center
        vec2.transformMat4(WIND.g_vCamPosition, WIND.g_vCamPosition, g_mMatrix);
        vec2.transformMat4(WIND.g_vCamTarget,   WIND.g_vCamTarget,   g_mMatrix);

        // rotate camera view strength
        vec2.transformMat4(g_vVector, g_vVector, g_mMatrix);
        g_vVector[0] = Math.abs(g_vVector[0]);
        g_vVector[1] = Math.abs(g_vVector[1]);
    }

    // add view and create new camera matrix (# quite over-engineered, dunno how this happened)
    vec3.add(WIND.g_vCamPosition, WIND.g_vCamPosition, [g_vView[0]*g_vVector[0], g_vView[1]*g_vVector[1], 45.0]);
    vec3.add(WIND.g_vCamTarget,   WIND.g_vCamTarget,   [g_vView[0]*0.5,          g_vView[1]*0.5,          fCameraZ]);
    vec3.set(WIND.g_vCamOrientation, 0.0, 0.0, 1.0);
};


// ****************************************************************
APP.MouseDown = function(iButton)
{

};


// ****************************************************************
APP.MouseUp = function(iButton)
{

};


// ****************************************************************
APP.KeyDown = function(iKey)
{
    // add hidden trophy
    if(iKey === UTILS.KEY.M)
        if(GJAPI.bActive && (g_iStatus <= C_STATUS_MAIN)) GJAPI.TrophyAchieve(5739);

    // toggle camera movement
    if(iKey === UTILS.KEY.C)
        g_bCamActive = !g_bCamActive;

    // pause game
    if(iKey === UTILS.KEY.ENTER || iKey === UTILS.KEY.SPACE)
        WIND.PauseGame(true);
};


// ****************************************************************
APP.KeyUp = function(iKey)
{

};


// ****************************************************************
APP.StartGame = function()
{
    if(g_iStatus === C_STATUS_MAIN)
    {
        // disable menu and start game
        SetMenuEnable(C_MENU_MAIN, false);
        g_iStatus = C_STATUS_GAME;
    }
};


// ****************************************************************
APP.PauseGame = function(bStatus)
{
    // pause game
    ActivatePause(bStatus);
};


// ****************************************************************
APP.ChangeOptionQuality = function(bStatus)
{
    // change video quality
    cPlane .Init(bStatus);
    cPaddle.Init(true);
    cBlock .Init(true);
};


// ****************************************************************
APP.ChangeOptionMusic = function(bStatus)
{
    // play sound effect
    if(bStatus) g_pSoundBump.Play(1.3);

    // show warning
    g_pMenuWarning.innerHTML = bStatus ? "" : "not recommended";

    // play or pause the current music stream
    if(g_bMusicStatus)
    {
        if(bStatus) WIND.g_pAudioStream.Play();
               else WIND.g_pAudioStream.Pause();
    }
};


// ****************************************************************
APP.ChangeOptionSound = function(bStatus)
{
    // play sound effect
    if(bStatus) g_pSoundBump.Play(1.0);
};


// ****************************************************************
APP.Resize = function(sWidth, sMargin)
{
    // resize menu
    g_pMenuLevel.style.width      = sWidth;
    g_pMenuScore.style.width      = sWidth;
    g_pMenuLevel.style.marginLeft = sMargin;
    g_pMenuScore.style.marginLeft = sMargin;
};


// ****************************************************************
function InTransition()
{
    // check, if currently in level transition
    return (g_fTransition < C_TRANSITION_END);
}


// ****************************************************************
function SetMenuOpacity(iType, fOpacity)
{
    // set option element opacity
    UTILS.SetElementOpacity(WIND.g_pMenuVideo, fOpacity);
    UTILS.SetElementOpacity(WIND.g_pMenuAudio, fOpacity);

    if(iType === C_MENU_MAIN)
    {
        // set main menu opacity
        if(GJAPI.bActive) UTILS.SetElementOpacity(g_pMenuJolt, fOpacity);
        UTILS.SetElementOpacity(WIND.g_pMenuHeader,  fOpacity);
        UTILS.SetElementOpacity(WIND.g_pMenuOption1, fOpacity);
        UTILS.SetElementOpacity(WIND.g_pMenuLeft,    fOpacity);
        UTILS.SetElementOpacity(WIND.g_pMenuRight,   fOpacity);
    }
    else if(iType === C_MENU_PAUSE)
    {
        // set pause menu opacity
        UTILS.SetElementOpacity(WIND.g_pMenuHeader,  fOpacity);
        UTILS.SetElementOpacity(WIND.g_pMenuOption2, fOpacity);
        UTILS.SetElementOpacity(WIND.g_pMenuOption3, fOpacity);
    }
    else if(iType === C_MENU_FAIL)
    {
        // set fail menu opacity
        UTILS.SetElementOpacity(WIND.g_pMenuOption1, fOpacity);
        UTILS.SetElementOpacity(g_pMenuScore,        fOpacity);
    }
}


// ****************************************************************
function SetMenuEnable(iType, bEnabled)
{
    // enable or disable option element interaction
    UTILS.SetElementEnabled(WIND.g_pMenuVideo, bEnabled);
    UTILS.SetElementEnabled(WIND.g_pMenuAudio, bEnabled);

    if(iType === C_MENU_MAIN)
    {
        // enable or disable main menu interaction
        UTILS.SetElementEnabled(WIND.g_pMenuOption1, bEnabled);
        UTILS.SetElementEnabled(WIND.g_pMenuLeft,    bEnabled);
        UTILS.SetElementEnabled(WIND.g_pMenuRight,   bEnabled);
    }
    else if(iType === C_MENU_PAUSE)
    {
        // enable or disable pause menu interaction
        UTILS.SetElementEnabled(WIND.g_pMenuOption2, bEnabled);
        UTILS.SetElementEnabled(WIND.g_pMenuOption3, bEnabled);
    }
    else if(iType === C_MENU_FAIL)
    {
        // enable or disable fail menu interaction
        UTILS.SetElementEnabled(WIND.g_pMenuOption1, bEnabled);
    }

    // change cursor style
    UTILS.SetCursor(bEnabled ? UTILS.CURSOR_AUTO : UTILS.CURSOR_CROSSHAIR);
}


// ****************************************************************
function ActivatePause(bPaused)
{
    if(bPaused && (g_iStatus === C_STATUS_GAME))
    {
        // change application status
        g_iStatus = C_STATUS_PAUSE;

        // set pause header
        WIND.g_pMenuHeader.innerHTML = "<p class='header'>PAUSE</p>";

        // enable the pause menu
        UTILS.SetElementOpacity(WIND.g_pCanvas, 0.5);
        SetMenuOpacity(C_MENU_PAUSE, 1.0);
        SetMenuEnable(C_MENU_PAUSE, true);

        // set music volume
        WIND.g_pAudioStream.volume = 0.5;
    }
    else if(!bPaused && (g_iStatus === C_STATUS_PAUSE))
    {
        // change application status
        g_iStatus = C_STATUS_GAME;

        // disable the pause menu
        UTILS.SetElementOpacity(WIND.g_pCanvas, 1.0);
        SetMenuOpacity(C_MENU_PAUSE, 0.0);
        SetMenuEnable(C_MENU_PAUSE, false);

        // set music volume
        WIND.g_pAudioStream.volume = 1.0;
    }
}


// ****************************************************************
function ActivateFail()
{
    // change application status
    g_iStatus = C_STATUS_FAIL;

    // set final score
    g_pMenuScore.innerHTML = "<p>Thank you for playing!<br /><br />Final Score<br />" + IntToString(g_iScore.toFixed(0), 6) + "</p>";

    // send score to Game Jolt
    if(GJAPI.bActive) GJAPI.ScoreAdd(21033, g_iScore.toFixed(0), g_iScore.toFixed(0) + " Points (L" + ((g_iLevel >= C_LEVEL_NUM-1) ? "!" : (g_iLevel+1)) + ")", WIND.g_fTotalTime.toFixed(2));

    // implement application restart ("javascript:window.location.reload(false)";)
    WIND.g_pMenuStart.innerHTML = "<a href='" + (UTILS.asQueryParam.has("restart") ? window.location : (window.location + (window.location.search ? "&" : "?") + "restart=1")) + "'>Restart</a>";

    // enable the fail menu (opacity is faded in Move())
    SetMenuEnable(C_MENU_FAIL, true);

    // throw out all missing blocks (as special effect)
    for(let i = 0; i < C_LEVEL_ALL; ++i)
    {
        vec3.sub(g_vVector, g_pBlock[i].m_vPosition, [0.0, 0.0, -10.0]);
        const fStrength = Math.max(40.0 - vec3.length(g_vVector), 0.0)*0.05;

        vec3.normalize(g_vVector, g_vVector);
        g_vVector[0] *= fStrength;
        g_vVector[1] *= fStrength;
        g_vVector[2] *= fStrength*70.0;

        g_pBlock[i].Throw(g_vVector, g_vVector[2]);
    }

    // set music volume
    WIND.g_pAudioStream.volume = 0.5;

    // end game
    WIND.EndGame();
}


// ****************************************************************
function TimeBits(n, o)
{
    // 00 01 02
    // 03    04
    // 05 06 07
    // 08    09
    // 10 11 12

    // o = new Array(13)

    o[ 0] = (n !== 1);
    o[ 1] = (n !== 1) && (n !== 4);
    o[ 2] = true;
    o[ 3] = (n !== 1) && (n !== 2) && (n !== 3) && (n !== 7);
    o[ 4] = (n !== 5) && (n !== 6);
    o[ 5] = (n !== 1) && (n !== 7);
    o[ 6] = (n !== 1) && (n !== 7) && (n !== 0);
    o[ 7] = true;
    o[ 8] = (n === 2) || (n === 6) || (n === 8) || (n === 0);   // #
    o[ 9] = (n !== 2);
    o[10] = (n !== 1) && (n !== 4) && (n !== 7);
    o[11] = (n !== 1) && (n !== 4) && (n !== 7);
    o[12] = true;
}


// ****************************************************************
function Signf(fValue)
{
    return (fValue < 0.0) ? -1.0 : 1.0;   // does not return 0.0
}


// ****************************************************************
function IntToString(iValue, iSize)
{
    return ("000000000" + iValue).substr(-iSize);
}