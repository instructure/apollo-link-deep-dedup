/**
 * A store interface for interacting with cache data
 */
export default class CacheDataStore {
    protected data: Object;

    constructor(seed: any) {
        this.data = seed;
    }

    public get(dataId: string) {
        return this.data[dataId];
    }
}
