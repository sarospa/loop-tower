// @ts-check
"use strict";

// Constants used as the base for Prestige exponential bonuses.
const PRESTIGE_COMBAT_BASE       = 1.20;
const PRESTIGE_PHYSICAL_BASE     = 1.20;
const PRESTIGE_MENTAL_BASE       = 1.20;
const PRESTIGE_BARTERING_BASE    = 1.10;
const PRESTIGE_SPATIOMANCY_BASE  = 1.10;
const PRESTIGE_CHRONOMANCY_BASE  = 1.05;
const PRESTIGE_EXP_OVERFLOW_BASE = 1.00222;

/**
 * @typedef CurrentActionEntry
 * @prop {number} loops
 * @prop {number} loopsLeft
 * @prop {number} extraLoops
 * @prop {number} ticks
 * @prop {number} [adjustedTicks]
 * @prop {number} [rawTicks]
 * @prop {number} manaUsed
 * @prop {number} lastMana
 * @prop {number} manaRemaining
 * @prop {number} goldRemaining
 * @prop {number} timeSpent
 * @prop {string} [errorMessage]
 * }} 
 * @typedef {CurrentActionEntry & AnyActionType} AnyActionEntry
 * 
 * @typedef NextActionEntry
 * @prop {ActionName} name
 * @prop {number}     loops
 * @prop {boolean}    disabled
 * @prop {boolean}    [collapsed]
 */

/** @param {AnyActionEntry} action @returns {action is MultipartAction} */
function isMultipartAction(action) {
    return 'loopStats' in action;
}

class Actions {
    /** @type {AnyActionEntry[]} */
    current = [];
    /** @type {NextActionEntry[]} */
    next = [];
    /** @type {NextActionEntry[]} */
    nextLast;
    addAmount = 1;

    totalNeeded = 0;
    completedTicks = 0;
    currentPos = 0;
    timeSinceLastUpdate = 0;

