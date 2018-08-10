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
    toIdValue,
} from 'apollo-utilities';

/**
 * Resolves given field against the cache
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
    const {
        store, // cache store
        cacheRedirects,
        dataIdFromObject,
    } = resolutionContext;

    // get the object from cache
    const objId: string = idValue.id;
    const obj: StoreObject = store.get(objId);

    let fieldValue: StoreValue | undefined = undefined;
    if (obj) {
        // get field from object
        const storeKeyName: string = args ? getStoreKeyName(fieldName, args) : fieldName;
        fieldValue = obj[storeKeyName]; // can also be undefined if cache miss

        // handle cache redirects
        if (
            typeof fieldValue === 'undefined' &&
            cacheRedirects &&
            (obj.__typename || objId === 'ROOT_QUERY')
        ) {
            const typename = obj.__typename || 'Query';
            // Look for the type in the custom resolver map
            const type = cacheRedirects[typename];
            if (type) {
                // Look for the field in the custom resolver map
                const resolver = type[fieldName];
                if (resolver) {
                    fieldValue = resolver(obj, args, {
                        getCacheKey(storeObj: StoreObject) {
                            return toIdValue({
                                id: dataIdFromObject(storeObj),
                                typename: storeObj.__typename,
                            });
                        },
                    });
                }
            }
        }

        // if this is an object scalar, it must be a json blob and we have to unescape it
        if (isJsonValue(fieldValue)) {
            return fieldValue.json;
        }
    }

    return fieldValue;
};
