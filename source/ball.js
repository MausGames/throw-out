/////////////////////////////////////////////////////
//*-----------------------------------------------*//
//| Part of Throw Out (https://www.maus-games.at) |//
//*-----------------------------------------------*//
//| Copyright (c) 2014 Martin Mauersics           |//
//| Released under the zlib License               |//
//*-----------------------------------------------*//
/////////////////////////////////////////////////////
"use strict";


// ****************************************************************
const C_BALL_SIZE     = 0.9;
const C_BALL_START    = vec2.fromValues(0.0, -32.0);
let   C_BALL_DISPLACE = 3.0;


// ****************************************************************
cBall.s_pModel  = null;
cBall.s_pShader = null;

// size vector
cBall.s_vSize = vec3.fromValues(C_BALL_SIZE, C_BALL_SIZE, C_BALL_SIZE);

// pre-allocated function variables
cBall.s_vPreOldPos   = vec2.create();
cBall.s_vPreTrueSize = vec4.create();
cBall.s_vPreDiff     = vec2.create();
cBall.s_vPreBurst    = vec2.create();


// ****************************************************************
cBall.Init = function()
{
    // define model and shader-program
    cBall.s_pModel  = new windModel ().Create(RES.cBall.s_afVertexData,  RES.cBall.s_aiIndexData);
    cBall.s_pShader = new windShader().Create(RES.cBall.s_sVertexShader, RES.cBall.s_sFragmentShader);
};


// ****************************************************************
cBall.Exit = function()
{
    // clear model and shader-program
    cBall.s_pModel .Destructor();
    cBall.s_pShader.Destructor();
};


// ****************************************************************
function cBall()
{
    // create properties
    this.m_vPosition  = vec3.fromValues(0.0, 0.0, C_BALL_SIZE);
    this.m_vDirection = vec2.create();
    this.m_mTransform = mat4.create();

    this.m_fAlpha     = 0.0;
    this.m_fSpeed     = 42.0;
    this.m_bActive    = false;

    this.m_iHitBlock  = 0;
    this.m_iHitPaddle = 0;
    this.m_fLifeTime  = 0.0;
}


// ****************************************************************
cBall.prototype.Render = function()
{
    if(!this.m_bActive) return;

    // enable the shader-program
    cBall.s_pShader.Enable();

    // update all object uniforms
    cBall.s_pShader.SendUniformMat4 ("u_m4ModelView",     mat4.mul(g_mMatrix, WIND.g_mCamera,     this.m_mTransform), false);
    cBall.s_pShader.SendUniformMat4 ("u_m4ModelViewProj", mat4.mul(g_mMatrix, WIND.g_mProjection, g_mMatrix),         false);
    cBall.s_pShader.SendUniformFloat("u_v1Alpha",         this.m_fAlpha);

    // draw the model
    cBall.s_pModel.Draw();
};


