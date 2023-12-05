class ActionLog {
    /** @type {ActionLogEntry[]} */
    entries = [];
    /** @type {ActionLogEntry[]} */
    history = [];
    /** @type {Record<string, ActionLogEntry>} */
    stories = {};

    /** @type {(entry: ActionLogEntry, init: boolean) => void} */
    addEntry(entry, init) {
        if (entry.historyIndex === null) {
            entry.historyIndex = this.history.length;
            this.history.push(entry);
        }
        if (!init && entry.entryIndex === null) {
            entry.entryIndex = this.entries.length;
            this.entries.push(entry);
        }
        if (entry.entryIndex !== null) {
            view.requestUpdate("updateActionLogEntry", entry.entryIndex);
        }
    }

    /** @type {<T extends ActionLogEntry, C extends new(...args: any[]) => T>(type: C, action: Action, updateLoopEnd?: boolean) => T | null} */
    findRepeatableEntry(type, action, updateLoopEnd) {
        for (let i = this.entries.length - 1; i >= 0; i--)  {
            const entry = this.entries[i];
            if (entry instanceof type && entry.action.name === action.name) {
                if (updateLoopEnd) entry.loopEnd = currentLoop;
                return entry;
            } else if (!entry.repeatable) {
                return null;
            }
        }
        return null;
    }

    /** @type {<C extends new(action: any, ...args: any[]) => any, T extends InstanceType<C>>(type: C, ...[action, ...args]: ConstructorParameters<C>) => T} */
    findOrCreateRepeatableEntry(type, action, ...args) {
        return this.findRepeatableEntry(type, action, true) ?? new type(action, ...args);
    }

    addActionStory(action, storyindex, init) {
        const key = `${action.name}:${storyindex}`;
        if (key in this.stories) return;
        this.stories[key] = null;
        if (!options.actionLog) return;
        const entry = new ActionStoryEntry(action, storyindex);
        this.stories[key] = entry;
        this.addEntry(entry, init);
    }

    addGlobalStory(num) {
        const key = `global:${num}`;
        if (key in this.stories) return;
        this.stories[key] = null;
        if (!options.actionLog) return;
        const entry = new GlobalStoryEntry(num);
        this.stories[key] = entry;
        this.addEntry(entry, false);
    }

    /** @type {(action: Action, stat: typeof statList[number], count: number, init: boolean) => void} */
    addSoulstones(action, stat, count, init) {
        if (!options.actionLog) return;

        const entry = this.findOrCreateRepeatableEntry(SoulstoneEntry, action);
        entry.addSoulstones(stat, count);
        this.addEntry(entry, init);
    }

    /** @type {(action: Action, skill: typeof skillList[number], toLevel: number, fromLevel?: number, init?: boolean) => void} */
    addSkillLevel(action, skill, toLevel, fromLevel, init) {
        if (!options.actionLog) return;

        const entry = this.findOrCreateRepeatableEntry(SkillEntry, action, skill, toLevel, fromLevel);
        entry.toLevel = toLevel;
        this.addEntry(entry, init);
    }
}
class ActionLogEntry {
    /** @type {string} */
    type;
    /** @type {number} */
    historyIndex = null;
    /** @type {number} */
    entryIndex = null;
    /** @type {number} */
    loopStart;
    /** @type {number} */
    loopEnd;
    /** @type {Action & ActionExtras} */
    action;
    /** @type {boolean} */
    repeatable;

    #element;
    /** @type {HTMLElement} */
    get element() {
        return this.#element ??= this.createElement();
    }
    set element(value) {
        this.#element = value;
    }
    /**
     * @param {string} type
     * @param {Action} action
     * @param {number=} loop
     */
    constructor(type, repeatable, action, loop) {
        this.type = type;
        this.repeatable = repeatable;
        this.loopStart = this.loopEnd = loop ?? currentLoop;
        this.action = /** @type {Action & ActionExtras} */(action);
    }
    createElement() {
        const div = document.createElement("div");
        div.innerHTML = `<li data-type="${this.type}">${this.format(this.getText())}</li>`
        return /** @type {HTMLElement} */(div.children[0]);
    }
    updateElement() {
        if (this.#element) {
            this.#element.innerHTML = this.format(this.getText());
        }
    }
    /** @type {(text: string) => string} */
    format(text) {
        let lastText = null;
        while (lastText !== text) {
            lastText = text;
            text = text.replace(/{(.*?)}/g, (_, k) => this.getReplacement(k));
        }
        return text;
    }

