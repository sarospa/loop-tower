const baseValueTypes = {
    skillLevel: "Skill Level",
    buffLevel: "Buff Level",
    primaryValue: "Primary value of action",
    progressLevel: "Progress Level",
    goodItems: "Total known-good items",
    discoveredItems: "Total discovered items",
    checkedItems: "Total checked items",
    value: "Calculated Value",
    function: "JS function",
};
const numericAdjustmentTypes = {
    addition: "Add",
    subtraction: "Subtract",
    multiplier: "Multiply by",
    divisor: "Divide by",
    adjustment: "Named adjustment",
    skillBonus: "Apply Skill Bonus",
    prestigeBonus: "Apply Prestige Bonus",
    surveyBonus: "Apply Survey Bonus",
    additiveBonus: "Add bonuses before applying",
    skillMod: "Skill-based modifier",
    setValue: "Set arbitrary value",
    ceil: "Round up",
    floor: "Round down",
    round: "Round to nearest",
    clampMin: "Clamp to minimum",
    clampMax: "Clamp to maximum",
};
const conditionalRuleTypes = {
    if: "If arbitrary value",
    ifPrimaryValue: "If action's primary value",
    ifCurrentValue: "If current evaluation",
    ifResource: "If resource",
    ifHasResource: "If player has resource",
    ifStoryFlag: "If story flag",
    ifProgress: "If current progress level",
    ifGoodItems: "If total known-good items",
    ifDiscoveredItems: "If total discovered items",
    ifCheckedItems: "If total checked items",
};
const numericOrConditionalElementTypes = {
    "Condition": conditionalRuleTypes,
    "Adjustment": numericAdjustmentTypes,
};
const numericTestTypes = {
    min: "≥",
    minExclusive: ">",
    max: "≤",
    maxExclusive: "<",
    equals: "=",
    notEquals: "≠",
};

const jsFunctions = {
    getExploreProgress,
};

/**
 * @typedef {keyof typeof baseValueTypes} BaseValueType
 * @typedef {keyof typeof numericAdjustmentTypes} NumericAdjustmentType
 * @typedef {keyof typeof conditionalRuleTypes} ConditionalRuleType
 * @typedef {keyof typeof numericTestTypes} NumericTestType
 * @typedef {NumericAdjustmentType | ConditionalRuleType} EvaluationRuleType
 */

/** @returns {type is BaseValueType} */
function isBaseValueType(type) {
    return type in baseValueTypes;
}
/** @returns {type is ConditionalRuleType} */
function isConditionalRuleType(type) {
    return type in conditionalRuleTypes;
}
/** @returns {type is NumericAdjustmentType} */
function isNumericAdjustmentType(type) {
    return type in numericAdjustmentTypes;
}
/** @returns {type is NumericTestType} */
function isNumericTestType(type) {
    return type in numericTestTypes;
}
/** @returns {type is EvaluationRuleType} */
function isEvaluationRuleType(type) {
    return isConditionalRuleType(type) || isNumericAdjustmentType(type);
}

/** @satisfies {Record<BaseValueType, string>} */
const baseValueClasses = /** @type {const} */({
    progressLevel: "varName progressVarName",
    skillLevel: "nameSelect skillName",
    buffLevel: "nameSelect buffName",
    primaryValue: "nameSelect actionName",
    value: "numericEvaluation",
    function: "nameSelect functionName",
    checkedItems: "varName limitedVarName",
    discoveredItems: "varName limitedVarName",
    goodItems: "varName limitedVarName",
});