// ****************************************************************
cBall.prototype.Move = function()
{
    if(!this.m_bActive) return;

    const fTimeSpeed = WIND.g_fTime*this.m_fSpeed;
    vec2.copy(cBall.s_vPreOldPos, this.m_vPosition);

    // move ball
    this.m_vPosition[0] += this.m_vDirection[0]*fTimeSpeed;
    this.m_vPosition[1] += this.m_vDirection[1]*fTimeSpeed;

    // update life time
    this.m_fLifeTime += WIND.g_fTime;

    // reset paddle status (always)
    this.m_iHitPaddle = 0;

    // get current plane distance (single value)
    const fMaxPos = UTILS.Clamp((60.0 - Math.max(Math.abs(this.m_vPosition[0]), Math.abs(this.m_vPosition[1])))*0.05, 0.0, 1.0);

    // update alpha (fade-out during transition, otherwise fade-in)
    this.m_fAlpha = Math.min(this.m_fAlpha + WIND.g_fTime*(InTransition() ? -3.0 : 3.0), 1.0) * fMaxPos;

    // destroy on zero visibility (too far away from plane or fade-out after level was finished)
    if(this.m_fAlpha <= 0.0)
    {
        if(GJAPI.bLoggedIn)
        {
            // ball lost too fast, add trophy
            if(!InTransition() && (this.m_fLifeTime < 5.0))
                GJAPI.TrophyAchieve(5740);
        }

        this.m_bActive = false;
        return;
    }

    // do not test collision on level transition
    if(!InTransition())
    {
        // pre-calculate ball-position with offset between block and ball
        cBall.s_vPreTrueSize[0] = this.m_vPosition[0] - C_BLOCK_BALL_OFF;
        cBall.s_vPreTrueSize[1] = this.m_vPosition[0] + C_BLOCK_BALL_OFF;
        cBall.s_vPreTrueSize[2] = this.m_vPosition[1] - C_BLOCK_BALL_OFF;
        cBall.s_vPreTrueSize[3] = this.m_vPosition[1] + C_BLOCK_BALL_OFF;

        // test collision with blocks and get nearest block
        let iNum = -1;
        let fDistance = 1000.0;
        for(let i = 0; i < C_LEVEL_ALL; ++i)
        {
            if(g_pBlock[i].m_bFlying) continue;

            // test collision (current position for the test, old position for direction calculations (better precision), ball as cube)
            if((cBall.s_vPreTrueSize[0] < g_pBlock[i].m_vPosition[0]) &&
               (cBall.s_vPreTrueSize[1] > g_pBlock[i].m_vPosition[0]) &&
               (cBall.s_vPreTrueSize[2] < g_pBlock[i].m_vPosition[1]) &&
               (cBall.s_vPreTrueSize[3] > g_pBlock[i].m_vPosition[1]))
            {
                const fNewDistance = vec2.sqrDist(cBall.s_vPreOldPos, g_pBlock[i].m_vPosition);
                if(fDistance > fNewDistance)
                {
                    // get nearest block
                    iNum = i;
                    fDistance = fNewDistance;
                }
            }
        }

        this.m_iHitBlock = 0;
        if(iNum >= 0)
        {
            let iDir = 0;
            this.m_iHitBlock = iNum+1;

            // calculate position-difference with old position
            const vDiff = cBall.s_vPreDiff;
            vec2.sub(vDiff, cBall.s_vPreOldPos, g_pBlock[iNum].m_vPosition);

            if(iNum >= C_LEVEL_CENTER)
            {
                // reflect ball-direction from the border
                iDir = (iNum >= C_LEVEL_CENTER+2*C_LEVEL_BX) ? 0 : 1;
                vDiff[iDir] = Math.abs(vDiff[iDir]) * -Signf(cBall.s_vPreOldPos[iDir]);
            }
            else
            {
                // reflect ball-direction depending on the angle of the position-difference
                if(Math.abs(vDiff[0]) > Math.abs(vDiff[1])) iDir = (Signf(vDiff[0]) === Signf(this.m_vDirection[0])) ? 1 : 0;
                                                       else iDir = (Signf(vDiff[1]) === Signf(this.m_vDirection[1])) ? 0 : 1;
            }
            this.m_vDirection[iDir] = Math.abs(this.m_vDirection[iDir]) * Signf(vDiff[iDir]);

            // set burst-direction to kick only blocks in an 180 degree area
            vec2.set(cBall.s_vPreBurst, 0.0, 0.0);
            cBall.s_vPreBurst[iDir] = -Signf(vDiff[iDir]);

            // move ball away from the block (vDiff not normalized)
            const fTime = WIND.g_fTime * C_BALL_DISPLACE;
            this.m_vPosition[0] += vDiff[0]*fTime;
            this.m_vPosition[1] += vDiff[1]*fTime;

            // play sound
            g_pSoundBump.Play(1.3);

            // kick all near relevant blocks away
            let iValid = 0;
            for(let j = 0; j < C_LEVEL_ALL; ++j)
            {
                if(g_pBlock[j].m_bFlying) continue;

                // calculate position-difference with current position
                vec2.sub(vDiff, this.m_vPosition, g_pBlock[j].m_vPosition);
                if((Math.abs(vDiff[0]) < C_HIT_RANGE) &&
                   (Math.abs(vDiff[1]) < C_HIT_RANGE))
                {
                    if(vec2.dot(cBall.s_vPreBurst, vDiff) < 0.0)
                    {
                        // calculate damage
                        const fDamage = (C_HIT_RANGE - vec2.squaredLength(vDiff))*C_HIT_INVERT;
                        if(fDamage > 0.0)
                        {
                            // damage block
                            g_pBlock[j].m_fHealth -= fDamage;
                            if(g_pBlock[j].m_fHealth <= 0.0)
                            {
                                vec2.normalize(vDiff, vDiff);

                                // increase or decrease score
                                const fScore = (j < C_LEVEL_CENTER) ? 5.0*g_fStatMulti : -10.0;
                                g_iScore += fScore;

                                // accumulate negative score
                                if(GJAPI.bLoggedIn)
                                {
                                    // negative score too high, add trophy (only-1-send switch behind function)
                                    if(fScore < 0.0) g_fGameJoltNeg += fScore;
                                    if(g_fGameJoltNeg <= -100.0) GJAPI.TrophyAchieve(5738);
                                }

                                // handle typed blocks
                                if(g_pBlock[j].m_iType === 1)
                                {
                                    // create new ball
                                    cBall.CreateBall(g_pBlock[j].m_vPosition, vDiff, false);
                                }
                                if(g_pBlock[j].m_iType === 2)
                                {
                                    // make paddles longer
                                    for(let k = 0; k < 4; ++k)
                                        g_pPaddle[k].m_bShield = true;
                                }

                                // throw the block out
                                vec2.negate(vDiff, vDiff);
                                g_pBlock[j].Throw(vDiff, 30.0);
                            }
                        }
                    }
                }

                // still a valid center block
                if(!g_pBlock[j].m_bFlying && (j < C_LEVEL_CENTER)) ++iValid;
            }

            // check for cleared level
            if(!iValid) NextLevel(false);
        }

        // pre-calculate ball-position with ball-size
        cBall.s_vPreTrueSize[0] = this.m_vPosition[0] - C_BALL_SIZE;
        cBall.s_vPreTrueSize[1] = this.m_vPosition[0] + C_BALL_SIZE;
        cBall.s_vPreTrueSize[2] = this.m_vPosition[1] - C_BALL_SIZE;
        cBall.s_vPreTrueSize[3] = this.m_vPosition[1] + C_BALL_SIZE;

        // test collision with paddles
        for(let i = 0; i < 4; ++i)
        {
            // (direction is set on paddle creation, 0/bottom, 1/up, 2/left, 3/right)
            const iX = (i < 2) ? 0 : 1;
            const iY = (i < 2) ? 1 : 0;

            if(g_pPaddle[i].m_bWall)
            {
                if(vec2.dot(this.m_vDirection, g_pPaddle[i].m_vDirection) > 0.0) continue;

                // simply reflect the ball from a wall-paddle
                let bHit = false;
                     if((i === 0) && (cBall.s_vPreTrueSize[2] < g_pPaddle[i].m_vPosition[1] + C_PADDLE_RANGE)) {this.m_vDirection[1] =  Math.abs(this.m_vDirection[1]); bHit = true;}
                else if((i === 1) && (cBall.s_vPreTrueSize[3] > g_pPaddle[i].m_vPosition[1] - C_PADDLE_RANGE)) {this.m_vDirection[1] = -Math.abs(this.m_vDirection[1]); bHit = true;}
                else if((i === 2) && (cBall.s_vPreTrueSize[0] < g_pPaddle[i].m_vPosition[0] + C_PADDLE_RANGE)) {this.m_vDirection[0] =  Math.abs(this.m_vDirection[0]); bHit = true;}
                else if((i === 3) && (cBall.s_vPreTrueSize[1] > g_pPaddle[i].m_vPosition[0] - C_PADDLE_RANGE)) {this.m_vDirection[0] = -Math.abs(this.m_vDirection[0]); bHit = true;}

                if(bHit)
                {
                    this.m_iHitPaddle = i+1;
                    if(g_pPaddle[iX ? 2 : 0].m_bWall && g_pPaddle[iX ? 3 : 1].m_bWall && (Math.abs(this.m_vDirection[iX]) < 0.15))
                    {
                        // prevent infinite ball
                        this.m_vDirection[iX] = -1.0*Signf(this.m_vPosition[iX]);
                    }

                    // always normalize direction
                    vec2.normalize(this.m_vDirection, this.m_vDirection);

                    // start bump-effect
                    g_pPaddle[i].m_fBump = 1.0;
                    g_pSoundBump.Play(1.05);
                }
            }
            else
            {
                // set paddle size
                vec2.set(g_vVector, (g_pPaddle[i].m_vSize[0] > 5.0) ? 100.0 : (g_pPaddle[i].m_vSize[0]*3.8), C_PADDLE_RANGE);

                if((cBall.s_vPreTrueSize[0] < g_pPaddle[i].m_vPosition[0] + g_vVector[iX]) &&
                   (cBall.s_vPreTrueSize[1] > g_pPaddle[i].m_vPosition[0] - g_vVector[iX]) &&
                   (cBall.s_vPreTrueSize[2] < g_pPaddle[i].m_vPosition[1] + g_vVector[iY]) &&
                   (cBall.s_vPreTrueSize[3] > g_pPaddle[i].m_vPosition[1] - g_vVector[iY]) &&
                   (vec2.dot(this.m_vDirection, g_pPaddle[i].m_vDirection) < 0.0))
                {
                    this.m_iHitPaddle = i+1;

                    // calculate position-difference with old position
                    const vDiff = cBall.s_vPreDiff;
                    vec2.sub(vDiff, cBall.s_vPreOldPos, g_pPaddle[i].m_vPosition);

                    // adapt and normalize the vector
                    vDiff[iX] *= 0.12/g_pPaddle[i].m_vSize[0];
                    vDiff[iY]  = 1.5875 * g_pPaddle[i].m_vDirection[iY]; // 1.5875 = 0.9+0.55*1.25
                    vec2.normalize(vDiff, vDiff);

                    // reflect ball
                    UTILS.Vec2Reflect(this.m_vDirection, this.m_vDirection, vDiff);
                    this.m_vDirection[iY] = Math.max(Math.abs(this.m_vDirection[iY]), 0.35) * g_pPaddle[i].m_vDirection[iY];
                    vec2.normalize(this.m_vDirection, this.m_vDirection);

                    // start bump-effect
                    g_pPaddle[i].m_fBump = 1.0;
                    g_pSoundBump.Play(1.05);

                    // reset paddle-hit time
                    g_fGameJoltFly = 0.0;
                }
            }
        }
    }

    // update transformation matrix
    mat4.identity (this.m_mTransform);
    mat4.translate(this.m_mTransform, this.m_mTransform, this.m_vPosition);
    mat4.scale    (this.m_mTransform, this.m_mTransform, cBall.s_vSize);
};


// ****************************************************************
cBall.CreateBall = function(vPosition, vDirection, bFirst)
{
    for(let i = 0; i < C_BALLS; ++i)
    {
        if(!g_pBall[i].m_bActive)
        {
            // activate and init new ball
            g_pBall[i].m_bActive = true;
            vec2.copy     (g_pBall[i].m_vPosition,  vPosition);
            vec2.normalize(g_pBall[i].m_vDirection, vDirection);

            // hide on start
            g_pBall[i].m_fAlpha = bFirst ? 0.0 : 0.5;
            mat4.scale(g_pBall[i].m_mTransform, g_pBall[i].m_mTransform, [0.0, 0.0, 0.0]);

            // reset life time
            g_pBall[i].m_fLifeTime = 0.0;

            // reset camera acceleration
            g_fCamAcc = 0.3;

            return;
        }
    }
};