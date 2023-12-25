// @ts-check
"use strict";

class Data {
    /** @type {Record<string, object>} */
    static rootObjects = {};
    /** @type {DataSnapshot[]} */
    static snapshotStack = [];

    /** @type {<T>(key: string, object: T) => T} */
    static register(key, object) {
        Data.rootObjects[key] = object;
        return object;
    }

    /** @type {(objects: {[key: string]: {}}) => void} */
    static registerAll(objects) {
        for (const key in objects) {
            this.register(key, objects[key]);
        }
    }

    static recordDefaults() {
        this.snapshotStack.length = 0;
        return this.recordSnapshot("defaults", null);
    }

    static recordBase() {
        if (this.snapshotStack.length === 0) {
            throw new Error("Tried to record base with no defaults layer");
        }
        this.snapshotStack.length = 1;
        return this.recordSnapshot("base", null);
    }

    /** @param {string|symbol|number|DataSnapshot} identifier */
    static getSnapshotIndex(identifier) {
        return identifier instanceof DataSnapshot ? this.snapshotStack.lastIndexOf(identifier)
             : typeof identifier === "symbol" ? this.findSnapshotIndex(s => s.tag === identifier)
             : typeof identifier === "string" ? this.findSnapshotIndex(s => s.name === identifier)
             : typeof identifier === "number" ? (identifier >= 0 ? identifier : this.snapshotStack.length + identifier)
             : -1;
    }

    /** @param {string|symbol|number|DataSnapshot} identifier */
    static getSnapshot(identifier) {
        return this.snapshotStack[this.getSnapshotIndex(identifier)];
    }

    /** @param {(snapshot: DataSnapshot) => boolean} predicate  */
    static findSnapshotIndex(predicate) {
        for (let i = this.snapshotStack.length - 1; i >= 0; i--) {
            if (predicate(this.snapshotStack[i])) {
                return i;
            }
        }
        return -1;
    }
    /** @param {(snapshot: DataSnapshot) => boolean} predicate  */
    static findSnapshot(predicate) {
        return this.snapshotStack[this.findSnapshotIndex(predicate)];
    }

    /**
     * @param {string} name Snapshot name, for debug purposes
     * @param {string|symbol|number|DataSnapshot|null=} baseIdentifier Name, identifier, index, or snapshot to delta from; explicit null for a static snapshot, -1 or omitted for previous snapshot
     * @returns {DataSnapshot | null} The new snapshot, or null if no change from previous delta
     */
    static recordSnapshot(name, baseIdentifier = -1) {
        name = `${name}:${performance.now()}`;
        const startMark = performance.mark(`start-recordSnapshot:${name}`);
        const base = this.getSnapshot(baseIdentifier);
        const snapshot = base ? new DeltaSnapshot(name, base) : new StaticSnapshot(name);
        
        if (snapshot.recordData(this.rootObjects)) {
            this.snapshotStack.push(snapshot);
            const endMark = performance.mark(`complete-recordSnapshot:${name}`);
            performance.measure(`recordSnapshot:${name}`, startMark.name, endMark.name);
            return snapshot;
        }

        const endMark = performance.mark("empty-recordSnapshot");
        performance.measure(`recordSnapshot:${name}`, startMark.name, endMark.name);
        return null;
    }

    /** @param {string|symbol|number|DataSnapshot} identifier */
    static revertToSnapshot(identifier, keepOnStack) {
        const startMark = performance.mark("start-revertToSnapshot");
        const targetSnapshot = this.getSnapshot(identifier);
        if (!targetSnapshot) {
            throw new Error(`Could not find snapshot ${String(identifier)} to revert to`);
        }
        while (this.snapshotStack.pop() !== targetSnapshot) {
        }
        if (keepOnStack) {
            this.snapshotStack.push(targetSnapshot);
        }
        targetSnapshot.applyState();
        const endMark = performance.mark("finish-revertToSnapshot");
        performance.measure("revertToSnapshot", startMark.name, endMark.name);
    }

