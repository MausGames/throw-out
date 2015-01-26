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
var C_LEVEL_NUM = 15;                                   // number of available levels

var C_LEVEL_X      = 20;                                // X center blocks
var C_LEVEL_Y      = 20;                                // Y
var C_LEVEL_BX     = 16;                                // X border blocks
var C_LEVEL_BY     = 16;                                // Y
var C_LEVEL_CENTER = C_LEVEL_X*C_LEVEL_Y;               // number of blocks in the center
var C_LEVEL_BORDER = C_LEVEL_BX*2 + C_LEVEL_BY*2;       // number of blocks in the border
var C_LEVEL_ALL    = C_LEVEL_CENTER + C_LEVEL_BORDER;   // number of all blocks

var LVL = 0;                                            // helper-variable used below for level defining


// ****************************************************************
// arrays with level data (# should be one array)
var cLevel = {};
cLevel.s_aavColor   = new Array(C_LEVEL_NUM);   // color list (indexed)
cLevel.s_aaiValue   = new Array(C_LEVEL_NUM);   // block value (0 = no block, !0 = color index)
cLevel.s_aaiTyped   = new Array(C_LEVEL_NUM);   // list with block type data
cLevel.s_aabPaddle  = new Array(C_LEVEL_NUM);   // paddles to use in the level
cLevel.s_avBallDir  = new Array(C_LEVEL_NUM);   // start direction of the ball
cLevel.s_asText     = new Array(C_LEVEL_NUM);   // possible level title (should be empty on first level)
cLevel.s_apInit     = new Array(C_LEVEL_NUM);   // function called directly after level generation (blocks still in the air)
cLevel.s_apFunction = new Array(C_LEVEL_NUM);   // function called during the whole level for special calculations and events
cLevel.s_apExit     = new Array(C_LEVEL_NUM);   // function called at level end (when last block is destroyed)

// default position for blocks in the center (index 0 is top-left)
cLevel.s_avBlockPos = function()
{
    var avOutput = new Array(C_LEVEL_CENTER);

    for(var i = 0; i < C_LEVEL_Y; ++i)
    {
        for(var j = 0; j < C_LEVEL_X; ++j)
        {
            var iCur = i*C_LEVEL_X + j;
            avOutput[iCur] = vec2.fromValues((j - C_LEVEL_X/2)*3.0+1.5, -((i - C_LEVEL_Y/2)*3.0+1.5));
        }
    }

    return avOutput;
}();

cLevel.s_aiStatus = new Float32Array(10);   // some status attributes for level-specific functions (reseted to 0 on level start)


// ****************************************************************
function NextLevel(bLoseChance)
{
    // control bonus, malus and displayed message
    g_iMessage = 0;
    if(bLoseChance)
    {
        // calculate remaining chances
        if(--g_iChances < 0)
        {
            // no chances left, activate fail screen
            ActivateFail();
            return;
        }

        // display chance message
        g_iMessage = C_MSG_CHANCE;
    }
    else
    {
        if(g_iActiveTime === 2)
        {
            // calculate time bonus
            g_fBonus  = Math.floor(1000.0 * Clamp((C_LEVEL_TIME-g_fLevelTime)/C_LEVEL_TIME, 0.0, 1.0));
            g_iScore += g_fBonus;

            // diplay bonus or time up message
            g_iMessage = g_fBonus ? C_MSG_BONUS : C_MSG_TIME;
        }
    }

    // throw missing blocks away
    for(var i = 0; i < C_LEVEL_CENTER; ++i)
    {
        if(g_pBlock[i].m_bFlying) continue;

        vec2.normalize(g_vVector, g_pBlock[i].m_vPosition);
        g_pBlock[i].Throw(g_vVector, 30.0);
    }

    // call level exit-function
    if(cLevel.s_apExit[g_iLevel]) cLevel.s_apExit[g_iLevel]();
    
    // reset total level time
    g_fLevelTime = C_TRANSITION_START - C_TRANSITION_END;

    // reset current negative score and paddle-hit time
    g_fGameJoltNeg = 0.0;
    g_fGameJoltFly = 0.0;

    // convert camera rotation for smooth reset
    g_fCamAngle  = g_fCamAngle % (Math.PI*2.0);
    g_fCamAngle -= (g_fCamAngle > Math.PI) ? Math.PI*2.0 : 0.0;

    // increase and check level number
    if(++g_iLevel < C_LEVEL_NUM)
    {
        // start level transition
        g_fTransition = C_TRANSITION_START;
    }
    else
    {
        // nufin'
    }
}


// ****************************************************************
function LoadLevel(iLevelNum)
{
    // create center blocks
    for(var i = 0; i < C_LEVEL_Y; ++i)
    {
        for(var j = 0; j < C_LEVEL_X; ++j)
        {
            var iCur = i*C_LEVEL_X + j;

            // create block and set start-position
            g_pBlock[iCur] = new cBlock();
            vec3.set(g_pBlock[iCur].m_vPosition, cLevel.s_avBlockPos[iCur][0], cLevel.s_avBlockPos[iCur][1], 270.0-i*12+j*18);

            if(cLevel.s_aaiValue[iLevelNum][iCur] > 0)
            {
                // set specific color of this block
                vec3.copy(g_pBlock[iCur].m_vColor, cLevel.s_aavColor[iLevelNum][cLevel.s_aaiValue[iLevelNum][iCur]-1]);

                // activate block
                g_pBlock[iCur].Activate();
            }
            else g_pBlock[iCur].m_vColor[3] = 0.0;
        }
    }

    // create or regenerate border blocks
    for(var i = 0; i < C_LEVEL_BORDER; ++i)
    {
        var iCur = i + C_LEVEL_CENTER;

        // check if new block has to be created
        if(!g_pBlock[iCur] || g_pBlock[iCur].m_bFlying)
        {
            var iVal = i % C_LEVEL_BX;
            
            // create block
            g_pBlock[iCur] = new cBlock();

            // set start-position
            if(i < 2*C_LEVEL_BY)
            {
                var fSecond = (i < C_LEVEL_BY) ? 1.0 : -1.0;
                vec3.set(g_pBlock[iCur].m_vPosition, (((iVal - C_LEVEL_BY/2)+0.5)*C_BLOCK_DIST) * 1.5*fSecond, -40.0*fSecond, 180.0+i*15);
            }
            else
            {
                var fSecond = (i < 2*C_LEVEL_BY+C_LEVEL_BX) ? 1.0 : -1.0;
                vec3.set(g_pBlock[iCur].m_vPosition, -40.0*fSecond, (((iVal - C_LEVEL_BX/2)+0.5)*C_BLOCK_DIST) * 1.5*fSecond, 180.0+i*15);
            }

            // add a bit of health to the border
            g_pBlock[iCur].m_fHealth = C_BORDER_HEALTH;

            // set color and activate block
            vec4.set(g_pBlock[iCur].m_vColor, 0.2, 0.2, 0.2, 1.0);
            g_pBlock[iCur].Activate();
        }
    }

    // set typed blocks
    if(cLevel.s_aaiTyped[iLevelNum].length)
    {
        // check for special value
        if(cLevel.s_aaiTyped[iLevelNum][0].iAll)
        {
            // all blocks get the specified type
            for(var i = 0; i < C_LEVEL_Y; ++i)
                for(var j = 0; j < C_LEVEL_X; ++j)
                    g_pBlock[i*C_LEVEL_X + j].m_iType = cLevel.s_aaiTyped[iLevelNum][0].iAll;
        }
        else
        {
            // loop through all entries and distribute the types
            for(var i = 0; i < cLevel.s_aaiTyped[iLevelNum].length; ++i)
            {
                var iCur = cLevel.s_aaiTyped[iLevelNum][i].iY*C_LEVEL_X + cLevel.s_aaiTyped[iLevelNum][i].iX;
                g_pBlock[iCur].m_iType = cLevel.s_aaiTyped[iLevelNum][i].iType;
            }
        }
    }

    // set title of the next level (if defined)
    g_pMenuLevel.innerHTML = "<font class='header'>" + cLevel.s_asText[iLevelNum] + "</font>";

    // reset level status attributes
    for(var i = 0; i < cLevel.s_aiStatus.length; ++i)
        cLevel.s_aiStatus[i] = 0;

    // call level init-function
    if(cLevel.s_apInit[iLevelNum]) cLevel.s_apInit[iLevelNum]();
}


// ****************************************************************
// ### ROUND LOGO 1 ###
LVL = 0;

cLevel.s_aavColor[LVL] =
[vec3.fromValues(140.0/255.0, 159.0/255.0,   8.0/255.0),
 vec3.fromValues(193.0/255.0, 218.0/255.0,  11.0/255.0),
 vec3.fromValues(255.0/255.0, 255.0/255.0, 255.0/255.0)];

cLevel.s_aaiValue[LVL] =
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 3, 3,  3, 3, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 3, 3, 2,  2, 3, 3, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 3, 3, 2, 2,  2, 2, 3, 3, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 3, 2, 2, 1,  1, 2, 2, 3, 0, 0, 0, 0, 0, 0,

 0, 0, 0, 0, 0, 0, 3, 2, 2, 1,  1, 2, 2, 3, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 3, 3, 2, 2,  2, 2, 3, 3, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 3, 3, 2,  2, 3, 3, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 3, 3,  3, 3, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

cLevel.s_aaiTyped[LVL] =
[];

cLevel.s_aabPaddle[LVL] =
[1, 0, 0, 0];

cLevel.s_avBallDir[LVL] =
[-0.707, 0.707];

cLevel.s_asText[LVL] = "";

cLevel.s_apInit[LVL] = function()
{
    // border in first level is invincible
    for(var i = C_LEVEL_CENTER; i < C_LEVEL_ALL; ++i)
        g_pBlock[i].m_fHealth = 1000.0;

    // increase affect range
    cLevel.s_aiStatus[0] = C_HIT_RANGE;
    cLevel.s_aiStatus[1] = C_HIT_INVERT;
    C_HIT_RANGE  = 60.0;
    C_HIT_INVERT = 1.0/60.0;
};
cLevel.s_apFunction[LVL] = function()
{
    var fIntensity = -(Math.max(g_fLevelTime-25.0, 0.0)/240.0);
    if(fIntensity)
    {
        // bending algorithm (# copied from "bending blocks" to make the first level less frustrating)
        for(var i = 0; i < C_LEVEL_CENTER; ++i)
        {
            if(g_pBlock[i].m_bFlying) continue;

            // get difference between ball and block position
            vec2.sub(g_vVector, cLevel.s_avBlockPos[i], g_pBall[0].m_vPosition);

            // calculate distortion vector
            var fLen = vec2.length(g_vVector);
            var fStr = Math.sqrt(Math.max(100.0-fLen, 0.0)) * fIntensity / fLen;   // divide by length to normalize g_vVector
            g_vVector[0] *= fStr;
            g_vVector[1] *= fStr;

            // set position and update transformation
            vec2.add(g_pBlock[i].m_vPosition, cLevel.s_avBlockPos[i], g_vVector);
            g_pBlock[i].UpdateTransform();
        }
    }
};
cLevel.s_apExit[LVL] = function()
{
    // remove border invincibility
    for(var i = C_LEVEL_CENTER; i < C_LEVEL_ALL; ++i)
        g_pBlock[i].m_fHealth = C_BORDER_HEALTH;

    // reset affect range
    C_HIT_RANGE  = cLevel.s_aiStatus[0];
    C_HIT_INVERT = cLevel.s_aiStatus[1];
};


