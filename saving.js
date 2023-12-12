function startGame() {
    // load calls recalcInterval, which will start the callbacks
    load();
    setScreenSize();
}

function cheat() {
    if (gameSpeed === 1) gameSpeed = 20;
    else gameSpeed = 1;
}

function cheatBonus()
{
    totalOfflineMs = 1000000000000000;
}

function cheatSurvey()
{
    for(i= 0; i<9; i++)
    {
        varName = "SurveyZ" + i
        towns[i][`exp${varName}`] = 505000;
        view.updateProgressAction({name: varName, town: towns[i]});
    }
}

function cheatProgress()
{
    for (const action of totalActionList)
    {
        if (action.type == "progress")
        {
            towns[action.townNum][`exp${action.varName}`] = 505000;
            view.updateProgressAction({name: action.varName, town: towns[action.townNum]});
        }
    }
    stonesUsed = {1:250, 3:250, 5:250, 6:250};
}

function cheatTalent(stat, targetTalentLevel)
{
    if (stat === "all" || stat === "All")
        for (const stat in stats)
        stats[stat].talent = getExpOfLevel(targetTalentLevel);
    else stats[stat].talent = getExpOfLevel(targetTalentLevel);
    view.updateStats();
}

function cheatSoulstone(stat, targetSS)
{
    if (stat === "all" || stat === "All")
        for (const stat in stats)
            stats[stat].soulstone = targetSS;
    else stats[stat].soulstone = targetSS;
    view.updateSoulstones();
}

function cheatSkill(skill, targetSkillLevel)
{
    if (skill === "all" || skill === "All")
        for (const skill in skills)
            skill[skill].exp = getExpOfLevel(targetSkillLevel);
    else skills[skill].exp = getExpOfLevel(targetSkillLevel);
    view.updateSkills();
}


let mainTickLoop;
const defaultSaveName = "idleLoops1";
const challengeSaveName = "idleLoopsChallenge";
let saveName = defaultSaveName;

// this is to hide the cheat button if you aren't supposed to cheat
if (window.location.href.includes("http://127.0.0.2:8080")) document.getElementById("cheat").style.display = "inline-block";

const timeNeededInitial = 5 * 50;
// eslint-disable-next-line prefer-const
let timer = timeNeededInitial;
// eslint-disable-next-line prefer-const
let timeNeeded = timeNeededInitial;
// eslint-disable-next-line prefer-const
let stop = false;
const view = new View();
const actions = new Actions();
const actionLog = new ActionLog();
const towns = [];
// eslint-disable-next-line prefer-const
let curTown = 0;


const statList = /** @type {const} */(["Dex", "Str", "Con", "Spd", "Per", "Cha", "Int", "Luck", "Soul"]);
/** @type {{[K in typeof statList[number]]?: {exp: number, talent: number, soulstone: number}}} */
const stats = {};
let totalTalent = 0;
// eslint-disable-next-line prefer-const
let shouldRestart = true;

// let prestigeValues = {};

// let prestigeCurrentPoints = 0;
// let prestigeTotalPoints = 0;
// let completedCurrentPrestige = false;
// let completedAnyPrestige = true; // Set to false once method is setup to complete Current game

// eslint-disable-next-line prefer-const
let resources = {
    gold: 0,
    reputation: 0,
    herbs: 0,
    hide: 0,
    potions: 0,
    teamMembers: 0,
    armor: 0,
    blood: 0,
    artifacts: 0,
    favors: 0,
    enchantments: 0,
    houses: 0,
    pylons: 0,
    zombie: 0,
    map: 0,
    completedMap: 0,
    heart: 0,
    power: 0,
    glasses: false,
    supplies: false,
    pickaxe: false,
    loopingPotion: false,
    citizenship: false,
    pegasus: false,
    key: false,
    stone: false
};
let hearts = [];
const resourcesTemplate = copyObject(resources);
//Temp variables
// eslint-disable-next-line prefer-const
let guild = "";
let escapeStarted = false;
let portalUsed = false;
let stoneLoc = 0;

let curLoadout = 0;
let loadouts;
let loadoutnames;
//let loadoutnames = ["1", "2", "3", "4", "5"];
const skillList = /** @type {const} */(["Combat", "Magic", "Practical", "Alchemy", "Crafting", "Dark", "Chronomancy", "Pyromancy", "Restoration", "Spatiomancy", "Mercantilism", "Divine", "Commune", "Wunderkind", "Gluttony", "Thievery", "Leadership", "Assassin"]);
/** @type {{[K in typeof skillList[number]]?: {exp: number}}} */
const skills = {};
const buffList = /** @type {const} */(["Ritual", 
    "Imbuement", 
    "Imbuement2", 
    "Feast", 
    "Aspirant", 
    "Heroism", 
    "Imbuement3",
    "PrestigePhysical",
    "PrestigeMental",
    "PrestigeCombat",
    "PrestigeSpatiomancy",
    "PrestigeChronomancy",
    "PrestigeBartering",
    "PrestigeExpOverflow"
]);

