"use strict";

let screenSize;

function View() {
    this.initalize = function() {
        this.createTravelMenu();
        this.createStats();
        this.updateStats();
        this.updateSkills();
        this.adjustDarkRitualText();
        this.updateBuffs();
        this.updateTime();
        this.updateNextActions();
        this.updateCurrentActionsDivs();
        this.updateTotalTicks();
        this.updateAddAmount(1);
        this.createTownActions();
        this.updateProgressActions();
        this.updateLockedHidden();
        this.updateSoulstones();
        this.showTown(0);
        this.showActions(false);
        this.updateTrainingLimits();
        this.changeStatView();
        this.changeTheme(true);
        this.adjustGoldCosts();
        this.adjustExpGains();
        this.updateTeamCombat();
        this.updateLoadoutNames();
        this.updateResources();
        this.updateTrials();
        if (storyMax >= 12)
            setInterval(() => {
                view.updateStories();
                view.updateLockedHidden();
            }, 20000);
        else
            setInterval(() => {
                view.updateStories();
                view.updateLockedHidden();
            }, 2000);
        adjustAll();
        this.updateActionTooltips();
        document.body.removeEventListener("mouseover", this.mouseoverHandler, {passive: true});
        document.body.addEventListener("mouseover", this.mouseoverHandler, {passive: true});
        document.body.removeEventListener("focusin", this.mouseoverHandler, {passive: true});
        document.body.addEventListener("focusin", this.mouseoverHandler, {passive: true});
        this.tooltipTriggerMap = new WeakMap();
        this.mouseoverCount = 0;
    };

    /** @this {View} @param {UIEvent} event */
    this.mouseoverHandler = function(event) {
        const trigger = this.getClosestTrigger(event.target);
        this.mouseoverCount++;
        if (trigger) {
            for (const tooltip of trigger.querySelectorAll(".showthis,.showthisO,.showthis2,.showthisH,.showthisloadout")) {
                this.fixTooltipPosition(tooltip, trigger, event);
            }
        }
    };
    this.mouseoverHandler = this.mouseoverHandler.bind(this);

    /** @this {View} @param {HTMLElement} element */
    this.getClosestTrigger = function(element) {
        let trigger = /** @type {WeakMap<HTMLElement, HTMLElement>} */(this.tooltipTriggerMap).get(element);
        if (trigger == null) {
            trigger = element.closest(".showthat,.showthatO,.showthat2,.showthatH,.showthatloadout") || false;
            this.tooltipTriggerMap.set(element, trigger);
        }
        return trigger;
    };

    this.createStats = function() {
        statGraph.init(document.getElementById("statsContainer"), stat =>
            `<div class='statContainer showthat' onmouseover='view.showStat("${stat}")' onmouseout='view.showStat(undefined)'>
                <div class='statLabelContainer'>
                    <div class='medium bold stat-name' style='margin-left:18px;margin-top:5px;'>${_txt(`stats>${stat}>long_form`)}</div>
                    <div class='medium statNum stat-soulstone' style='color:var(--stat-soulstone-color);' id='stat${stat}ss'></div>
                    <div class='medium statNum stat-talent' id='stat${stat}Talent'>0</div>
                    <div class='medium statNum stat-level bold' id='stat${stat}Level'>0</div>
                </div>
                <div class='thinProgressBarUpper'><div class='statBar statLevelBar' id='stat${stat}LevelBar'></div></div>
                <div class='thinProgressBarLower'><div class='statBar statTalentBar' id='stat${stat}TalentBar'></div></div>
                <div class='showthis' id='stat${stat}Tooltip' style='width:225px;'>
                    <div class='medium bold'>${_txt(`stats>${stat}>long_form`)}</div><br>${_txt(`stats>${stat}>blurb`)}
                    <br>
                    <div class='medium bold'>${_txt("stats>tooltip>level")}:</div> <div id='stat${stat}Level2'></div>
                    <br>
                    <div class='medium bold'>${_txt("stats>tooltip>level_exp")}:</div>
                    <div id='stat${stat}LevelExp'></div>/<div id='stat${stat}LevelExpNeeded'></div>
                    <div class='statTooltipPerc'>(<div id='stat${stat}LevelProgress'></div>%)</div>
                    <br>
                    <div class='medium bold'>${_txt("stats>tooltip>talent")}:</div>
                    <div id='stat${stat}Talent2'></div>
                    <br>
                    <div class='medium bold'>${_txt("stats>tooltip>talent_exp")}:</div>
                    <div id='stat${stat}TalentExp'></div>/<div id='stat${stat}TalentExpNeeded'></div>
                    <div class='statTooltipPerc'>(<div id='stat${stat}TalentProgress'></div>%)</div>
                    <br>
                    <div class='medium bold'>${_txt("stats>tooltip>talent_multiplier")}:</div>
                    x<div id='stat${stat}TalentMult'></div>
                    <br>
                    <div id='ss${stat}Container' class='ssContainer'>
                        <div class='bold'>${_txt("stats>tooltip>soulstone")}:</div> <div id='ss${stat}'></div><br>
                        <div class='medium bold'>${_txt("stats>tooltip>soulstone_multiplier")}:</div> x<div id='stat${stat}SSBonus'></div>
                    </div><br>
                    <div class='medium bold'>${_txt("stats>tooltip>total_multiplier")}:</div> x<div id='stat${stat}TotalMult'></div>
                </div>
            </div>`);

        if (options.statColors)
            Array.from(document.getElementsByClassName("statLevelBar")).forEach((div, index) => {
                addStatColors(div, statList[index]);
            });
    };

    // requests are properties, where the key is the function name,
    // and the array items in the value are the target of the function
    this.requests = {
        updateStat: [],
        updateSkill: [],
        updateSkills: [],
        updateBuff: [],
        updateTrialInfo: [],
        updateTrials: [],
        updateRegular: [],
        updateProgressAction: [],
        updateMultiPartSegments: [],
        updateMultiPart: [],
        updateMultiPartActions: [],
        updateNextActions: [],
        updateCloudSave: [],
        updateTime: [],
        updateOffline: [],
        updateTotals: [],
        updateStories: [],
        updateGlobalStory: [],
        updateActionLogEntry: [],
        updateCurrentActionBar: [],
        updateCurrentActionsDivs: [],
        updateTotalTicks: [],
        updateCurrentActionLoops: [],
        updateSoulstones: [],
        updateResource: [],
        updateResources: [],
        updateActionTooltips: [],
        updateLockedHidden: [],
        updateTravelMenu: [],
        updateTeamCombat: [],
        adjustManaCost: [],
        adjustGoldCost: [],
        adjustGoldCosts: [],
        adjustExpGain: [],
        removeAllHighlights: [],
        highlightIncompleteActions: [],
        highlightAction: [],
    };

    // requesting an update will call that update on the next view.update tick (based off player set UPS)
    this.requestUpdate = function(category, target) {
        if (!this.requests[category].includes(target)) this.requests[category].push(target);
    };

    this.handleUpdateRequests = function() {
        for (const category in this.requests) {
            for (const target of this.requests[category]) {
                this[category](target);
            }
            this.requests[category] = [];
        }
    };

    this.update = function() {

        this.handleUpdateRequests();

        if (dungeonShowing !== undefined) this.updateSoulstoneChance(dungeonShowing);
        if (this.updateStatGraphNeeded) statGraph.update();
        this.updateTime();
    };


    this.adjustTooltipPosition = function(tooltipDiv) {
        // this is a no-op now, all repositioning happens dynamically on mouseover.
        // if the delegation in mouseoverHandler ends up being too costly, though, this is where
        // we'll bind discrete mouseenter handlers, like so:

        // const trigger = /** @type {HTMLElement} */(tooltipDiv.closest(".showthat,.showthatO,.showthat2,.showthatH,.showthatloadout"));
        // trigger.onmouseenter = e => this.fixTooltipPosition(tooltipDiv, trigger, e);
    }

    /**
     * @param {HTMLElement} tooltip 
     * @param {HTMLElement} trigger 
     * @param {UIEvent} event 
     */
    this.fixTooltipPosition = function(tooltip, trigger, event) {
        if (tooltip.contains(event.target)) {
            // console.log("Not fixing tooltip while cursor is inside",{tooltip,trigger,event});
            return;
        }
        const triggerRect = trigger.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        const viewportRect = {
            // document.documentElement.getBoundingClientRect();
            top: 0,
            left: 0,
            right: window.innerWidth,
            bottom: window.innerHeight,
        };
        const viewportMargins = {
            top: triggerRect.top - viewportRect.top,
            right: viewportRect.right - triggerRect.right,
            bottom: viewportRect.bottom - triggerRect.bottom,
            left: triggerRect.left - viewportRect.left,
        };
        const wantsSidePosition = document.getElementById("nextActionsList").contains(trigger) || document.getElementById("changelog").contains(trigger);

        // We prefer to display tooltips above or below the trigger, except in the action list and the changelog
        let displayOverUnder = true;
        if (tooltipRect.height > Math.max(viewportMargins.top, viewportMargins.bottom)) displayOverUnder = false;
        if (wantsSidePosition && tooltipRect.width <= Math.max(viewportMargins.left, viewportMargins.right)) displayOverUnder = false;

        if (displayOverUnder) {
            tooltipRect.y = viewportMargins.top > viewportMargins.bottom
                          ? triggerRect.top - tooltipRect.height
                          : triggerRect.bottom;
            tooltipRect.x = viewportMargins.left > viewportMargins.right && tooltipRect.width > triggerRect.width
                          ? triggerRect.right - tooltipRect.width
                          : triggerRect.left;
        } else {
            tooltipRect.x = viewportMargins.left > viewportMargins.right
                          ? triggerRect.left - tooltipRect.width
                          : triggerRect.right;
            tooltipRect.y = viewportMargins.top > viewportMargins.bottom
                          ? triggerRect.bottom - tooltipRect.height
                          : triggerRect.top;
        }

        // check all bounds and nudge the tooltip back onto the screen if necessary, favoring the
        // top and left edges. don't trust the trbl on tooltipRect, since adjusting those isn't in spec.
        tooltipRect.x = Math.min(tooltipRect.x, viewportRect.right - tooltipRect.width);
        tooltipRect.y = Math.min(tooltipRect.y, viewportRect.bottom - tooltipRect.height);
        tooltipRect.x = Math.max(tooltipRect.x, viewportRect.left);
        tooltipRect.y = Math.max(tooltipRect.y, viewportRect.top);

        // console.log("Fixing tooltip:",{tooltip,tooltipRect,trigger,triggerRect,event});

        tooltip.style.position = "fixed";
        tooltip.style.left = `${tooltipRect.x - viewportRect.left}px`;
        tooltip.style.top = `${tooltipRect.y - viewportRect.top}px`;
        tooltip.style.right = "auto";
        tooltip.style.bottom = "auto";
        tooltip.style.margin = "0";
    }

    this.showStat = function(stat) {
        statShowing = stat;
        if (stat !== undefined) this.updateStat(stat);
    };

    this.updateStatGraphNeeded = false;

    /** @param {typeof statList[number]} stat */
    this.updateStat = function(stat) {
        const level = getLevel(stat);
        const talent = getTalent(stat);
        const levelPrc = `${getPrcToNextLevel(stat)}%`;
        const talentPrc = `${getPrcToNextTalent(stat)}%`;
        document.getElementById(`stat${stat}LevelBar`).style.width = levelPrc;
        document.getElementById(`stat${stat}TalentBar`).style.width = talentPrc;
        document.getElementById(`stat${stat}Level`).textContent = intToString(level, 1);
        document.getElementById(`stat${stat}Talent`).textContent = intToString(talent, 1);

        if (statShowing === stat || document.getElementById(`stat${stat}LevelExp`).innerHTML === "") {
            document.getElementById(`stat${stat}Level2`).textContent = intToString(level, 1);
            document.getElementById(`stat${stat}LevelExp`).textContent = intToString(stats[stat].statLevelExp.exp, 1);
            document.getElementById(`stat${stat}LevelExpNeeded`).textContent = intToString(stats[stat].statLevelExp.expRequiredForNextLevel, 1);
            document.getElementById(`stat${stat}LevelProgress`).textContent = intToString(levelPrc, 2);

            document.getElementById(`stat${stat}Talent2`).textContent = intToString(talent, 1);
            document.getElementById(`stat${stat}TalentExp`).textContent = intToString(stats[stat].talentLevelExp.exp, 1);
            document.getElementById(`stat${stat}TalentExpNeeded`).textContent = intToString(stats[stat].talentLevelExp.expRequiredForNextLevel, 1);
            document.getElementById(`stat${stat}TalentMult`).textContent = intToString(stats[stat].talentMult, 3);
            document.getElementById(`stat${stat}TalentProgress`).textContent = intToString(talentPrc, 2);
            document.getElementById(`stat${stat}TotalMult`).textContent = intToString(getTotalBonusXP(stat), 3);
        }
    };

    this.updateStats = function() {
        for (const stat of statList) {
            this.updateStat(stat);
        }
    };

    this.showSkill = function(skill) {
        skillShowing = skill;
        if (skill !== undefined) this.updateSkill(skill);
    };

    /** @param {SkillName} skill */
    this.updateSkill = function(skill) {
        if (skills[skill].levelExp.level === 0) {
            document.getElementById(`skill${skill}Container`).style.display = "none";
            return;
        }
        let container = document.getElementById(`skill${skill}Container`);
        container.style.display = "inline-block";
        if (skill === "Combat" || skill === "Pyromancy" || skill === "Restoration") {
            this.updateTeamCombat();
        }

        const levelPrc = getPrcToNextSkillLevel(skill);
        document.getElementById(`skill${skill}Level`).textContent = (getSkillLevel(skill) > 9999) ? toSuffix(getSkillLevel(skill)) : formatNumber(getSkillLevel(skill));
        document.getElementById(`skill${skill}LevelBar`).style.width = `${levelPrc}%`;

        if (skillShowing === skill) {
            document.getElementById(`skill${skill}LevelExp`).textContent = intToString(skills[skill].levelExp.exp, 1);
            document.getElementById(`skill${skill}LevelExpNeeded`).textContent = intToString(skills[skill].levelExp.expRequiredForNextLevel, 1);
            document.getElementById(`skill${skill}LevelProgress`).textContent = intToString(levelPrc, 2);

            if (skill === "Dark") {
                document.getElementById("skillBonusDark").textContent = intToString(getSkillBonus("Dark"), 4);
            } else if (skill === "Chronomancy") {
                document.getElementById("skillBonusChronomancy").textContent = intToString(getSkillBonus("Chronomancy"), 4);
            } else if (skill === "Practical") {
                document.getElementById("skillBonusPractical").textContent = getSkillBonus("Practical").toFixed(3).replace(/(\.\d*?[1-9])0+$/gu, "$1");
            } else if (skill === "Mercantilism") {
                document.getElementById("skillBonusMercantilism").textContent = intToString(getSkillBonus("Mercantilism"), 4);
            } else if (skill === "Spatiomancy") {
                document.getElementById("skillBonusSpatiomancy").textContent = getSkillBonus("Spatiomancy").toFixed(3).replace(/(\.\d*?[1-9])0+$/gu, "$1");
            } else if (skill === "Divine") {
                document.getElementById("skillBonusDivine").textContent = intToString(getSkillBonus("Divine"), 4);
            } else if (skill === "Commune") {
                document.getElementById("skillBonusCommune").textContent = getSkillBonus("Commune").toFixed(3).replace(/(\.\d*?[1-9])0+$/gu, "$1");
            } else if (skill === "Wunderkind") {
                document.getElementById("skillBonusWunderkind").textContent = intToString(getSkillBonus("Wunderkind"), 4);
            }else if (skill === "Gluttony") {
                document.getElementById("skillBonusGluttony").textContent = getSkillBonus("Gluttony").toFixed(3).replace(/(\.\d*?[1-9])0+$/gu, "$1");
            } else if (skill === "Thievery") {
                document.getElementById("skillBonusThievery").textContent = intToString(getSkillBonus("Thievery"), 4);
            } else if (skill === "Leadership") {
                document.getElementById("skillBonusLeadership").textContent = intToString(getSkillBonus("Leadership"), 4);
            } else if (skill === "Assassin") {
                document.getElementById("skillBonusAssassin").textContent = intToString(getSkillBonus("Assassin"), 4);
            }
        }
        this.adjustTooltipPosition(container.querySelector("div.showthis"));
    };

    this.updateSkills = function() {
        for (const skill of skillList) {
            this.updateSkill(skill);
        }
    };

    this.showBuff = function(buff) {
        buffShowing = buff;
        if (buff !== undefined) this.updateBuff(buff);
    };

    this.updateBuff = function(buff) {
        if (buffs[buff].amt === 0) {
            document.getElementById(`buff${buff}Container`).style.display = "none";
            return;
        }
        let container = document.getElementById(`buff${buff}Container`);
        container.style.display = "flex";
        document.getElementById(`buff${buff}Level`).textContent = `${getBuffLevel(buff)}/`;
        if (buff === "Imbuement") {
            this.updateTrainingLimits();
        }
        this.adjustTooltipPosition(container.querySelector("div.showthis"));
    };

    this.updateBuffs = function() {
        for (const buff of buffList) {
            this.updateBuff(buff);
        }
    };

    /** @param {string|gapi.client.drive.File} fileOrText */
    this.updateCloudSave = function(fileOrText) {
        const list = document.getElementById("cloud_save_result");
        if (typeof fileOrText === "string") {
            list.innerHTML = fileOrText;
        } else if (fileOrText) {
            const fileId = fileOrText.id;
            const fileName = fileOrText.name;
            let li = document.getElementById(`cloud_save_${fileId}`);
            if (li && !fileName) {
                li.remove();
                return;
            }
            if (!li) {
                li = document.createElement("li");
                list.appendChild(li);
            }
            li.className = "cloud_save";
            li.id = `cloud_save_${fileId}`;
            li.dataset.fileId = fileId;
            li.dataset.fileName = fileName;
            li.innerHTML = `
                <button onclick='startRenameCloudSave("${fileId}")' class='cloud_rename actionIcon fas fa-pencil-alt'></button>
                <div class="cloud_save_name"'>
                    ${fileName}
                </div>
                <button class='button cloud_import' style='margin-top: 1px;' onclick='googleCloud.importFile("${fileId}")'>${_txt("menu>save>import_button")}</button>
                <button class='button cloud_delete' style='margin-top: 1px;' onclick='askDeleteCloudSave("${fileId}")'>${_txt("menu>save>delete_button")}</button>
            `;
            const name = li.querySelector(".cloud_save_name");
            name.textContent = fileName;
            name.title = fileName;
        }
    }

    this.updateTime = function() {
        document.getElementById("timeBar").style.width = `${100 - timer / timeNeeded * 100}%`;
        document.getElementById("timer").textContent = `${intToString((timeNeeded - timer), options.fractionalMana ? 2 : 1)} | ${formatTime((timeNeeded - timer) / 50 / getActualGameSpeed())}`;
    };
    this.updateOffline = function() {
        document.getElementById("bonusSeconds").textContent = formatTime(totalOfflineMs / 1000);
        const returnTimeButton = document.getElementById("returnTimeButton");
        if (returnTimeButton instanceof HTMLButtonElement) {
            returnTimeButton.disabled = totalOfflineMs < 86400_000;
        }
    }
    this.updateBonusText = function() {
        document.getElementById("bonusText").innerHTML = this.getBonusText();
    }
    this.getBonusText = function() {
        let text = _txt("time_controls>bonus_seconds>main_text");
        let lastText = null;
        while (lastText !== text) {
            lastText = text;
            text = text.replace(/{([^+{}-]*)([+-]?)(.*?)}/g, (_str, lhs, op, rhs) => this.getBonusReplacement(lhs, op, rhs));
        }
        return text;
    }
    /** @type {(lhs: string, op?: string, rhs?: string) => string} */
    this.getBonusReplacement = function(lhs, op, rhs) {
        // this is the second time I've manually implemented this text-replacement pattern (first was for Action Log entries). Next time I need to make it a
        // generic operation on Localization; I think I'm beginning to figure out what will be needed for it
        const fgSpeed = Math.max(5, options.speedIncrease10x ? 10 : 0, options.speedIncrease20x ? 20 : 0, options.speedIncreaseCustom);
        const bgSpeed = !isFinite(options.speedIncreaseBackground) ? -1 : options.speedIncreaseBackground ?? -1;
        const variables = {
            __proto__: null, // toString is not a valid replacement name
            get background_info() {
                if (bgSpeed < 0 || bgSpeed === fgSpeed) {
                    return _txt("time_controls>bonus_seconds>background_disabled");
                } else if (bgSpeed === 0) {
                    return _txt("time_controls>bonus_seconds>background_0x");
                } else if (bgSpeed < 1) {
                    return _txt("time_controls>bonus_seconds>background_regen");
                } else if (bgSpeed === 1) {
                    return _txt("time_controls>bonus_seconds>background_1x");
                } else if (bgSpeed < fgSpeed) {
                    return _txt("time_controls>bonus_seconds>background_slower");
                } else {
                    return _txt("time_controls>bonus_seconds>background_faster");
                }
            },
            get state() {return `<span class='bold' id='isBonusOn'>${_txt(`time_controls>bonus_seconds>state>${isBonusActive() ? "on" : "off"}`)}</span>`},
            get counter_text() {return `<span class='bold'>${_txt("time_controls>bonus_seconds>counter_text")}</span>`},
            get bonusSeconds() {return `<span id='bonusSeconds'>${formatTime(totalOfflineMs / 1000)}</span>`},
            speed: fgSpeed,
            background_speed: bgSpeed,
        }
        const lval = variables[lhs] ?? (parseFloat(lhs) || 0);
        const rval = variables[rhs] ?? (parseFloat(rhs) || 0);
        return String(
            op === "+" ? lval + rval
            : op === "-" ? lval - rval
            : lval);
    }
    this.updateTotalTicks = function() {
        document.getElementById("totalTicks").textContent = `${formatNumber(actions.completedTicks)} | ${formatTime(timeCounter)}`;
        document.getElementById("effectiveTime").textContent = `${formatTime(effectiveTime)}`;
    };
    this.updateResource = function(resource) {
        if (resource !== "gold") document.getElementById(`${resource}Div`).style.display = resources[resource] ? "inline-block" : "none";

        if (resource === "supplies") document.getElementById("suppliesCost").textContent = towns[0].suppliesCost;
        if (resource === "teamMembers") document.getElementById("teamCost").textContent = (resources.teamMembers + 1) * 100;

        if (Number.isFinite(resources[resource])) document.getElementById(resource).textContent = resources[resource];
    };
    this.updateResources = function() {
        for (const resource in resources) this.updateResource(resource);
    };
    this.updateActionTooltips = function() {
        document.getElementById("goldInvested").textContent = intToStringRound(goldInvested);
        document.getElementById("bankInterest").textContent = intToStringRound(goldInvested * .001);
        document.getElementById("actionAllowedPockets").textContent = intToStringRound(towns[7].totalPockets);
        document.getElementById("actionAllowedWarehouses").textContent = intToStringRound(towns[7].totalWarehouses);
        document.getElementById("actionAllowedInsurance").textContent = intToStringRound(towns[7].totalInsurance);
        document.getElementById("totalSurveyProgress").textContent = getExploreProgress();
        Array.from(document.getElementsByClassName("surveySkill")).forEach(div => {
            div.textContent = getExploreSkill();
        });
    }
    this.updateTeamCombat = function() {
        if (towns[2].unlocked) {
            document.getElementById("skillSCombatContainer").style.display = "inline-block";
            document.getElementById("skillTCombatContainer").style.display = "inline-block";
            document.getElementById("skillSCombatLevel").textContent = intToString(getSelfCombat(), 1);
            document.getElementById("skillTCombatLevel").textContent = intToString(getTeamCombat(), 1);
        } else {
            document.getElementById("skillSCombatContainer").style.display = "none";
            document.getElementById("skillTCombatContainer").style.display = "none";
        }
    };
    this.zoneTints = [
        "var(--zone-tint-1)", //Beginnersville
        "var(--zone-tint-2)", //Forest Path
        "var(--zone-tint-3)", //Merchanton
        "var(--zone-tint-4)", //Mt Olympus
        "var(--zone-tint-5)", //Valhalla
        "var(--zone-tint-6)", //Startington
        "var(--zone-tint-7)", //Jungle Path
        "var(--zone-tint-8)", //Commerceville
        "var(--zone-tint-9)", //Valley of Olympus
    ];
    this.highlightAction = function(index) {
        const element = document.getElementById(`nextActionContainer${index}`);
        if (!(element instanceof HTMLElement)) return;
        element.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "nearest",
        })
    };
    this.updateNextActions = function() {
        let count = 0;
        while (nextActionsDiv.firstChild) {
            if (document.getElementById(`capButton${count}`)) {
                document.getElementById(`capButton${count}`).removeAttribute("onclick");
            }
            // not for journey
            if (document.getElementById(`plusButton${count}`)) {
                document.getElementById(`plusButton${count}`).removeAttribute("onclick");
                document.getElementById(`minusButton${count}`).removeAttribute("onclick");
                document.getElementById(`splitButton${count}`).removeAttribute("onclick");
            }
            document.getElementById(`upButton${count}`).removeAttribute("onclick");
            document.getElementById(`downButton${count}`).removeAttribute("onclick");
            document.getElementById(`removeButton${count}`).removeAttribute("onclick");

            const dragAndDropDiv = document.getElementById(`nextActionContainer${count}`);
            dragAndDropDiv.removeAttribute("ondragover");
            dragAndDropDiv.removeAttribute("ondrop");
            dragAndDropDiv.removeAttribute("ondragstart");
            dragAndDropDiv.removeAttribute("ondragend");
            dragAndDropDiv.removeAttribute("ondragenter");
            dragAndDropDiv.removeAttribute("ondragleave");

            while (nextActionsDiv.firstChild.firstChild) {
                if (nextActionsDiv.firstChild.firstChild instanceof HTMLImageElement) {
                    nextActionsDiv.firstChild.firstChild.src = "";
                }
                nextActionsDiv.firstChild.removeChild(nextActionsDiv.firstChild.firstChild);
            }
            count++;
            nextActionsDiv.removeChild(nextActionsDiv.firstChild);
        }

        let totalDivText = "";

        for (let i = 0; i < actions.next.length; i++) {
            const action = actions.next[i];
            const translatedAction = translateClassNames(action.name);
            let capButton = "";
            const townNum = translatedAction.townNum;
            const travelNum = getTravelNum(action.name);
            const collapses = [];
            // eslint-disable-next-line no-loop-func
            actions.next.forEach((a, index) => {
                if (a.collapsed) {
                    const collapse = {};
                    collapse.zone = translateClassNames(a.name).townNum;
                    collapse.index = index;
                    collapses.push(collapse);
                }
            });
            if (hasLimit(action.name)) {
                capButton = `<button id='capButton${i}' onclick='capAmount(${i}, ${townNum})' class='actionIcon far fa-circle'></button>`;
            } else if (isTraining(action.name)) {
                capButton = `<button id='capButton${i}' onclick='capTraining(${i})' class='actionIcon far fa-circle'></button>`;
            }
            let isSingular;
            if (translatedAction.allowed === undefined) {
                isSingular = false;
            } else {
                isSingular = translatedAction.allowed() === 1;
            }
            const actionLoops = action.loops > 99999 ? toSuffix(action.loops) : formatNumber(action.loops);
            const opacity = action.disabled || action.loops === 0 ? "opacity: 0.5" : "";
            let display = "display: flex";
            for (const collapse of collapses) {
                if (townNum === collapse.zone && i < collapse.index) display = "display: none";
            }
            let color;
            if (action.name === "Face Judgement") {
                color = "linear-gradient(to bottom, var(--zone-tint-4-opaque) 49%, transparent 51%), linear-gradient(to right, var(--zone-tint-5) 50%, var(--zone-tint-6) 51%)";
            } else if (action.name === "Fall From Grace") {
                color = "linear-gradient(to bottom, var(--zone-tint-5) 49%, var(--zone-tint-6) 51%)";
            } else if (action.name === "Open Rift") {
                color = "linear-gradient(to bottom, var(--zone-tint-1) 49%, var(--zone-tint-6) 51%)";
            } else {
                color = (travelNum > 0 || travelNum == -5) ? `linear-gradient(${this.zoneTints[townNum]} 49%, ${this.zoneTints[townNum + travelNum]} 51%)` : this.zoneTints[townNum];
            }
            const imageName = action.name.startsWith("Assassin") ? "assassin" : camelize(action.name);
            totalDivText +=
                `<div
                    id='nextActionContainer${i}'
                    class='nextActionContainer small'
                    ondragover='handleDragOver(event)'
                    ondrop='handleDragDrop(event)'
                    ondragstart='handleDragStart(event)'
                    ondragend='draggedUndecorate(${i})'
                    ondragenter='dragOverDecorate(${i})'
                    ondragleave='dragExitUndecorate(${i})'
                    draggable='true' data-index='${i}'
                    style='background: ${color}; ${opacity}; ${display};'
                >
                    <div class='nextActionLoops'><img src='img/${imageName}.svg' class='smallIcon imageDragFix'> x
                    <div class='bold'>${actionLoops}</div></div>
                    <div class='nextActionButtons'>
                        ${capButton}
                        ${isSingular ? "" : `<button id='plusButton${i}' onclick='addLoop(${i})' class='actionIcon fas fa-plus'></button>`}
                        ${isSingular ? "" : `<button id='minusButton${i}' onclick='removeLoop(${i})' class='actionIcon fas fa-minus'></button>`}
                        ${isSingular ? "" : `<button id='splitButton${i}' onclick='split(${i})' class='actionIcon fas fa-arrows-alt-h'></button>`}
                        ${travelNum ? `<button id='collapseButton${i}' onclick='collapse(${i})' class='actionIcon fas fa-${action.collapsed ? "expand" : "compress"}-alt'></button>` : ""}
                        <button id='upButton${i}' onclick='moveUp(${i})' class='actionIcon fas fa-sort-up'></button>
                        <button id='downButton${i}' onclick='moveDown(${i})' class='actionIcon fas fa-sort-down'></button>
                        <button id='skipButton${i}' onclick='disableAction(${i})' class='actionIcon far fa-${action.disabled ? "check" : "times"}-circle'></button>
                        <button id='removeButton${i}' onclick='removeAction(${i})' class='actionIcon fas fa-times'></button>
                    </div>
                </div>`;
        }
        nextActionsDiv.innerHTML = totalDivText;
    };

    this.updateCurrentActionsDivs = function() {
        let totalDivText = "";

        // definite leak - need to remove listeners and image
        for (let i = 0; i < actions.current.length; i++) {
            const action = actions.current[i];
            const actionLoops = action.loops > 99999 ? toSuffix(action.loops) : formatNumber(action.loops);
            const actionLoopsDone = (action.loops - action.loopsLeft) > 99999 ? toSuffix(action.loops - action.loopsLeft) : formatNumber(action.loops - action.loopsLeft);
            const imageName = action.name.startsWith("Assassin") ? "assassin" : camelize(action.name);
            totalDivText +=
                `<div class='curActionContainer small' onmouseover='view.mouseoverAction(${i}, true)' onmouseleave='view.mouseoverAction(${i}, false)'>
                    <div class='curActionBar' id='action${i}Bar'></div>
                    <div class='actionSelectedIndicator' id='action${i}Selected'></div>
                    <img src='img/${imageName}.svg' class='smallIcon'>
                    <div id='action${i}LoopsDone' style='margin-left:3px; border-left: 1px solid var(--action-separator-border);padding-left: 3px;'>${actionLoopsDone}</div>
                    /<div id='action${i}Loops'>${actionLoops}</div>
                </div>`;
        }

        curActionsDiv.innerHTML = totalDivText;

        totalDivText = "";

        for (let i = 0; i < actions.current.length; i++) {
            const action = actions.current[i];
            totalDivText +=
                `<div id='actionTooltip${i}' style='display:none;padding-left:10px;width:90%'>` +
                    `<div style='text-align:center;width:100%'>${action.label}</div><br><br>` +
                    `<b>${_txt("actions>current_action>mana_original")}</b> <div id='action${i}ManaOrig'></div><br>` +
                    `<b>${_txt("actions>current_action>mana_used")}</b> <div id='action${i}ManaUsed'></div><br>` +
                    `<b>${_txt("actions>current_action>last_mana")}</b> <div id='action${i}LastMana'></div><br>` +
                    `<b>${_txt("actions>current_action>mana_remaining")}</b> <div id='action${i}Remaining'></div><br>` +
                    `<b>${_txt("actions>current_action>gold_remaining")}</b> <div id='action${i}GoldRemaining'></div><br>` +
                    `<b>${_txt("actions>current_action>time_spent")}</b> <div id='action${i}TimeSpent'></div><br><br>` +
                    `<div id='action${i}ExpGain'></div>` +
                    `<div id='action${i}HasFailed' style='display:none'>` +
                        `<b>${_txt("actions>current_action>failed_attempts")}</b> <div id='action${i}Failed'></div><br>` +
                        `<b>${_txt("actions>current_action>error")}</b> <div id='action${i}Error'></div>` +
                    `</div>` +
                `</div>`;
        }

        document.getElementById("actionTooltipContainer").innerHTML = totalDivText;
        this.mouseoverAction(0, false);
    };

    this.updateCurrentActionBar = function(index) {
        const div = document.getElementById(`action${index}Bar`);
        if (!div) {
            return;
        }
        const action = actions.current[index];
        if (!action) {
            return;
        }
        if (action.errorMessage) {
            document.getElementById(`action${index}Failed`).textContent = action.loopsLeft;
            document.getElementById(`action${index}Error`).textContent = action.errorMessage;
            document.getElementById(`action${index}HasFailed`).style.display = "";
            div.style.width = "100%";
            div.style.backgroundColor = "var(--cur-action-error-indicator)";
            div.style.height = "30%";
            div.style.marginTop = "5px";
            if (action.name === "Heal The Sick") unlockStory("failedHeal");
            if (action.name === "Brew Potions" && resources.reputation >= 0 && resources.herbs >= 10) unlockStory("failedBrewPotions");
            if (action.name === "Brew Potions" && resources.reputation < 0 && resources.herbs >= 10) unlockStory("failedBrewPotionsNegativeRep");
            if (action.name === "Gamble" && resources.reputation < -5) unlockStory("failedGamble");
            if (action.name === "Gamble" && resources.gold < 20 && resources.reputation > -6) unlockStory("failedGambleLowMoney");
            if (action.name === "Gather Team") unlockStory("failedGatherTeam");
            if (action.name === "Craft Armor") unlockStory("failedCraftArmor");
            if (action.name === "Imbue Body") unlockStory("failedImbueBody");
            if (action.name === "Accept Donations") unlockStory("failedReceivedDonations");
            if (action.name === "Raise Zombie") unlockStory("failedRaiseZombie")
        } else if (action.loopsLeft === 0) {
            div.style.width = "100%";
            div.style.backgroundColor = "var(--cur-action-completed-background)";
        } else {
            div.style.width = `${100 * action.ticks / action.adjustedTicks}%`;
        }

        // only update tooltip if it's open
        if (curActionShowing === index) {
            document.getElementById(`action${index}ManaOrig`).textContent = intToString(action.manaCost() * action.loops, options.fractionalMana ? 3 : 1);
            document.getElementById(`action${index}ManaUsed`).textContent = intToString(action.manaUsed, options.fractionalMana ? 3 : 1);
            document.getElementById(`action${index}LastMana`).textContent = intToString(action.lastMana, 3);
            document.getElementById(`action${index}Remaining`).textContent = intToString(action.manaRemaining, options.fractionalMana ? 3 : 1);
            document.getElementById(`action${index}GoldRemaining`).textContent = formatNumber(action.goldRemaining);
            document.getElementById(`action${index}TimeSpent`).textContent = formatTime(action.timeSpent);

            let statExpGain = "";
            const expGainDiv = document.getElementById(`action${index}ExpGain`);
            while (expGainDiv.firstChild) {
                expGainDiv.removeChild(expGainDiv.firstChild);
            }
            for (const stat of statList) {
                if (action[`statExp${stat}`]) {
                    statExpGain += `<div class='bold'>${_txt(`stats>${stat}>short_form`)}:</div> ${intToString(action[`statExp${stat}`], 2)}<br>`;
                }
            }
            expGainDiv.innerHTML = statExpGain;
        }
    };

    this.updateActionLogEntry = function(index) {
        const log = document.getElementById("actionLog");
        this.actionLogClearHTML ??= log.innerHTML;
        if (index === "clear") {
            log.innerHTML = this.actionLogClearHTML; // nuke it, dot it
        }
        const entry = actionLog.getEntry(index);
        if (actionLog.hasPrevious()) {
            log.classList.add("hasPrevious");
        } else {
            log.classList.remove("hasPrevious");
        }
        if (!entry) return;
        let element = document.getElementById(`actionLogEntry${index}`);
        if (element) {
            entry.element = element;
            entry.updateElement();
        } else {
            element = entry.createElement();
            element.id = `actionLogEntry${index}`;
            element.style.order = index;

            log.appendChild(element);
        }
        if ((actionLog.firstNewOrUpdatedEntry ?? Infinity) <= index) {
            element.classList.add("highlight");
            element.scrollIntoView({block: "nearest", inline: "nearest", behavior: "auto"});
            setTimeout(() => element.classList.remove("highlight"), 1);
        }
    }

    this.mouseoverAction = function(index, isShowing) {
        if (isShowing) curActionShowing = index;
        else curActionShowing = undefined;
        const div = document.getElementById(`action${index}Selected`);
        if (div) {
            div.style.opacity = isShowing ? "1" : "0";
            document.getElementById(`actionTooltip${index}`).style.display = isShowing ? "inline-block" : "none";
        }
        nextActionsDiv.style.display = isShowing ? "none" : "inline-block";
        document.getElementById("actionTooltipContainer").style.display = isShowing ? "inline-block" : "none";
        view.updateCurrentActionBar(index);
    };

    this.updateCurrentActionLoops = function(index) {
        const action = actions.current[index];
        if (action !== undefined) {
            document.getElementById(`action${index}LoopsDone`).textContent = (action.loops - action.loopsLeft) > 99999
                ? toSuffix(action.loops - action.loopsLeft) : formatNumber(action.loops - action.loopsLeft);
            document.getElementById(`action${index}Loops`).textContent = action.loops > 99999 ? toSuffix(action.loops) : formatNumber(action.loops);
        }
    };

    this.updateProgressAction = function(updateInfo) {
        const varName = updateInfo.name;
        const town = updateInfo.town;
        const level = town.getLevel(varName);
        const levelPrc = `${town.getPrcToNext(varName)}%`;
        document.getElementById(`prc${varName}`).textContent = level;
        document.getElementById(`expBar${varName}`).style.width = levelPrc;
        document.getElementById(`progress${varName}`).textContent = intToString(levelPrc, 2);
        document.getElementById(`bar${varName}`).style.width = `${level}%`;
    };

    this.updateProgressActions = function() {
        for (const town of towns) {
            for (let i = 0; i < town.progressVars.length; i++) {
                const varName = town.progressVars[i];
                this.updateProgressAction({name: varName, town: town});
            }
        }
    };

    this.updateLockedHidden = function() {
        for (const action of totalActionList) {
            const actionDiv = document.getElementById(`container${action.varName}`);
            const infoDiv = document.getElementById(`infoContainer${action.varName}`);
            const storyDiv = document.getElementById(`storyContainer${action.varName}`);
            if (action.allowed && getNumOnList(action.name) >= action.allowed()) {
                addClassToDiv(actionDiv, "capped");
            } else if (action.unlocked()) {
                if (infoDiv) {
                    removeClassFromDiv(infoDiv, "hidden");
                }
                removeClassFromDiv(actionDiv, "locked");
                removeClassFromDiv(actionDiv, "capped");
            } else {
                addClassToDiv(actionDiv, "locked");
                if (infoDiv) {
                    addClassToDiv(infoDiv, "hidden");
                }
            }
            if (action.unlocked() && infoDiv) {
                removeClassFromDiv(infoDiv, "hidden");
            }
            if (action.visible()) {
                removeClassFromDiv(actionDiv, "hidden");
                if (storyDiv !== null) removeClassFromDiv(storyDiv, "hidden");
            } else {
                addClassToDiv(actionDiv, "hidden");
                if (storyDiv !== null) addClassToDiv(storyDiv, "hidden");
            }
            if (storyDiv !== null) {
                if (action.unlocked()) {
                    removeClassFromDiv(storyDiv, "hidden");
                } else {
                    addClassToDiv(storyDiv, "hidden");
                }
            }
        }
        if (totalActionList.filter(action => action.finish.toString().includes("handleSkillExp")).filter(action => action.unlocked()).length > 0) {
            document.getElementById("skillList").style.display = "";
        } else {
            document.getElementById("skillList").style.display = "none";
        }
        if (totalActionList.filter(action => action.finish.toString().includes("updateBuff")).filter(action => action.unlocked()).length > 0 ||
            prestigeValues["completedAnyPrestige"]) {
            document.getElementById("buffList").style.display = "";
        } else {
            document.getElementById("buffList").style.display = "none";
        }
    };

    this.updateGlobalStory = function(num) {
        actionLog.addGlobalStory(num);
    }

    this.updateStories = function(init) {
        // ~1.56ms cost per run. run once every 2000ms on an interval
        for (const action of totalActionList) {
            if (action.storyReqs !== undefined) {
                // greatly reduces/nullifies the cost of checking actions with all stories unlocked, which is nice,
                // since you're likely to have more stories unlocked at end game, which is when performance is worse
                const divName = `storyContainer${action.varName}`;
                if (init || document.getElementById(divName).innerHTML.includes("???")) {
                    let storyTooltipText = "";
                    let lastInBranch = false;
                    const name = action.name.toLowerCase().replace(/ /gu, "_");
                    const storyAmt = _txt(`actions>${name}`, "fallback").split("⮀").length - 1;
                    let storiesUnlocked = 0;
                    for (let i = 1; i <= storyAmt; i++) {
                        const storyText = _txt(`actions>${name}>story_${i}`, "fallback").split("⮀");
                        if (action.storyReqs(i)) {
                            storyTooltipText += storyText[0] + storyText[1];
                            lastInBranch = false;
                            storiesUnlocked++;
                            if (action.visible() && action.unlocked() && completedActions.includes(action.varName)) {
                                actionLog.addActionStory(action, i, init);
                            }
                        } else if (lastInBranch) {
                            storyTooltipText += "<b>???:</b> ???";
                        } else {
                            storyTooltipText += `${storyText[0]} ???`;
                            lastInBranch = true;
                        }
                        storyTooltipText += "<br>";
                    }
                    if (document.getElementById(divName).children[2].innerHTML !== storyTooltipText) {
                        document.getElementById(divName).children[2].innerHTML = storyTooltipText;
                        if (!init) {
                            showNotification(divName);
                            if (!unreadActionStories.includes(divName)) unreadActionStories.push(divName);
                        }
                        if (storiesUnlocked === storyAmt) {
                            document.getElementById(divName).classList.add("storyContainerCompleted");
                        } else {
                            document.getElementById(divName).classList.remove("storyContainerCompleted");
                        }
                    }
                }
            }
        }
    };

    this.showTown = function(townNum) {
        if (!towns[townNum].unlocked()) return;

        if (townNum === 0) {
            document.getElementById("townViewLeft").style.visibility = "hidden";
        } else {
            document.getElementById("townViewLeft").style.visibility = "";
        }

        if (townNum === Math.max(...townsUnlocked)) {
            document.getElementById("townViewRight").style.visibility = "hidden";
        } else {
            document.getElementById("townViewRight").style.visibility = "";
        }

        for (let i = 0; i < actionOptionsTown.length; i++) {
            actionOptionsTown[i].style.display = "none";
            actionStoriesTown[i].style.display = "none";
            townInfos[i].style.display = "none";
        }
        if (actionStoriesShowing) actionStoriesTown[townNum].style.display = "";
        else actionOptionsTown[townNum].style.display = "";
        townInfos[townNum].style.display = "";
        $("#TownSelect").val(townNum);
        document.getElementById("townDesc").textContent = _txt(`towns>town${townNum}>desc`);
        townShowing = townNum;
    };

    this.showActions = function(stories) {
        for (let i = 0; i < actionOptionsTown.length; i++) {
            actionOptionsTown[i].style.display = "none";
            actionStoriesTown[i].style.display = "none";
        }

        if (stories) {
            document.getElementById("actionsViewLeft").style.visibility = "";
            document.getElementById("actionsViewRight").style.visibility = "hidden";
            actionStoriesTown[townShowing].style.display = "";
        } else {
            document.getElementById("actionsViewLeft").style.visibility = "hidden";
            document.getElementById("actionsViewRight").style.visibility = "";
            actionOptionsTown[townShowing].style.display = "";
        }

        document.getElementById("actionsTitle").textContent = _txt(`actions>title${(stories) ? "_stories" : ""}`);
        actionStoriesShowing = stories;
    };

    this.updateRegular = function(updateInfo) {
        const varName = updateInfo.name;
        const index = updateInfo.index;
        const town = towns[index];
        document.getElementById(`total${varName}`).textContent = town[`total${varName}`];
        document.getElementById(`checked${varName}`).textContent = town[`checked${varName}`];
        document.getElementById(`unchecked${varName}`).textContent = town[`total${varName}`] - town[`checked${varName}`];
        document.getElementById(`goodTemp${varName}`).textContent = town[`goodTemp${varName}`];
        document.getElementById(`good${varName}`).textContent = town[`good${varName}`];
    };

    this.updateAddAmount = function(num) {
        for (let i = 0; i < 6; i++) {
            const elem = document.getElementById(`amount${num}`);
            if (elem) {
                addClassToDiv(elem, "unused");
            }
        }
        if (num > 0) removeClassFromDiv(document.getElementById(`amount${num}`), "unused");
    };

    this.updateLoadout = function(num) {
        for (let i = 0; i < 16; i++) {
            const elem = document.getElementById(`load${i}`);
            if (elem) {
                addClassToDiv(elem, "unused");
            }
        }
        const elem = document.getElementById(`load${num}`);
        if (elem) {
            removeClassFromDiv(document.getElementById(`load${num}`), "unused");
        }
    };

    this.updateLoadoutNames = function() {
        for (let i = 0; i < loadoutnames.length; i++) {
            document.getElementById(`load${i + 1}`).textContent = loadoutnames[i];
        }
        document.getElementById("renameLoadout").value = loadoutnames[curLoadout - 1];
    };

    this.createTownActions = function() {
        if (actionOptionsTown[0].firstChild) return;
        for (const prop in Action) {
            const action = Action[prop];
            this.createTownAction(action);
            if (action.type === "limited") this.createTownInfo(action);
            if (action.type === "progress") this.createActionProgress(action);
            if (action.type === "multipart") this.createMultiPartPBar(action);
            if (options.highlightNew) this.highlightIncompleteActions();
        }
    };

    this.createActionProgress = function(action) {
        const totalDivText =
        `<div class='townStatContainer showthat'>
            <div class='bold townLabel'>${action.labelDone}</div>
            <div class='progressValue' id='prc${action.varName}'>5</div><div class='percentSign'>%</div>
            <div class='thinProgressBarUpper'><div id='expBar${action.varName}' class='statBar townExpBar'></div></div>
            <div class='thinProgressBarLower'><div id='bar${action.varName}' class='statBar townBar'></div></div>

            <div class='showthis'>
                ${_txt("actions>tooltip>higher_done_percent_benefic")}<br>
                <div class='bold'>${_txt("actions>tooltip>progress_label")}</div> <div id='progress${action.varName}'></div>%
            </div>
        </div>`;
        const progressDiv = document.createElement("div");
        progressDiv.className = "townContainer progressType";
        progressDiv.id = `infoContainer${action.varName}`;
        progressDiv.style.display = "";
        progressDiv.innerHTML = totalDivText;
        townInfos[action.townNum].appendChild(progressDiv);
    };

    this.createTownAction = function(action) {
        let actionStats = "";
        let actionSkills = "";
        let skillDetails = "";
        let lockedStats = "";
        let lockedSkills = "";
        const statKeyNames = Object.keys(action.stats);
        for (let i = 0; i < 9; i++) {
            for (const stat of statKeyNames) {
                if (statList[i] === stat) {
                    const statLabel = _txt(`stats>${stat}>short_form`);
                    actionStats += `<div class='bold'>${statLabel}:</div> ${action.stats[stat] * 100}%<br>`;
                }
            }
        }
        // pretty sure this is guaranteed but we'll check anyway
        if (statKeyNames.length > 0) {
            // sort stats by percentage descending
            statKeyNames.sort((a, b) => (action.stats[b] - action.stats[a]));
            const highestStatValue = action.stats[statKeyNames[0]];
            lockedStats = `(${statKeyNames.map(stat => /** @type {[boolean, string]} */([action.stats[stat] === highestStatValue, _txt(`stats>${stat}>short_form`)]))
                                      .map(([isHighestStat, label]) => isHighestStat ? `<div class='bold'>${label}</div>` : label)
                                      .join(", ")})<br>`;
        }
        if (action.skills !== undefined) {
            const skillKeyNames = Object.keys(action.skills);
            const l = skillList.length;
            for (let i = 0; i < l; i++) {
                for (const skill of skillKeyNames) {
                    if (skillList[i] === skill) {
                        const xmlName = getXMLName(skill);
                        const skillLabel = `${_txt(`skills>${xmlName}>label`)} ${_txt("stats>tooltip>exp")}`;
                        actionSkills += `<div class='bold'>${skillLabel}:</div><span id='expGain${action.varName}${skill}'></span><br>`;
                        if (action.teachesSkill(skill)) {
                            const learnSkill = `<div class='bold'>${_txt("actions>tooltip>learn_skill")}:</div>`;
                            lockedSkills += `${learnSkill} <span>${_txt(`skills>${xmlName}>label`)}</span><br>`;
                            skillDetails +=
                                `<hr>
                                ${learnSkill} <div class='bold underline'>${_txt(`skills>${xmlName}>label`)}</div><br>
                                <i>${_txt(`skills>${xmlName}>desc`)}</i><br>`;
                            if (_txtsObj(`skills>${xmlName}>desc2`)?.length > 0) {
                                skillDetails += `${_txt(`skills>${xmlName}>desc2`).replace(/<br>\s*Currently.*(?:<br>|$)/sgi, "") }<br>`; // ugh
                            }
                        }
                    }
                }
            }
        }
        let extraImage = "";
        const extraImagePositions = ["margin-top:17px;margin-left:5px;", "margin-top:17px;margin-left:-55px;", "margin-top:0px;margin-left:-55px;", "margin-top:0px;margin-left:5px;"];
        if (action.affectedBy) {
            for (let i = 0; i < action.affectedBy.length; i++) {
                extraImage += `<img src='img/${camelize(action.affectedBy[i])}.svg' class='smallIcon' draggable='false' style='position:absolute;${extraImagePositions[i]}'>`;
            }
        }
        const isTravel = getTravelNum(action.name) > 0;
        const divClass = isTravel ? "travelContainer showthat" : "actionContainer showthat";
        const imageName = action.name.startsWith("Assassin") ? "assassin" : camelize(action.name);
        const unlockConditions = /<br>Unlocked (.*?)(?:<br>|$)/is.exec(`${action.tooltip}${action.goldCost === undefined ? "" : action.tooltip2}`)?.[1]; // I hate this but wygd
        const lockedText = unlockConditions ? `${_txt("actions>tooltip>locked_tooltip")}<br>Will unlock ${unlockConditions}` : `${action.tooltip}${action.goldCost === undefined ? "" : action.tooltip2}`;
        const totalDivText =
            `<button
                id='container${action.varName}'
                class='${divClass}'
                draggable='true'
                ondragover='handleDragOver(event)'
                ondragstart='handleDirectActionDragStart(event, "${action.name}", ${action.townNum}, "${action.varName}", false)'
                ondragend='handleDirectActionDragEnd("${action.varName}")'
                onclick='addActionToList("${action.name}", ${action.townNum})'
                onmouseover='view.updateAction("${action.varName}")'
                onmouseout='view.updateAction(undefined)'
            >
                ${action.label}<br>
                <div style='position:relative'>
                    <img src='img/${imageName}.svg' class='superLargeIcon' draggable='false'>${extraImage}
                </div>
                <div class='showthis when-unlocked' draggable='false'>
                    ${action.tooltip}<span id='goldCost${action.varName}'></span>
                    ${(action.goldCost === undefined) ? "" : action.tooltip2}
                    <br>
                    ${actionSkills}
                    ${actionStats}
                    <div class='bold'>${_txt("actions>tooltip>mana_cost")}:</div> <div id='manaCost${action.varName}'>${formatNumber(action.manaCost())}</div><br>
                    <div class='bold'>${_txt("actions>tooltip>exp_multiplier")}:</div><div id='expMult${action.varName}'>${action.expMult * 100}</div>%<br>
                    ${skillDetails}
                </div>
                <div class='showthis when-locked' draggable='false'>
                    ${lockedText}
                    <br>
                    ${lockedSkills}
                    ${lockedStats}
                </div>
            </button>`;

        const actionsDiv = document.createElement("div");
        actionsDiv.innerHTML = totalDivText;
        if (isTravel) actionsDiv.style.width = "100%";
        actionOptionsTown[action.townNum].appendChild(actionsDiv);

        if (action.storyReqs !== undefined) {
            let storyTooltipText = "";
            let lastInBranch = false;
            const storyAmt = _txt(`actions>${action.name.toLowerCase().replace(/ /gu, "_")}`, "fallback").split("⮀").length - 1;
            for (let i = 1; i <= storyAmt; i++) {
                if (_txt(`actions>${action.name.toLowerCase().replace(/ /gu, "_")}>story_${i}`) === undefined) console.log(`actions>${action.name.toLowerCase().replace(/ /gu, "_")}>story_${i}`);
                const storyText = _txt(`actions>${action.name.toLowerCase().replace(/ /gu, "_")}>story_${i}`, "fallback").split("⮀");
                if (action.storyReqs(i)) {
                    storyTooltipText += storyText[0] + storyText[1];
                    lastInBranch = false;
                } else if (lastInBranch) {
                    storyTooltipText += "<b>???:</b> ???";
                } else {
                    storyTooltipText += `${storyText[0]} ???`;
                    lastInBranch = true;
                }
                storyTooltipText += "<br>";
            }
    
            const storyDivText =
                `<div id='storyContainer${action.varName}' class='storyContainer showthat' draggable='false' onmouseover='hideNotification("storyContainer${action.varName}")'>${action.label}
                    <br>
                    <div style='position:relative'>
                        <img src='img/${camelize(action.name)}.svg' class='superLargeIcon' draggable='false'>
                        <div id='storyContainer${action.varName}Notification' class='notification storyNotification'></div>
                    </div>
                    <div class='showthisstory' draggable='false'>
                        ${storyTooltipText}
                    </div>
                </div>`;
    
            const storyDiv = document.createElement("div");
            storyDiv.innerHTML = storyDivText;
            actionStoriesTown[action.townNum].appendChild(storyDiv);
        }
    };

    this.updateAction = function(action) {
        if (action === undefined) return
        let container = document.getElementById(`container${action}`);
        this.adjustTooltipPosition(container.querySelector("div.showthis"));
    }

    this.adjustManaCost = function(actionName) {
        const action = translateClassNames(actionName);
        document.getElementById(`manaCost${action.varName}`).textContent = formatNumber(action.manaCost());
    };

    this.adjustExpMult = function(actionName) {
        const action = translateClassNames(actionName);
        document.getElementById(`expMult${action.varName}`).textContent = formatNumber(action.expMult * 100);
    };

    this.goldCosts = {};

    this.adjustGoldCost = function(updateInfo) {
        const varName = updateInfo.varName;
        const amount = updateInfo.cost;
        if (this.goldCosts[varName] !== amount) {
            document.getElementById(`goldCost${varName}`).textContent = formatNumber(amount);
            this.goldCosts[varName] = amount;
        }
    };
    this.adjustGoldCosts = function() {
        for (const action of actionsWithGoldCost) {
            this.adjustGoldCost({varName: action.varName, cost: action.goldCost()});
        }
    };
    this.adjustExpGain = function(action) {
        for (const skill in action.skills) {
            if (Number.isInteger(action.skills[skill])) document.getElementById(`expGain${action.varName}${skill}`).textContent = ` ${action.skills[skill].toFixed(0)}`;
            else document.getElementById(`expGain${action.varName}${skill}`).textContent = ` ${action.skills[skill]().toFixed(0)}`;
        }
    };
    this.adjustExpGains = function() {
        for (const action of totalActionList) {
            if (action.skills) this.adjustExpGain(action);
        }
    };

    this.createTownInfo = function(action) {
        const totalInfoText =
            // important that there be 8 element children of townInfoContainer (excluding the showthis popup)
            `<div class='townInfoContainer showthat'>
                <div class='bold townLabel'>${action.labelDone}</div>
                <div class='numeric goodTemp' id='goodTemp${action.varName}'>0</div> <i class='fa fa-arrow-left'></i>
                <div class='numeric good' id='good${action.varName}'>0</div> <i class='fa fa-arrow-left'></i>
                <div class='numeric unchecked' id='unchecked${action.varName}'>0</div>
                <input type='checkbox' id='searchToggler${action.varName}' style='margin-left:10px;'>
                <label for='searchToggler${action.varName}'> Lootable first</label>
                <div class='showthis'>${action.infoText()}</div>
            </div><br>`;

        const infoDiv = document.createElement("div");
        infoDiv.className = "townContainer infoType";
        infoDiv.id = `infoContainer${action.varName}`;
        infoDiv.style.display = "";
        infoDiv.innerHTML = totalInfoText;
        townInfos[action.townNum].appendChild(infoDiv);
    };

    this.createMultiPartPBar = function(action) {
        let pbars = "";
        const width = `style='width:calc(${91 / action.segments}% - 4px)'`;
        const varName = action.varName;
        for (let i = 0; i < action.segments; i++) {
            pbars += `<div class='thickProgressBar showthat' ${width}>
                        <div id='expBar${i}${varName}' class='segmentBar'></div>
                        <div class='showthis' id='tooltip${i}${varName}'>
                            <div id='segmentName${i}${varName}'></div><br>
                            <div class='bold'>Main Stat</div> <div id='mainStat${i}${varName}'></div><br>
                            <div class='bold'>Progress</div> <div id='progress${i}${varName}'></div> / <div id='progressNeeded${i}${varName}'></div>
                        </div>
                    </div>`;
        }
        const completedTooltip = action.completedTooltip ? action.completedTooltip() : "";
        let mouseOver = "";
        if (varName === "SDungeon") mouseOver = "onmouseover='view.showDungeon(0)' onmouseout='view.showDungeon(undefined)'";
        else if (varName === "LDungeon") mouseOver = "onmouseover='view.showDungeon(1)' onmouseout='view.showDungeon(undefined)'";
        else if (varName === "TheSpire") mouseOver = "onmouseover='view.showDungeon(2)' onmouseout='view.showDungeon(undefined)'";
        const totalDivText =
            `<div class='townStatContainer' id='infoContainer${varName}'>
                <div class='multipartLabel'>
                    <div class='flexMargin'></div>
                    <div class='bold townLabel' id='multiPartName${varName}'></div>
                    <div class='completedInfo showthat' ${mouseOver}>
                        <div class='bold'>${action.labelDone}</div>
                        <div id='completed${varName}'></div>
                        ${completedTooltip === "" ? "" : `<div class='showthis' id='completedContainer${varName}'>
                            ${completedTooltip}
                        </div>`}
                    </div>
                    <div class='flexMargin'></div>
                </div>
                <div class='multipartBars'>
                    ${pbars}
                </div>
            </div>`;

        const progressDiv = document.createElement("div");
        progressDiv.className = "townContainer multipartType";
        progressDiv.style.display = "";
        progressDiv.innerHTML = totalDivText;
        townInfos[action.townNum].appendChild(progressDiv);
    };

    this.updateMultiPartActions = function() {
        for (const action of totalActionList) {
            if (action.type === "multipart") {
                this.updateMultiPart(action);
                this.updateMultiPartSegments(action);
            }
        }
    };
    
    this.updateMultiPartSegments = function(action) {
        let segment = 0;
        let curProgress = towns[action.townNum][action.varName];
        // update previous segments
        let loopCost = action.loopCost(segment);
        while (curProgress >= loopCost && segment < action.segments) {
            document.getElementById(`expBar${segment}${action.varName}`).style.width = "0px";
            const roundedLoopCost = intToStringRound(loopCost);
            if (document.getElementById(`progress${segment}${action.varName}`).textContent !== roundedLoopCost) {
                document.getElementById(`progress${segment}${action.varName}`).textContent = roundedLoopCost;
                document.getElementById(`progressNeeded${segment}${action.varName}`).textContent = roundedLoopCost;
            }

            curProgress -= loopCost;
            segment++;
            loopCost = action.loopCost(segment);
        }

        // update current segments
        if (document.getElementById(`progress${segment}${action.varName}`)) {
            document.getElementById(`expBar${segment}${action.varName}`).style.width = `${100 - 100 * curProgress / loopCost}%`;
            document.getElementById(`progress${segment}${action.varName}`).textContent = intToStringRound(curProgress);
            document.getElementById(`progressNeeded${segment}${action.varName}`).textContent = intToStringRound(loopCost);
        }

        // update later segments
        for (let i = segment + 1; i < action.segments; i++) {
            document.getElementById(`expBar${i}${action.varName}`).style.width = "100%";
            if (document.getElementById(`progress${i}${action.varName}`).textContent !== "0") {
                document.getElementById(`progress${i}${action.varName}`).textContent = "0";
            }
            document.getElementById(`progressNeeded${i}${action.varName}`).textContent = intToStringRound(action.loopCost(i));
        }
    };

    this.showDungeon = function(index) {
        dungeonShowing = index;
        if (index !== undefined) this.updateSoulstoneChance(index);
    };

    this.updateSoulstoneChance = function(index) {
        const dungeon = dungeons[index];
        for (let i = 0; i < dungeon.length; i++) {
            const level = dungeon[i];
            document.getElementById(`soulstoneChance${index}_${i}`).textContent = intToString(level.ssChance * 100, 4);
            document.getElementById(`soulstonePrevious${index}_${i}`).textContent = level.lastStat;
            document.getElementById(`soulstoneCompleted${index}_${i}`).textContent = formatNumber(level.completed);
        }
    };

    this.updateTrials = function() {
        for(let i = 0; i < trials.length; i++)
        {
            this.updateTrialInfo({trialNum: i, curFloor: 0});
        }
    };

    this.updateTrialInfo = function(updateInfo) {
        const curFloor = updateInfo.curFloor;
        const trialNum = updateInfo.trialNum;
        const trial = trials[trialNum];
            document.getElementById(`trial${trialNum}HighestFloor`).textContent = trial.highestFloor + 1;
            if (curFloor >= trial.length) {
                document.getElementById(`trial${trialNum}CurFloor`).textContent = "";
                document.getElementById(`trial${trialNum}CurFloorCompleted`).textContent = "";
            }
            else {
                document.getElementById(`trial${trialNum}CurFloor`).textContent = "" + (curFloor + 1);
                document.getElementById(`trial${trialNum}CurFloorCompleted`).textContent = trial[curFloor].completed;
            }
            if (curFloor > 0) {
                document.getElementById(`trial${trialNum}LastFloor`).textContent = curFloor;
                document.getElementById(`trial${trialNum}LastFloorCompleted`).textContent = trial[curFloor - 1].completed;
            }
    };

    this.updateSoulstones = function() {
        for (const stat of statList) {
            if (stats[stat].soulstone) {
                document.getElementById(`ss${stat}Container`).style.display = "inline-block";
                document.getElementById(`ss${stat}`).textContent = intToString(stats[stat].soulstone, 1);
                document.getElementById(`stat${stat}SSBonus`).textContent = intToString(stats[stat].soulstone ? stats[stat].soulstoneMult : 0);
                document.getElementById(`stat${stat}ss`).textContent = intToString(stats[stat].soulstone, 1);
            } else {
                document.getElementById(`ss${stat}Container`).style.display = "none";
                document.getElementById(`stat${stat}ss`).textContent = "";
            }
        }
    };

    this.updateMultiPart = function(action) {
        const town = towns[action.townNum];
        document.getElementById(`multiPartName${action.varName}`).textContent = action.getPartName();
        document.getElementById(`completed${action.varName}`).textContent = ` ${formatNumber(town[`total${action.varName}`])}`;
        for (let i = 0; i < action.segments; i++) {
            const expBar = document.getElementById(`expBar${i}${action.varName}`);
            if (!expBar) {
                continue;
            }
            const mainStat = action.loopStats[(town[`${action.varName}LoopCounter`] + i) % action.loopStats.length];
            document.getElementById(`mainStat${i}${action.varName}`).textContent = _txt(`stats>${mainStat}>short_form`);
            addStatColors(expBar, mainStat);
            document.getElementById(`segmentName${i}${action.varName}`).textContent = action.getSegmentName(town[`${action.varName}LoopCounter`] + i);
        }
    };

    this.updateTrainingLimits = function() {
        for (let i = 0; i < statList.length; i++) {
            const trainingDiv = document.getElementById(`trainingLimit${statList[i]}`);
            if (trainingDiv) {
                trainingDiv.textContent = trainingLimits;
            }
        }
        if (getBuffLevel("Imbuement") > 0 || getBuffLevel("Imbuement3") > 0) document.getElementById("maxTraining").style.display = "";
    };

    // when you mouseover Story
    this.updateStory = function(num) {
        document.getElementById("newStory").style.display = "none";
        if (num <= 0) {
            num = 0;
            document.getElementById("storyLeft").style.visibility = "hidden";
        } else {
            document.getElementById("storyLeft").style.visibility = "";
        }

        if (num >= storyMax) {
            num = storyMax;
            document.getElementById("storyRight").style.visibility = "hidden";
        } else {
            document.getElementById("storyRight").style.visibility = "";
        }
        //Hard coded story count - need to fix this
        for (let i = 0; i <= 12; i++) {
            const storyDiv = document.getElementById(`story${i}`);
            if (storyDiv) {
                storyDiv.style.display = "none";
            }
        }
        storyShowing = num;
        document.getElementById("storyPage").textContent = storyShowing + 1;
        document.getElementById(`story${num}`).style.display = "inline-block";
    };

    this.changeStatView = function() {
        const statsWindow = document.getElementById("statsWindow");
        if (document.getElementById("regularStats").checked) {
            statsWindow.dataset.view = "regular";
            document.getElementById("statsColumn").style.width = "316px";
        } else {
            statsWindow.dataset.view = "radar";
            document.getElementById("statsColumn").style.width = "410px";
            statGraph.update();
        }
    };

    this.changeTheme = function(init) {
        const themeInput = document.getElementById("themeInput");
        const themeVariantInput = document.getElementById("themeVariantInput");
        if (init) themeInput.value = options.theme;
        if (init) themeVariantInput.value = options.themeVariant;
        options.theme = themeInput.value;
        options.themeVariant = themeVariantInput.value;
        const variants = $(themeVariantInput).find(`.variant-${options.theme.replaceAll(" ","_")}`);
        if (variants.length) {
            document.getElementById("themeVariantSection").style.display = "";
            $(themeVariantInput).find("option").css("display", "none");
            variants.css("display", "");
        } else {
            document.getElementById("themeVariantSection").style.display = "none";
        }
        document.getElementById("theBody").className = `t-${options.theme} ${options.themeVariant}`;
        localStorage["latestTheme"] = `${options.theme} ${options.themeVariant}`;
    };

    this.createTravelMenu = function() {
        let travelMenu = $("#TownSelect");
        travelMenu.empty()
        townNames.forEach((town, index) => {
            travelMenu.append("<option value="+index+" hidden=''>"+town+"</option>");
        });
        travelMenu.change(function() {
            view.showTown(Number($(this).val()));
        });
        this.updateTravelMenu()
    }

    this.updateTravelMenu = function() {
        let travelOptions = $("#TownSelect").children();
        for (let i=0;i<travelOptions.length;i++) {
            travelOptions[i].hidden=(!townsUnlocked.includes(i));
        }
    }

    this.adjustDarkRitualText = function() {
        let DRdesc = document.getElementById("DRText");
        DRdesc.innerHTML = `Actions are:<br>`;
        townsUnlocked.forEach(townNum => {
            DRdesc.innerHTML += DarkRitualDescription[townNum];
        });
        if(getBuffLevel("Ritual") > 200) DRdesc.innerHTML += DarkRitualDescription[9];
    }

    this.highlightIncompleteActions = function() {
        let actionDivs = Array.from(document.getElementsByClassName("actionContainer"));
        actionDivs.forEach(div => {
            let actionName = div.id.replace("container","");
            if (!completedActions.includes(actionName))
                div.classList.add("actionHighlight");
        });
    }

    this.removeAllHighlights = function() {
        let actionDivs = Array.from(document.getElementsByClassName("actionHighlight"));
        actionDivs.forEach(div => {
            div.classList.remove("actionHighlight");
        });
    }

    this.updateTotals = function() {
        document.getElementById('totalPlaytime').textContent = `${formatTime(totals.time)}`;
        document.getElementById('totalEffectiveTime').textContent = `${formatTime(totals.effectiveTime)}`;
        document.getElementById('borrowedTimeBalance').textContent = formatTime(totals.borrowedTime);
        document.getElementById('borrowedTimeDays').textContent = `${formatNumber(Math.floor(totals.borrowedTime / 86400))}${_txt("time_controls>days")}`;
        document.getElementById('totalLoops').textContent = `${formatNumber(totals.loops)}`;
        document.getElementById('totalActions').textContent = `${formatNumber(totals.actions)}`;
        if (totals.borrowedTime > 0) document.documentElement.classList.add("time-borrowed");
        else document.documentElement.classList.remove("time-borrowed");
    }

    this.updatePrestigeValues = function() {
        document.getElementById('currentPrestigePoints').textContent = `${formatNumber(prestigeValues["prestigeCurrentPoints"])}`;
        document.getElementById('currentPrestigesCompleted').textContent = `${formatNumber(prestigeValues["prestigeTotalCompletions"])}`;
        // document.getElementById('maxTotalImbueSoulLevels').textContent = `${formatNumber(prestigeValues["prestigeTotalCompletions"])}`;
        document.getElementById('maxTotalImbueSoulLevels').textContent = `${formatNumber(Math.floor(prestigeValues["prestigeTotalCompletions"], 7))}`;

        document.getElementById('totalPrestigePoints').textContent = `${formatNumber(prestigeValues["prestigeTotalPoints"])}`;

        document.getElementById('prestigePhysicalCurrentBonus').textContent = `${formatNumber(getPrestigeCurrentBonus("PrestigePhysical", PRESTIGE_PHYSICAL_BASE))}`;
        document.getElementById('prestigeMentalCurrentBonus').textContent = `${formatNumber(getPrestigeCurrentBonus("PrestigeMental", PRESTIGE_MENTAL_BASE))}`;
        document.getElementById('prestigeCombatCurrentBonus').textContent = `${formatNumber(getPrestigeCurrentBonus("PrestigeCombat", PRESTIGE_COMBAT_BASE))}`;
        document.getElementById('prestigeSpatiomancyCurrentBonus').textContent = `${formatNumber(getPrestigeCurrentBonus("PrestigeSpatiomancy", PRESTIGE_SPATIOMANCY_BASE))}`;
        document.getElementById('prestigeChronomancyCurrentBonus').textContent = `${formatNumber(getPrestigeCurrentBonus("PrestigeChronomancy", PRESTIGE_CHRONOMANCY_BASE))}`;
        document.getElementById('prestigeBarteringCurrentBonus').textContent = `${formatNumber(getPrestigeCurrentBonus("PrestigeBartering", PRESTIGE_BARTERING_BASE))}`;
        document.getElementById('prestigeExpOverflowCurrentBonus').textContent = `${formatNumber(getPrestigeCurrentBonus("PrestigeExpOverflow", PRESTIGE_EXP_OVERFLOW_BASE) * 10)}`;

        document.getElementById('prestigePhysicalNextCost').textContent = `${formatNumber(getPrestigeCost("PrestigePhysical"))}`;
        document.getElementById('prestigeMentalNextCost').textContent = `${formatNumber(getPrestigeCost("PrestigeMental"))}`;
        document.getElementById('prestigeCombatNextCost').textContent = `${formatNumber(getPrestigeCost("PrestigeCombat"))}`;
        document.getElementById('prestigeSpatiomancyNextCost').textContent = `${formatNumber(getPrestigeCost("PrestigeSpatiomancy"))}`;
        document.getElementById('prestigeChronomancyNextCost').textContent = `${formatNumber(getPrestigeCost("PrestigeChronomancy"))}`;
        document.getElementById('prestigeBarteringNextCost').textContent = `${formatNumber(getPrestigeCost("PrestigeBartering"))}`;
        document.getElementById('prestigeExpOverflowNextCost').textContent = `${formatNumber(getPrestigeCost("PrestigeExpOverflow"))}`;        
    }
}