// ****************************************************************
// ### BLUE WAVE 1 ###
LVL = 1;

cLevel.s_aavColor[LVL] =
[vec3.fromValues(0.102*0.75, 0.702*0.75, 1.000*0.75),
 vec3.fromValues(0.102*1.00, 0.702*1.00, 1.000*1.00),
 vec3.fromValues(0.102*1.25, 0.702*1.25, 1.000*1.25),
 vec3.fromValues(0.102*1.50, 0.702*1.50, 1.000*1.50)];

cLevel.s_aaiValue[LVL] =
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 3, 0,  0, 3, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,  1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,  2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,  3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,  4, 4, 4, 4, 4, 4, 4, 4, 4, 4,

 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

cLevel.s_aaiTyped[LVL] =
[{iX :  8, iY : 2, iType : 1},
 {iX : 11, iY : 2, iType : 1}];

cLevel.s_aabPaddle[LVL] =
[1, 0, 0, 0];

cLevel.s_avBallDir[LVL] =
[0.0, 1.0];

cLevel.s_asText[LVL] = "";

cLevel.s_apInit[LVL] = function() {};
cLevel.s_apFunction[LVL] = function()
{
    // start effect after hitting a block
    if(cLevel.s_aiStatus[0])
    {
        // increase effect strength
        cLevel.s_aiStatus[1] = Math.min(cLevel.s_aiStatus[1]+g_fTime, 1.0);

        // apply wave animation to all blocks
        for(var i = 0; i < C_LEVEL_CENTER; ++i)
        {
            if(g_pBlock[i].m_bFlying) continue;

            // set position and update transformation
            vec2.copy(g_pBlock[i].m_vPosition, cLevel.s_avBlockPos[i]);
            g_pBlock[i].m_vPosition[1] += 5.0*cLevel.s_aiStatus[1]*(0.5 + 0.5*Math.sin(Math.PI*g_fLevelTime + cLevel.s_avBlockPos[i][0]*0.1));
            g_pBlock[i].UpdateTransform();
        }
    }
    else
    {
        // check for hit block
        if(cBlock.IsHitAny(0, C_LEVEL_CENTER))
        {
            cLevel.s_aiStatus[0] = 1;

            // start music!
            g_bMusicStatus = true;
            if(g_bMusic) g_pAudio.play();
        }
    }
};
cLevel.s_apExit[LVL] = function() {};


// ****************************************************************
// ### BEATING HEART 1 ###
LVL = 2;

cLevel.s_aavColor[LVL] =
[vec3.fromValues(245.0/255.0*1.0,   1.0/255.0*1.0,   0.0/255.0*1.0),
 vec3.fromValues(245.0/255.0*0.7,   1.0/255.0*0.7,   0.0/255.0*0.7),
 vec3.fromValues( 10.0/255.0,      10.0/255.0,      10.0/255.0)];

cLevel.s_aaiValue[LVL] =
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 3, 3, 0, 0,  0, 0, 3, 3, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 3, 2, 2, 3, 0,  0, 3, 2, 2, 3, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 3, 2, 1, 1, 2, 3,  0, 2, 1, 1, 2, 3, 0, 0, 0, 0,
 0, 0, 0, 0, 3, 2, 1, 1, 1, 0,  2, 1, 1, 1, 2, 3, 0, 0, 0, 0,

 0, 0, 0, 0, 3, 2, 1, 1, 1, 1,  0, 1, 1, 1, 2, 3, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 3, 2, 1, 1, 0,  1, 1, 1, 2, 3, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 3, 2, 1, 1,  0, 1, 2, 3, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 3, 2, 0,  1, 2, 3, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 3, 2,  0, 3, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  3, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

cLevel.s_aaiTyped[LVL] =
[{iX : 10, iY : 11, iType : 1}];

cLevel.s_aabPaddle[LVL] =
[0, 1, 0, 0];

cLevel.s_avBallDir[LVL] =
[0.707, 0.707];

cLevel.s_asText[LVL] = "";

cLevel.s_apInit[LVL] = function() {};
cLevel.s_apFunction[LVL] = function()
{
    var fTime = g_fTime*2.0;

    // start effect after hitting a block
    if(cLevel.s_aiStatus[0])
    {
        var fDist = C_BLOCK_DIST*2.0;

        // break the heart
        for(var i = 0; i < C_LEVEL_CENTER; ++i)
        {
            if(g_pBlock[i].m_bFlying) continue;

            // set position and update transformation
            g_pBlock[i].m_vPosition[0] += (cLevel.s_avBlockPos[i][0] + fDist * Signf(g_pBlock[i].m_vPosition[0]) - g_pBlock[i].m_vPosition[0])*fTime;
            g_pBlock[i].m_vPosition[1] += (cLevel.s_avBlockPos[i][1]                                             - g_pBlock[i].m_vPosition[1])*fTime;
            g_pBlock[i].UpdateTransform();
        }
    }
    else
    {
        var fDist = C_BLOCK_DIST*0.5;

        // update timer
        cLevel.s_aiStatus[2]  = cLevel.s_aiStatus[1];
        cLevel.s_aiStatus[1] += g_fTime*3.0;

        // check for fixed difference
        var iOld = Math.floor(cLevel.s_aiStatus[2]) % 4;
        var iCur = Math.floor(cLevel.s_aiStatus[1]) % 4;
        if(iOld !== iCur)
        {
            // create beat at 0 and 1 (bump bump calm calm)
            if(iCur < 2)
            {
                for(var i = 0; i < C_LEVEL_CENTER; ++i)
                {
                    if(g_pBlock[i].m_bFlying) continue;
                    g_pBlock[i].m_vPosition[0] = 1.2 * (cLevel.s_avBlockPos[i][0] - fDist * Signf(g_pBlock[i].m_vPosition[0]));
                    g_pBlock[i].m_vPosition[1] = 1.2 *  cLevel.s_avBlockPos[i][1];
                }
            }
        }

        // keep blocks together, contract
        for(var i = 0; i < C_LEVEL_CENTER; ++i)
        {
            if(g_pBlock[i].m_bFlying) continue;

            // set position and update transformation
            g_pBlock[i].m_vPosition[0] += (cLevel.s_avBlockPos[i][0] - fDist * Signf(g_pBlock[i].m_vPosition[0]) - g_pBlock[i].m_vPosition[0])*fTime;
            g_pBlock[i].m_vPosition[1] += (cLevel.s_avBlockPos[i][1]                                             - g_pBlock[i].m_vPosition[1])*fTime;
            g_pBlock[i].UpdateTransform();
        }

        // check for hit block
        if(cBlock.IsHitAny(0, C_LEVEL_CENTER))
        {
            cLevel.s_aiStatus[0] = 1;

            // activate full interface
            if(!g_iActiveTime)  g_iActiveTime  = 1;
            if(!g_iActiveMulti) g_iActiveMulti = 1;
        }
    }
};
cLevel.s_apExit[LVL] = function() {};


// ****************************************************************
// ### GRAVITATION 2 ###
LVL = 3;

cLevel.s_aavColor[LVL] =
[vec3.fromValues(140.0/255.0*0.80, 159.0/255.0*0.80,   8.0/255.0*0.80),
 vec3.fromValues(140.0/255.0*1.00, 159.0/255.0*1.00,   8.0/255.0*1.00),
 vec3.fromValues(140.0/255.0*1.20, 159.0/255.0*1.20,   8.0/255.0*1.20),
 vec3.fromValues(140.0/255.0*1.40, 159.0/255.0*1.40,   8.0/255.0*1.40),
 vec3.fromValues(255.0/255.0*0.80, 159.0/255.0*0.80,   8.0/255.0*0.80),
 vec3.fromValues(255.0/255.0*1.00, 159.0/255.0*1.00,   8.0/255.0*1.00),
 vec3.fromValues(255.0/255.0*1.20, 159.0/255.0*1.20,   8.0/255.0*1.20),
 vec3.fromValues(255.0/255.0*1.40, 159.0/255.0*1.40,   8.0/255.0*1.40),
 vec3.fromValues(255.0/255.0,      255.0/255.0,      255.0/255.0)];

cLevel.s_aaiValue[LVL] =
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 8, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 3, 4, 3, 0, 0, 0,  0, 0, 0, 7, 8, 7, 0, 0, 0, 0,
 0, 0, 0, 0, 3, 4, 3, 0, 0, 0,  0, 0, 6, 7, 8, 7, 6, 0, 0, 0,
 0, 0, 0, 0, 3, 4, 3, 0, 0, 0,  0, 5, 6, 7, 8, 7, 6, 5, 0, 0,
 0, 0, 0, 0, 3, 4, 3, 0, 0, 0,  0, 0, 0, 7, 8, 7, 0, 0, 0, 0,
 0, 0, 0, 0, 3, 4, 3, 0, 0, 0,  0, 0, 0, 7, 8, 7, 0, 0, 0, 0,
 0, 0, 0, 0, 3, 4, 3, 0, 0, 9,  0, 0, 0, 7, 8, 7, 0, 0, 0, 0,

 0, 0, 0, 0, 3, 4, 3, 0, 0, 0,  0, 0, 0, 7, 8, 7, 0, 0, 0, 0,
 0, 0, 0, 0, 3, 4, 3, 0, 0, 0,  0, 0, 0, 7, 8, 7, 0, 0, 0, 0,
 0, 0, 0, 0, 3, 4, 3, 0, 0, 0,  0, 0, 0, 7, 8, 7, 0, 0, 0, 0,
 0, 0, 1, 2, 3, 4, 3, 2, 1, 0,  0, 0, 0, 7, 8, 7, 0, 0, 0, 0,
 0, 0, 0, 2, 3, 4, 3, 2, 0, 0,  0, 0, 0, 7, 8, 7, 0, 0, 0, 0,
 0, 0, 0, 0, 3, 4, 3, 0, 0, 0,  0, 0, 0, 7, 8, 7, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 4, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