/** @satisfies {Record<EvaluationRuleType, string>} */
const ruleClasses = /** @type {const} */({
    addition: "numericEvaluation",
    subtraction: "numericEvaluation",
    multiplier: "numericEvaluation",
    divisor: "numericEvaluation",
    adjustment: "nameSelect adjustmentName",
    skillBonus: "nameSelect skillName",
    prestigeBonus: "nameSelect prestigeBuffName",
    surveyBonus: "",
    additiveBonus: "",
    skillMod: "nameSelect skillName skillMod",
    setValue: "numericEvaluation",
    ceil: "",
    floor: "",
    round: "",
    clampMin: "numericEvaluation",
    clampMax: "numericEvaluation",
    if: "numericEvaluation numericCondition",
    ifPrimaryValue: "nameSelect actionName",
    ifCurrentValue: "numericCondition",
    ifResource: "nameSelect numericCondition resourceName",
    ifHasResource: "nameSelect booleanCondition resourceName",
    ifStoryFlag: "nameSelect booleanCondition storyFlagName",
    ifProgress: "numericCondition varName progressVarName",
    ifGoodItems: "numericCondition varName limitedVarName",
    ifDiscoveredItems: "numericCondition varName limitedVarName",
    ifCheckedItems: "numericCondition varName limitedVarName",
});

/**
 * @template {string} S
 * @typedef {S extends `${infer S1} ${infer S2}` ? S1 | Split<S2> : S extends '' ? never : S} Split
 */

/**
 * @typedef {Split<typeof baseValueClasses[BaseValueType]>} BaseValueClass
 * @typedef {Split<typeof ruleClasses[EvaluationRuleType]>} RuleClass
 */


class DataElement {
    static defaultIndent = 4;
    /** @type {string} */
    static defaultTemplate;
    /** @type {Readonly<Record<string, boolean>>} */
    static defaultFieldRequirements;

    static addDefaultFields(requiredFields = [], optionalFields = []) {
        const defaultFields = {...this.defaultFieldRequirements};
        for (const name of requiredFields) {
            defaultFields[name] = true;
        }
        for (const name of optionalFields) {
            defaultFields[name] = false;
        }
        this.defaultFieldRequirements = defaultFields;
    }

    /** @type {Element} */
    xmlElement;
    /** @type {string} */
    tagName;
    indentColumns = 0;
    /** @type {HTMLElement} */
    uiElement;
    /** @type {DataElement} */
    parent;
    /** @type {Record<string, boolean>} */
    fieldRequirements;
    /** @type {Record<string, string>} */
    stringFields = {__proto__: null};
    /** @type {Record<string, DataElement>} */
    namedChildren = {__proto__: null};

    isOptional = false;
    isPresent = true;

    uiSpawned = false;

    get rootActionDefinition() {
        return this instanceof ActionDefinition ? this : this.parent?.rootActionDefinition;
    }

    /** @param {DataElement} parent @param {Element|string} elementOrTagName @param {boolean} optional @param {boolean} [present] */
    constructor(parent, elementOrTagName, optional = false, present = undefined) {
        this.parent = parent;
        this.xmlElement = elementOrTagName instanceof Element ? elementOrTagName : null;
        this.tagName = elementOrTagName instanceof Element ? elementOrTagName.tagName : elementOrTagName;
        this.indentColumns = (this.parent?.indentColumns ?? -DataElement.defaultIndent) + DataElement.defaultIndent;
        this.isOptional = optional;
        this.isPresent = present ?? (optional ? !!this.xmlElement : true);
        if (this.constructor["defaultFieldRequirements"]) {
            this.fieldRequirements = {__proto__: null, ...this.constructor["defaultFieldRequirements"]};
        }
    }

