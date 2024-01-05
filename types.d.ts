declare interface Action<const N, const E> {
    // provided as extras in constructor:
    type: E["type"];
    expMult: E["expMult"];
    townNum: E["townNum"];
    story?: (completed: number) => void,
    storyReqs?: (storyNum: number) => boolean;
    stats: E["stats"];
    canStart(): boolean;
    cost?: () => void,
    manaCost(): number;
    goldCost?: () => number;
    allowed?: () => number;
    visible(): boolean;
    unlocked(): boolean;
    finish(): void;
    skills?: E["skills"];
    grantsBuff?: E["grantsBuff"];
    affectedBy?: readonly string[];
}

declare interface MultipartAction<const N, const E> {
    segments: number;

    loopStats: E["loopStats"];
    loopCost(segment: number): number;
    tickProgress(offset: number): number;
    segmentFinished?: () => void;
    loopsFinished(): void;
    getPartName(): string;
    completedTooltip?: () => string;
}

declare interface DungeonAction<const N, const E> {

}

declare interface TrialAction<const N, const E> {
    floorReward(): ReturnType<E["floorReward"]>;
    baseProgress(): number;
    baseScaling: E["baseScaling"];
    exponentScaling?: E["exponentScaling"];
}

declare interface AssassinAction<const N, const E> {

}

declare const LZString = await import("lz-string");