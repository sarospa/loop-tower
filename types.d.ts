declare interface Action<const E, N, VN> {
    name: N;
    varName: VN;

    // provided as extras in constructor:
    type: E["type"];
    expMult: E["expMult"];
    townNum: number;
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
    affectedBy?: readonly string[];
}

declare interface MultipartAction<const E, N> {
    segments: number;

    loopStats: E["loopStats"];
    loopCost(segment: number): number;
    tickProgress(offset: number): number;
    segmentFinished?: () => void;
    loopsFinished(): void;
    getPartName(): string;
    completedTooltip?: () => string;
}

declare interface DungeonAction<const E, N> {

}

declare interface TrialAction<const E, N> {
    floorReward(): ReturnType<E["floorReward"]>;
    baseProgress(): number;
    baseScaling: E["baseScaling"];
    exponentScaling?: E["exponentScaling"];
}

declare interface AssassinAction<const E, N> {

}