    #initDone = false;
    init() {
        if (this.#initDone) throw new Error("Attempting to re-call init()");
        this.#initDone = true;
        if (this.xmlElement) {
            const previous = this.xmlElement.previousSibling;
            if (previous?.nodeType === Node.TEXT_NODE) {
                const leadingText = previous.nodeValue;
                if (leadingText.includes("\n")) {
                    const indentText = leadingText.slice(leadingText.lastIndexOf("\n") + 1);
                    this.indentColumns = indentText.length - indentText.trimStart().length;
                }
            }
            for (const [name, required] of Object.entries(this.fieldRequirements ?? {})) {
                if (name in this) {
                    Object.defineProperty(this.stringFields, name, {
                        get: () => this[name],
                        set: value => this[name] = value,
                        enumerable: true,
                        configurable: true,
                    });
                }
                if (this.xmlElement.hasAttribute(name)) {
                    this.stringFields[name] = this.xmlElement.getAttribute(name);
                }
            }
        }
    }

    toString() {
        return "name" in this ? `${this.tagName}: ${this.name}` : `${this.tagName}`;
    }

    /** @param {string|Element} elementOrId */
    attachUI(elementOrId, bindUI = true) {
        this.init();
        this.uiElement = htmlElement(elementOrId);
        if (bindUI) this.bindUI();
        return this;
    }

    /** @param {Element} container @param {Element} insertBefore */
    spawnUI(container = this.parent?.uiElement, insertBefore = null, bindUI = true) {
        this.init();
        this.uiSpawned = true;
        const template = this["defaultTemplate"] ?? this.constructor["defaultTemplate"];
        if (typeof template !== "string") {
            throw new Error(`spawnUI for ${this.constructor.name} does not know how to spawn UI ☹`);
        }
        this.spawnUIFromTemplate(template, container, insertBefore);
        if (bindUI) this.bindUI();
        return this;
    }

    /** @param {string} templateId @param {Element} container @param {Element} insertBefore */
    spawnUIFromTemplate(templateId, container = this.parent?.uiElement, insertBefore = null) {
        const clonedTemplate = cloneTemplate(templateId);
        container.insertBefore(clonedTemplate, insertBefore);
        this.uiElement = htmlElement(clonedTemplate instanceof DocumentFragment ? container : clonedTemplate);
        const summaryElement = this.uiElement.querySelector(":scope>details>summary, details:scope>summary");
        if (summaryElement && summaryElement.childNodes.length === 0) {
            summaryElement.textContent = this.toString();
        }
        return this.uiElement;
    }

    bindUI() {
        if (!this.uiElement) return;
        for (const evaluationField of this.uiElement.querySelectorAll(":is(.numericEvaluation,.conditionalEvaluation)[data-xml-name]")) {
            const isNumericEvaluation = evaluationField.classList.contains("numericEvaluation");
            const tagName = evaluationField.getAttribute("data-xml-name");
            const xmlChild = this.xmlElement.querySelector(tagName);
            const isOptional = evaluationField.classList.contains("optional");
            const fieldElement =
                new (isNumericEvaluation ? NumericEvaluationElement : ConditionalEvaluationElement)
                    (this, xmlChild ?? tagName, isOptional).spawnUI(evaluationField);
            this.namedChildren[tagName] = fieldElement;
        }
        this.populateUIFields();
    }

    populateUIFields() {
        if (this.isOptional) {
            const presenceCheckbox = this.uiElement.querySelector("input.elementPresent[type=checkbox]");
            if (presenceCheckbox) {
                inputElement(presenceCheckbox).checked = this.isPresent;
            }
        }
        for (const [name, value] of Object.entries(this.stringFields)) {
            const element = valueElement(this.uiElement?.querySelector(`[name="${name}"]`), false, false);
            if (element) {
                if (typeof value === "string" && value !== "") {
                    element.value = value;
                    element.setAttribute("value", value);
                } else {
                    element.removeAttribute("value");
                    element.value = "";
                }
            }
        }
    }
}

class BaseValueElement extends DataElement {
    
}

class EvaluationRuleElement extends DataElement {
    static {
        this.defaultTemplate = "evaluationRuleTemplate";
        this.addDefaultFields(["tagName"], ["name","varName","numericTest1","numericTest1Value","numericTest2","numericTest2Value","percentChange"]);
    }
    uiElementClass = "";

    numericTest1 = "";
    numericTest1Value = "";
    numericTest2 = "";
    numericTest2Value = "";

    /** @param {RuleClass} className */
    hasRuleClass(className) {
        return isEvaluationRuleType(this.tagName) && ruleClasses[this.tagName].split(" ").includes(className);
    }