    /** @type {(key: string) => string} */
    getReplacement(key) {
        if (key === "loop") return this.loopStart === this.loopEnd ? intToString(this.loopStart, 1) : _txt("actions>log>multiloop");
        if (key === "loopStart") return intToString(this.loopStart, 1);
        if (key === "loopEnd") return intToString(this.loopEnd, 1);
        if (key === "town") return townNames[this.action.townNum];
        if (key === "action") return this.action.label;
        if (key === "header") return _txt("actions>log>header");
        throw new Error(`Bad key ${key}`);
    }

    /** @returns {string} */
    getText() {
        throw new Error("Method not implemented.");
    }

    /** @type {(other: ActionLogEntry) => boolean} */
    canMerge(other) {
        return this.type === other.type && this.action.name === other.action.name && this.canMergeParameters(other);
    }
    /** @returns {boolean} */
    canMergeParameters(_other) {
        return false;
    }

}

class ActionStoryEntry extends ActionLogEntry {
    /** @type {number} */
    storyIndex;

    /**
     * @param {Action} action
     * @param {number} storyIndex 
     * @param {number=} loop 
     */
    constructor(action, storyIndex, loop) {
        super("story", false, action, loop);
        this.storyIndex = storyIndex;
    }

    getText() {
        return _txt("actions>log>action_story");
    }

    getReplacement(key) {
        if (key === "condition") return _txt(`actions>${getXMLName(this.action.name)}>story_${this.storyIndex}`).split("⮀")[0].replace(/^<b>|:<\/b>$/g,"");
        if (key === "story") return _txt(`actions>${getXMLName(this.action.name)}>story_${this.storyIndex}`).split("⮀")[1];
        return super.getReplacement(key);
    }
}

class GlobalStoryEntry extends ActionLogEntry {
    /** @type {number} */
    chapter;

    /**
     * @param {number} chapter
     * @param {number=} loop
     */
    constructor(chapter, loop) {
        super("global", false, null, loop);
        this.chapter = chapter;
    }

    getText() {
        return _txt("actions>log>global_story");
    }

    getReplacement(key) {
        if (key === "story") return _txt(`time_controls>stories>story[num="${this.chapter}"]`);
        return super.getReplacement(key);
    }
}

class SoulstoneEntry extends ActionLogEntry {
    count = 0;
    /** @type {{[K in typeof statList[number]]?: number}} */
    stones = {};

    /**
     * @param {Action} action
     * @param {number=} loop 
     */
    constructor(action, loop) {
        super("soulstone", true, action, loop);
    }

    addSoulstones(stat, count) {
        this.stones[stat] ??= 0;
        this.stones[stat] += count;
        this.count += count;
    }

    getText() {
        return _txt(this.count === 1 ? "actions>log>soulstone" : Object.keys(this.stones).length === 1 ? "actions>log>soulstone_singlemulti" : "actions>log>soulstone_multi");
    }

    getReplacement(key) {
        if (key === "count") return intToString(this.count, 1);
        if (key === "stat_long") return _txt(`stats>${Object.keys(this.stones)[0]}>long_form`);
        if (key === "stat") return _txt(`stats>${Object.keys(this.stones)[0]}>short_form`);
        if (key === "stats") {
            const strs = [];
            const template = _txt(Object.keys(this.stones).length > 3 ? "actions>log>soulstone_stat_short" : "actions>log>soulstone_stat"); 
            for (const stat in stats) {
                if (stat in this.stones) {
                    strs.push(template
                                .replace("{count}", intToString(this.stones[stat], 1))
                                .replace("{stat_long}", _txt(`stats>${stat}>long_form`))
                                .replace("{stat}", _txt(`stats>${stat}>short_form`))
                            );
                }
            }
            return strs.join(", ");
        }
        return super.getReplacement(key);
    }

    canMergeParameters() {
        return true;
    }
}

class SkillEntry extends ActionLogEntry {
    count = 0;
    /** @type {typeof skillList[number]} */
    skill;

    /** @type {number} */
    fromLevel;
    /** @type {number} */
    toLevel;

    /**
     * @param {Action} action
     * @param {typeof skillList[number]} skill
     * @param {number} toLevel
     * @param {number=} fromLevel
     * @param {number=} loop
     */
    constructor(action, skill, toLevel, fromLevel, loop) {
        super("skill", true, action, loop);
        this.skill = skill;
        this.fromLevel = fromLevel ?? toLevel - 1;
        this.toLevel = toLevel;
    }

    getText() {
        return _txt(this.toLevel === this.fromLevel + 1 ? "actions>log>skill" : "actions>log>skill_multi");
    }

    getReplacement(key) {
        if (key === "skill") return _txt(`skills>${getXMLName(this.skill)}>label`);
        if (key === "levels") return formatNumber(this.toLevel - this.fromLevel);
        if (key === "fromLevel") return formatNumber(this.fromLevel);
        if (key === "toLevel") return formatNumber(this.toLevel);
        return super.getReplacement(key);
    }
}