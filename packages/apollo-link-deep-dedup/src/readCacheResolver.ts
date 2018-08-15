// types
import { StoreObject } from 'apollo-cache-inmemory';
import { StoreValue } from 'apollo-utilities';
import {
    CacheDataIdObj,
    Resolver,
} from './types';

// util functions
import {
    getStoreKeyName,
    isJsonValue,
} from 'apollo-utilities';

/**
 * Resolves given field against the cache
 * @param {string} fieldName the name of the field to be resolved
 * @param {CacheDataIdObj} idValue an object holding dataId to the corresponding object in the cache
 * @param {any} args argument associated with this field
 * @param {any} resolutionContext a context object holding field resolution related info
 * @returns {any} resolved data or undefined if missing
 */
export const readCacheResolver: Resolver = (
    fieldName: string,
    idValue: CacheDataIdObj,
    args: any,
    resolutionContext: any,
) => {
    const { store } = resolutionContext;  // cache data store

    // get the object from cache
    const objId: string = idValue.id;
    const obj: StoreObject = store.get(objId);

    let fieldValue: StoreValue | undefined = undefined;
    if (obj) {
        // get field from object
        const storeKeyName: string = args ? getStoreKeyName(fieldName, args) : fieldName;
        fieldValue = obj[storeKeyName]; // can also be undefined if cache miss

        // if this is an object scalar, it must be a json blob and we have to unescape it
        // this is specific to the cache data in apollo-cache-inmemory
        if (isJsonValue(fieldValue)) {
            return fieldValue.json;
        }
    }
    return fieldValue;
};

export default readCacheResolver;
