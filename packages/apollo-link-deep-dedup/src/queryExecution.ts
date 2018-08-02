import { FetchResult } from 'apollo-link';

// util funcs from apollo-utilities
import {
    argumentsObjectFromField,
    getMainDefinition,
    isField,
    resultKeyNameFromField,
    shouldInclude,
} from 'apollo-utilities';

// util funcs from lodash
import {
    cloneDeep,
    merge,
} from 'lodash';

// graphql types
import {
    DocumentNode,
    FieldNode,
    SelectionNode,
    SelectionSetNode,
} from 'graphql';

// custom types
import {
    ExecContext,
    FieldResult,
    QueryResult,
    Resolver,
    VariableMap,
} from './types';

/**
 * @param {Resolver} resolver resolver that resolves each query field
 * @param {DocumentNode} document the main GraphQL query document
 * @param {VariableMap} variableValues the variable values map associated with the query
 * @param {any} rootValue entry point passed into resolver for field resolution
 * @param {any} [resolutionContext] a context object holding field resolution related info
 * @returns {QueryResult} a result object containing resolved data and allResolved flag
 */
export const executeQuery = (
    resolver: Resolver,
    document: DocumentNode,
    variableValues: VariableMap,
    rootValue: any,
    resolutionContext?: any,
): QueryResult => {
    const mainDefinition = getMainDefinition(document);

    const execContext: ExecContext = {
        variableValues,
        resolver,
        resolutionContext,
    };

    const queryResult = executeSelectionSet(
        mainDefinition.selectionSet,
        rootValue,
        execContext,
    );

    return {
        data: queryResult,
        allResolved: selectionSetAllResolved(mainDefinition.selectionSet),
    } as QueryResult;
};

const executeSelectionSet = (
    selectionSet: SelectionSetNode,
    rootValue: any,
    execContext: ExecContext,
): FetchResult => {
    const result = {};
    // modified selections list that's to replace the old one
    const deduplicatedSelections: SelectionNode[] = [];
    const { variableValues } = execContext;

    selectionSet.selections.forEach((selection: SelectionNode) => {
        // validate selection
        if (!shouldInclude(selection, variableValues)
            || !isField(selection)) {
            return;
        }

        const fieldResult = executeField(
            selection,
            rootValue,
            execContext,
        );

        // if this field has not been fully resolved, include it as part of the new AST
        if (!fieldResult.allResolved) {
            deduplicatedSelections.push(selection);
        }

        const fieldResultData: FetchResult = fieldResult.data;
        // append result data to result object
        if (fieldResultData !== undefined) {
            const resultFieldKey = resultKeyNameFromField(selection);
            if (result[resultFieldKey] === undefined) {
                result[resultFieldKey] = fieldResultData;
            } else {
                merge(result[resultFieldKey], fieldResultData);
            }
        }
        return;
    });

    // rewrite AST by replacing selectionSet.selections with deduplicated selections
    selectionSet.selections = deduplicatedSelections;
    return result;
};

/**
 * @param {FieldNode} field a field node in the AST to be executed
 * @param {any} rootValue entry point passed into resolver for field resolution
 * @param {ExecContext} execContext a context object holding field execution related info
 * @returns {FieldResult} a result object containing resolved data and allResolved flag
 */
const executeField = (
    field: FieldNode,
    rootValue: any,
    execContext: ExecContext,
): FieldResult => {
    const {
        variableValues,
        resolver,
        resolutionContext,
    } = execContext;

    const fieldName = field.name.value;
    const args = argumentsObjectFromField(field, variableValues);
    const result = resolver(fieldName, rootValue, args, resolutionContext);

    // Case A: cache miss
    if (result === undefined) {
        // any field in a GraphQL response can be null, or missing
        return { data: result, allResolved: false } as FieldResult;
    }

    // Case B: fully resolved into scalar types
    if (!field.selectionSet) {
        return { data: result, allResolved: true } as FieldResult;
    }

    // From here down, the field has a selection set, which means it's trying to
    // query a GraphQLObjectType

    // Case C: resolved into a subSelectedArray
    if (Array.isArray(result)) {
        return executeSubSelectedArray(field, result, execContext);
    }

    // Case D: resolved into a sub-selectionSet, recurse executeSelectionSet
    const executeSelectionSetResult = executeSelectionSet(field.selectionSet, result, execContext);
    return {
        data: executeSelectionSetResult,
        allResolved: selectionSetAllResolved(field.selectionSet),
    } as FieldResult;
};

/**
 *
 * @param {FieldNode} field a field node in the AST to be executed
 * @param {any[]} subSelectedArray a (possibly nested) N-d array of selectionSets
 * @param {ExecContext} execContext a context object holding field execution related info
 * @returns {FieldResult} a result object containing resolved data and allResolved flag
 */
const executeSubSelectedArray = (
    field: FieldNode,
    subSelectedArray: any[],
    execContext: ExecContext,
): FieldResult => {

    // deep-cloned copy of field, to prevent the original field from being mutated during field execution
    let tempField;
    const resultDataList: FetchResult[] = [];
    const allResolvedList: boolean[] = [];

    subSelectedArray.forEach(item => {
        // handle null value in array
        if (item === null) {
            return null;
        }

        tempField = cloneDeep(field);
        if (Array.isArray(item)) {
            // Case A: this is a nested array, recurse
            const executeSubSelectedArrayResult: FieldResult = executeSubSelectedArray(
                tempField,
                item,
                execContext,
            );
            resultDataList.push(executeSubSelectedArrayResult.data);
            allResolvedList.push(executeSubSelectedArrayResult.allResolved);
        } else {
            // Case B: this is an object, run the selection set on it
            const executeSelectionSetResult: FetchResult = executeSelectionSet(
                tempField.selectionSet as SelectionSetNode,
                item,
                execContext,
            );
            resultDataList.push(executeSelectionSetResult);
            allResolvedList.push(selectionSetAllResolved(tempField.selectionSet));
        }
    });

    // assign the executed tempField to the original field in the end
    field = tempField;

    return {
        data: resultDataList,
        allResolved: allResolvedList.every(allResolved => allResolved),
    } as FieldResult;
};

/**
 * @param {SelectionNode} selectionSet a selectionSet node in the AST
 * @returns {boolean} whether all selections in the selectionSet have been resolved
 */
const selectionSetAllResolved = (selectionSet: SelectionSetNode): boolean =>
    selectionSet.selections.length === 0;