    init() {
        if (this.xmlElement) {
            for (const test of Object.keys(numericTestTypes)) {
                if (this.xmlElement.hasAttribute(test)) {
                    if (this.numericTest1 === "") {
                        this.numericTest1 = test;
                        this.numericTest1Value = this.xmlElement.getAttribute(test);
                    } else if (this.numericTest2 === "") {
                        this.numericTest2 = test;
                        this.numericTest2Value = this.xmlElement.getAttribute(test);
                    } else {
                        throw new Error(`Too many numeric tests: ${this.numericTest1}, ${this.numericTest2}, ${test} (this is a limitation of the editor, not the spec)`);
                    }
                }
            }
        }
        super.init();
    }

    changeRuleType(type="") {
        this.uiElement.dataset.ruleType = type;
        if (!isEvaluationRuleType(type)) {
            return;
        }
        const ruleClass = ruleClasses[type];
        this.uiElement.className = `${this.uiElementClass} ${ruleClass}`;
        for (const className of ruleClass.split(" ")) {
            switch (className) {
                case "skillName":
                    populateSelectOptions(this.uiElement, "select[name=name]", skills, this.stringFields.name, s => s.label);
                    break;
                case "prestigeBuffName":
                    populateSelectOptions(this.uiElement, "select[name=name]", buffs, this.stringFields.name, b => b.name in prestigeBases && b.label);
                    break;
                case "adjustmentName":
                    populateSelectOptions(this.uiElement, "select[name=name]", editor.defs, this.stringFields.name, d => d instanceof NamedAdjustment && d.name);
                    break;
                case "storyFlagName":
                    populateSelectOptions(this.uiElement, "select[name=name]", storyReqs, this.stringFields.name, (_, k) => k);
                    break;
                case "resourceName":
                    populateSelectOptions(this.uiElement, "select[name=name]", resources, this.stringFields.name, (_, k) => k);
                    break;
                case "actionName":
                    populateSelectOptions(this.uiElement, "select[name=name]", editor.actions, this.stringFields.name, a => a instanceof ActionDefinition && a.name, (_,a) => a instanceof ActionDefinition && a.name);
                    break;
                case "limitedVarName":
                    populateSelectOptions(this.uiElement, "select[name=varName]", {...editor.actions, "": ""}, this.stringFields.varName, a => a === "" ? "(this Action)" : a instanceof ActionDefinition && a.type === "limited" && a.name, (_,a)=>a instanceof ActionDefinition ? a.effectiveVarName : String(a));
                    break;
                case "progressVarName":
                    populateSelectOptions(this.uiElement, "select[name=varName]", {...editor.actions, "": ""}, this.stringFields.varName, a => a === "" ? "(this Action)" :  a instanceof ActionDefinition && a.type === "progress" && a.name, (_,a)=>a instanceof ActionDefinition ? a.effectiveVarName : String(a));
                    break;
                case "varName":
                    populateSelectOptions(this.uiElement, "select[name=varName]", {...editor.actions, "": ""}, this.stringFields.varName, a => a === "" ? "(this Action)" :  a instanceof ActionDefinition && a.name, (_,a)=>a instanceof ActionDefinition ? a.effectiveVarName : String(a))
                    break;
            }
        }
    }

    bindUI() {
        super.bindUI();
        this.uiElementClass = this.uiElement.className;
        const typeSelect = valueElement(this.uiElement.querySelector("select[name=tagName]"));
        (typeSelect.onchange = () => this.changeRuleType(typeSelect.value))();
    }
}

class EvaluationRulesContainerElement extends DataElement {
    /** @type {EvaluationRuleElement[]} */
    rules = [];
    /** @type {HTMLElement} */
    rulesContainer;

    init() {
        super.init();
        for (const elem of this.xmlElement?.children ?? []) {
            if (elem.tagName in numericAdjustmentTypes || elem.tagName in conditionalRuleTypes) {
                this.rules.push(new EvaluationRuleElement(this, elem, true, true));
            }
        }
    }

