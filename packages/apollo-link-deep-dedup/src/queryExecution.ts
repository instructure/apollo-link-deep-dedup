// types
import { FetchResult } from 'apollo-link';
import {
    DocumentNode,
    FieldNode,
    SelectionNode,
    SelectionSetNode,
} from 'graphql';
import {
    ExecutionContext,
    ExecutionResult,
    Resolver,
    VariableMap,
} from './types';

// util functions
import {
    argumentsObjectFromField,
    getMainDefinition,
    isField,
    resultKeyNameFromField,
    shouldInclude,
} from 'apollo-utilities';
import cloneDeep = require('lodash.clonedeep');
import merge = require('lodash.merge');

/**
 * Executes a GraphQL query AST with the given field resolver
 * The implementation is based on the official GraphQL language specification
 * {@link http://facebook.github.io/graphql/June2018/#sec-Executing-Operations GraphQL Query Execution}
 * and apollo-client/graphql-anywhere
 * {@link https://github.com/apollographql/apollo-client/tree/master/packages/graphql-anywhere graphql-anywhere}
 * with additional query rewriting logic
 *
 * @param {Resolver} resolver resolver that resolves each query field
 * @param {DocumentNode} document the main GraphQL query document
 * @param {VariableMap} variableValues the variable values map associated with the query
 * @param {any} rootValue entry point passed into resolver for field resolution
 * @param {any} [resolutionContext] a context object holding field resolution related info
 * @returns {ExecutionResult} a result object containing resolved data and allResolved flag
 */
export const executeQuery = (
    resolver: Resolver,
    document: DocumentNode,
    variableValues: VariableMap,
    rootValue: any,
    resolutionContext?: any,
): ExecutionResult => {
    const mainDefinition = getMainDefinition(document);

    const executionContext: ExecutionContext = {
        variableValues,
        resolver,
        resolutionContext,
    };

    return executeSelectionSet(
        mainDefinition.selectionSet,
        rootValue,
        executionContext,
    );
};

/**
 * @param {SelectionSetNode} selectionSet a SelectionSet node in the AST to be executed
 * @param {any} rootValue entry point passed into resolver for field resolution
 * @param {ExecutionContext} executionContext a context object holding field execution related info
 */
const executeSelectionSet = (
    selectionSet: SelectionSetNode,
    rootValue: any,
    executionContext: ExecutionContext,
): ExecutionResult => {
    const resultData = {};
    const { variableValues } = executionContext;
    // modified selections list that's to replace the old one
    const deduplicatedSelections: SelectionNode[] = [];

    selectionSet.selections.forEach((selection: SelectionNode) => {
        // validate selection
        if (!shouldInclude(selection, variableValues)
            || !isField(selection)) {
            // append it to the deduplicatedSelections as part of the new AST
            deduplicatedSelections.push(selection);
            return;
        }

        const fieldResult = executeField(
            selection,
            rootValue,
            executionContext,
        );

        // if this field has not been fully resolved, include it as part of the new AST
        if (!fieldResult.allResolved) {
            deduplicatedSelections.push(selection);
        }

        // append result data to result object
        const fieldResultData: FetchResult = fieldResult.data;
        if (fieldResultData !== undefined) {
            const resultFieldKey = resultKeyNameFromField(selection);
            if (resultData[resultFieldKey] === undefined) {
                resultData[resultFieldKey] = fieldResultData;
            } else {
                merge(resultData[resultFieldKey], fieldResultData);
            }
        }
    });

    // rewrite AST by replacing selectionSet.selections with deduplicated selections
    selectionSet.selections = deduplicatedSelections;
    const allResolved = deduplicatedSelections.length === 0;
    return { data: resultData, allResolved } as ExecutionResult;
};

/**
 * @param {FieldNode} field a Field node in the AST to be executed
 * @param {any} rootValue entry point passed into resolver for field resolution
 * @param {ExecutionContext} executionContext a context object holding field execution related info
 * @returns {ExecutionResult} a result object containing resolved data and allResolved flag
 */
const executeField = (
    field: FieldNode,
    rootValue: any,
    executionContext: ExecutionContext,
): ExecutionResult => {
    const {
        variableValues,
        resolver,
        resolutionContext,
    } = executionContext;

    const fieldName = field.name.value;
    const args = argumentsObjectFromField(field, variableValues);
    const result = resolver(fieldName, rootValue, args, resolutionContext);

    // Case A: cache miss
    if (result === undefined) {
        // any field in a GraphQL response can be null, or missing
        return { data: result, allResolved: false } as ExecutionResult;
    }

    // Case B: fully resolved to scalar types
    if (!field.selectionSet) {
        return { data: result, allResolved: true } as ExecutionResult;
    }

    // From here down, the field has a selection set, which means it's trying to
    // query a GraphQLObjectType

    // Case C: resolved to a subSelectedArray
    if (Array.isArray(result)) {
        return executeSubSelectedArray(field, result, executionContext);
    }

    // Case D: resolved to a sub-selectionSet, recurse executeSelectionSet
    return executeSelectionSet(field.selectionSet, result, executionContext);
};

/**
 * @param {FieldNode} field a Field node in the AST to be executed
 * @param {any[]} subSelectedArray a (possibly nested) N-d array of selectionSets
 * @param {ExecutionContext} executionContext a context object holding field execution related info
 * @returns {ExecutionResult} a result object containing resolved data and allResolved flag
 */
const executeSubSelectedArray = (
    field: FieldNode,
    subSelectedArray: any[],
    executionContext: ExecutionContext,
): ExecutionResult => {
    const resultDataList: any = [];
    // deep-cloned copy of field,
    // to prevent the original field from being mutated during iterative field execution
    let tempField;

    subSelectedArray.forEach(item => {
        // Case A: this is a null value in the array, append it to resultDataList
        if (item === null) {
            resultDataList.push(null);
        } else {
            tempField = cloneDeep(field);
            const executionResult: ExecutionResult =
                Array.isArray(item) ?
                    // Case B: this is a nested array, recurse
                    executeSubSelectedArray(
                        tempField,
                        item,
                        executionContext,
                    )
                    :
                    // Case C: this is an object, run the selection set on it
                    executeSelectionSet(
                        tempField.selectionSet as SelectionSetNode,
                        item,
                        executionContext,
                    );
            resultDataList.push(executionResult.data);
        }
    });

    // rewrite AST by replacing selectionSet.selections with tempField's deduplicated selections
    (field.selectionSet as SelectionSetNode).selections = tempField.selectionSet.selections;
    const allResolved = tempField.selectionSet.selections.length === 0;
    return { data: (resultDataList as FetchResult), allResolved } as ExecutionResult;
};