const dungeonFloors = [6, 9, 20];
const trialFloors = [50, 100, 7, 1000, 25];
const buffHardCaps = {
    Ritual: 666,
    Imbuement: 500,
    Imbuement2: 500,
    Imbuement3: 7,
    Feast: 100,
    Aspirant: 20,
    Heroism: 50,
    PrestigePhysical: 100,
    PrestigeMental: 100,
    PrestigeCombat: 100,
    PrestigeSpatiomancy: 100,
    PrestigeChronomancy: 100,
    PrestigeBartering: 100,
    PrestigeExpOverflow: 100
};
const buffCaps = {
    Ritual: 666,
    Imbuement: 500,
    Imbuement2: 500,
    Imbuement3: 7,
    Feast: 100,
    Aspirant: 20,
    Heroism: 50,
    PrestigePhysical: 100,
    PrestigeMental: 100,
    PrestigeCombat: 100,
    PrestigeSpatiomancy: 100,
    PrestigeChronomancy: 100,
    PrestigeBartering: 100,
    PrestigeExpOverflow: 100
};
/** @type {{[K in typeof buffList[number]]?: {amt: number}}} */
const buffs = {};
const prestigeValues = {};
let goldInvested = 0;
let stonesUsed;
// eslint-disable-next-line prefer-const
let townShowing = 0;
// eslint-disable-next-line prefer-const
let actionStoriesShowing = false;
let townsUnlocked = [];
let completedActions = [];
let statShowing;
let skillShowing;
let buffShowing;
let curActionShowing;
let dungeonShowing;
let actionTownNum;
let trainingLimits = 10;
let storyShowing = 0;
let storyMax = 0;
let unreadActionStories;
const storyReqs = {
    maxSQuestsInALoop: false,
    realMaxSQuestsInALoop: false,
    maxLQuestsInALoop: false,
    realMaxLQuestsInALoop: false,
    heal10PatientsInALoop: false,
    failedHeal: false,
    clearSDungeon: false,
    haggle: false,
    haggle15TimesInALoop: false,
    haggle16TimesInALoop: false,
    glassesBought: false,
    partyThrown: false,
    partyThrown2: false,
    strengthTrained: false,
    suppliesBought: false,
    suppliesBoughtWithoutHaggling: false,
    smallDungeonAttempted: false,
    satByWaterfall: false,
    dexterityTrained: false,
    speedTrained: false,
    birdsWatched: false,
    darkRitualThirdSegmentReached: false,
    brewed50PotionsInALoop: false,
    failedBrewPotions: false,
    failedBrewPotionsNegativeRep: false,
    potionBrewed: false,
    failedGamble: false,
    failedGambleLowMoney: false,
    potionSold: false,
    sell20PotionsInALoop: false,
    sellPotionFor100Gold: false,
    sellPotionFor1kGold: false,
    manaZ3Bought:false,
    advGuildTestsTaken: false,
    advGuildRankEReached: false,
    advGuildRankDReached: false,
    advGuildRankCReached: false,
    advGuildRankBReached: false,
    advGuildRankAReached: false,
    advGuildRankSReached: false,
    advGuildRankUReached: false,
    advGuildRankGodlikeReached: false,
    teammateGathered: false,
    fullParty: false,
    failedGatherTeam: false,
    largeDungeonAttempted: false,
    clearLDungeon: false,
    craftGuildTestsTaken: false,
    craftGuildRankEReached: false,
    craftGuildRankDReached: false,
    craftGuildRankCReached: false,
    craftGuildRankBReached: false,
    craftGuildRankAReached: false,
    craftGuildRankSReached: false,
    craftGuildRankUReached: false,
    craftGuildRankGodlikeReached: false,
    armorCrafted: false,
    craft10Armor: false,
    craft20Armor: false,
    failedCraftArmor: false,
    booksRead: false,
    pickaxeBought: false,
    heroTrial1Done: false,
    heroTrial10Done: false,
    heroTrial25Done: false,
    heroTrial50Done: false,
    charonPaid: false,
    loopingPotionMade: false,
    slay6TrollsInALoop: false,
    slay20TrollsInALoop: false,
    imbueMindThirdSegmentReached: false,
    imbueBodyThirdSegmentReached: false,
    failedImbueBody: false,
    judgementFaced: false,
    acceptedIntoValhalla: false,
    castIntoShadowRealm: false,
    spokeToGuru: false,
    fellFromGrace: false,
    donatedToCharity: false,
    receivedDonation: false,
    failedReceivedDonations: false,
    tidiedUp: false,
    tidiedUp1Time: false,
    tidiedUp6Times: false,
    tidiedUp20Times: false,
    manaZ5Bought: false,
    artifactSold: false,
    artifactDonated: false,
    donated20Artifacts: false,
    donated40Artifacts: false,
    charmSchoolVisited: false,
    oracleVisited: false,
    armorEnchanted: false,
    enchanted10Armor: false,
    enchanted20Armor: false,
    wizardGuildTestTaken: false,
    wizardGuildRankEReached: false,
    wizardGuildRankDReached: false,
    wizardGuildRankCReached: false,
    wizardGuildRankBReached: false,
    wizardGuildRankAReached: false,
    wizardGuildRankSReached: false,
    wizardGuildRankSSReached: false,
    wizardGuildRankSSSReached: false,
    wizardGuildRankUReached: false,
    wizardGuildRankGodlikeReached: false,
    repeatedCitizenExam: false,
    houseBuilt: false,
    housesBuiltGodlike: false,
    built50Houses: false,
    collectedTaxes: false,
    collected50Taxes: false,
    acquiredPegasus: false,
    acquiredPegasusWithTeam: false,
    giantGuildTestTaken: false,
    giantGuildRankDReached: false,
    giantGuildRankCReached: false,
    giantGuildRankEReached: false,
    giantGuildRankBReached: false,
    giantGuildRankAReached: false,
    giantGuildRankSReached: false,
    giantGuildRankSSReached: false,
    giantGuildRankSSSReached: false,
    giantGuildRankUReached: false,
    giantGuildRankGodlikeReached: false,
    blessingSought: false,
    greatBlessingSought: false,
    feastAttempted: false,
    wellDrawn: false,
    drew10Wells: false,
    drew15Wells: false,
    drewDryWell: false,
    attemptedRaiseZombie: false,
    failedRaiseZombie: false,
    spireAttempted: false,
    clearedSpire: false,
    spire10Pylons: false,
    spire20Pylons: false,
    suppliesPurchased: false,
    deadTrial1Done: false,
    deadTrial10Done: false,
    deadTrial25Done: false,
    monsterGuildTestTaken: false,
    monsterGuildRankDReached: false,
    monsterGuildRankCReached: false,
    monsterGuildRankBReached: false,
    monsterGuildRankAReached: false,
    monsterGuildRankAReached: false,
    monsterGuildRankSReached: false,
    monsterGuildRankSSReached: false,
    monsterGuildRankSSSReached: false,
    monsterGuildRankUReached: false,
    monsterGuildRankGodlikeReached: false,
    survivorRescued: false,
    rescued6Survivors: false,
    rescued20Survivors: false,
    buffetHeld: false,
    buffetFor1: false,
    buffetFor6: false,
    portalOpened: false,
    excursionAsGuildmember: false,
    explorerGuildTestTaken: false,
    mapTurnedIn: false,
    thiefGuildTestsTaken: false,
    thiefGuildRankEReached: false,
    thiefGuildRankDReached: false,
    thiefGuildRankCReached: false,
    thiefGuildRankBReached: false,
    thiefGuildRankAReached: false,
    thiefGuildRankSReached: false,
    thiefGuildRankUReached: false,
    thiefGuildRankGodlikeReached: false,
    assassinHeartDelivered: false,
    assassin4HeartsDelivered: false,
    assassin8HeartsDelivered: false,
    investedOne:false,
    investedTwo:false,
    interestCollected:false,
    collected1KInterest:false,
    collected1MInterest:false,
    collectedMaxInterest:false,
    seminarAttended:false,
    leadership10:false,
    leadership100:false,
    leadership1k:false,
    keyBought:false,
    trailSecretFaced:false,
    trailSecret1Done:false,
    trailSecret10Done:false,
    trailSecret100Done:false,
    trailSecret500Done:false,
    trailSecretAllDone:false,
    soulInfusionAttempted:false,
    trailGodsFaced:false,
    trailGods10Done:false,
    trailGods20Done:false,
    trailGods30Done:false,
    trailGods40Done:false,
    trailGods50Done:false,
    trailGods60Done:false,
    trailGods70Done:false,
    trailGods80Done:false,
    trailGods90Done:false,
    trailGodsAllDone:false,
    fightGods01:false,
    fightGods02:false,
    fightGods03:false,
    fightGods04:false,
    fightGods05:false,
    fightGods06:false,
    fightGods07:false,
    fightGods08:false,
    fightGods09:false,
    fightGods10:false,
    fightGods11:false,
    fightGods12:false,
    fightGods13:false,
    fightGods14:false,
    fightGods15:false,
    fightGods16:false,
    fightGods17:false,
    fightGods18:false,
};