    bindUI() {
        super.bindUI();

        this.rulesContainer = htmlElement(this.uiElement.classList.contains("evaluationRules") ? this.uiElement : this.uiElement.querySelector(".evaluationRules"));
        for (const adj of this.rules) {
            adj.spawnUI(this.rulesContainer);
        }
    }
}

class ConditionalEvaluationElement extends EvaluationRulesContainerElement {
    static {
        this.defaultTemplate = "conditionalEvaluationTemplate";
    }

    /** @param {string} templateId @param {Element} container @param {Element} insertBefore */
    spawnUIFromTemplate(templateId, container = this.parent?.uiElement, insertBefore = null) {
        const {isOptional} = this;
        let label = container.querySelector(":scope > label");
        const uiElement = super.spawnUIFromTemplate(templateId, container, insertBefore);

        const labelSlot = uiElement.querySelector("slot[name=label]");
        const labelContainer = labelSlot.parentElement;

        if (!label) {
            label = document.createElement('label');
            label.textContent = this.toString();
        }

        labelSlot.replaceWith(label);
        if (isOptional) {
            // add checkbox to label
            label.insertAdjacentHTML("afterbegin", "<input type='checkbox' class='elementPresent'> ");
        } else {
            // no checkbox, so move all label attributes to the parent element and unwrap it
            for (const attr of label.attributes) {
                labelContainer.setAttribute(attr.name, attr.value);
            }
            label.outerHTML = label.innerHTML;
        }

        return uiElement;
    }

    populateUIFields() {
        super.populateUIFields();
        if (this.rules.length > 0) {
            getElement(this.uiElement, HTMLDetailsElement).open = true;
        }
    }
}

class NumericEvaluationElement extends ConditionalEvaluationElement {
    static {
        this.defaultTemplate = "numericEvaluationTemplate";
        this.addDefaultFields([], ["value"]);
    }

    /** @type {string} */
    value;

    init() {
        super.init();
        if (this.xmlElement?.firstChild?.nodeType === Node.TEXT_NODE && this.value == null) {
            const text = this.xmlElement.firstChild.nodeValue.trim();
            if (text.length) {
                this.value = text;
            }
        }
    }

    /** @param {BaseValueClass} className */
    hasBaseValueClass(className) {
        return isBaseValueType(this.tagName) && baseValueClasses[this.tagName].split(" ").includes(className);
    }

    changeBaseValueType(type="") {
        this.uiElement.dataset.baseValueType = type;
        if (!isBaseValueType(type)) {
            return;
        }
        const baseValueClass = baseValueClasses[type];
        this.uiElement.className = `${this.uiElementClass} ${baseValueClass}`;

        for (const className of baseValueClass.split(" ")) {
            switch (className) {
                case "skillName":
                    populateSelectOptions(this.uiElement, "select.baseValueType ~ select[name=name]", skills, this.stringFields.name, s => s.label);
                    break;
                case "buffName":
                    populateSelectOptions(this.uiElement, "select.baseValueType ~ select[name=name]", buffs, this.stringFields.name, b => !(b.name in prestigeBases) && b.label);
                    break;
                // case "resourceName":
                //     populateSelectOptions(this.uiElement, "select.baseValueType ~ select[name=name]", resources, this.stringFields.name, (_, k) => k);
                //     break;
                case "functionName":
                    populateSelectOptions(this.uiElement, "select.baseValueType ~ select[name=name]", jsFunctions, this.stringFields.name, f => f.toString().replace(/\).*/,")"));
                    break;
                case "actionName":
                    populateSelectOptions(this.uiElement, "select.baseValueType ~ select[name=name]", editor.actions, this.stringFields.name, a => a instanceof ActionDefinition && a.name, (_, a) => a instanceof ActionDefinition && withoutSpaces(a.name));
                    break;
                case "limitedVarName":
                    populateSelectOptions(this.uiElement, "select.baseValueType ~ select[name=varName]", {"": "", ...editor.actions}, this.stringFields.varName, a => a === "" ? "(this Action)" : a instanceof ActionDefinition && a.type === "limited" && a.name, (_,a)=>a instanceof ActionDefinition ? a.effectiveVarName : String(a));
                    break;
                case "progressVarName":
                    populateSelectOptions(this.uiElement, "select.baseValueType ~ select[name=varName]", {"": "", ...editor.actions}, this.stringFields.varName, a => a === "" ? "(this Action)" : a instanceof ActionDefinition && a.type === "progress" && a.name, (_,a)=>a instanceof ActionDefinition ? a.effectiveVarName : String(a))
                    break;
                case "varName":
                    populateSelectOptions(this.uiElement, "select.baseValueType ~ select[name=varName]", {"": "", ...editor.actions}, this.stringFields.varName, a => a === "" ? "(this Action)" : a instanceof ActionDefinition && a.name, (_,a)=>a instanceof ActionDefinition ? a.effectiveVarName : String(a))
                    break;
                }
        }
    }