    tick(availableMana) {
        availableMana ??= 1;
        availableMana = Mana.floor(availableMana);

        const curAction = this.getNextValidAction();
        // out of actions
        if (!curAction) {
            shouldRestart = true;
            return 0;
        }
        currentAction = curAction;

        // this is how much mana is actually getting spent during this call to tick().
        let manaToSpend = availableMana;

        // restrict to the number of ticks it takes to get to a next talent level.
        manaToSpend = Math.min(manaToSpend, getMaxTicksForAction(curAction, true));
        // restrict to the number of ticks it takes to finish the current action
        manaToSpend = Math.min(manaToSpend, Mana.ceil(curAction.adjustedTicks - curAction.ticks));
        // just in case
        if (manaToSpend < 0) manaToSpend = 0;

        // we think we'll be spending manaToSpend, but we might not actually finish out the whole
        // amount if this is a multi-part progress action.

        // exp needs to get added AFTER checking multipart progress, since this tick() call may
        // represent any number of ticks, all of which process at the existing levels

        // only for multi-part progress bars
        if (isMultipartAction(curAction)) {
            let loopCosts = {};

            function loopCost(segment) {
                // @ts-ignore
                return loopCosts[segment] ??= curAction.loopCost(segment);
            }

            let segment = 0;
            let curProgress = towns[curAction.townNum][curAction.varName];
            while (curProgress >= loopCost(segment)) {
                curProgress -= loopCost(segment);
                segment++;
            }
            // segment is 0,1,2

            // thanks to Gustav on the discord for the multipart loop code
            let manaLeft = manaToSpend;
            // don't go any further than will get to the next level of whatever stat is being used for this segment
            let manaLeftForCurrentSegment = Math.min(manaLeft, getMaxTicksForStat(curAction, curAction.loopStats[segment], false));
            manaToSpend = 0;
            const tickMultiplier = (curAction.manaCost() / curAction.adjustedTicks);
            let partUpdateRequired = false;

            manaLoop:
            while (manaLeftForCurrentSegment > 0 && curAction.canMakeProgress(segment)) {
                //const toAdd = curAction.tickProgress(segment) * (curAction.manaCost() / curAction.adjustedTicks);
                const progressMultiplier = curAction.tickProgress(segment) * tickMultiplier;
                const toAdd = Math.min(
                    manaLeftForCurrentSegment * progressMultiplier, // how much progress would we make if we spend all available mana?
                    loopCost(segment) - curProgress // how much progress would it take to complete this segment?
                );
                const manaUsed = toAdd / progressMultiplier;
                manaLeftForCurrentSegment -= manaUsed;
                manaLeft -= manaUsed;
                manaToSpend += manaUsed;
                // console.log("using: "+curAction.loopStats[(towns[curAction.townNum][curAction.varName + "LoopCounter"]+segment) % curAction.loopStats.length]+" to add: " + toAdd + " to segment: " + segment + " and part " +towns[curAction.townNum][curAction.varName + "LoopCounter"]+" of progress " + curProgress + " which costs: " + curAction.loopCost(segment));
                towns[curAction.townNum][curAction.varName] += toAdd;
                curProgress += toAdd;
                while (curProgress >= loopCost(segment)) {
                    curProgress -= loopCost(segment);
                    // segment finished
                    if (segment === curAction.segments - 1) {
                        // part finished
                        if (curAction.name === "Dark Ritual" && towns[curAction.townNum][curAction.varName] >= 4000000) unlockStory("darkRitualThirdSegmentReached");
                        if (curAction.name === "Imbue Mind" && towns[curAction.townNum][curAction.varName] >= 700000000) unlockStory("imbueMindThirdSegmentReached");
                        towns[curAction.townNum][curAction.varName] = 0;
                        towns[curAction.townNum][`${curAction.varName}LoopCounter`] += curAction.segments;
                        towns[curAction.townNum][`total${curAction.varName}`]++;
                        segment -= curAction.segments;
                        loopCosts = {};
                        curAction.loopsFinished();
                        partUpdateRequired = true;
                        if (curAction.canStart && !curAction.canStart()) {
                            this.completedTicks += curAction.ticks;
                            view.requestUpdate("updateTotalTicks", null);
                            curAction.loopsLeft = 0;
                            curAction.ticks = 0;
                            curAction.manaRemaining = timeNeeded - timer;
                            curAction.goldRemaining = resources.gold;
                            curAction.finish();
                            totals.actions++;
                            break manaLoop;
                        }
                        towns[curAction.townNum][curAction.varName] = curProgress;
                    }
                    if (curAction.segmentFinished) {
                        curAction.segmentFinished();
                        partUpdateRequired = true;
                    }
                    segment++;
                    manaLeftForCurrentSegment = Math.min(manaLeft, getMaxTicksForStat(curAction, curAction.loopStats[segment], false));
                }
            }

            view.requestUpdate("updateMultiPartSegments", curAction);
            if (partUpdateRequired) {
                view.requestUpdate("updateMultiPart", curAction);
            }
        }

        curAction.ticks += manaToSpend;
        curAction.manaUsed += manaToSpend;
        curAction.timeSpent += manaToSpend / baseManaPerSecond / getActualGameSpeed();

        // exp gets added here, where it can factor in to adjustTicksNeeded
        addExpFromAction(curAction, manaToSpend);

        if (curAction.ticks >= curAction.adjustedTicks) {
            curAction.ticks = 0;
            curAction.loopsLeft--;

            curAction.lastMana = curAction.rawTicks;
            this.completedTicks += curAction.adjustedTicks;
            curAction.finish();
            totals.actions++;
            curAction.manaRemaining = timeNeeded - timer;
            
            if (curAction.cost) {
                curAction.cost();
            }
            curAction.goldRemaining = resources.gold;

            this.adjustTicksNeeded();
            view.requestUpdate("updateCurrentActionLoops", this.currentPos);
        }
        view.requestUpdate("updateCurrentActionBar", this.currentPos);
        if (curAction.loopsLeft === 0) {
            if (!this.current[this.currentPos + 1] && options.repeatLastAction &&
                (!curAction.canStart || curAction.canStart()) && curAction.townNum === curTown) {
                curAction.loopsLeft++;
                curAction.loops++;
                curAction.extraLoops++;
            } else {
                this.currentPos++;
            }
        }

        currentAction = null;

        return manaToSpend;
    }