const curDate = new Date();
let totalOfflineMs = 0;
// eslint-disable-next-line prefer-const
let bonusSpeed = 1;
let bonusActive = false;
let currentLoop = 0;
/** @type {Action & ActionExtras} */
let currentAction = null;
const offlineRatio = 1;
let totals = {
    time: 0,
    effectiveTime: 0,
    loops: 0,
    actions: 0
};

let challengeSave = {
    challengeMode: 0,
    inChallenge: false
};

let totalMerchantMana = 7500;

// eslint-disable-next-line prefer-const
let curAdvGuildSegment = 0;
// eslint-disable-next-line prefer-const
let curCraftGuildSegment = 0;
// eslint-disable-next-line prefer-const
let curWizCollegeSegment = 0;
// eslint-disable-next-line prefer-const
let curFightFrostGiantsSegment = 0;
// eslint-disable-next-line prefer-const
let curFightJungleMonstersSegment = 0;
// eslint-disable-next-line prefer-const
let curThievesGuildSegment = 0;
// eslint-disable-next-line prefer-const
let curGodsSegment = 0;

// register all the object variables assigned in this file
Data.registerAll({
    actions,
    towns,
    stats,
    resources,
    hearts,
    skills,
    buffs,
    prestigeValues,
    townsUnlocked,
    completedActions,
    storyReqs,
    totals,
});

// If we want to be able to iterate through the scalar global variables, they have to be assigned to an object. If we want to read or write them programmatically, we have to
// be able to access a syntactic variable via indirection, which can only be done by eval (or its cousin, new Function).
// the shorthand object initializer syntax here is just an easy way to get variable names into a call.
const globalVariables = virtualizeGlobalVariables({
    timer,
    timeNeeded,
    curTown,
    totalTalent,
    shouldRestart,
    guild,
    escapeStarted,
    portalUsed,
    stoneLoc,
    goldInvested,
    stonesUsed,
    actionTownNum,
    trainingLimits,
    storyMax,
    unreadActionStories,
    totalMerchantMana,
    curAdvGuildSegment,
    curCraftGuildSegment,
    curWizCollegeSegment,
    curFightFrostGiantsSegment,
    curFightJungleMonstersSegment,
    curThievesGuildSegment,
    curGodsSegment,
});

function virtualizeGlobalVariables(variables) {
    const globals = Data.rootObjects.globals ?? {};
    for (const name in variables) {
        const get = /** @type {() => any} */(new Function(`return ${name};`));
        const set = /** @type {(any) => void} */(new Function("v__", `${name} = v__`));
        Object.defineProperty(globals, name, {
            get,
            set,
            enumerable: true,
            configurable: true,
        });
    }
    return Data.register("globals", globals);
}

/** @type {Notification} */
let pauseNotification = null;
const googleCloud = new GoogleCloud();

const options = {
    theme: "normal",
    themeVariant: "",
    responsiveUI: false,
    actionLog: true,
    fractionalMana: false,
    keepCurrentList: false,
    repeatLastAction: false,
    addActionsToTop: false,
    pauseBeforeRestart: false,
    pauseOnFailedLoop: false,
    pauseOnComplete: false,
    speedIncrease10x: false,
    speedIncrease20x: false,
    speedIncrease50x: false,
    speedIncrease100x: false,
    speedIncreaseCustom: 5,
    speedIncreaseBackground: -1,
    highlightNew: true,
    statColors: false,
    pingOnPause: false,
    notifyOnPause: false,
    autoMaxTraining: false,
    hotkeys: true,
    predictor:  false,
    googleCloud: false,
    updateRate: 50,
    autosaveRate: 30,
};

// The original forks will throw exceptions if there are unexpected properties in the options element. This list lets us
// check to see if a given option should go into "options" in the save, otherwise it belongs in "extraOptions".
/** @satisfies {{[K in keyof typeof options]: boolean}} */
const isStandardOption = {
    theme: true,
    themeVariant: false,
    responsiveUI: false,
    actionLog: false,
    fractionalMana: false,
    keepCurrentList: true,
    repeatLastAction: true,
    addActionsToTop: true,
    pauseBeforeRestart: true,
    pauseOnFailedLoop: true,
    pauseOnComplete: true,
    speedIncrease10x: true,
    speedIncrease20x: true,
    speedIncrease50x: true,
    speedIncrease100x: true,
    speedIncreaseCustom: true,
    speedIncreaseBackground: false,
    highlightNew: true,
    statColors: true,
    pingOnPause: true,
    notifyOnPause: false,
    autoMaxTraining: true,
    hotkeys: true,
    predictor: false,
    googleCloud: false,
    updateRate: true,
    autosaveRate: true,
};