    bindUI() {
        super.bindUI();
        this.uiElementClass = this.uiElement.className;
        const typeSelect = valueElement(this.uiElement.querySelector("select.baseValueType"));
        (typeSelect.onchange = () => this.changeBaseValueType(typeSelect.value))();
    }
}

class NamedAdjustment extends EvaluationRulesContainerElement {
    static {
        this.defaultTemplate = "defineAdjustmentTemplate";
        this.addDefaultFields(["name"]);
    }
    /** @type {string} */
    name;

    toString() {
        return `Named Adjustment: ${this.name}`;
    }
}

class ActionDefinition extends DataElement {
    static {
        this.defaultTemplate = "actionDefinitionTemplate";
        this.addDefaultFields(["type", "name"], ["varName", "xmlName"]);
    }
    /** @satisfies {Record<ActionType, string>} */
    static validTypes = {
        normal: "Normal",
        limited: "Limited",
        progress: "Progress",
        multipart: "Multipart",
    }
    /** @param {string} type @returns {type is ActionType} */
    static isValidType(type) {
        return type in this.validTypes;
    }

    /** @type {ActionType} */
    type;
    /** @type {string} */
    name;

    get effectiveVarName() {
        return this.stringFields.varName ?? withoutSpaces(this.name);
    }

    toString() {
        return `${ActionDefinition.validTypes[this.type]} action: ${this.name}`;
    }

    init() {
        super.init();
        this.name ??= "";
        const literalType = this.xmlElement?.getAttribute("type");
        this.type = ActionDefinition.isValidType(literalType) ? literalType : "normal";
        if (!ActionDefinition.validTypes[this.type]) {
            console.warn(`Unknown or missing type ${this.type}, treating as normal action`, this, this.xmlElement);
            this.type = "normal";
        }
    }

    updateNameDerivations() {
        this.updatePlaceholder("input[name=varName]", withoutSpaces(this.name));
        this.updatePlaceholder("input[name=xmlName]", getXMLName(this.name));
    }
    updatePlaceholder(inputSelector, placeholderValue) {
        const element = inputElement(this.uiElement.querySelector(inputSelector));
        element.placeholder = placeholderValue;
    }

    bindUI() {
        super.bindUI();
        const typeSelect = valueElement(this.uiElement.querySelector("select[name=type]"));
        (typeSelect.onchange = () => this.uiElement.dataset.actionType = typeSelect.value)();
    }

    populateUIFields() {
        super.populateUIFields();
        this.updateNameDerivations();
    }
}

function setValueAttribute(event) {
    const target = valueElement(event.target, false, false);
    if (!target || target.type === "checkbox" || target.type === "radio") return;
    const {value} = target;
    if (value === "" || value == null) {
        target.removeAttribute("value");
    } else {
        target.setAttribute("value", value);
    }
}

class ActionListEditor {
    /** @type {NamedAdjustment[]} */
    defs = [];
    /** @type {ActionDefinition[]} */
    actions = [];
    url = "";
    xmlText = "";
    /** @type {XMLDocument} */
    xmlDoc;

    windowBound = false;

