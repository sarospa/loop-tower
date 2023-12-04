class ActionLog {
    /** @type {ActionLogEntry[]} */
    entries = [];
    /** @type {ActionLogEntry[]} */
    history = [];
    /** @type {Record<string, ActionLogEntry>} */
    stories = {};

    /** @type {(entry: ActionLogEntry, init: boolean) => void} */
    addEntry(entry, init) {
        this.history.push(entry);
        if (!init) {
            this.entries.push(entry);
            view.requestUpdate("updateActionLogEntry", this.entries.length - 1);
        }
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
        /** @type {ActionLogEntry} */
        let entry;
        for (let i = this.entries.length - 1; i >= 0; i--)  {
            entry = this.entries[i];
            if (entry instanceof SoulstoneEntry) {
                if (entry.action.name === action.name) {
                    break;
                }
            } else {
                break;
            }
        }
        if (entry instanceof SoulstoneEntry && entry.action.name === action.name) {
            entry.addSoulstones(stat, count);
            entry.loopEnd = currentLoop;
        } else {
            entry = new SoulstoneEntry(action);
            entry.addSoulstones(stat, count);
            this.addEntry(entry, init);
        }
        view.requestUpdate("updateActionLogEntry", this.entries.length - 1);
    }
}
class ActionLogEntry {
    /** @type {string} */
    type;
    /** @type {number} */
    loopStart;
    /** @type {number} */
    loopEnd;
    /** @type {Action & ActionExtras} */
    action;

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
     * @param {Action & ActionExtras} action
     * @param {number=} loop
     */
    constructor(type, action, loop) {
        this.type = type;
        this.loopStart = this.loopEnd = loop ?? currentLoop;
        this.action = action;
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
}

class ActionStoryEntry extends ActionLogEntry {
    /** @type {number} */
    storyIndex;

    constructor(action, storyIndex, loop) {
        super("story", action, loop);
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

    constructor(chapter) {
        super("global", null);
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

    constructor(action, loop) {
        super("soulstone", action, loop);
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
}