/** @type {{[K in keyof typeof options]?: (value: any, init: boolean, getInput: () => HTMLInputElement) => void}} */
const optionValueHandlers = {
    notifyOnPause(value, init, getInput) {
        const input = getInput();
        if (value && !init) {
            if (Notification && Notification.permission === "default") {
                input.checked = false;
                input.indeterminate = true;
                Notification.requestPermission(_ => {
                    input.indeterminate = false;
                    input.checked = value;
                    setOption("notifyOnPause", value);
                });
            } else if (Notification && Notification.permission === "denied") {
                input.checked = false;
                input.indeterminate = false;
                alert("Notification permission denied. You may need to allow this site to send you notifications manually.");
            } else if (!Notification || Notification.permission !== "granted") {
                input.checked = false;
                input.indeterminate = false;
            }
        } else if (!value) {
            options.notifyOnPause = false;
            input.checked = false;
            input.indeterminate = false;
        }
    },
    updateRate(value, init) {
        if (!init) recalcInterval(value);
    },
    responsiveUI(value, init) {
        if (value) {
            document.documentElement.classList.add("responsive");
        } else {
            document.documentElement.classList.remove("responsive");
        }
    },
    actionLog(value, init) {
        document.getElementById("actionLogContainer").style.display = value ? "" : "none";
        document.getElementById("navbar_action_log").style.display = value ? "" : "none";
    },
    predictor(value, init) {
        localStorage["loadPredictor"] = value || "";
    },
    googleCloud(value, init, getInput) {
        if (value) {
            googleCloud.init();
            document.getElementById("cloud_save").style.display="";
        } else {
            document.getElementById("cloud_save").style.display="none";
        }
        if (!init && !value) googleCloud.revoke();
    },
    speedIncrease10x: checkExtraSpeed,
    speedIncrease20x: checkExtraSpeed,
    speedIncreaseCustom: checkExtraSpeed,
    speedIncreaseBackground(value, init) {
        checkExtraSpeed();
        if (typeof value === "number" && !isNaN(value) && value < 1) {
            document.getElementById("speedIncreaseBackgroundWarning").style.display = "";
        } else {
            document.getElementById("speedIncreaseBackgroundWarning").style.display = "none";
        }
    }
};

function setOption(option, value) {
    options[option] = value;
    optionValueHandlers[option]?.(value, false, () => document.getElementById(`${option}Input`));
}

function loadOption(option, value) {
    const input = document.getElementById(`${option}Input`);
    if (!input || !(input instanceof HTMLInputElement)) return;
    if (input.type === "checkbox") input.checked = value;
    else if (option === "speedIncreaseBackground" && (typeof value !== "number" || isNaN(value) || value < 0)) input.value = "";
    else input.value = value;
    optionValueHandlers[option]?.(value, true, () => input);
}

function showPauseNotification(message) {
    pauseNotification = new Notification("Idle Loops", { icon: "favicon-32x32.png", body: message, tag: "paused", renotify: true });
}

function clearPauseNotification() {
    if (pauseNotification) {
        pauseNotification.close();
        pauseNotification = null;
    }
}

function closeTutorial() {
    document.getElementById("tutorial").style.display = "none";
}

function clearSave() {
    window.localStorage[defaultSaveName] = "";
    window.localStorage[challengeSaveName] = "";
    location.reload();
}

function loadDefaults() {
    initializeStats();
    initializeSkills();
    initializeBuffs();
    prestigeValues["prestigeCurrentPoints"] = 0;
    prestigeValues["prestigeTotalPoints"] = 0;
    prestigeValues["prestigeTotalCompletions"] = 0;
    prestigeValues["completedCurrentPrestige"] = false;
    prestigeValues["completedAnyPrestige"] = false;
}

function loadUISettings() {
    document.getElementById("expandableList").style.height = localStorage.getItem("actionListHeight");
    curActionsDiv.style.maxHeight = `${parseInt(localStorage.getItem("actionListHeight")) - 43}px`;
    nextActionsDiv.style.maxHeight = `${parseInt(localStorage.getItem("actionListHeight")) - 43}px`;
}

function saveUISettings() {
    if ((document.getElementById("expandableList").style.height === "")) localStorage.setItem("actionListHeight", document.getElementById("expandableList").style.height = "500px");
    else localStorage.setItem("actionListHeight", document.getElementById("expandableList").style.height);
}