    init() {
        this.defs.length = 0;
        this.actions.length = 0;

        if (!this.windowBound) {
            this.windowBound = true;
            addEventListener("input", setValueAttribute, {capture: true, passive: true});
            for (const template of document.getElementsByTagName("template")) {
                populateSelectOptions(template.content, "select.baseValueType", baseValueTypes);
                populateSelectOptions(template.content, "select.numericTestType", {"": "", ...numericTestTypes});
                populateSelectOptionGroups(template.content, "select.evaluationRuleType", numericOrConditionalElementTypes);
            }
        }

        return this;
    }

    /** @param {string} url  */
    async load(url) {
        this.url = url;
        const res = await fetch(url);
        this.xmlText = await res.text();
        const parser = new DOMParser();
        this.xmlDoc = parser.parseFromString(this.xmlText, "text/xml");
        const actionsElement = this.xmlDoc.querySelector("actions:root");
        const defsElement = this.xmlDoc.querySelector("actions:root>defs");
        this.actionsElement = new DataElement(null, actionsElement ?? "actions").attachUI("actions");
        this.defsElement = new DataElement(this.actionsElement, defsElement ?? "defs").attachUI("defs");
        if (defsElement) {
            for (const child of defsElement.children) {
                if (child.namespaceURI !== null) {
                    continue;
                }
                if (child.tagName === "defineAdjustment") {
                    this.defs.push(new NamedAdjustment(this.defsElement, child).spawnUI());
                } else {
                    console.warn("Got unexpected child of <defs>, ignoring:", child);
                }
            }
        }
        if (actionsElement) {
            for (const child of actionsElement.children) {
                if (child.tagName === "defs" || child.namespaceURI !== null) {
                    // defs element and out-of-namespaces elements are ignored
                    continue;
                }
                if (child.tagName === "action") {
                    this.actions.push(new ActionDefinition(this.actionsElement, child).spawnUI());
                } else {
                    console.warn("Got unexpected child of <actions>, ignoring:", child);
                }
            }
        }
    }
}

let editor = new ActionListEditor();

async function startEditor() {
    loadDefaults();
    console.log("Starting editor...");
    await editor.init().load("data/actionList.xml");
    console.log(`Loaded ${editor.url}`);
}

/**
 * @template {string|number|symbol} K
 * @template {*} V
 * @param {DocumentFragment|Element} context
 * @param {string} selector
 * @param {Record<K, V>} options
 * @param {string} [currentSelection]
 * @param {(value: V, key: K) => string|false} [labelFunc]
 * @param {(value: K, key: V) => string|false} [keyFunc]
 */
function populateSelectOptions(context, selector, options, currentSelection, labelFunc = x => String(x), keyFunc = k => String(k)) {
    for (const element of context instanceof Element && !selector ? [context] : context.querySelectorAll(selector)) {
        element.innerHTML = ""; // still the fastest way to remove all children
        for (const [key, value] of /** @type {[K,V][]} */(Object.entries(options))) {
            const label = labelFunc(value, key);
            const adjKey = keyFunc(key, value);
            if (adjKey === false || label === false) continue;
            const isSelected = currentSelection === adjKey;
            element.appendChild(new Option(label, adjKey, isSelected, isSelected));
        }
    }
}

/**
 * @template {string} K
 * @template {*} V
 * @template {Record<K, V>} KV
 * @param {DocumentFragment|Element} context
 * @param {string} selector
 * @param {Record<string, KV>} optionGroups
 * @param {string} [currentSelection]
 * @param {(value: V, key: K) => string|false} [labelFunc]
 * @param {(value: K, key: V) => string|false} [keyFunc]
 */
function populateSelectOptionGroups(context, selector, optionGroups, currentSelection, labelFunc = x => String(x), keyFunc = k => String(k)) {
    for (const element of context instanceof Element && !selector ? [context] : context.querySelectorAll(selector)) {
        element.innerHTML = "";
        for (const [label, opts] of Object.entries(optionGroups)) {
            const group = document.createElement("optgroup");
            group.label = label;
            element.appendChild(group);
            populateSelectOptions(group, null, opts, currentSelection, labelFunc, keyFunc);
        }
    }
}