function startRenameCloudSave(fileId) {
    const li = document.getElementById(`cloud_save_${fileId}`);
    const nameInput = li?.querySelector(".cloud_save_name");
    if (!nameInput) return;
    if (nameInput instanceof HTMLInputElement) {
        if (!nameInput.value || nameInput.value === li.dataset.fileName) {
            const div = document.createElement("div");
            div.className = nameInput.className;
            div.textContent = li.dataset.fileName;
            div.title = li.dataset.fileName;
            li.replaceChild(div, nameInput);
        } else {
            googleCloud.renameFile(fileId, nameInput.value);
        }
    } else {
        const input = document.createElement("input");
        input.className = nameInput.className;
        input.style.width = `${nameInput.clientWidth}px`;
        input.value = li.dataset.fileName;
        input.onkeydown = (e) => e.key === "Enter" && startRenameCloudSave(fileId) || true;
        li.replaceChild(input, nameInput);
        input.focus();
    }
}

async function askDeleteCloudSave(fileId) {
    const li = document.getElementById(`cloud_save_${fileId}`);
    const button = li?.querySelector(".button.cloud_delete");
    if (!button) return;
    if (button.classList.contains("warning")) {
        googleCloud.deleteFile(fileId);
    } else {
        button.textContent = _txt("menu>save>confirm_button");
        button.classList.add("warning");
        await delay(3000);
        button.classList.remove("warning");
        button.textContent = _txt("menu>save>delete_button");
    }
}