function load(inChallenge) {
    loadDefaults();
    loadUISettings();

    loadouts = [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []];
    loadoutnames = [[], [], [], [], [], [], [], [], [], [], [], [], [], [], []];
    // loadoutnames[-1] is what displays in the loadout renaming box when no loadout is selected
    // It isn't technically part of the array, just a property on it, so it doesn't count towards loadoutnames.length
    loadoutnames[-1] = "";

    let toLoad = {};
    // has a save file
    if (window.localStorage[saveName] && window.localStorage[saveName] !== "null") {
        closeTutorial();
        toLoad = JSON.parse(window.localStorage[saveName]);
    }

    console.log("Loading game from: " + saveName + " inChallenge: " + inChallenge);

    if(toLoad.challengeSave !== undefined)
    for (let challengeProgress in toLoad.challengeSave)
        challengeSave[challengeProgress] = toLoad.challengeSave[challengeProgress];
    if (inChallenge !== undefined) challengeSave.inChallenge = inChallenge;

    console.log("Challenge Mode: " + challengeSave.challengeMode + " In Challenge: " + challengeSave.inChallenge);


    if (saveName === defaultSaveName && challengeSave.inChallenge === true) {
        console.log("Switching to challenge save");
        saveName = challengeSaveName;
        load(true);
        return;
    }

    if (challengeSave.challengeMode !== 0)
        saveName = challengeSaveName;

    for (const property in toLoad.stats) {
        if (toLoad.stats.hasOwnProperty(property)) {
            stats[property].talent =  toLoad.stats[property].talent > 0 ? toLoad.stats[property].talent : 0;
            stats[property].soulstone = toLoad.stats[property].soulstone > 0 ? toLoad.stats[property].soulstone : 0;
        }
    }


    for (const property in toLoad.skills) {
        if (toLoad.skills.hasOwnProperty(property)) {
            skills[property].exp = toLoad.skills[property].exp > 0 ? toLoad.skills[property].exp : toLoad.skills[property].exp;
        }
    }

    for (const property in toLoad.buffs) {
        if (toLoad.buffs.hasOwnProperty(property)) {
            // need the min for people with broken buff amts from pre 0.93
            buffs[property].amt = Math.min(toLoad.buffs[property].amt, buffHardCaps[property]);
        }
    }

    if (toLoad.buffCaps !== undefined) {
        for (const property in buffCaps) {
            if (toLoad.buffCaps.hasOwnProperty(property)) {
                buffCaps[property] = toLoad.buffCaps[property];
                document.getElementById(`buff${property}Cap`).value = buffCaps[property];
            }
        }
    }

    if (toLoad.prestigeValues !== undefined) {
        prestigeValues["prestigeCurrentPoints"]     = toLoad.prestigeValues["prestigeCurrentPoints"]     === undefined ? 0     : toLoad.prestigeValues["prestigeCurrentPoints"];
        prestigeValues["prestigeTotalPoints"]       = toLoad.prestigeValues["prestigeTotalPoints"]       === undefined ? 0     : toLoad.prestigeValues["prestigeTotalPoints"];
        prestigeValues["prestigeTotalCompletions"]  = toLoad.prestigeValues["prestigeTotalCompletions"]  === undefined ? 0     : toLoad.prestigeValues["prestigeTotalCompletions"];
        prestigeValues["completedCurrentPrestige"]  = toLoad.prestigeValues["completedCurrentPrestige"]  === undefined ? 0     : toLoad.prestigeValues["completedCurrentPrestige"];
        prestigeValues["completedAnyPrestige"]      = toLoad.prestigeValues["completedAnyPrestige"]      === undefined ? false : toLoad.prestigeValues["completedAnyPrestige"];
    }


    if (toLoad.storyReqs !== undefined) {
        for (const property in storyReqs) {
            if (toLoad.storyReqs.hasOwnProperty(property)) {
                storyReqs[property] = toLoad.storyReqs[property];
            }
        }
    }

    if (toLoad.actionLog !== undefined) {
        actionLog.load(toLoad.actionLog);
        actionLog.loadRecent();
    }

    if (toLoad.totalTalent === undefined) {
        let temptotalTalent = 0;
        for (const property in toLoad.stats) {
            if (toLoad.stats.hasOwnProperty(property)) {
                temptotalTalent += toLoad.stats[property].talent * 100;
            }
        }
        totalTalent = temptotalTalent;
    } else {
        totalTalent = toLoad.totalTalent;
    }

    if (toLoad.maxTown) {
        townsUnlocked = [0];
        for (let i = 1; i <= toLoad.maxTown; i++) {
            townsUnlocked.push(i);
        }
    } else {
        townsUnlocked = toLoad.townsUnlocked === undefined ? [0] : toLoad.townsUnlocked;
    }
    completedActions = [];
    if (toLoad.completedActions && toLoad.completedActions.length > 0)
        toLoad.completedActions.forEach(action => {
            completedActions.push(action);
        });
    completedActions.push("FoundGlasses");
    for (let i = 0; i <= 8; i++) {
        towns[i] = new Town(i);
    }
    actionTownNum = toLoad.actionTownNum === undefined ? 0 : toLoad.actionTownNum;
    trainingLimits = 10 + getBuffLevel("Imbuement");
    goldInvested = toLoad.goldInvested === undefined ? 0 : toLoad.goldInvested;
    stonesUsed = toLoad.stonesUsed === undefined ? {1:0, 3:0, 5:0, 6:0} : toLoad.stonesUsed;

    actions.next = [];
    if (toLoad.nextList) {
        for (const action of toLoad.nextList) {
            if (action.name === "Sell Gold") {
                action.name = "Buy Mana";
            }
            if (action.name === "Buy Mana Challenge")
                action.name = "Buy Mana Z1";
            if (action.name === "Tournament") {
                action.name = "Buy Pickaxe";
            }
            if (action.name === "Train Dex") {
                action.name = "Train Dexterity";
            }
            if (action.name === "Buy Mana") {
                action.name = "Buy Mana Z1";
            }
            if (action.name === "Purchase Mana") {
                action.name = "Buy Mana Z3";
            }
            if(totalActionList.some(x => x.name === action.name))
                actions.next.push(action);
        }
    }
    actions.nextLast = copyObject(actions.next);

    if (toLoad.loadouts) {
        for (let i = 0; i < loadouts.length; i++) {
            if (!toLoad.loadouts[i]) {
                continue;
            }
            //Translates old actions that no longer exist
            for (const action of toLoad.loadouts[i]) {
                if (action.name === "Sell Gold") {
                    action.name = "Buy Mana";
                }
                if (action.name === "Tournament") {
                    action.name = "Buy Pickaxe";
                }
                if (action.name === "Train Dex") {
                    action.name = "Train Dexterity";
                }
                if (action.name === "Buy Mana") {
                    action.name = "Buy Mana Z1";
                }
                if (action.name === "Purchase Mana") {
                    action.name = "Buy Mana Z3";
                }
                if(totalActionList.some(x => x.name === action.name))
                    loadouts[i].push(action);
            }
        }
    }
    for (let i = 0; i < loadoutnames.length; i++) {
        loadoutnames[i] = "Loadout " + (i + 1);
    }
    if (toLoad.loadoutnames) {
        for (let i = 0; i < loadoutnames.length; i++) {
            if(toLoad.loadoutnames[i] != undefined && toLoad.loadoutnames != "")
                loadoutnames[i] = toLoad.loadoutnames[i];
            else
                loadoutnames[i] = "Loadout " + (i + 1);
        }
    }
    curLoadout = toLoad.curLoadout;
    const elem = document.getElementById(`load${curLoadout}`);
    if (elem) {
        removeClassFromDiv(document.getElementById(`load${curLoadout}`), "unused");
    }

    /*if (toLoad.dungeons) {
        if (toLoad.dungeons.length < dungeons.length) {
            toLoad.dungeons.push([]);
        }
    }*/
    dungeons = [[], [], []];
    const level = { ssChance: 1, completed: 0 };
    let floors = 0;
    if(toLoad.dungeons === undefined) toLoad.dungeons = copyArray(dungeons);
    for (let i = 0; i < dungeons.length; i++) {
        floors = dungeonFloors[i];
        for (let j = 0; j < floors; j++) {
            if (toLoad.dungeons[i] != undefined && toLoad.dungeons && toLoad.dungeons[i][j]) {
                dungeons[i][j] = toLoad.dungeons[i][j];
            } else {
                dungeons[i][j] = copyArray(level);
            }
            dungeons[i][j].lastStat = "NA";
        }
    }

    trials = [[], [], [], [], []];
    const trialLevel = {completed: 0};
    if(toLoad.trials === undefined) toLoad.trials = copyArray(trials);
    for (let i = 0; i < trials.length; i++) {
        floors = trialFloors[i];
        trials[i].highestFloor = 0;
        for (let j = 0; j < floors; j++) {
            if (toLoad.trials[i] != undefined && toLoad.trials && toLoad.trials[i][j]) {
                trials[i][j] = toLoad.trials[i][j];
                if (trials[i][j].completed > 0) trials[i].highestFloor = j;
            } else {
                trials[i][j] = copyArray(trialLevel);
            }
        }
    }

    if (toLoad.options === undefined) {
        options.theme = toLoad.currentTheme === undefined ? options.theme : toLoad.currentTheme;
        options.repeatLastAction = toLoad.repeatLast;
        options.pingOnPause = toLoad.pingOnPause === undefined ? options.pingOnPause : toLoad.pingOnPause;
        options.notifyOnPause = toLoad.notifyOnPause === undefined ? options.notifyOnPause : toLoad.notifyOnPause;
        options.autoMaxTraining = toLoad.autoMaxTraining === undefined ? options.autoMaxTraining : toLoad.autoMaxTraining;
        options.highlightNew = toLoad.highlightNew === undefined ? options.highlightNew : toLoad.highlightNew;
        options.hotkeys = toLoad.hotkeys === undefined ? options.hotkeys : toLoad.hotkeys;
        options.updateRate = toLoad.updateRate === undefined ? options.updateRate : window.localStorage["updateRate"] ?? toLoad.updateRate;
    } else {
        const optionsToLoad = {...toLoad.options, ...toLoad.extraOptions};
        for (const option in optionsToLoad) {
            options[option] = optionsToLoad[option];
        }
        if ("updateRate" in optionsToLoad && window.localStorage["updateRate"]) {
            options.updateRate = window.localStorage["updateRate"];
        }
    }

    for (const town of towns) {
        for (const action of town.totalActionList) {
            if (action.type === "progress")
                town[`exp${action.varName}`] = toLoad[`exp${action.varName}`] === undefined ? 0 : toLoad[`exp${action.varName}`];
            else if (action.type === "multipart")
                town[`total${action.varName}`] = toLoad[`total${action.varName}`] === undefined ? 0 : toLoad[`total${action.varName}`];
            else if (action.type === "limited") {
                const varName = action.varName;
                if (toLoad[`total${varName}`] !== undefined)
                    town[`total${varName}`] = toLoad[`total${varName}`];
                if (toLoad[`checked${varName}`] !== undefined)
                    town[`checked${varName}`] = toLoad[`checked${varName}`];
                if (toLoad[`good${varName}`] !== undefined)
                    town[`good${varName}`] = toLoad[`good${varName}`];
                if (toLoad[`good${varName}`] !== undefined)
                    town[`goodTemp${varName}`] = toLoad[`good${varName}`];
            }
        }
    }

    loadChallenge();
    view.initalize();

    for (const town of towns) {
        for (const action of town.totalActionList) {
            if (action.type === "limited") {
                const varName = action.varName;
                if (toLoad[`searchToggler${varName}`] !== undefined) {
                    document.getElementById(`searchToggler${varName}`).checked = toLoad[`searchToggler${varName}`];
                }
                view.updateRegular({name: action.varName, index: town.index});
            }
        }
    }

    for (const option in options) {
        // Not sure how to remove old UI elements yet without breaking them from past saves. Using this as "temp" fix
        if (!["speedIncrease50x", "speedIncrease100x"].includes(option)) 
            loadOption(option, options[option]); 
    }
    storyShowing = toLoad.storyShowing === undefined ? 0 : toLoad.storyShowing;
    storyMax = toLoad.storyMax === undefined ? 0 : toLoad.storyMax;
    if (toLoad.unreadActionStories === undefined
        || toLoad.unreadActionStories.find(s => !s.includes('storyContainer'))) {
        unreadActionStories = [];
    } else {
        unreadActionStories = toLoad.unreadActionStories;
        for (const name of unreadActionStories) {
            showNotification(name);
        }
    }

    totalOfflineMs = toLoad.totalOfflineMs === undefined ? 0 : toLoad.totalOfflineMs;
    if (toLoad.totals != undefined) {
        totals.time = toLoad.totals.time === undefined ? 0 : toLoad.totals.time;
        totals.effectiveTime = toLoad.totals.effectiveTime === undefined ? 0 : toLoad.totals.effectiveTime;
        totals.loops = toLoad.totals.loops === undefined ? 0 : toLoad.totals.loops;
        totals.actions = toLoad.totals.actions === undefined ? 0 : toLoad.totals.actions;
    }
    else totals = {time: 0, effectiveTime: 0, loops: 0, actions: 0};
    currentLoop = totals.loops;
    view.updateTotals();
    console.log("Updating prestige values from load")
    view.updatePrestigeValues();

    // capped at 1 month of gain
    addOffline(Math.min(Math.floor((new Date() - new Date(toLoad.date)) * offlineRatio), 2678400000));

    if (toLoad.version75 === undefined) {
        const total = towns[0].totalSDungeon;
        dungeons[0][0].completed = Math.floor(total / 2);
        dungeons[0][1].completed = Math.floor(total / 4);
        dungeons[0][2].completed = Math.floor(total / 8);
        dungeons[0][3].completed = Math.floor(total / 16);
        dungeons[0][4].completed = Math.floor(total / 32);
        dungeons[0][5].completed = Math.floor(total / 64);
        towns[0].totalSDungeon = dungeons[0][0].completed + dungeons[0][1].completed + dungeons[0][2].completed + dungeons[0][3].completed + dungeons[0][4].completed + dungeons[0][5].completed;
    }

    //Handle players on previous challenge system
    if(toLoad.challenge !== undefined && toLoad.challenge !== 0) {
        challengeSave.challengeMode = 0;
        challengeSave.inChallenge = true;
        save();

        challengeSave.challengeMode = toLoad.challenge;
        saveName = challengeSaveName;
        save();
        location.reload();
    }

    if(getExploreProgress() >= 100) addResource("glasses", true);

    adjustAll();

    view.updateLoadoutNames();
    view.changeStatView();
    view.updateNextActions();
    view.updateMultiPartActions();
    view.updateStories(true);
    view.update();
    recalcInterval(options.updateRate);
    pauseGame();

    Data.recordBase();
}