    /** @param {string|symbol|number|DataSnapshot} identifier */
    static rewindToSnapshot(identifier, keepOnStack) {
        const startMark = performance.mark("start-rewindToSnapshot");
        const targetSnapshot = this.getSnapshot(identifier);
        if (!targetSnapshot) {
            throw new Error(`Could not find snapshot ${String(identifier)} to revert to`);
        }
        // to start, we need to record the current state so we know what's changed since the latest snapshot
        let inverse = new DeltaSnapshot("current", this.snapshotStack[this.snapshotStack.length - 1]).recordData(this.rootObjects)?.invert();
        let snap;
        while (this.snapshotStack.length >= 1) {
            snap = this.snapshotStack.pop();
            if (snap === targetSnapshot) {
                break;
            }
            if (!(snap instanceof DeltaSnapshot)) {
                throw new Error(`Encountered non-delta snapshot ${snap.name} while trying to revert:`);
            }
            // otherwise, invert it and add to the composition
            inverse = inverse?.composeWith(snap.invert()) ?? snap.invert();
        }
        if (snap !== targetSnapshot) {
            throw new Error(`Did not get to snapshot ${targetSnapshot.name}? found ${snap.name}`);
        }
        if (snap instanceof DeltaSnapshot && !keepOnStack) {
            // add snap to the composition
            inverse = inverse?.composeWith(snap.invert()) ?? snap.invert();
        } else {
            // leave it on the stack
            this.snapshotStack.push(snap);
        }
        performance.mark("rewindToSnapshot-composed")
        console.log(`Reverting using composition ${inverse.name}:`, inverse);
        inverse.applySnapshot();
        const endMark = performance.mark("finish-rewindToSnapshot");
        performance.measure("rewindToSnapshot", startMark.name, endMark.name);
    }

    /** @param {string|symbol|number|DataSnapshot} identifier */
    static discardToSnapshot(identifier) {
        const index = this.getSnapshotIndex(identifier);
        if (index < 0) {
            throw new Error(`Could not find snapshot ${String(identifier)} to discard back to`);
        }
        this.snapshotStack.length = index;
    }

    static resetToDefaults() {
        this.snapshotStack.length = 1;
        this.snapshotStack[0].applyState();
    }

    static resetToBase() {
        this.snapshotStack.length = 2;
        this.snapshotStack[1].applyState();
    }

    static shallowCopy(object) {
        const clone = Object.create(Object.getPrototypeOf(object), Object.getOwnPropertyDescriptors(object));
        return clone;
    }

    static subkey(target, name, prop) {
        if (name === "") return prop;
        if (Array.isArray(target) && !isNaN(parseInt(prop))) {
            return `${name}[${prop}]`;
        }
        return `${name}.${prop}`;
    }
}

/* global consts for typing */
const DataSnapshot_NAME = Symbol("DataSnapshot_NAME");
const DataSnapshot_OWNER = Symbol("DataSnapshot_OWNER");
const DataSnapshot_DELETED = Symbol("DataSnapshot_DELETED");
/** @typedef {{readonly [DataSnapshot_NAME]: string, readonly [DataSnapshot_OWNER]: symbol, readonly [prop: string]: any}} DataRecord */
/**
 * Creates and holds a DataRecord as it is being recorded
 */
class DataRecorder {
    /** @type {string} */
    name;
    /** @type {symbol} */
    owner;
    /** @type {DataRecord | null} */
    base;
    /** @type {DataRecord & Record<string, any>} */
    #record;