function unlockGlobalStory(num) {
    if (num > storyMax) {
        document.getElementById("newStory").style.display = "inline-block";
        storyMax = num;
        view.requestUpdate("updateGlobalStory", num);
    }
}

function unlockStory(name) {
    if (!storyReqs[name]) {
        storyReqs[name] = true;
        if (options.actionLog) view.requestUpdate("updateStories", false);
    }
}

function scrollToPanel(event, target) {
    event.preventDefault();
    const element = document.getElementById(target);
    const main = document.getElementById("main");

    if (element instanceof HTMLElement && main) {
        main.scroll({
            behavior: "smooth",
            left: element.offsetLeft,
        });
    }

    return false;
}

const curActionsDiv = document.getElementById("curActionsList");
const nextActionsDiv = document.getElementById("nextActionsList");
const actionOptionsTown = [];
const actionStoriesTown = [];
const townInfos = [];
for (let i = 0; i <= 8; i++) {
    actionOptionsTown[i] = document.getElementById(`actionOptionsTown${i}`);
    actionStoriesTown[i] = document.getElementById(`actionStoriesTown${i}`);
    townInfos[i] = document.getElementById(`townInfo${i}`);
}

function addStatColors(theDiv, stat) {
    if (stat === "Str") {
        theDiv.style.backgroundColor = "var(--stat-str-color)";
    } else if (stat === "Dex") {
        theDiv.style.backgroundColor = "var(--stat-dex-color)";
    } else if (stat === "Con") {
        theDiv.style.backgroundColor = "var(--stat-con-color)";
    } else if (stat === "Per") {
        theDiv.style.backgroundColor = "var(--stat-per-color)";
    } else if (stat === "Int") {
        theDiv.style.backgroundColor = "var(--stat-int-color)";
    } else if (stat === "Cha") {
        theDiv.style.backgroundColor = "var(--stat-cha-color)";
    } else if (stat === "Spd") {
        theDiv.style.backgroundColor = "var(--stat-spd-color)";
    } else if (stat === "Luck") {
        theDiv.style.backgroundColor = "var(--stat-luck-color)";
    } else if (stat === "Soul") {
        theDiv.style.backgroundColor = "var(--stat-soul-color)";
    }
}