cLevel.s_aaiTyped[LVL] =
[{iX :  5, iY : 16, iType : 1},
 {iX : 14, iY :  3, iType : 1},
 {iX :  9, iY :  9, iType : 2}];

cLevel.s_aabPaddle[LVL] =
[0, 0, 1, 1];

cLevel.s_avBallDir[LVL] =
[0.0, 1.0];

cLevel.s_asText[LVL] = "";

cLevel.s_apInit[LVL] = function()
{
    // re-position the centered block
    vec2.set(g_pBlock[C_LEVEL_X*9+9].m_vPosition, 0.0, 0.0);
};
cLevel.s_apFunction[LVL] = function()
{
    // apply Y gravitation to all ball directions (not perfect, but feels playable)
    for(var i = 0; i < 3; ++i)
    {
        if(g_pBall[i].m_bActive)
            g_pBall[i].m_vDirection[1] = Clamp(g_pBall[i].m_vDirection[1] + g_fTime*Signf(g_pBall[i].m_vPosition[0]), -1.0, 1.0);
    }

    // move blocks up and down
    var fCur = Math.sin(Math.PI*g_fLevelTime);
    for(var i = 0; i < C_LEVEL_CENTER; ++i)
    {
        if(g_pBlock[i].m_bFlying || g_pBlock[i].m_iType === 2) continue;

        // set position and update transformation
        g_pBlock[i].m_vPosition[1] = cLevel.s_avBlockPos[i][1] + fCur*Signf(g_pBlock[i].m_vPosition[0]);
        g_pBlock[i].UpdateTransform();
    }
};
cLevel.s_apExit[LVL] = function() {};


// ****************************************************************
// ### DOUBLE BALL 2 ###
LVL = 4;

cLevel.s_aavColor[LVL] =
[vec3.fromValues(240.0/255.0*1.05,     219.0/255.0*1.05,       8.0/255.0*1.05),
 vec3.fromValues(240.0/255.0*1.05*0.7, 219.0/255.0*1.05*0.7,   8.0/255.0*1.05*0.7)];

cLevel.s_aaiValue[LVL] =
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 1, 1, 1, 1, 1, 1, 1, 1, 1,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  2, 2, 2, 2, 2, 2, 2, 2, 2, 1,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 2, 1,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 2, 1,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 2, 1,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 2, 1,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  1, 0, 0, 0, 0, 0, 0, 0, 2, 1,
 0, 1, 0, 0, 0, 0, 0, 0, 0, 2,  1, 0, 0, 0, 0, 0, 0, 0, 2, 1,
 2, 1, 0, 0, 0, 0, 0, 0, 0, 2,  1, 0, 0, 0, 0, 0, 0, 0, 2, 1,
 2, 1, 1, 1, 1, 1, 1, 1, 1, 1,  1, 1, 1, 1, 1, 1, 1, 1, 1, 1,

 2, 1, 2, 2, 2, 2, 2, 2, 2, 2,  1, 2, 2, 2, 2, 2, 2, 2, 2, 1,
 2, 1, 0, 0, 0, 0, 0, 0, 0, 2,  1, 0, 0, 0, 0, 0, 0, 0, 2, 1,
 2, 1, 0, 0, 0, 0, 0, 0, 0, 2,  1, 0, 0, 0, 0, 0, 0, 0, 2, 0,
 2, 1, 0, 0, 0, 0, 0, 0, 0, 2,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 2, 1, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 2, 1, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 2, 1, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 2, 1, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 2, 1, 1, 1, 1, 1, 1, 1, 1, 1,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 2, 2, 2, 2, 2, 2, 2, 2, 2, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

cLevel.s_aaiTyped[LVL] =
[{iX :  9, iY : 13, iType : 2}];

cLevel.s_aabPaddle[LVL] =
[1, 1, 1, 1];

cLevel.s_avBallDir[LVL] =
[0.707, 0.707];

cLevel.s_asText[LVL] = "";

cLevel.s_apInit[LVL] = function() {};
cLevel.s_apFunction[LVL] = function()
{
    if(g_fLevelTime >= 0.0 && !cLevel.s_aiStatus[0])
    {
        cLevel.s_aiStatus[0] = 1;

        // create second ball
        cBall.CreateBall([-C_BALL_START[0],                 -C_BALL_START[1]],
                         [-cLevel.s_avBallDir[g_iLevel][0], -cLevel.s_avBallDir[g_iLevel][1]], true);

        // reset camera acceleration
        g_fCamAcc = 0.0;

        // save current direction of both balls
        cLevel.s_aiStatus[1] = g_pBall[0].m_vDirection[0];
        cLevel.s_aiStatus[2] = g_pBall[0].m_vDirection[1];
        cLevel.s_aiStatus[3] = g_pBall[1].m_vDirection[0];
        cLevel.s_aiStatus[4] = g_pBall[1].m_vDirection[1];
    }

    // mirror one ball to the other
    for(var i = 1; i < 5; ++i)
    {
        var pA   = g_pBall[i < 3 ? 0 : 1];
        var pB   = g_pBall[i < 3 ? 1 : 0];
        var iDir = (i-1) % 2;

        // check if ball changed his direction
        if(cLevel.s_aiStatus[i] !== pA.m_vDirection[iDir])
        {
            // save and apply inverse direction to other ball
            cLevel.s_aiStatus[i]  =  pA.m_vDirection[iDir];
            pB.m_vDirection[iDir] = -pA.m_vDirection[iDir];

            // synchronize position of both balls
            pB.m_vPosition[0] = -pA.m_vPosition[0];
            pB.m_vPosition[1] = -pA.m_vPosition[1];
        }
    }

    // animate the color of all blocks
    var fStr1 = Math.sin(g_fLevelTime*2.0)*0.5+0.5;
    var fStr2 = 1.0-fStr1;
    for(var i = 0; i < C_LEVEL_CENTER; ++i)
    {
        if(g_pBlock[i].m_bFlying) continue;

        var iType   = (cLevel.s_aaiValue[g_iLevel][i] === 1) ? 0 : 1;
        var vColor1 =  cLevel.s_aavColor[g_iLevel][iType];
        var vColor2 =  cLevel.s_aavColor[g_iLevel][1-iType];

        // calculate the new color
        g_pBlock[i].m_vColor[0] = vColor1[0] * fStr2 + vColor2[0] * fStr1;
        g_pBlock[i].m_vColor[1] = vColor1[1] * fStr2 + vColor2[1] * fStr1;
        g_pBlock[i].m_vColor[2] = vColor1[2] * fStr2 + vColor2[2] * fStr1;
    }
};
cLevel.s_apExit[LVL] = function() {};


// ****************************************************************
// ### MOVING BLOCKS 3 ###
LVL = 5;

cLevel.s_aavColor[LVL] =
[vec3.fromValues(216.0/255.0,   6.0/255.0,   6.0/255.0),
 vec3.fromValues(110.0/255.0, 102.0/255.0,   0.0/255.0),
 vec3.fromValues(247.0/255.0, 170.0/255.0,   0.0/255.0)];

cLevel.s_aaiValue[LVL] =
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 1, 1, 1,  1, 1, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,  1, 1, 1, 1, 1, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 2, 2, 2, 3,  3, 2, 3, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 2, 3, 2, 3, 3,  3, 2, 3, 3, 3, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 2, 3, 2, 2, 3,  3, 3, 2, 3, 3, 3, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 2, 2, 3, 3, 3,  3, 2, 2, 2, 2, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 3, 3, 3,  3, 3, 3, 3, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 2, 2, 1, 2,  2, 2, 2, 0, 0, 0, 0, 0, 0, 0,

 0, 0, 0, 0, 0, 2, 2, 2, 1, 2,  2, 1, 2, 2, 2, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 2, 2, 2, 2, 1, 1,  1, 1, 2, 2, 2, 2, 0, 0, 0, 0,
 0, 0, 0, 0, 3, 3, 2, 1, 3, 1,  1, 3, 1, 2, 3, 3, 0, 0, 0, 0,
 0, 0, 0, 0, 3, 3, 3, 1, 1, 1,  1, 1, 1, 3, 3, 3, 0, 0, 0, 0,
 0, 0, 0, 0, 3, 3, 1, 1, 1, 1,  1, 1, 1, 1, 3, 3, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 1, 1, 1, 0,  0, 1, 1, 1, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 2, 2, 2, 0, 0,  0, 0, 2, 2, 2, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 2, 2, 2, 2, 0, 0,  0, 0, 2, 2, 2, 2, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

cLevel.s_aaiTyped[LVL] =
[{iX :  4, iY : 14, iType : 1},
 {iX :  5, iY : 14, iType : 1},
 {iX : 15, iY : 14, iType : 2}];

cLevel.s_aabPaddle[LVL] =
[1, 1, 0, 0];

cLevel.s_avBallDir[LVL] =
[0.0, 1.0];

cLevel.s_asText[LVL] = "";

