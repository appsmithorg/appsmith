package com.appsmith.external.constants.spans.ce;

import static com.appsmith.external.constants.spans.BaseSpan.APPSMITH_SPAN_PREFIX;

/**
 * Please make sure that all span names start with `appsmith.` because span with any other naming format would get
 * dropped / ignored as defined in TracingConfig.java
 */
public final class RefactorSpanCE {
    // Main refactoring flow spans
    public static final String REFACTOR_PREFIX = "refactor.";
    public static final String REFACTOR_ENTITY_NAME = APPSMITH_SPAN_PREFIX + REFACTOR_PREFIX + "entityName";
    public static final String REFACTOR_COMPOSITE_ENTITY_NAME =
            APPSMITH_SPAN_PREFIX + REFACTOR_PREFIX + "compositeEntityName";
    public static final String REFACTOR_NAME = APPSMITH_SPAN_PREFIX + REFACTOR_PREFIX + "name";
    public static final String REFACTOR_ALL_REFERENCES = APPSMITH_SPAN_PREFIX + REFACTOR_PREFIX + "allReferences";

    // Validation spans
    public static final String VALIDATE_ENTITY_NAME = APPSMITH_SPAN_PREFIX + REFACTOR_PREFIX + "validateEntityName";
    public static final String VALIDATE_NAME = APPSMITH_SPAN_PREFIX + REFACTOR_PREFIX + "validateName";
    public static final String IS_NAME_ALLOWED = APPSMITH_SPAN_PREFIX + REFACTOR_PREFIX + "isNameAllowed";
    public static final String GET_ALL_EXISTING_ENTITIES =
            APPSMITH_SPAN_PREFIX + REFACTOR_PREFIX + "getAllExistingEntities";

    // Widget refactoring spans
    public static final String WIDGET_REFACTOR_REFERENCES =
            APPSMITH_SPAN_PREFIX + REFACTOR_PREFIX + "widget.references";
    public static final String WIDGET_REFACTOR_NAME_IN_DSL =
            APPSMITH_SPAN_PREFIX + REFACTOR_PREFIX + "widget.nameInDsl";
    public static final String WIDGET_GET_CONTEXT_DTO = APPSMITH_SPAN_PREFIX + REFACTOR_PREFIX + "widget.getContextDto";
    public static final String WIDGET_UPDATE_CONTEXT = APPSMITH_SPAN_PREFIX + REFACTOR_PREFIX + "widget.updateContext";
    public static final String WIDGET_GET_EXISTING_NAMES =
            APPSMITH_SPAN_PREFIX + REFACTOR_PREFIX + "widget.getExistingNames";

    // Action refactoring spans
    public static final String ACTION_REFACTOR_REFERENCES =
            APPSMITH_SPAN_PREFIX + REFACTOR_PREFIX + "action.references";
    public static final String ACTION_REFACTOR_NAME_IN_ACTION =
            APPSMITH_SPAN_PREFIX + REFACTOR_PREFIX + "action.nameInAction";
    public static final String ACTION_GET_BY_CONTEXT = APPSMITH_SPAN_PREFIX + REFACTOR_PREFIX + "action.getByContext";
    public static final String ACTION_UPDATE_REFACTORED =
            APPSMITH_SPAN_PREFIX + REFACTOR_PREFIX + "action.updateRefactored";
    public static final String ACTION_EXTRACT_JSON_PATHS =
            APPSMITH_SPAN_PREFIX + REFACTOR_PREFIX + "action.extractJsonPaths";
    public static final String ACTION_SAVE = APPSMITH_SPAN_PREFIX + REFACTOR_PREFIX + "action.save";
    public static final String ACTION_GET_EXISTING_NAMES =
            APPSMITH_SPAN_PREFIX + REFACTOR_PREFIX + "action.getExistingNames";
    public static final String ACTION_REFACTOR_DYNAMIC_BINDINGS =
            APPSMITH_SPAN_PREFIX + REFACTOR_PREFIX + "action.dynamicBindings";