    /** @returns {CurrentActionEntry & Action | CurrentActionEntry & MultipartAction} */
    getNextValidAction() {
        let curAction = this.current[this.currentPos];
        if (!curAction) {
            return curAction;
        }
        if (curAction.allowed && getNumOnCurList(curAction.name) > curAction.allowed()) {
            curAction.ticks = 0;
            curAction.timeSpent = 0;
            view.requestUpdate("updateCurrentActionBar", this.currentPos);
            return undefined;
        }
        while ((curAction.canStart && !curAction.canStart() && curAction.townNum === curTown) || curAction.townNum !== curTown) {
            curAction.errorMessage = this.getErrorMessage(curAction);
            view.requestUpdate("updateCurrentActionBar", this.currentPos);
            this.currentPos++;
            if (this.currentPos >= this.current.length) {
                curAction = undefined;
                break;
            }
            curAction = this.current[this.currentPos];
        }
        return curAction;
    }

    getErrorMessage(action) {
        if (action.townNum !== curTown) {
            return `You were in zone ${curTown + 1} when you tried this action, and needed to be in zone ${action.townNum + 1}`;
        }
        if (action.canStart && !action.canStart()) {
            return "You could not make the cost for this action.";
        }
        return "??";
    }

    restart() {
        this.currentPos = 0;
        this.completedTicks = 0;
        curTown = 0;
        towns[0].suppliesCost = 300;
        view.requestUpdate("updateResource","supplies");
        curAdvGuildSegment = 0;
        curCraftGuildSegment = 0;
		curWizCollegeSegment = 0;
        curFightFrostGiantsSegment = 0;
        curFightJungleMonstersSegment = 0;
        curThievesGuildSegment = 0;
        curGodsSegment = 0;
        for (const town of towns) {
            for (const action of town.totalActionList) {
                if (action.type === "multipart") {
                    town[action.varName] = 0;
                    town[`${action.varName}LoopCounter`] = 0;
                }
            }
        }
        guild = "";
        hearts = [];
        escapeStarted = false;
        portalUsed = false;
        stoneLoc = 0;
        totalMerchantMana = 7500;
        if (options.keepCurrentList && this.current?.length > 0) {
            this.currentPos = 0;
            this.completedTicks = 0;

            for (const action of this.current) {
                action.loops -= action.extraLoops;
                action.loopsLeft = action.loops;
                action.extraLoops = 0;
                action.ticks = 0;
                action.manaUsed = 0;
                action.lastMana = 0;
                action.manaRemaining = 0;
                action.goldRemaining = 0;
                action.timeSpent = 0;
            }

        } else {
            this.current = [];
            for (const action of this.next) {
                // don't add empty/disabled ones
                if (action.loops === 0 || action.disabled) {
                    continue;
                }
                const toAdd = /** @type {AnyActionEntry} */(translateClassNames(action.name));

                toAdd.loops = action.loops;
                toAdd.loopsLeft = action.loops;
                toAdd.extraLoops = 0;
                toAdd.ticks = 0;
                toAdd.manaUsed = 0;
                toAdd.lastMana = 0;
                toAdd.manaRemaining = 0;
                toAdd.goldRemaining = 0;
                toAdd.timeSpent = 0;

                this.current.push(toAdd);
            }
        }
        if (this.current.length === 0) {
            pauseGame();
        }
        this.adjustTicksNeeded();
        view.requestUpdate("updateMultiPartActions");
        view.requestUpdate("updateNextActions");
        view.requestUpdate("updateTime");
        view.requestUpdate("updateActionTooltips");
    }

    adjustTicksNeeded() {
        let remainingTicks = 0;
        for (let i = this.currentPos; i < this.current.length; i++) {
            const action = this.current[i];
            setAdjustedTicks(action);
            remainingTicks += action.loopsLeft * action.adjustedTicks;
        }
        this.totalNeeded = this.completedTicks + remainingTicks;
        view.requestUpdate("updateTotalTicks", null);
    }


