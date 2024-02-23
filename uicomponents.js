/**
 * @template {Element} T
 * A WrappingElement is a custom element that wraps a native one and attempts to behave like it.
 * For now, this is a one-way operation, because this will probably only ever be used statically.
 */
class WrappingElement extends HTMLElement {
    /**
     * @param {string|Element} elementOrId 
     * @param {boolean} [throwIfMissing] 
     * @param {boolean} [warnIfMissing] 
     */
    static get(elementOrId, throwIfMissing=true, warnIfMissing=true) {
        return getElement(elementOrId, this, throwIfMissing, warnIfMissing);
    }

    /** @type {T} */
    #wrappedElement;
    get wrappedElement() {
        return this.#wrappedElement;
    }
    /** @protected */
    set wrappedElement(element) {
        if (this.#wrappedElement === element) return;
        if (element) {
            this.wrapElement(element);
        }
    }
    get [wrappedElementSymbol]() {
        return this.wrappedElement;
    }

    /** @readonly @type {string} */
    wraps;

    observer = new MutationObserver(this.mutationHandler.bind(this));;
    /** @type {Record<string, boolean>} */
    omitAttributes = {
        __proto__: null,
        "wraps": true,
        "class": true,
        "id": true,
    };

    /** @param {(MutationRecord & {target:Element})[]} mutations */
    mutationHandler(mutations) {
        for (const {type, target, attributeName, oldValue} of mutations) {
            if (type !== "attributes" || this.omitAttributes[attributeName]) continue;
            const reflectTo = target === this ? this.wrappedElement : this;
            if (target.hasAttribute(attributeName)) {
                const value = target.getAttribute(attributeName);
                if (!reflectTo.hasAttribute(attributeName) || value !== reflectTo.getAttribute(attributeName)) {
                    reflectTo.setAttribute(attributeName, value);
                }
                if (value !== oldValue && target === this) {
                    this.attributeChanged(attributeName, value);
                }
            } else {
                if (reflectTo.hasAttribute(attributeName)) {
                    reflectTo.removeAttribute(attributeName);
                }
                if (target === this) {
                    this.attributeRemoved(attributeName);
                }
            }
        }
    }

    /** @param {string} name @param {string} value */
    attributeChanged(name, value) {
    }

    /** @param {string} name */
    attributeRemoved(name) {
    }

    /** @protected @param {T} element */
    wrapElement(element) {
        if (this.#wrappedElement) {
            throw new Error("Attempted to rebind wrappedElement!");
        }
        this.#wrappedElement = element;
        const mirroredAttributes = Object.fromEntries(Array.from(element.attributes).map(a => [a.name, a.value]));
        Object.setPrototypeOf(mirroredAttributes, null);
        for (const attr of this.attributes) {
            if (this.omitAttributes[attr.name]) continue;
            if (attr.name in mirroredAttributes) {
                delete mirroredAttributes[attr.name];
                this.omitAttributes[attr.name] = true;
            } else {
                element.setAttribute(attr.name, attr.value);
            }
        }
        for (const [name, value] of Object.entries(mirroredAttributes)) {
            if (this.omitAttributes[name]) continue;
            this.setAttribute(name, value);
        }
        // @ts-ignore
        this.wraps = element.tagName.toLowerCase();
        this.setAttribute("wraps", this.wraps);
        
        this.observer.observe(this, {attributes: true});
        this.observer.observe(element, {attributes: true});
    }
}

/** @extends {WrappingElement<HTMLValueElement>} */
class ShrinkWrapElement extends WrappingElement {
    static {
        customElements.define("shrink-wrap", this);
    }

    static get observedAttributes() {
        return ["value", "placeholder"];
    }

    /** @type {CSSStyleSheet[]} */
    static stylesheets = [];

    /** @type {DocumentFragment} */
    static template;

    static cloneTemplate() {
        if (!this.template) {
            this.template = /** @type {DocumentFragment} */(templateElement("shrinkWrapTemplate").content.cloneNode(true));
            for (const styleElement of this.template.querySelectorAll("style")) {
                const stylesheet = new CSSStyleSheet();
                stylesheet.replaceSync(styleElement.textContent);
                styleElement.remove();
                this.stylesheets.push(stylesheet);
            }
        }
        return /** @type {DocumentFragment} */(this.template.cloneNode(true));
    }

    get input() {
        return this.wrappedElement;
    }

    /** @type {HTMLSlotElement} */
    inputSlot;

    /** @type {HTMLSlotElement} */
    labelSlot;

    /** @type {HTMLElement} */
    label;

    get value() {
        return this.input.value;
    }

    set value(v) {
        if (this.input.value !== v) {
            this.input.value = v ?? "";
        }
        if (v) {
            this.setAttribute("value", v);
            // this.input.setAttribute("value", v);
        } else {
            this.removeAttribute("value");
            // this.input.removeAttribute("value");
        }
    }

    constructor() {
        super();
        this.omitAttributes["slot"] = true;
        const clonedTemplate = new.target.cloneTemplate();
        const shadow = this.attachShadow({
            mode: "open",
            delegatesFocus: true,
        });
        shadow.appendChild(clonedTemplate);
        shadow.adoptedStyleSheets.push(...new.target.stylesheets);
        this.inputHandler = this.inputHandler.bind(this);
        this.slotchangeHandler = this.slotchangeHandler.bind(this);
        this.inputSlot = shadow.querySelector("slot[name=input]");
        this.labelSlot = shadow.querySelector("slot[name=label]");
        this.inputSlot.addEventListener("slotchange", this.slotchangeHandler);
        this.labelSlot.addEventListener("slotchange", this.slotchangeHandler);
    }

    /** @param {string} value  */
    getLabel(value) {
        if (this.input instanceof HTMLSelectElement && this.input.selectedIndex >= 0) {
            return this.input.options[this.input.selectedIndex].label;
        } else if (this.input instanceof HTMLInputElement && value === "") {
            return this.input.placeholder;
        }
        return value || " "; // that's an nbsp
    }

    inputHandler() {
        if (!this.input) return;
        this.value = this.input.value ?? "";
    }

    /** @param {Event & {target: HTMLSlotElement}} event  */
    slotchangeHandler({target}) {
        if (target === this.inputSlot) {
            this.#adoptInput(valueElement(target.assignedElements()[0]));
        } else if (target === this.labelSlot) {
            this.label = htmlElement(target.assignedElements()[0]);
        }
        if (this.wrappedElement && this.label) {
            this.label.textContent = this.getLabel(this.getAttribute("value") ?? "");
        }
    }

    connectedCallback() {
        if (this.children.length === 1) {
            // simple usage, assign slot and create label
            this.firstElementChild.setAttribute("slot", "input");
            this.firstElementChild.classList.add("shrink-wrapped");
            const label = document.createElement("span");
            label.className = "shrink-wrapped label";
            label.slot = "label";
            this.append(label);
        }
    }

    /** @param {HTMLValueElement} element  */
    #adoptInput(element) {
        this.wrappedElement = element;
        this.inputSlot.addEventListener("input", this.inputHandler, {capture: true, passive: true});
        this.inputHandler();
    }

    /** @param {string} name @param {string} oldValue @param {string} newValue */
    attributeChangedCallback(name, oldValue, newValue) {
        if (this.label) {
            this.label.textContent = this.getLabel(newValue ?? "");
        }
    }
}