function save() {
    const toSave = {};
    toSave.curLoadout = curLoadout;
    toSave.dungeons = dungeons;
    toSave.trials = trials;
    toSave.townsUnlocked = townsUnlocked;
    toSave.completedActions = completedActions;
    toSave.actionTownNum = actionTownNum;

    toSave.stats = stats;
    toSave.totalTalent = totalTalent;
    toSave.skills = skills;
    toSave.buffs = buffs;
    toSave.prestigeValues = prestigeValues;
    toSave.goldInvested = goldInvested;
    toSave.stonesUsed = stonesUsed;
    toSave.version75 = true;

    for (const town of towns) {
        for (const action of town.totalActionList) {
            if (action.type === "progress") {
                toSave[`exp${action.varName}`] = town[`exp${action.varName}`];
            } else if (action.type === "multipart") {
                toSave[`total${action.varName}`] = town[`total${action.varName}`];
            } else if (action.type === "limited") {
                const varName = action.varName;
                toSave[`total${varName}`] = town[`total${varName}`];
                toSave[`checked${varName}`] = town[`checked${varName}`];
                toSave[`good${varName}`] = town[`good${varName}`];
                toSave[`goodTemp${varName}`] = town[`good${varName}`];
                if (document.getElementById(`searchToggler${varName}`)) {
                    toSave[`searchToggler${varName}`] = document.getElementById(`searchToggler${varName}`).checked;
                }
            }
        }
    }
    toSave.nextList = actions.next;
    toSave.loadouts = loadouts;
    toSave.loadoutnames = loadoutnames;
    toSave.options = {};
    toSave.extraOptions = {}; // to avoid crashing when exporting to lloyd, etc
    for (const option in options) {
        if (isStandardOption[option]) {
            toSave.options[option] = options[option];
        } else {
            toSave.extraOptions[option] = options[option];
        }
    }
    toSave.storyShowing = storyShowing;
    toSave.storyMax = storyMax;
    toSave.storyReqs = storyReqs;
    toSave.unreadActionStories = unreadActionStories;
    toSave.actionLog = actionLog;
    toSave.buffCaps = buffCaps;

    toSave.date = new Date();
    toSave.totalOfflineMs = totalOfflineMs;
    toSave.totals = totals;
    
    toSave.challengeSave = challengeSave;
    for (const challengeProgress in challengeSave)
        toSave.challengeSave[challengeProgress] = challengeSave[challengeProgress];

    window.localStorage[saveName] = JSON.stringify(toSave);
    window.localStorage["updateRate"] = options.updateRate;
}