cLevel.s_apInit[LVL] = function()
{
    // add progress trophy
    if(GJAPI.bActive) GJAPI.TrophyAchieve(5780);
};
cLevel.s_apFunction[LVL] = function()
{
    var fDecrease = 1.0-g_fTime*4.0;
    var fPush     = g_fTime*2.0;

    for(var i = 0; i < C_LEVEL_CENTER; ++i)
    {
        // check if block was hit
        var pBlock = g_pBlock[i];
        if(pBlock.IsHit())
        {
            var bHit = false;
            for(var k = 0; k < 2; ++k)
            {
                // check which ball hit the block
                if(g_pBall[k].m_iHitBlock !== i+1) continue;
                bHit = true;

                for(var j = 0; j < C_LEVEL_CENTER; ++j)
                {
                    var pOther = g_pBlock[j];
                    if(pOther.m_bFlying) continue;

                    // calculate difference between block and ball
                    vec2.sub(pOther.m_vFlyDir, pOther.m_vPosition, g_pBall[k].m_vPosition);

                    // apply push effect to block (save in fly direction)
                    var fLen  = vec2.length(pOther.m_vFlyDir);
                    var fDist = Math.max(20.0 - fLen, 0.0)*1.5 / fLen;   // divide by length to normalize pOther.m_vFlyDir
                    pOther.m_vFlyDir[0] *= fDist;
                    pOther.m_vFlyDir[1] *= fDist;
                }
            }
            if(bHit) break;
        }
    }

    for(var i = 0; i < C_LEVEL_CENTER; ++i)
    {
        var pBlock = g_pBlock[i];
        if(pBlock.m_bFlying) continue;

        // update push effect
        if(pBlock.m_vFlyDir[0] || pBlock.m_vFlyDir[1])
        {
            // move block with push vector
            pBlock.m_vPosition[0] += pBlock.m_vFlyDir[0] * g_fTime;
            pBlock.m_vPosition[1] += pBlock.m_vFlyDir[1] * g_fTime;

            // decrease push strength over time
            pBlock.m_vFlyDir[0] *= (Math.abs(pBlock.m_vFlyDir[0]) < 0.01) ? 0.0 : fDecrease;
            pBlock.m_vFlyDir[1] *= (Math.abs(pBlock.m_vFlyDir[1]) < 0.01) ? 0.0 : fDecrease;
        }

        // push current block and other blocks apart (# not best algo, but efficient enough)
        for(var j = 0; j < C_LEVEL_CENTER; ++j)
        {
            var pOther = g_pBlock[j];
            if(pOther.m_bFlying) continue;

            // don't compare same block
            if(i === j) continue;

            // calculate difference between both blocks
            vec2.sub(g_vVector, pBlock.m_vPosition, pOther.m_vPosition);

            // check for intersection
            if(Math.abs(g_vVector[0]) < C_BLOCK_DIST &&
               Math.abs(g_vVector[1]) < C_BLOCK_DIST)
            {
                vec2.normalize(g_vVector, g_vVector);
                g_vVector[0] *= fPush;
                g_vVector[1] *= fPush;

                // push both blocks apart (= best result)
                vec2.add(pBlock.m_vPosition, pBlock.m_vPosition, g_vVector);
                vec2.sub(pOther.m_vPosition, pOther.m_vPosition, g_vVector);
            }
        }

        // reflect and clamp block on imaginary wall
        for(var j = 0; j < 2; ++j)
        {
            if(pBlock.m_vPosition[j] < -30.0)
            {
                if(pBlock.m_vFlyDir[j] < 0.0) pBlock.m_vFlyDir[j] = Math.abs(pBlock.m_vFlyDir[j]);
                pBlock.m_vPosition[j] = -30.0;
            }
            else if(pBlock.m_vPosition[j] > 30.0)
            {
                if(pBlock.m_vFlyDir[j] > 0.0) pBlock.m_vFlyDir[j] = -Math.abs(pBlock.m_vFlyDir[j]);
                pBlock.m_vPosition[j] = 30.0;
            }
        }

        // update transformation
        pBlock.UpdateTransform();
    }
};
cLevel.s_apExit[LVL] = function() {};


// ****************************************************************
// ### COLORED LINES 2 ###
LVL = 6;

cLevel.s_aavColor[LVL] =
[vec3.fromValues(255.0/255.0, 100.0/255.0, 100.0/255.0),
 vec3.fromValues(255.0/255.0, 255.0/255.0, 100.0/255.0),
 vec3.fromValues(100.0/255.0, 255.0/255.0, 100.0/255.0),
 vec3.fromValues(100.0/255.0, 255.0/255.0, 255.0/255.0),
 vec3.fromValues(100.0/255.0, 100.0/255.0, 255.0/255.0),
 vec3.fromValues(255.0/255.0, 255.0/255.0, 255.0/255.0)];