    // Action collection refactoring spans
    public static final String COLLECTION_REFACTOR_REFERENCES =
            APPSMITH_SPAN_PREFIX + REFACTOR_PREFIX + "collection.references";
    public static final String COLLECTION_REFACTOR_NAME_IN_COLLECTION =
            APPSMITH_SPAN_PREFIX + REFACTOR_PREFIX + "collection.nameInCollection";
    public static final String COLLECTION_SAVE = APPSMITH_SPAN_PREFIX + REFACTOR_PREFIX + "collection.save";
    public static final String COLLECTION_UPDATE_REFACTORED =
            APPSMITH_SPAN_PREFIX + REFACTOR_PREFIX + "collection.updateRefactored";
    public static final String COLLECTION_UPDATE_ACTIONS_FQN =
            APPSMITH_SPAN_PREFIX + REFACTOR_PREFIX + "collection.updateActionsFqn";
    public static final String COLLECTION_GET_EXISTING_NAMES =
            APPSMITH_SPAN_PREFIX + REFACTOR_PREFIX + "collection.getExistingNames";

    // Module instance refactoring spans
    public static final String MODULE_INSTANCE_REFACTOR_REFERENCES =
            APPSMITH_SPAN_PREFIX + REFACTOR_PREFIX + "moduleInstance.references";
    public static final String MODULE_INSTANCE_REFACTOR_NAME =
            APPSMITH_SPAN_PREFIX + REFACTOR_PREFIX + "moduleInstance.name";
    public static final String MODULE_INSTANCE_REFACTOR_INPUTS =
            APPSMITH_SPAN_PREFIX + REFACTOR_PREFIX + "moduleInstance.inputs";
    public static final String MODULE_INSTANCE_REFACTOR_LAYOUTS =
            APPSMITH_SPAN_PREFIX + REFACTOR_PREFIX + "moduleInstance.layouts";
    public static final String MODULE_INSTANCE_REFACTOR_OUTPUTS =
            APPSMITH_SPAN_PREFIX + REFACTOR_PREFIX + "moduleInstance.outputs";
    public static final String MODULE_INSTANCE_UPDATE_REFACTORED =
            APPSMITH_SPAN_PREFIX + REFACTOR_PREFIX + "moduleInstance.updateRefactored";
    public static final String MODULE_INSTANCE_GET_EXISTING_NAMES =
            APPSMITH_SPAN_PREFIX + REFACTOR_PREFIX + "moduleInstance.getExistingNames";

    // Module input refactoring spans
    public static final String MODULE_INPUT_UPDATE_REFACTORED =
            APPSMITH_SPAN_PREFIX + REFACTOR_PREFIX + "moduleInput.updateRefactored";
    public static final String MODULE_INPUT_GET_EXISTING_NAMES =
            APPSMITH_SPAN_PREFIX + REFACTOR_PREFIX + "moduleInput.getExistingNames";

    // AST service spans for refactoring
    public static final String AST_REPLACE_VALUE_IN_MUSTACHE =
            APPSMITH_SPAN_PREFIX + REFACTOR_PREFIX + "ast.replaceValueInMustache";

    // Layout update spans
    public static final String UPDATE_LAYOUT = APPSMITH_SPAN_PREFIX + REFACTOR_PREFIX + "updateLayout";
    public static final String UNESCAPE_MONGO_CHARS = APPSMITH_SPAN_PREFIX + REFACTOR_PREFIX + "unescapeMongoChars";

    // Analytics spans
    public static final String SEND_REFACTOR_ANALYTICS = APPSMITH_SPAN_PREFIX + REFACTOR_PREFIX + "sendAnalytics";
    public static final String PREPARE_ANALYTICS = APPSMITH_SPAN_PREFIX + REFACTOR_PREFIX + "prepareAnalytics";
}