function currentSaveData() {
    return `ILSV01${LZString.compressToBase64(window.localStorage[saveName])}`;
}

function exportSave() {
    save();
    // idle loops save version 01. patch v0.94, moved from old save system to lzstring base 64
    document.getElementById("exportImport").value = `ILSV01${LZString.compressToBase64(window.localStorage[saveName])}`;
    document.getElementById("exportImport").select();
    document.execCommand("copy");
}

function importSave() {
    const saveData = document.getElementById("exportImport").value;
    processSave(saveData);
}

function processSave(saveData) {
    if (saveData === "") {
        if (confirm("Importing nothing will delete your save. Are you sure you want to delete your save?")) {
            challengeSave = {};
            clearSave();
        } else {
            return;
        }
    }
    // idle loops save version 01. patch v0.94, moved from old save system to lzstring base 64
    if (saveData.substr(0, 6) === "ILSV01") {
        window.localStorage[saveName] = LZString.decompressFromBase64(saveData.substr(6));
    } else {
        // handling for old saves from stopsign or patches prior to v0.94
        window.localStorage[saveName] = decode(saveData);
    }
    actions.next = [];
    actions.current = [];
    load();
    pauseGame();
    restart();
}

function saveFileName() {
    const gameName = document.title.replace('*PAUSED* ','')
    const version = document.querySelector('#changelog').childNodes[1].firstChild.textContent.trim()
    return `${gameName} ${version} - Loop ${totals.loops}.txt`
}

function exportSaveFile() {
    save();
    const saveData = `ILSV01${LZString.compressToBase64(window.localStorage[saveName])}`;
    const a = document.createElement('a');
    a.setAttribute('href', 'data:text/plain;charset=utf-8,' + saveData);
    a.setAttribute('download', saveFileName());
    a.setAttribute('id', 'downloadSave');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function openSaveFile() {
    document.getElementById('SaveFileInput').click();
}

function importSaveFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        const saveData = e.target.result;
        processSave(saveData);
    }
    reader.readAsText(file)
}

function exportCurrentList() {
    let toReturn = "";
    for (const action of actions.next) {
        toReturn += `${action.loops}x ${action.name}`;
        toReturn += "\n";
    }
    document.getElementById("exportImportList").value = toReturn.slice(0, -1);
    document.getElementById("exportImportList").select();
    document.execCommand("copy");
}

function importCurrentList() {
    const toImport = document.getElementById("exportImportList").value.split("\n");
    actions.next = [];
    for (let i = 0; i < toImport.length; i++) {
        if (!toImport[i]) {
            continue;
        }
        const name = toImport[i].substr(toImport[i].indexOf("x") + 1).trim();
        const loops = toImport[i].substr(0, toImport[i].indexOf("x"));
        const action = translateClassNames(name);
        if (action && action.unlocked()) {
            actions.next.push({ name, loops: Number(loops), disabled: false });
        }
    }
    view.updateNextActions();
}

function beginChallenge(challengeNum) {
    console.log("Beginning Challenge");
    if (window.localStorage[challengeSaveName] && window.localStorage[challengeSaveName] !== "") {
        if (confirm("Beginning a new challenge will delete your current challenge save. Are you sure you want to begin?"))
            window.localStorage[challengeSaveName] = "";
        else
            return false;
    }
    if (challengeSave.challengeMode === 0) {
        challengeSave.inChallenge = true;
        save();
        console.log ("Saving to: " + saveName);
    }
    challengeSave.challengeMode = challengeNum;
    saveName = challengeSaveName;
    load(true);
    totalOfflineMs = 1000000;
    save();
    pauseGame();
    restart();
}