    addAction(action, loops, initialOrder, disabled) {
        const toAdd = {};
        toAdd.name = action;
        if (disabled) toAdd.disabled = true;
        else toAdd.disabled = false;

        toAdd.loops = loops === undefined ? this.addAmount : loops;

        if (initialOrder === undefined) {
            if (options.addActionsToTop) {
                this.next.splice(0, 0, toAdd);
                initialOrder = 0;
            } else {
                initialOrder = this.next.length;
                this.next.push(toAdd);
            }
        } else {
            // insert at index
            this.next.splice(initialOrder, 0, toAdd);
        }
        return initialOrder;
    }
}

function setAdjustedTicks(action) {
    let newCost = 0;
    for (const actionStatName in action.stats){
        newCost += action.stats[actionStatName] * stats[actionStatName].manaMultiplier;
    }
    action.rawTicks = action.manaCost() * newCost - (options.fractionalMana ? 0 : 0.000001);
    action.adjustedTicks = Math.max(options.fractionalMana ? 0 : 1, Mana.ceil(action.rawTicks));
}

function calcSoulstoneMult(soulstones) {
    return 1 + Math.pow(soulstones, 0.8) / 30;
}

function calcTalentMult(talent) {
    return 1 + Math.pow(talent, 0.4) / 3;
}

// how many ticks would it take to get to the first level up
function getMaxTicksForAction(action, talentOnly=false) {
    let maxTicks = Number.MAX_SAFE_INTEGER;
    const expMultiplier = action.expMult * (action.manaCost() / action.adjustedTicks);
    const overFlow=prestigeBonus(PRESTIGE_EXP_OVERFLOW_BASE, "PrestigeExpOverflow") - 1;
    for (const stat of statList) {
        const expToNext = getExpToLevel(stat, talentOnly);
        const statMultiplier = expMultiplier * ((action.stats[stat]??0)+overFlow) * getTotalBonusXP(stat);
        maxTicks = Math.min(maxTicks, Mana.ceil(expToNext / statMultiplier));
    }
    return maxTicks;
}

/** @param {StatName} stat  */
function getMaxTicksForStat(action, stat, talentOnly=false) {
    const expMultiplier = action.expMult * (action.manaCost() / action.adjustedTicks);
    const overFlow=prestigeBonus(PRESTIGE_EXP_OVERFLOW_BASE, "PrestigeExpOverflow") - 1;
    const expToNext = getExpToLevel(stat, talentOnly);
    const statMultiplier = expMultiplier * ((action.stats[stat]??0)+overFlow) * getTotalBonusXP(stat);
    return Mana.ceil(expToNext / statMultiplier);
}

function addExpFromAction(action, manaCount) {
    const adjustedExp = manaCount * action.expMult * (action.manaCost() / action.adjustedTicks);
    const overFlow=prestigeBonus(PRESTIGE_EXP_OVERFLOW_BASE, "PrestigeExpOverflow") - 1;
    for (const stat of statList) {
        const expToAdd = ((action.stats[stat]??0)+overFlow) * adjustedExp * getTotalBonusXP(stat);

        // Used for updating the menus when hovering over a completed item in the actionList
        const statExp = `statExp${stat}`;
        if (!action[statExp]) {
            action[statExp] = 0;
        }
        action[statExp] += expToAdd;
        addExp(stat, expToAdd);
    }
}

function markActionsComplete(loopCompletedActions) {
    loopCompletedActions.forEach(action => {
        let varName = Action[withoutSpaces(action.name)].varName;
        if (!completedActions.includes(varName)) completedActions.push(varName);
    });
}

function actionStory(loopCompletedActions) {
    loopCompletedActions.forEach(action => {
        let completed = action.loops - action.loopsLeft;
        if (action.story !== undefined) action.story(completed);
    });
}

function getNumOnList(actionName) {
    let count = 0;
    for (const action of actions.next) {
        if (!action.disabled && action.name === actionName) {
            count += action.loops;
        }
    }
    return count;
}

function getOtherSurveysOnList(surveyName) {
    let count = 0;
    for (const action of actions.next) {
        if (!action.disabled && action.name.startsWith("Survey") && action.name != surveyName) {
            count += action.loops;
        }
    }
    return count;
}

function getNumOnCurList(actionName) {
    let count = 0;
    for (const action of actions.current) {
        if (action.name === actionName) {
            count += action.loops;
        }
    }
    return count;
}