function dragOverDecorate(i) {
    if (document.getElementById(`nextActionContainer${i}`)) document.getElementById(`nextActionContainer${i}`).classList.add("draggedOverAction");
}

function dragExitUndecorate(i) {
    if (document.getElementById(`nextActionContainer${i}`)) document.getElementById(`nextActionContainer${i}`).classList.remove("draggedOverAction");
}

function draggedDecorate(i) {
    if (document.getElementById(`nextActionContainer${i}`)) document.getElementById(`nextActionContainer${i}`).classList.add("draggedAction");
}

function draggedUndecorate(i) {
    if (document.getElementById(`nextActionContainer${i}`)) document.getElementById(`nextActionContainer${i}`).classList.remove("draggedAction");
    showActionIcons();
}

function adjustActionListSize(amt) {
    if (document.getElementById("expandableList").style.height === "" && amt > 0) {
        document.getElementById("expandableList").style.height = `${500 + amt}px`;
        curActionsDiv.style.maxHeight = `${457 + amt}px`;
        nextActionsDiv.style.maxHeight = `${457 + amt}px`;
    } else if (document.getElementById("expandableList").style.height === "" && amt === -100) {
        document.getElementById("expandableList").style.height = "500px";
        curActionsDiv.style.maxHeight = "457px";
        nextActionsDiv.style.maxHeight = "457px";
    } else {
        document.getElementById("expandableList").style.height = `${Math.min(Math.max(parseInt(document.getElementById("expandableList").style.height) + amt, 500), 2000)}px`;
        curActionsDiv.style.maxHeight = `${Math.min(Math.max(parseInt(curActionsDiv.style.maxHeight) + amt, 457), 1957)}px`;
        nextActionsDiv.style.maxHeight = `${Math.min(Math.max(parseInt(nextActionsDiv.style.maxHeight) + amt, 457), 1957)}px`;
    }
    setScreenSize();
    saveUISettings();
}