    /**
     * @param {string} name
     * @param {symbol} owner
     * @param {DataRecord | null} [base]
     */
    constructor(name, owner, base)  {
        this.name = name;
        this.owner = owner;
        this.base = base || null;
        this.#record = Object.create(null, { // don't reproto to base until finalize, otherwise we'll be affected by its readonly
            [DataSnapshot_OWNER]: {value: owner},
            [DataSnapshot_NAME]: {value: name},
        });
    }

    /** @type {(prop: string) => boolean} */
    has(prop) {
        return Object.hasOwn(this.#record, prop);
    }

    /** @param {string} prop  */
    set(prop, value) {
        this.#record[prop] = value;
    }

    /** @param {string} prop  */
    delete(prop) {
        this.#record[prop] = DataSnapshot_DELETED;
    }

    /** @returns {DataRecord | null} */
    finalize() {
        Object.setPrototypeOf(this.#record, this.base);
        return Object.freeze(this.#record);
    }
}

class DeltaRecorder extends DataRecorder {
    hasChanges = false;
    /** @type {Record<string, true>} */
    foundProps = {};

    /**
     * @param {string} name
     * @param {symbol} owner
     * @param {DataRecord} base
     */
    constructor(name, owner, base)  {
        super(name, owner, base);
    }

    /** @param {string} prop  */
    set(prop, value) {
        this.foundProps[prop] = true;
        if (!(prop in this.base) || this.base[prop] !== value) {
            this.hasChanges = true;
            super.set(prop, value);
        }
    }

    delete(prop) {
        this.hasChanges = true;
        super.delete(prop);
    }

    /** @returns {DataRecord | null} */
    finalize() {
        for (const prop in this.base) {
            if (!this.foundProps[prop]) {
                this.delete(prop);
            }
        }
        findBase:
        while (this.base) {
            // seek down through the prototype stack until we find one with properties that are still exposed
            for (const prop of Object.getOwnPropertyNames(this.base)) {
                if (!this.has(prop)) {
                    break findBase;
                }
            }
            this.base = Object.getPrototypeOf(this.base);
        }
        return this.hasChanges ? super.finalize() : null;
    }
}

/** 
 * Base class for snapshots 
 * @template {*} [O=any] A generic typedef meaning "target object"
 * @implements {ReadonlyMap<O, DataRecord>}
 */
class DataSnapshot {
    /** @type {string} */
    name;
    /** @type {symbol} */
    tag;
    /** @type {Map<O, DataRecord>} */
    objects = new Map();

    /** About how much storage space does this take up? */
    sizeEstimate = 0;

    #root;
    get root() { return this.#root; }

    get size() { return this.objects.size; }

    // For debug only
    get namedObjects() {
        const named = {};
        for (const v of this.objects.values()) {
            named[v[DataSnapshot_NAME]] = v;
        }
        return named;
    }

    /**
     * @protected
     * @param {String} name 
     */
    constructor(name) {
        this.name = name;
        this.tag = Symbol(name);
    }

    /** @param {O} object  */
    get(object) {
        return this.objects.get(object);
    }

    /** @param {O} object  */
    has(object) {
        return this.objects.has(object);
    }

    [Symbol.iterator]() {
        return this.entries();
    }

    *entries() {
        yield *this.objects.entries();
    }

    /** @type {(callbackfn: (record: DataRecord, object: O, snapshot: DataSnapshot) => void, thisArg?: any) => void}   */
    forEach(callbackfn, thisArg) {
        for (const [object, record] of this.entries()) {
            callbackfn.call(thisArg, record, object, this);
        }
    }

    *keys() {
        for (const [object, _copy] of this.entries()) {
            yield object;
        }
    }

    *values() {
        for (const [_object, copy] of this.entries()) {
            yield copy;
        }
    }

    /** @param {O} object @param {string} prop */
    getValue(object, prop) {
        const copy = this.get(object);
        const value = copy[prop];
        if (value === DataSnapshot_DELETED) return undefined;
        return value;
    }

    /** @param {O} object @returns {Generator<[string, any]>} */
    *getEntries(object) {
        const record = this.get(object);
        if (!record) return;

        yield* this.getEntriesFromRecord(record);
    }

    /** @param {DataRecord} record @returns {Generator<[string, any]>} */
    *getEntriesFromRecord(record) {
        for (const prop in record) {
            const value = record[prop];
            if (value === DataSnapshot_DELETED) continue;
            yield [prop, value];
        }
    }

    /** @param {O} object */
    *getProps(object) {
        for (const [prop, _value] of this.getEntries(object)) {
            yield prop;
        }
    }

    applySnapshot() {
        for (const [object, record] of this.objects) { // we specifically only want our own objects
            this.applyObject(object, record);
        }
    }

    applyState() {
        performance.mark("applyState-start");
        for (const [object, record] of this) {
            for (const [prop, value] of this.getEntriesFromRecord(record)) {
                if (object[prop] !== value) object[prop] = value;
            }
            for (const prop of Object.getOwnPropertyNames(object)) {
                if (!(prop in record) || record[prop] === DataSnapshot_DELETED) {
                    delete object[prop];
                }
            }
        }
        performance.mark("applyState-end");
        performance.measure("applyState", "applyState-start", "applyState-end");
    }

    /** @protected @param {O} object @param {DataRecord} record */
    applyObject(object, record) {
        for (const prop of Object.getOwnPropertyNames(record)) { // we only want modifications on our layer of the object
            const value = record[prop];
            if (value === DataSnapshot_DELETED) {
                delete object[prop];
            } else {
                object[prop] = value;
            }
        }
    }

    /** @returns {this | null} */
    finalize() {
        for (const record of this.objects.values()) {
            this.sizeEstimate += this.estimateSize(record);
        }
        Object.freeze(this);
        return this;
    }

    /** @protected @param {DataRecord} record */
    estimateSize(record) {
        // as a rough estimate, each property of each record will need a reference to its key and a reference to its value, each 64 bits
        // add another 40 bytes for the symbol-named properties and a reference to the snapshot itself
        // whatever, it's not an exact science
        return Object.getOwnPropertyNames(record).length * 16 + 40;
    }

    /** @returns {this | null} */
    recordData(root, finalize=true) {
        this.#root = root;
        this.recordHierarchy(root, "", DataSnapshot.#getEntriesForRecord);
        
        return finalize ? this.finalize() : this;
    }

    /** @param {DataSnapshot} snapshot @returns {this | null} */
    recordFromSnapshot(snapshot, finalize=true) {
        this.#root = snapshot.#root;
        this.recordHierarchy(this.#root, "", snapshot.getEntries.bind(snapshot));

        return finalize ? this.finalize() : this;
    }

    // When recording from live data we get all the string-named own properties, enumerable or not
    /** @returns {Generator<[string, any]>} */
    static *#getEntriesForRecord(object) {
        for (const prop of Object.getOwnPropertyNames(object)) {
            yield ([prop, object[prop]]);
        }
    }

    /**
     * @param {O} object Key into this.objects and source of data
     * @param {string} name Hierarchical name for debug
     * @param {(object: O) => Iterable<[string, any]>} getEntries
     * @returns {number} Number of records created
     */
    recordHierarchy(object, name, getEntries) {
        let count = 0;

        for (const [o, record] of this.walkHierarchy(object, name, getEntries)) {
            if (record) {
                count++;
                this.objects.set(o, record);
            }
        }

        return count;
    }

    /** @type {(object: O, name: string, getEntries: (object: O) => Iterable<[string, any]>, seen?: Set<O>) => Generator<[O, DataRecord | null]>} */
    *walkHierarchy(object, name, getEntries, seen) {
        if (!object) {
            throw new Error(`Called walkHierarchy for ${name} with falsy object`, object);
        }
        seen ??= new Set();
        if (seen.has(object)) {
            console.debug(`Object ${name} has already been recorded!`, object, this.objects.get(object));
            return;
        }
        seen.add(object);

        const recorder = this.createRecorder(object, name);

        for (const [prop, value] of this.processRecord(object, recorder, getEntries)) {
            yield *this.walkHierarchy(value, Data.subkey(object, name, prop), getEntries, seen);
        }

        yield [object, recorder.finalize()];
    }

    /** @type {(object: O, recorder: DataRecorder, getEntries: (object: O) => Iterable<[string, any]>) => Generator<[string, any]>} */
    *processRecord(object, recorder, getEntries) {
        for (const [prop, value] of getEntries(object)) {
            recorder.set(prop, value);

            if (value && typeof value === "object") {
                yield [prop, value];
            }
        }
    }

    /** @type {(base: DataSnapshot) => DeltaSnapshot} */
    createDeltaFrom(base) {
        const delta = new DeltaSnapshot(this.tag.description, base);
        return delta.recordFromSnapshot(this);
    }

    /** @returns {StaticSnapshot} */
    toStatic() {
        const snapshot = new StaticSnapshot(this.tag.description);
        return snapshot.recordFromSnapshot(this);
    }

    /** @protected @type {(object: O, name: string) => DataRecorder} */
    createRecorder(_object, name) {
        return new DataRecorder(name, this.tag, null);
    }
}

/** 
 * Snapshots recorded in full
 * @template {*} [O=any] A generic typedef meaning "target object"
 * @extends {DataSnapshot<O>}
 */
class StaticSnapshot extends DataSnapshot {
    /** @param {string} name  */
    constructor(name) {
        super(name);
    }

    /**  @protected @param {O} object @param {DataRecord} copy */
    applyObject(object, copy) {
        super.applyObject(object, copy);

        // static snapshot, remove missing props
        for (const prop in object) {
            if (!(prop in copy)) {
                delete object[prop];
            }
        }
    }

    toStatic() {
        return this;
    }
}

/** 
 * Snapshots recorded as a delta against a base
 * @template {*} [O=any] A generic typedef meaning "target object"
 * @extends {DataSnapshot<O>}
 */
class DeltaSnapshot extends DataSnapshot {
    /** @type {DataSnapshot<O>} */
    deltaBase;
    /** @type {DataSnapshot<O>} */
    nominalBase;

    get size() {
        let count = this.deltaBase.size;
        for (const object of this.objects.keys()) {
            if (Object.getPrototypeOf(object) === null) count++;
        }
        return count;
    }

    /**
     * @param {string} name 
     * @param {DataSnapshot<O>} deltaBase 
     */
    constructor(name, deltaBase) {
        super(name);
        this.deltaBase = deltaBase;
        this.nominalBase = deltaBase;
    }

    get(object) {
        return super.get(object) ?? this.deltaBase.get(object);
    }

    has(object) {
        return super.has(object) || this.deltaBase.has(object);
    }

    *entries() {
        yield *super.entries();
        for (const entry of this.deltaBase ?? []) {
            if (!super.has(entry[0])) yield entry;
        }
    }

    /** @returns {this | null} */
    finalize() {
        const count = this.objects.size;
        if (!count) return null;
        this.optimizeDeltaBase();
        return super.finalize();
    }

    optimizeDeltaBase() {
        /** @type {Set<symbol>} */
        const parents = new Set();
        // get a list of all names of snapshots that parent our records
        for (const record of this.objects.values()) {
            const baseRecord = Object.getPrototypeOf(record);
            if (baseRecord) {
                parents.add(baseRecord[DataSnapshot_OWNER]);
            }
        }
        // iterate down through snapshots to see which we can discard. A snapshot is discardable if
        // (a) it doesn't have any own records that we're missing,
        // (b) it's also a DeltaSnapshot, and
        // (c) its name isn't in our parents list
        discardBases:
        while (this.deltaBase instanceof DeltaSnapshot && !parents.has(this.deltaBase.tag)) {
            for (const object of this.deltaBase.objects.keys()) {
                if (!this.objects.has(object)) {
                    break discardBases;
                }
            }
            this.deltaBase = this.deltaBase.deltaBase;
        }
    }

    /** @override @type {(object: O, name: string) => DataRecorder} */
    createRecorder(object, name) {
        const base = this.deltaBase.get(object) || null;
        return new (base ? DeltaRecorder : DataRecorder)(name, this.tag, base);
    }
    
    invert(finalize=true) {
        const inverse = new DeltaSnapshot(`-${this.tag.description}`, this);
        this.objects.forEach((record, object) => inverse.#invertRecord(object, record, this.nominalBase.get(object)));
        return finalize ? inverse.finalize() : inverse;
    }

    /** @type {(object: O, record: DataRecord, baseRecord: DataRecord) => void} */
    #invertRecord(object, record, baseRecord) {
        if (baseRecord === null) {
            // this object was introduced in this delta, which means it needs no changes. Skip.
            return;
        }

        // we're good with a standard MutableRecord since we already know everything that will need changing
        const inverse = new DataRecorder(baseRecord[DataSnapshot_NAME], this.tag, record);

        for (const prop of Object.getOwnPropertyNames(record)) {
            // everything that is an own property name in record is something that has changed since base.
            if (prop in baseRecord && baseRecord[prop] !== DataSnapshot_DELETED) {
                inverse.set(prop, baseRecord[prop]);
            } else {
                inverse.delete(prop);
            }
        }

        this.objects.set(object, inverse.finalize());
    }

    /** @type {(next: DeltaSnapshot, finalize?: boolean) => DeltaSnapshot} */
    composeWith(next, finalize=true) {
        const composition = new DeltaSnapshot(`${this.tag.description}${next.tag.description.startsWith("-")?"":"+"}${next.tag.description}`, this.nominalBase);
        if (next.deltaBase === this) {
            // This is easier, we know that any object present in both only needs info from nextRecord
            // I'll do this later
        }
        for (const [object, record] of this.objects.entries()) {
            const nextRecord = next.objects.get(object);
            composition.#composeObject(object, record, nextRecord);
        }
        for (const [object, nextRecord] of next.objects.entries()) {
            if (!this.objects.has(object)) {
                composition.#composeObject(object, undefined, nextRecord);
            }
        }
        return finalize ? composition.finalize() : composition;
    }

    /** @param {DataRecord} record @param {DataRecord} nextRecord */
    #composeObject(object, record, nextRecord) {
        const baseRecord = this.nominalBase.get(object) ?? null;
        const composition = new DataRecorder(nextRecord[DataSnapshot_NAME], this.tag, baseRecord);

        // just apply all record props followed by all nextRecord props
        for (const prop of Object.getOwnPropertyNames(record ?? {})) {
            composition.set(prop, record[prop]);
        }
        for (const prop of Object.getOwnPropertyNames(nextRecord ?? {})) {
            composition.set(prop, nextRecord[prop]);
        }

        this.objects.set(object, composition.finalize());
    }
}

