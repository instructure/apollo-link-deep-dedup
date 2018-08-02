import {
    CacheDataIdObj,
    Resolver,
} from './types';

/**
 * @param {string} fieldName the name of the field to be resolved
 * @param {CacheDataIdObj} idValue an object holding dataId to the corresponding object in the cache
 * @param {any} args argument associated with this field
 * @param resolutionContext a context object holding field resolution related info
 * @returns {any} resolved data or undefined if missing
 */
export const readCacheResolver: Resolver = (
    fieldName: string,
    idValue: CacheDataIdObj,
    args: any,
    resolutionContext: any,
) => {
    return undefined;
};