function updateBuffCaps() {
    for (const buff of buffList) {
        document.getElementById(`buff${buff}Cap`).value = Math.min(parseInt(document.getElementById(`buff${buff}Cap`).value), buffHardCaps[buff]);
        buffCaps[buff] = parseInt(document.getElementById(`buff${buff}Cap`).value);
    }
}

function setScreenSize() {
    screenSize = document.body.scrollHeight;
}

//Attempts at getting divs to stay on screen, but can't figure it out still
function clampDivs() {
    let tooltips = Array.from(document.getElementsByClassName("showthis"));
    let test = document.getElementById("radarStats");
    console.log(screenSize);
    tooltips.forEach(tooltip => {
        var offsets = cumulativeOffset(tooltip);
        if (offsets.top != 0) console.log("Top: " + offsets.top + ". Height: " + tooltip.clientHeight + ". Total: " + (offsets.top + tooltip.clientHeight) + ". Screensize: " + screenSize);
        if (offsets.top < 0) console.log("Offscreen - top");
        if (offsets.top + tooltip.clientHeight > screenSize) tooltip.style.top = -100 + 'px';
    });
}

function cumulativeOffset(element) {
    var top = 0, bottom = 0;
    do {
        top += element.offsetTop  || 0;
        bottom += element.offsetBottom || 0;
        element = element.offsetParent;
    } while(element);

    return {
        top: top,
        bottom: bottom
    };
}

const DarkRitualDescription = [
    `10% faster in Beginnersville per ritual from 1-20<br>`,
    `5% faster in the Forest Path per ritual from 21-40<br>`,
    `2.5% faster in Merchanton per ritual from 41-60<br>`,
    `1.5% faster in Mt. Olympus per ritual from 61-80<br>`,
    `1.0% faster in Valhalla per ritual from 81-100<br>`,
    `0.5% faster in Startington per ritual from 101-150<br>`,
    `0.5% faster in Jungle Path per ritual from 151-200<br>`,
    `0.5% faster in Commerceville per ritual from 201-250<br>`,
    `0.5% faster in Valley of Olympus per ritual from 251-300<br>`,
    `0.1% faster globally per ritual from 301-666`];