cLevel.s_aaiValue[LVL] =
[6, 6, 6, 6, 6, 6, 6, 6, 6, 6,  6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,  6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,  6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,  6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,  6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,  6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,  6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,  6, 6, 6, 6, 6, 6, 6, 6, 6, 6,

 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

cLevel.s_aaiTyped[LVL] =
[{iX :  9, iY :  1, iType : 1},
 {iX : 19, iY :  2, iType : 1},
 {iX :  0, iY :  7, iType : 1},
 {iX : 10, iY :  8, iType : 1}];

cLevel.s_aabPaddle[LVL] =
[1, 0, 0, 0];

cLevel.s_avBallDir[LVL] =
[0.0, 1.0];

cLevel.s_asText[LVL] = "";

cLevel.s_apInit[LVL] = function()
{
    // increase health of all upper blocks
    for(var i = 0; i < C_LEVEL_CENTER/2; ++i)
    {
        if(g_pBlock[i].m_bFlying) continue;
        g_pBlock[i].m_fHealth = 5.0;
        g_pBlock[i].m_vPosition[1] -= C_BLOCK_DIST;
    }

    // re-sort first block line
    for(var i = 0; i < C_LEVEL_X*4; ++i)
        g_pBlock[i].m_vPosition[0] *= -1.0;

    // make unreachable border blocks invincible
    for(var i = C_LEVEL_CENTER+C_LEVEL_BX; i < C_LEVEL_ALL; ++i)
        g_pBlock[i].m_fHealth = 1000.0;

    // increase affect range (also for bottom border blocks, destroys border faster, makes the level harder (=OK), but may confuse the player)
    cLevel.s_aiStatus[0] = C_HIT_RANGE;
    cLevel.s_aiStatus[1] = C_HIT_INVERT;
    C_HIT_RANGE  = 300.0;
    C_HIT_INVERT = 1.0/300.0;

    // increase transition time
    cLevel.s_aiStatus[4] = C_TRANSITION_END;
    C_TRANSITION_END = 7.0;
};
cLevel.s_apFunction[LVL] = function()
{
    // update color of all blocks
    for(var i = 0; i < C_LEVEL_CENTER; ++i)
    {
        if(g_pBlock[i].m_bFlying) continue;

        // get fraction and relevant color values
        var fFract    = g_pBlock[i].m_fHealth % 1.0;   // x - floor(x)
        var fFractInv = 1.0-fFract;
        var vColor1   = cLevel.s_aavColor[g_iLevel][Math.floor(g_pBlock[i].m_fHealth)];
        var vColor2   = cLevel.s_aavColor[g_iLevel][Math.ceil(g_pBlock[i].m_fHealth)];

        // interpolate new color between both color values
        g_pBlock[i].m_vColor[0] = vColor1[0] * fFractInv + vColor2[0] * fFract;
        g_pBlock[i].m_vColor[1] = vColor1[1] * fFractInv + vColor2[1] * fFract;
        g_pBlock[i].m_vColor[2] = vColor1[2] * fFractInv + vColor2[2] * fFract;
    }

    // calculate effect delay and intro
    var fTime = Math.max(g_fLevelTime-0.5, 0.0);
    if(!fTime) return;

    // calculate effect strength and movement speed
    var fStrength = Math.min(fTime*0.5, 1.0);
    var fSpeed    = 1.0 - Math.cos(Math.PI*0.5*Clamp(fTime*0.5-0.5, 0.0, 1.0));

    // calculate block range/segmentation and half line length
    var fRange = 1.0 + 0.115*fStrength;
    var fSide = C_BLOCK_DIST*C_LEVEL_X*0.5*fRange;

    // update the current effect-time
    cLevel.s_aiStatus[2] = (cLevel.s_aiStatus[2] + g_fTime*3.0*fSpeed) % 20.0;
    cLevel.s_aiStatus[3] = cLevel.s_aiStatus[2]*C_BLOCK_DIST;

    for(var i = 0; i < C_LEVEL_CENTER/2; ++i)
    {
        if(g_pBlock[i].m_bFlying) continue;

        // move blocks horizontally
        g_pBlock[i].m_vPosition[0] = (cLevel.s_avBlockPos[i][0] + cLevel.s_aiStatus[3])*fRange;
        if(g_pBlock[i].m_vPosition[0] > fSide) g_pBlock[i].m_vPosition[0] -= fSide*2.0;   // move block back to the other side
        if(i <= C_LEVEL_X*4) g_pBlock[i].m_vPosition[0] *= -1.0;                          // invert movement of the first block line

        // move blocks up and down (looks better when warping the blocks to the other side)
        g_pBlock[i].m_vPosition[2] = 1.0 - fStrength*(0.8 + 0.8*Math.cos(Math.PI*Math.abs(g_pBlock[i].m_vPosition[0])*0.0625));

        // update transformation
        g_pBlock[i].UpdateTransform();
    }
};
cLevel.s_apExit[LVL] = function()
{
    // remove border invincibility
    for(var i = C_LEVEL_CENTER+C_LEVEL_BX; i < C_LEVEL_ALL; ++i)
        g_pBlock[i].m_fHealth = C_BORDER_HEALTH;

    // reset affect range
    C_HIT_RANGE  = cLevel.s_aiStatus[0];
    C_HIT_INVERT = cLevel.s_aiStatus[1];

    // reset transition time
    C_TRANSITION_END = cLevel.s_aiStatus[4];
};


// ****************************************************************
// ### AROUND AND AROUND 3 ###
LVL = 7;

cLevel.s_aavColor[LVL] =
[vec3.fromValues(240.0/255.0*1.1, 219.0/255.0*1.1,   8.0/255.0*1.1),
 vec3.fromValues(245.0/255.0,       1.0/255.0,       0.0/255.0),
 vec3.fromValues(255.0/255.0,     255.0/255.0,     255.0/255.0)];

cLevel.s_aaiValue[LVL] =
[1, 1, 1, 1, 1, 1, 1, 1, 1, 1,  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, // ^ outer
 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, // v inner
 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,  1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,  1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,  1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 3,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

cLevel.s_aaiTyped[LVL] =
[{iX :  9, iY :  9, iType : 1},
 {iX : 19, iY :  4, iType : 2}];

cLevel.s_aabPaddle[LVL] =
[0, 0, 1, 1];

cLevel.s_avBallDir[LVL] =
[0.707, 0.707];

cLevel.s_asText[LVL] = "";

var g_mRotaStep = null;   // additional matrix reference
cLevel.s_apInit[LVL] = function()
{
    // set values for the paddle rotation
    cLevel.s_aiStatus[1] = 0;
    cLevel.s_aiStatus[3] = 0;
    cLevel.s_aiStatus[4] = 2;
    cLevel.s_aiStatus[5] = 1;
    cLevel.s_aiStatus[6] = 3;

    // center the centered block
    vec2.set(g_pBlock[9*C_LEVEL_X+9].m_vPosition, 0.0, 0.0);

    // calculate colors (instead of doing a normal look-up)
    var vColor1 = cLevel.s_aavColor[g_iLevel][0];
    var vColor2 = cLevel.s_aavColor[g_iLevel][1];
    for(var i = 0; i < 5; ++i)
    {
        var fStr1 = (i/4);
        var fStr2 = 1.0-fStr1;

        for(var j = 0; j < C_LEVEL_X; ++j)
        {
            var pBlock = g_pBlock[i*C_LEVEL_X+j];

            pBlock.m_vColor[0] = vColor1[0] * fStr1 + vColor2[0] * fStr2;
            pBlock.m_vColor[1] = vColor1[1] * fStr1 + vColor2[1] * fStr2;
            pBlock.m_vColor[2] = vColor1[2] * fStr1 + vColor2[2] * fStr2;
        }
    }

    // set rotation-step-matrix (to rotate position vector step-by-step)
    g_mRotaStep = g_pBlock[202].m_mTransform;
    mat4.identity(g_mRotaStep);
    mat4.rotateZ(g_mRotaStep, g_mRotaStep, Math.PI*2.0/C_LEVEL_X);

    // increase transition time
    cLevel.s_aiStatus[7] = C_TRANSITION_END;
    C_TRANSITION_END = 7.5;
};
cLevel.s_apFunction[LVL] = function()
{
    // update time to rotate the paddles
    var fCur = cLevel.s_aiStatus[0];
    cLevel.s_aiStatus[0] = (cLevel.s_aiStatus[0] + g_fTime) % 5.0;

    if(cLevel.s_aiStatus[0] < fCur)
    {
        // define new paddles
        cLevel.s_aiStatus[1] = (cLevel.s_aiStatus[1] + 1) % 4;

        // reset to wall-status and activate new paddles
        for(var i = 0; i < 4; ++i) g_pPaddle[i].m_bWall = true;
        g_pPaddle[cLevel.s_aiStatus[3+ cLevel.s_aiStatus[1]     ]].m_bWall = false;
        g_pPaddle[cLevel.s_aiStatus[3+(cLevel.s_aiStatus[1]+2)%4]].m_bWall = false;
    }

    // misuse matrices from blocks
    var mMatrix1 = g_pBlock[200].m_mTransform;
    var mMatrix2 = g_pBlock[201].m_mTransform;
    var fTime    = (g_fLevelTime+5.0)*0.5;

    // calculate basic rotation matrices in both directions
    mat4.identity(mMatrix1);
    mat4.rotateZ(mMatrix1, mMatrix1, fTime);

    mat4.identity(mMatrix2);
    mat4.rotateZ(mMatrix2, mMatrix2, -fTime);

    // transform all relevant blocks
    var fStep  = Math.PI*2.0/C_LEVEL_X;
    var fIntro = Clamp(g_fLevelTime-0.5, 0.0, 1.0);
    for(var i = 0; i < 5; ++i)
    {
        // set initial vector to rotate around
        vec2.transformMat4(g_vVector, [0.0, (1.0+i)*5.0], (i%2) ? mMatrix1 : mMatrix2);

        var fRota = (i%2 ? g_fLevelTime : -g_fLevelTime)*0.5;
        for(var j = 0; j < C_LEVEL_X; ++j)
        {
            // rotate vector around center
            vec2.transformMat4(g_vVector, g_vVector, g_mRotaStep);

            // get and check block status
            var pBlock = g_pBlock[i*C_LEVEL_X+j];
            if(pBlock.m_bFlying) continue;

            // set position and update transformation rotated
            vec2.copy(pBlock.m_vPosition, g_vVector);
            pBlock.UpdateTransformRotated((fRota + fStep*(((i%2) ? 0 : 2)+j))*fIntro);
        }
    }
};
cLevel.s_apExit[LVL] = function()
{
    // reset transition time
    C_TRANSITION_END = cLevel.s_aiStatus[7];
};


// ****************************************************************
// ### INVISIBLE BLOCKS 3 ###
LVL = 8;

cLevel.s_aavColor[LVL] =
[vec3.fromValues( 10.0/255.0,  10.0/255.0,  10.0/255.0),
 vec3.fromValues( 64.0/255.0,  64.0/255.0,  64.0/255.0),
 vec3.fromValues(128.0/255.0, 128.0/255.0, 128.0/255.0),
 vec3.fromValues(192.0/255.0, 192.0/255.0, 192.0/255.0),
 vec3.fromValues(255.0/255.0, 255.0/255.0, 255.0/255.0)];

cLevel.s_aaiValue[LVL] =
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 3, 0, 0, 0, 5,  0, 0, 0, 0, 5, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 3, 4, 3, 0, 0, 0,  0, 0, 0, 5, 4, 5, 0, 0, 0, 0,
 0, 0, 0, 3, 4, 5, 4, 3, 0, 0,  0, 0, 5, 4, 3, 4, 5, 0, 0, 0,
 0, 0, 0, 0, 3, 4, 3, 0, 0, 0,  0, 5, 4, 3, 2, 3, 4, 5, 0, 0,
 0, 0, 0, 0, 0, 3, 0, 0, 0, 0,  5, 4, 3, 2, 1, 2, 3, 4, 5, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 5, 4, 3, 2, 3, 4, 5, 0, 0,
 0, 0, 4, 0, 0, 0, 0, 0, 0, 0,  0, 0, 5, 4, 3, 4, 5, 0, 0, 0,
 0, 4, 5, 4, 0, 0, 0, 0, 0, 0,  0, 0, 0, 5, 4, 5, 0, 0, 0, 0,
 0, 0, 4, 0, 0, 0, 0, 0, 3, 0,  0, 0, 0, 0, 5, 0, 0, 0, 0, 0,

 0, 0, 0, 0, 0, 0, 0, 3, 4, 3,  0, 0, 0, 0, 0, 0, 0, 0, 5, 0,
 0, 0, 0, 0, 0, 0, 3, 4, 5, 4,  3, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 3, 4, 3,  0, 0, 0, 0, 0, 0, 3, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 3, 0,  0, 0, 0, 0, 0, 3, 4, 3, 0, 0,
 0, 0, 0, 0, 4, 0, 0, 0, 0, 0,  0, 0, 0, 0, 3, 4, 5, 4, 3, 0,
 0, 0, 0, 4, 5, 4, 0, 0, 0, 0,  0, 0, 0, 0, 0, 3, 4, 3, 0, 0,
 0, 0, 0, 0, 4, 0, 0, 0, 0, 0,  0, 4, 0, 0, 0, 0, 3, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  4, 5, 4, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 4, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

cLevel.s_aaiTyped[LVL] =
[{iX :  9, iY :  1, iType : 1},
 {iX : 18, iY : 10, iType : 2}];

cLevel.s_aabPaddle[LVL] =
[1, 0, 1, 0];

cLevel.s_avBallDir[LVL] =
[-0.707, 0.707];

cLevel.s_asText[LVL] = "";

cLevel.s_apInit[LVL] = function()
{
    // change block-rendering
    g_bDepthSort = true;
};
cLevel.s_apFunction[LVL] = function()
{
    var fHalfPI = Math.PI*0.5;

    // set transparency strength and visibility-area range
    var fStrength = 1.0 - Clamp((g_fLevelTime+3.0)*0.5, 0.0, 1.0);
    var fRange1   = 0.075*(1.2/g_pPaddle[0].m_vSize[0]);
    var fRange2   = 0.075*(1.2/g_pPaddle[2].m_vSize[0]);

    for(var i = 0; i < C_LEVEL_CENTER; ++i)
    {
        if(g_pBlock[i].m_bFlying)
        {
            // remove transparency smoothly when hit
            if(g_pBlock[i].m_bActive && g_pBlock[i].m_vPosition[2] > 0.0)
                g_pBlock[i].m_vColor[3] += g_fTime*3.0;
            continue;
        }

        // create visibility-area with both paddles
        g_pBlock[i].m_vColor[3] = fStrength + Math.cos(fHalfPI * Clamp(fRange1*(g_pBlock[i].m_vPosition[0] - g_pPaddle[0].m_vPosition[0]), -1.0, 1.0)) *
                                              Math.cos(fHalfPI * Clamp(fRange2*(g_pBlock[i].m_vPosition[1] - g_pPaddle[2].m_vPosition[1]), -1.0, 1.0));
    }
};
cLevel.s_apExit[LVL] = function()
{
    // reset block-rendering in next level
};


// ****************************************************************
// ### BENDING BLOCKS 4 ###
LVL = 9;

cLevel.s_aavColor[LVL] =
[vec3.fromValues(  1.0,     0.275,     0.275),
 vec3.fromValues(  1.0*0.7, 0.275*0.7, 0.275*0.7),
 vec3.fromValues(0.102,     0.702,       1.0),
 vec3.fromValues(0.102*0.7, 0.702*0.7,   1.0*0.7)];

cLevel.s_aaiValue[LVL] =
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 3, 4, 3, 0, 0, 0,  0, 0, 0, 1, 2, 1, 0, 0, 0, 0,
 0, 0, 0, 3, 4, 3, 4, 3, 0, 0,  0, 0, 1, 2, 1, 2, 1, 0, 0, 0,
 0, 0, 0, 4, 3, 4, 3, 4, 0, 0,  0, 0, 2, 1, 2, 1, 2, 0, 0, 0,
 0, 0, 0, 3, 4, 3, 4, 3, 0, 0,  0, 0, 1, 2, 1, 2, 1, 0, 0, 0,
 0, 0, 0, 0, 3, 4, 3, 0, 0, 0,  0, 0, 0, 1, 2, 1, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 1, 2, 1, 0, 0, 0,  0, 0, 0, 3, 4, 3, 0, 0, 0, 0,
 0, 0, 0, 1, 2, 1, 2, 1, 0, 0,  0, 0, 3, 4, 3, 4, 3, 0, 0, 0,
 0, 0, 0, 2, 1, 2, 1, 2, 0, 0,  0, 0, 4, 3, 4, 3, 4, 0, 0, 0,
 0, 0, 0, 1, 2, 1, 2, 1, 0, 0,  0, 0, 3, 4, 3, 4, 3, 0, 0, 0,
 0, 0, 0, 0, 1, 2, 1, 0, 0, 0,  0, 0, 0, 3, 4, 3, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

cLevel.s_aaiTyped[LVL] =
[];

cLevel.s_aabPaddle[LVL] =
[1, 1, 1, 1];

cLevel.s_avBallDir[LVL] =
[-0.707, 0.707];

cLevel.s_asText[LVL] = "";

cLevel.s_apInit[LVL] = function()
{
    // reset block-rendering
    g_bDepthSort = false;

    // reset ball-position for correct block-positions at the beginning
    vec2.copy(g_pBall[0].m_vPosition, C_BALL_START);
};
cLevel.s_apFunction[LVL] = function()
{
    // check if ball hit a paddle (only one ball exists)
    if(g_pBall[0].m_iHitPaddle)
    {
        for(var i = 0; i < C_LEVEL_CENTER; ++i)
        {
            if(g_pBlock[i].m_bFlying) continue;

            // flip color of all blocks and therefore their behavior
                 if(cLevel.s_aavColor[g_iLevel][0][0] === g_pBlock[i].m_vColor[0]) vec3.copy(g_pBlock[i].m_vColor, cLevel.s_aavColor[g_iLevel][2]);
            else if(cLevel.s_aavColor[g_iLevel][1][0] === g_pBlock[i].m_vColor[0]) vec3.copy(g_pBlock[i].m_vColor, cLevel.s_aavColor[g_iLevel][3]);
            else if(cLevel.s_aavColor[g_iLevel][2][0] === g_pBlock[i].m_vColor[0]) vec3.copy(g_pBlock[i].m_vColor, cLevel.s_aavColor[g_iLevel][0]);
            else if(cLevel.s_aavColor[g_iLevel][3][0] === g_pBlock[i].m_vColor[0]) vec3.copy(g_pBlock[i].m_vColor, cLevel.s_aavColor[g_iLevel][1]);
        }
    }

    // bending algorithm (# first level copies it)
    for(var i = 0; i < C_LEVEL_CENTER; ++i)
    {
        if(g_pBlock[i].m_bFlying) continue;

        // get difference between ball and block position
        vec2.sub(g_vVector, cLevel.s_avBlockPos[i], g_pBall[0].m_vPosition);

        // define direction through block-color
        var fDir = (cLevel.s_aavColor[g_iLevel][0][0] === g_pBlock[i].m_vColor[0] ||
                    cLevel.s_aavColor[g_iLevel][1][0] === g_pBlock[i].m_vColor[0]) ? 0.5 : -0.5;

        // calculate distortion vector
        var fLen = vec2.length(g_vVector);
        var fStr = Math.sqrt(Math.max(100.0-fLen, 0.0)) * fDir / fLen;   // divide by length to normalize g_vVector
        g_vVector[0] *= fStr;
        g_vVector[1] *= fStr;

        // set position and update transformation
        vec2.add(g_pBlock[i].m_vPosition, cLevel.s_avBlockPos[i], g_vVector);
        g_pBlock[i].UpdateTransform();
    }
};
cLevel.s_apExit[LVL] = function() {};


// ****************************************************************
// ### UNSTOPPABLE 3 ###
LVL = 10;

cLevel.s_aavColor[LVL] =
[vec3.fromValues(255.0/255.0, 100.0/255.0, 100.0/255.0),
 vec3.fromValues(255.0/255.0, 255.0/255.0, 100.0/255.0),
 vec3.fromValues(100.0/255.0, 255.0/255.0, 100.0/255.0),
 vec3.fromValues(100.0/255.0, 255.0/255.0, 255.0/255.0),
 vec3.fromValues(100.0/255.0, 100.0/255.0, 255.0/255.0),
 vec3.fromValues(255.0/255.0, 255.0/255.0, 255.0/255.0)];

cLevel.s_aaiValue[LVL] =
[6, 6, 6, 6, 6, 6, 6, 6, 6, 6,  6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,  6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,  6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,  6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,  6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,  6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,  6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,  6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,  6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,  6, 6, 6, 6, 6, 6, 6, 6, 6, 6,

 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,  6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,  6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,  6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,  6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,  6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,  6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,  6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,  6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,  6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,  6, 6, 6, 6, 6, 6, 6, 6, 6, 6];

cLevel.s_aaiTyped[LVL] =
[];

cLevel.s_aabPaddle[LVL] =
[0, 0, 1, 1];

cLevel.s_avBallDir[LVL] =
[-0.707, 0.707];

cLevel.s_asText[LVL] = "";

cLevel.s_apInit[LVL] = function()
{
    var fMax = 4.0 / vec2.length(cLevel.s_avBlockPos[0]);

    for(var i = 0; i < C_LEVEL_CENTER; ++i)
    {
        if(g_pBlock[i].m_bFlying) continue;
        if(Math.abs(g_pBlock[i].m_vPosition[0]) < 20.0 &&
           Math.abs(g_pBlock[i].m_vPosition[1]) < 20.0) continue;

        // get transformed distance from center
        var fDist = vec2.length(g_pBlock[i].m_vPosition) * fMax;

        // get fraction and relevant color values
        var fFract    = fDist % 1.0;   // x - floor(x)
        var fFractInv = 1.0-fFract;
        var vColor1   = cLevel.s_aavColor[g_iLevel][Math.floor(fDist)];
        var vColor2   = cLevel.s_aavColor[g_iLevel][Math.ceil(fDist)];

        // interpolate new color between both color values
        g_pBlock[i].m_vColor[0] = vColor1[0] * fFractInv + vColor2[0] * fFract;
        g_pBlock[i].m_vColor[1] = vColor1[1] * fFractInv + vColor2[1] * fFract;
        g_pBlock[i].m_vColor[2] = vColor1[2] * fFractInv + vColor2[2] * fFract;
    }

    // save starting direction
    cLevel.s_aiStatus[1] = cLevel.s_avBallDir[g_iLevel][0];
    cLevel.s_aiStatus[2] = cLevel.s_avBallDir[g_iLevel][1];

    // save configured ball speed
    cLevel.s_aiStatus[0] = g_pBall[0].m_fSpeed;
    
    // prevent ball displacement
    cLevel.s_aiStatus[5] = C_BALL_DISPLACE;
    C_BALL_DISPLACE = 0.0;

    // decrease level time
    cLevel.s_aiStatus[3] = C_LEVEL_TIME;
    C_LEVEL_TIME = 15.0;
};
cLevel.s_apFunction[LVL] = function()
{
    // check for paddle and border hit
    if(g_pBall[0].m_iHitPaddle || (g_pBall[0].m_iHitBlock && g_pBall[0].m_iHitBlock >= C_LEVEL_CENTER+1))
    {
        // save new direction
        cLevel.s_aiStatus[1] = g_pBall[0].m_vDirection[0];
        cLevel.s_aiStatus[2] = g_pBall[0].m_vDirection[1];
    }

    // check for center hit
    if(g_pBall[0].m_iHitBlock && g_pBall[0].m_iHitBlock < C_LEVEL_CENTER+1)
    {
        // apply old direction to ignore the collision
        g_pBall[0].m_vDirection[0] = cLevel.s_aiStatus[1];
        g_pBall[0].m_vDirection[1] = cLevel.s_aiStatus[2];
    }

    // increase ball speed over time
    g_pBall[0].m_fSpeed = cLevel.s_aiStatus[0] * (1.0 + g_fLevelTime/C_LEVEL_TIME);

    // check current time and update all blocks
    var fTime = Math.floor(C_LEVEL_TIME-g_fLevelTime);
    if(cLevel.s_aiStatus[4] !== fTime)
    {
        cLevel.s_aiStatus[4] = fTime;

        var abOutput = new Array(13);
        var pvColor  = cLevel.s_aavColor[g_iLevel][5];

        // map the remaining time on the blocks
        for(var j = 0; j < 2; ++j)
        {
            // set number and position
            var iNum = Math.floor(j ? (fTime/10) : (fTime%10));
            var iPos = j ? (6+7*C_LEVEL_X) : (11+7*C_LEVEL_X);

            // get bit status
            TimeBits(iNum, abOutput);

            for(var i = 0; i < 13; ++i)
            {
                var iC = i + (i >= 4 ? 1 : 0) + (i >= 9 ? 1 : 0);
                var iX = iC % 3;
                var iY = Math.floor(iC / 3);

                // get specific block (no status check)
                var pBlock = g_pBlock[iPos + iX+iY*C_LEVEL_X];

                // set new color value
                if(abOutput[i]) vec3.set(pBlock.m_vColor, pvColor[0]*0.2, pvColor[1]*0.2, pvColor[2]*0.2);
                           else vec3.copy(pBlock.m_vColor, pvColor);
            }
        }
    }
};
cLevel.s_apExit[LVL] = function()
{
    // reset ball speed
    g_pBall[0].m_fSpeed = cLevel.s_aiStatus[0];
    
    // reset ball displacement
    C_BALL_DISPLACE = cLevel.s_aiStatus[5];

    // reset level time
    C_LEVEL_TIME = cLevel.s_aiStatus[3];
};


// ****************************************************************
// ### TELEPORTER 4 ###
LVL = 11;

cLevel.s_aavColor[LVL] =
[vec3.fromValues(193.0/255.0*0.97, 218.0/255.0*0.97,  11.0/255.0*0.97),
 vec3.fromValues(240.0/255.0*1.05, 219.0/255.0*1.05,   8.0/255.0*1.05)];

cLevel.s_aaiValue[LVL] =
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 1, 0, 0, 0, 1, 0, 0,  0, 0, 1, 0, 0, 0, 1, 0, 0, 0,
 0, 0, 0, 1, 1, 0, 0, 1, 1, 0,  0, 1, 1, 0, 0, 1, 1, 0, 0, 0,
 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,  1, 1, 1, 1, 1, 1, 1, 1, 1, 1,

 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,  1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
 0, 0, 0, 1, 1, 0, 0, 1, 1, 0,  0, 1, 1, 0, 0, 1, 1, 0, 0, 0,
 0, 0, 0, 1, 0, 0, 0, 1, 0, 0,  0, 0, 1, 0, 0, 0, 1, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

cLevel.s_aaiTyped[LVL] =
[];

cLevel.s_aabPaddle[LVL] =
[1, 1, 0, 0];

cLevel.s_avBallDir[LVL] =
[0.0, 1.0];

cLevel.s_asText[LVL] = "";

cLevel.s_apInit[LVL] = function()
{
    // activate teleport appearance on all paddles
    for(var i = 0; i < 4; ++i)
        g_pPaddle[i].m_bTeleporter = true;

    // create a little space between the blocks
    for(var i = 0; i < C_LEVEL_CENTER; ++i)
    {
        if(g_pBlock[i].m_bFlying) continue;
        g_pBlock[i].m_vPosition[0] += Signf(g_pBlock[i].m_vPosition[0])*0.8;
    }
};
cLevel.s_apFunction[LVL] = function()
{
    // teleport the ball on paddle and wall collision
    for(var i = 0; i < 4; ++i)
    {
        if(g_pBall[0].m_iHitPaddle === i+1)
        {
            var iX   = (i < 2) ?  1   : 0;
            var fSig = (i % 2) ? -1.0 : 1.0;

            // set ball to new position and overload direction
            g_pBall[0].m_vPosition[iX]  =  fSig*32.5;
            g_pBall[0].m_vDirection[iX] = -fSig*Math.abs(g_pBall[0].m_vDirection[iX]);

            // reset camera acceleration
            g_fCamAcc = (i < 2) ? 0.0 : 0.08;
        }
    }

    // animate the color of all blocks
    var vColor1 = cLevel.s_aavColor[g_iLevel][0];
    var vColor2 = cLevel.s_aavColor[g_iLevel][1];
    for(var i = 0; i < C_LEVEL_CENTER; ++i)
    {
        if(g_pBlock[i].m_bFlying) continue;

        // set the interpolation value as positioned sinus wave
        var fStr1 = Math.sin(g_fLevelTime*5.0 + Math.abs(g_pBlock[i].m_vPosition[0])*0.3333)*0.5+0.5;
        var fStr2 = 1.0-fStr1;

        // make outer blocks darker
        if(i < 180 || i > 220)   // 200 +- C_LEVEL_X
        {
            fStr1 *= 0.75;
            fStr2 *= 0.75;
        }

        // calculate the new color
        g_pBlock[i].m_vColor[0] = vColor1[0] * fStr2 + vColor2[0] * fStr1;
        g_pBlock[i].m_vColor[1] = vColor1[1] * fStr2 + vColor2[1] * fStr1;
        g_pBlock[i].m_vColor[2] = vColor1[2] * fStr2 + vColor2[2] * fStr1;
    }
};
cLevel.s_apExit[LVL] = function()
{
    // deactivate teleport appearance on all paddles
    for(var i = 0; i < 4; ++i)
        g_pPaddle[i].m_bTeleporter = false;
};


// ****************************************************************
// ### FEZ 5 ###
LVL = 12;

cLevel.s_aavColor[LVL] =
[vec4.fromValues(254.0/255.0, 201.0/255.0,  38.0/255.0, 1.0),
 vec4.fromValues(188.0/255.0,   0.0/255.0,   0.0/255.0, 1.0),
 vec4.fromValues(255.0/255.0,   0.0/255.0,   0.0/255.0, 1.0),
 vec4.fromValues(158.0/255.0, 167.0/255.0, 155.0/255.0, 1.0),
 vec4.fromValues(209.0/255.0, 212.0/255.0, 208.0/255.0, 1.0),
 vec4.fromValues(255.0/255.0, 255.0/255.0, 255.0/255.0, 1.0),
 vec4.fromValues( 10.0/255.0,  10.0/255.0,  10.0/255.0, 1.0)];

cLevel.s_aaiValue[LVL] =
[0, 0, 0, 0, 0, 0, 0, 1, 3, 3,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 1, 2, 3, 3,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 2, 3, 3,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 4, 5, 6, 6, 6,  6, 6, 6, 6, 6, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 4, 5, 5, 6, 6, 6,  6, 6, 6, 6, 6, 6, 0, 0, 0, 0,
 0, 0, 0, 0, 4, 5, 6, 6, 6, 6,  6, 6, 6, 6, 6, 6, 0, 0, 0, 0,
 0, 0, 0, 0, 4, 5, 6, 7, 6, 6,  6, 6, 6, 6, 7, 6, 0, 0, 0, 0,
 0, 0, 0, 0, 4, 5, 6, 6, 6, 6,  6, 6, 6, 6, 6, 6, 0, 0, 0, 0,
 0, 0, 0, 0, 4, 5, 5, 6, 6, 6,  7, 7, 6, 6, 6, 6, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 4, 4, 5, 6, 6,  6, 6, 6, 6, 6, 0, 0, 0, 0, 0,

 0, 0, 0, 0, 0, 0, 0, 4, 4, 5,  6, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 4, 5, 6, 6,  6, 6, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 4, 6, 6, 6, 6,  6, 6, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 4, 6, 4, 6, 6, 6,  6, 6, 4, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 4, 5, 6, 6,  6, 6, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 4, 5, 6, 6,  6, 6, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 4, 5, 5, 6,  6, 6, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 4, 5, 0, 0,  4, 5, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 4, 0, 0, 0,  0, 4, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

cLevel.s_aaiTyped[LVL] =
[{iX : 8, iY : 1, iType : 2}];

cLevel.s_aabPaddle[LVL] =
[1, 1, 0, 0];

cLevel.s_avBallDir[LVL] =
[-0.707, 0.707];

cLevel.s_asText[LVL] = "";

cLevel.s_apInit[LVL] = function() {};
cLevel.s_apFunction[LVL] = function()
{
    // update delay to next rotation
    cLevel.s_aiStatus[1] += g_fTime*0.1;
    if(cLevel.s_aiStatus[1] >= 1.0)
    {
        // start rotation
        cLevel.s_aiStatus[1] -= 1.0;
        cLevel.s_aiStatus[0]  = 1.0;
    }

    if(cLevel.s_aiStatus[0])
    {
        // rotate camera
        cLevel.s_aiStatus[2] += Math.min(cLevel.s_aiStatus[0], g_fTime);
        cLevel.s_aiStatus[0]  = Math.max(cLevel.s_aiStatus[0] - g_fTime, 0.0);
        g_fCamAngle = Math.PI*0.5*cLevel.s_aiStatus[2];

        // rotate all blocks with camera
        mat4.identity(g_mMatrix);
        mat4.rotateZ(g_mMatrix, g_mMatrix, g_fCamAngle);
        for(var i = 0; i < C_LEVEL_CENTER; ++i)
        {
            if(g_pBlock[i].m_bFlying) continue;

            // set position and update transformation rotated
            vec2.transformMat4(g_pBlock[i].m_vPosition, cLevel.s_avBlockPos[i], g_mMatrix);
            g_pBlock[i].UpdateTransformRotated(g_fCamAngle);
        }
    }
};
cLevel.s_apExit[LVL] = function() {};


// ****************************************************************
// ### BARRIER 5 ###
LVL = 13;

cLevel.s_aavColor[LVL] =
[vec3.fromValues(0.71*0.75, 0.333*0.75,   1.0*0.75),
 vec3.fromValues(0.71*1.00, 0.333*1.00,   1.0*1.00),
 vec3.fromValues(0.71*1.25, 0.333*1.25,   1.0*1.25),
 vec3.fromValues(0.71*1.50, 0.333*1.50,   1.0*1.50)];

cLevel.s_aaiValue[LVL] =
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, // 1 wall
 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,  2, 2, 2, 2, 2, 2, 2, 2, 2, 2, // 2
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 4, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 4 big shot
 0, 4, 3, 4, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 5
 0, 0, 4, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 6
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,  3, 3, 3, 3, 3, 3, 3, 3, 3, 3, // 8 line shot
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,  4, 4, 4, 4, 4, 4, 4, 4, 4, 4, // 10 spread shot
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

cLevel.s_aaiTyped[LVL] =
[{iX :  2, iY :  5, iType : 1}];

cLevel.s_aabPaddle[LVL] =
[1, 0, 0, 0];

cLevel.s_avBallDir[LVL] =
[-0.707, 0.707];

cLevel.s_asText[LVL] = "";

var g_vWall = vec2.create();   // additional vector
cLevel.s_apInit[LVL] = function()
{
    // make all wall-blocks invincible
    for(var i = C_LEVEL_X; i < C_LEVEL_X*3; ++i)
    {
        if(g_pBlock[i].m_bFlying) continue;
        g_pBlock[i].m_fHealth = 1000.0;
        g_pBlock[i].m_vPosition[0] = cLevel.s_avBlockPos[i][0]*1.06;
    }

    // hide all attack blocks
    for(var i = C_LEVEL_X*4; i < C_LEVEL_X*11; ++i)
        g_pBlock[i].m_vPosition[1] = -200.0;

    // init spread direction
    cLevel.s_aiStatus[5] = 1.0;

    // increase transition time
    cLevel.s_aiStatus[6] = C_TRANSITION_END;
    C_TRANSITION_END = 9.0;

    // hide current time
    g_iActiveTime = 0;
};
cLevel.s_apFunction[LVL] = function()
{
    if(g_fLevelTime < 0.5) return;

    if(g_fLevelTime >= 90.0)
    {
        // finish the level
        for(var i = C_LEVEL_X; i < C_LEVEL_X*3; ++i)
        {
            if(g_pBlock[i].m_bFlying) continue;

            // throw all blocks away
            vec2.random(g_vVector);
            g_vVector[0] *= 0.6;
            g_vVector[1] *= 0.6;
            g_pBlock[i].Throw(g_vVector, 45.0);
        }

        // set bonus and go to last level
        g_fLevelTime  = 0.0;   // maximum bonus
        g_iActiveTime = 2;
        NextLevel(false);

        return;
    }

    // move wall
    var fImplode = Math.min(90.0-g_fLevelTime, 0.5)*2.12;
    var fCurrent = g_fLevelTime*0.45;
    for(var i = C_LEVEL_X; i < C_LEVEL_X*3; ++i)
    {
        if(g_pBlock[i].m_bFlying) continue;

        g_pBlock[i].m_vPosition[0] = cLevel.s_avBlockPos[i][0] * fImplode;
        g_pBlock[i].m_vPosition[1] = cLevel.s_avBlockPos[i][1] - fCurrent;
        g_pBlock[i].UpdateTransform();
    }

    // define block position references (wall is relative)
    vec2.add(g_vWall, g_pBlock[C_LEVEL_X+9].m_vPosition, [C_BLOCK_DIST*0.5, 0.0]);
    var vShot   = cLevel.s_avBlockPos[C_LEVEL_X* 5+2];
    var vLine   = cLevel.s_avBlockPos[C_LEVEL_X* 8+9];
    var vSpread = cLevel.s_avBlockPos[C_LEVEL_X*10+9];

    // ###########################################
    // create shot with delay
    if(g_fLevelTime % 12.0 < 1.0 && !cLevel.s_aiStatus[0])
    {
        // re-create shot blocks
        for(var i = C_LEVEL_X*4; i < C_LEVEL_X*7; ++i)
        {
            if(cLevel.s_aaiValue[g_iLevel][i])
            {
                g_pBlock[i].Reset();
                g_pBlock[i].Activate();
            }  
        }

        // start shot
        cLevel.s_aiStatus[0] = 1.0;
        cLevel.s_aiStatus[1] = 0.0;
    }

    if(cLevel.s_aiStatus[0])
    {
        // update and finish shot (# finish < delay !)
        cLevel.s_aiStatus[0] += g_fTime*10.0;
        if(cLevel.s_aiStatus[0] >= 100.0) cLevel.s_aiStatus[0] = 0.0;

        // bounce shot left and right
        cLevel.s_aiStatus[1] += g_fTime*30.0 * (cLevel.s_aiStatus[2] ? -1.0 : 1.0);
        if(cLevel.s_aiStatus[1] >  28.0) cLevel.s_aiStatus[2] = 1;
        if(cLevel.s_aiStatus[1] < -28.0) cLevel.s_aiStatus[2] = 0;

        // calculate shot rotation matrix
        mat4.identity(g_mMatrix);
        mat4.rotateZ(g_mMatrix, g_mMatrix, cLevel.s_aiStatus[0]*0.3);

        var fHeight = Math.min((cLevel.s_aiStatus[0]-1.0)*0.3-1.5, 1.0);
        for(var i = C_LEVEL_X*4; i < C_LEVEL_X*7; ++i)
        {
            if(g_pBlock[i].m_bFlying) continue;

            // calculate relative position of specific shot block
            vec2.sub(g_vVector, cLevel.s_avBlockPos[i], vShot);
            vec2.transformMat4(g_vVector, g_vVector, g_mMatrix);
            vec2.add(g_vVector, g_vVector, g_vWall);

            // set position and update transformation rotated
            g_pBlock[i].m_vPosition[0] = g_vVector[0] + cLevel.s_aiStatus[1];
            g_pBlock[i].m_vPosition[1] = g_vVector[1] - cLevel.s_aiStatus[0];
            g_pBlock[i].m_vPosition[2] = fHeight;
            g_pBlock[i].UpdateTransformRotated(cLevel.s_aiStatus[0]*0.3);
        }
    }
    else
    {
        // hide shot at the bottom
        for(var i = C_LEVEL_X*4; i < C_LEVEL_X*7; ++i)
        {
            if(g_pBlock[i].m_bFlying || g_pBlock[i].m_vPosition[1] === -200.0) continue;

            g_pBlock[i].m_vPosition[1] = -200.0;
            g_pBlock[i].UpdateTransform();
        }
    }

    // ###########################################
    // create line with delay
    if(g_fLevelTime % 9.0 < 1.0 && !cLevel.s_aiStatus[3])
    {
        // re-create line blocks
        for(var i = C_LEVEL_X*8; i < C_LEVEL_X*9; ++i)
        {
            if(cLevel.s_aaiValue[g_iLevel][i])
            {
                g_pBlock[i].Reset();
                g_pBlock[i].Activate();
                g_pBlock[i].m_vPosition[0] = cLevel.s_avBlockPos[i][0];
            }
        }

        // start line
        cLevel.s_aiStatus[3] = 1.0;
    }

    if(cLevel.s_aiStatus[3])
    {
        // update and finish line (# finish < delay !)
        cLevel.s_aiStatus[3] += g_fTime*20.0;
        if(cLevel.s_aiStatus[3] >= 100.0) cLevel.s_aiStatus[3] = 0.0;

        var fDepth  = g_vWall[1] - vLine[1] - cLevel.s_aiStatus[3];
        var fHeight = Math.min((cLevel.s_aiStatus[3]-1.0)*0.3-1.5, 1.0);
        for(var i = C_LEVEL_X*8; i < C_LEVEL_X*9; ++i)
        {
            if(g_pBlock[i].m_bFlying) continue;

            // set position and update transformation
            g_pBlock[i].m_vPosition[1] = cLevel.s_avBlockPos[i][1] + fDepth;
            g_pBlock[i].m_vPosition[2] = fHeight;
            g_pBlock[i].UpdateTransform();
        }
    }
    else
    {
        // hide line at the bottom
        for(var i = C_LEVEL_X*8; i < C_LEVEL_X*9; ++i)
        {
            if(g_pBlock[i].m_bFlying || g_pBlock[i].m_vPosition[1] === -200.0) continue;

            g_pBlock[i].m_vPosition[1] = -200.0;
            g_pBlock[i].UpdateTransform();
        }
    }

    // ###########################################
    // create spread with delay
    if(g_fLevelTime % 6.0 < 1.0 && !cLevel.s_aiStatus[4])
    {
        // re-create spread blocks
        for(var i = C_LEVEL_X*10; i < C_LEVEL_X*11; ++i)
        {
            if(cLevel.s_aaiValue[g_iLevel][i])
            {
                g_pBlock[i].Reset();
                g_pBlock[i].Activate();
                vec2.copy(g_pBlock[i].m_vPosition, g_vWall);

                // make waiting blocks invincible, so they get not destroyed early
                g_pBlock[i].m_fHealth = 1000.0;
            }
        }

        // start spread
        cLevel.s_aiStatus[4] = 1.0;
        cLevel.s_aiStatus[5] = -cLevel.s_aiStatus[5];
    }

    if(cLevel.s_aiStatus[4])
    {
        // update and finish spread (# finish < delay !)
        cLevel.s_aiStatus[4] += g_fTime*20.0;
        if(cLevel.s_aiStatus[4] >= 100.0) cLevel.s_aiStatus[4] = 0.0;

        var fTime = g_fTime*40.0;
        for(var i = C_LEVEL_X*10; i < C_LEVEL_X*11; ++i)
        {
            if(g_pBlock[i].m_bFlying) continue;

            // calculate individual delay
            var fValue = Math.max((cLevel.s_aiStatus[4]-1.0) - 3.0*(i-C_LEVEL_X*10), 0.0);

            if(fValue)
            {
                g_pBlock[i].m_fHealth = 0.0;

                // calculate movement direction
                vec2.sub(g_vVector, [3.0*(i-C_LEVEL_X*10.5), -35.0], g_vWall);
                vec2.normalize(g_vVector, g_vVector);

                // set position and update transformation rotated
                g_pBlock[i].m_vPosition[0] += g_vVector[0] * fTime * cLevel.s_aiStatus[5];
                g_pBlock[i].m_vPosition[1] += g_vVector[1] * fTime;
                g_pBlock[i].m_vPosition[2] = Math.min(fValue*0.3-1.5, 1.0);
                g_pBlock[i].UpdateTransformRotated(g_vVector[0]*cLevel.s_aiStatus[5]);
            }
            else
            {
                // hide waiting blocks
                g_pBlock[i].m_vPosition[2] = -5.0;
                g_pBlock[i].UpdateTransform();
            }
        }
    }
    else
    {
        // hide spread at the bottom
        for(var i = C_LEVEL_X*10; i < C_LEVEL_X*11; ++i)
        {
            if(g_pBlock[i].m_bFlying || g_pBlock[i].m_vPosition[1] === -200.0) continue;

            g_pBlock[i].m_vPosition[1] = -200.0;
            g_pBlock[i].UpdateTransform();
        }
    }

    // fix glitchi glitch, where balls get stuck in the wall
    if(fImplode >= 1.0)
    {
        for(var i = 0; i < C_BALLS; ++i)
        {
            if(g_pBall[i].m_bActive && g_pBall[i].m_vPosition[1] > g_vWall[1]-C_BLOCK_DIST)
            {
                vec2.copy(g_pBall[i].m_vPosition, C_BALL_START);
                g_pBall[i].m_vDirection[1] = Math.abs(g_pBall[i].m_vDirection[1]);
            }
        }
    }
};
cLevel.s_apExit[LVL] = function()
{
    // reset transition time
    C_TRANSITION_END = cLevel.s_aiStatus[6];
    C_TRANSITION_START = -3.0;
};


// ****************************************************************
// ### GAME JOLT 0 ###
LVL = 14;

cLevel.s_aavColor[LVL] =
[vec3.fromValues( 47.0/255.0, 127.0/255.0, 111.0/255.0),
 vec3.fromValues(204.0/255.0, 255.0/255.0,   0.0/255.0),
 vec3.fromValues(255.0/255.0, 255.0/255.0, 255.0/255.0)];

cLevel.s_aaiValue[LVL] =
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 3, 3, 3, 3,  3, 3, 3, 3, 3, 3, 3, 3, 0, 0,
 0, 0, 0, 0, 0, 0, 3, 3, 3, 3,  3, 3, 3, 3, 3, 3, 3, 0, 0, 0,
 0, 0, 0, 0, 0, 3, 3, 1, 1, 1,  1, 1, 1, 1, 3, 3, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 3, 3, 1, 1, 1,  1, 1, 1, 3, 3, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 3, 3, 1, 1, 1, 1,  1, 1, 3, 3, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 3, 3, 1, 1, 1, 1,  1, 3, 3, 3, 3, 3, 3, 0, 0, 0,
 0, 0, 0, 3, 3, 1, 2, 1, 2, 1,  2, 3, 3, 3, 3, 3, 0, 0, 0, 0,
 0, 0, 0, 3, 3, 2, 1, 2, 1, 2,  1, 2, 1, 3, 3, 0, 0, 0, 0, 0,
 0, 0, 3, 3, 3, 3, 3, 3, 3, 3,  2, 2, 3, 3, 0, 0, 0, 0, 0, 0,

 0, 0, 3, 3, 3, 3, 3, 3, 3, 3,  2, 3, 3, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 3, 3,  3, 3, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 3, 3,  3, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 3, 3, 3,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 3, 3, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 3, 3, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 3, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 3, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

cLevel.s_aaiTyped[LVL] =
[];

cLevel.s_aabPaddle[LVL] =
[0, 0, 0, 0];

cLevel.s_avBallDir[LVL] =
[0.707, 0.707],

cLevel.s_asText[LVL] = "";

cLevel.s_apInit[LVL] = function()
{
    // increase logical number of balls
    C_BALLS = 50;

    // re-create ball array with new number
    g_pBall = new Array(C_BALLS);
    for(var i = 0; i < C_BALLS; ++i)
        g_pBall[i] = new cBall();

    // deactivate stat display
    g_iActiveMulti = 0;
    g_iActiveTime  = 0;
};
cLevel.s_apFunction[LVL] = function()
{
    // completely ignore score in this level
    g_fStatMulti = 0.0;

    // create new random balls at the level start
    if(g_fLevelTime >= 0.0 && !cLevel.s_aiStatus[0])
    {
        cLevel.s_aiStatus[0] = 1;
        
        for(var i = 0; i < C_BALLS-1; ++i)
        {
            vec2.random(g_vVector);
            cBall.CreateBall(C_BALL_START, g_vVector, true);
        }
    }
};
cLevel.s_apExit[LVL] = function()
{
    // add final trophy
    if(GJAPI.bActive) GJAPI.TrophyAchieve(5543);

    // finished the game
    ActivateFail();
};


// ****************************************************************
// Other Ideas:
// Destruction of block destroys other (invincible) blocks remotely
// Snake-like block animation
// Boss: indestructible life-bar on top (green -> red)
// Creation of new blocks during the level
// Rain-like animation + new blocks spawn from below around the "rain-drop"