function exitChallenge() {
    if (challengeSave.challengeMode !== 0) {
        saveName = defaultSaveName;
        load(false);
        save();
        location.reload();
    }
}

function resumeChallenge() {
    if (challengeSave.challengeMode === 0 && window.localStorage[challengeSaveName] && window.localStorage[challengeSaveName] !== "") {
        challengeSave.inChallenge = true;
        save();
        saveName = challengeSaveName;
        load(true);
        save();
        pauseGame();
        restart();
    }
}

// All prestige button functions
function completedCurrentGame() {
    console.log("completed current prestige")

    if (!prestigeValues["completedCurrentPrestige"]) {
        prestigeValues["prestigeCurrentPoints"]    += 90;
        prestigeValues["prestigeTotalPoints"]      += 90;
        prestigeValues["prestigeTotalCompletions"] += 1;
        prestigeValues["completedCurrentPrestige"] = true;
        prestigeValues["completedAnyPrestige"]     = true;

        view.updatePrestigeValues();
    }
}

function prestigeUpgrade(prestigeSelected) {
    // Update prestige value
    const costOfPrestige = getPrestigeCost(prestigeSelected);
    if (costOfPrestige > prestigeValues["prestigeCurrentPoints"]) {
        console.log("Not enough points available.")
        return;
    } 
    // Confirmation of prestige
    if (!prestigeConfirmation()) {
        return;
    }

    addBuffAmt(prestigeSelected, 1);
    prestigeValues["prestigeCurrentPoints"] -= costOfPrestige;
    
    // Retain certain values between prestiges
    const nextPrestigeBuffs = {
        PrestigePhysical:    getBuffLevel("PrestigePhysical"),
        PrestigeMental:      getBuffLevel("PrestigeMental"),
        PrestigeCombat:      getBuffLevel("PrestigeCombat"),
        PrestigeSpatiomancy: getBuffLevel("PrestigeSpatiomancy"),
        PrestigeChronomancy: getBuffLevel("PrestigeChronomancy"),
        PrestigeBartering:   getBuffLevel("PrestigeBartering"),
        PrestigeExpOverflow: getBuffLevel("PrestigeExpOverflow"),

        // Imbue Soul carry overs between prestiges, but only up to the number of prestiges you have.
        Imbuement3: Math.floor(prestigeValues["prestigeTotalCompletions"], getBuffLevel("Imbuement3")), 
    }

    const nextPrestigeValues = {
        prestigeCurrentPoints:     prestigeValues["prestigeCurrentPoints"],
        prestigeTotalPoints:       prestigeValues["prestigeTotalPoints"],
        prestigeTotalCompletions:  prestigeValues["prestigeTotalCompletions"],
        completedCurrentPrestige:  false,
        completedAnyPrestige:      prestigeValues["completedAnyPrestige"],
    }

    prestigeWithNewValues(nextPrestigeValues, nextPrestigeBuffs)
}

function resetAllPrestiges() {
    // Retain certain values between prestiges
    const nextPrestigeBuffs = {
        PrestigePhysical:    0,
        PrestigeMental:      0,
        PrestigeCombat:      0,
        PrestigeSpatiomancy: 0,
        PrestigeChronomancy: 0,
        PrestigeBartering:   0,
        PrestigeExpOverflow: 0,

        // Imbue Soul carry overs between prestiges, but only up to the number of prestiges you have.
        Imbuement3: Math.floor(prestigeValues["prestigeTotalCompletions"], getBuffLevel("Imbuement3")), 
    }

    const nextPrestigeValues = {
        prestigeCurrentPoints:     prestigeValues["prestigeTotalPoints"],
        prestigeTotalPoints:       prestigeValues["prestigeTotalPoints"],
        prestigeTotalCompletions:  prestigeValues["prestigeTotalCompletions"],
        completedCurrentPrestige:  false,
        completedAnyPrestige:      prestigeValues["completedAnyPrestige"],
    }

    prestigeWithNewValues(nextPrestigeValues, nextPrestigeBuffs)
}

function prestigeWithNewValues(nextPrestigeValues, nextPrestigeBuffs) {
    let nextTotals = totals;
    let nextOfflineMs = totalOfflineMs;


    // Remove all progress and save totals
    load(false);
    clearList();
    restart();
    pauseGame();


    // Regain prestige values and Totals
    for (const [key, value] of Object.entries(nextPrestigeBuffs)) {
        addBuffAmt(key, 0);     // Set them to 0
        addBuffAmt(key, value); // Then set them to actual value
        view.requestUpdate("updateBuff", key);
    }

    prestigeValues["prestigeCurrentPoints"]    = nextPrestigeValues.prestigeCurrentPoints.valueOf();
    prestigeValues["prestigeTotalPoints"]      = nextPrestigeValues.prestigeTotalPoints.valueOf();
    prestigeValues["prestigeTotalCompletions"] = nextPrestigeValues.prestigeTotalCompletions.valueOf();
    prestigeValues["completedCurrentPrestige"] = nextPrestigeValues.completedCurrentPrestige.valueOf();
    prestigeValues["completedAnyPrestige"]     = nextPrestigeValues.completedAnyPrestige.valueOf();
    totals = nextTotals;
    totalOfflineMs = nextOfflineMs;
    view.updatePrestigeValues();
    save();
}

function prestigeConfirmation() {
    save();
    if (window.localStorage[defaultSaveName] && window.localStorage[defaultSaveName] !== "") {
        if (confirm("Prestiging will reset all of your progress, but retain prestige points. Are you sure?"))
            window.localStorage[defaultSaveName] = "";
        else
            return false;
    }
    return true;
}

function getPrestigeCost(prestigeSelected) {
    var currentCost = 30;

    for (var i = 0; i < getBuffLevel(prestigeSelected); i++) {
        currentCost += 10 + (5 * i)
    }

    return currentCost;
}

function getPrestigeCurrentBonus(prestigeSelected, base) {
    return Math.pow(base, getBuffLevel(prestigeSelected)) > 1 ? 
        Math.pow(base, getBuffLevel(prestigeSelected)) * 100 - 100 :      // *100 - 100 is to get percent values, otherwise 1.02 will just round to 1, rather than 2%.
        0;
}
