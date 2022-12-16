package com.external.utils;

public class GraphQLConstants {
    public static final String PREV_LIMIT_VARIABLE_NAME = "prevLimitVariableName";
    public static final String PREV_LIMIT_VAL = "prevLimitValue";
    public static final String PREV_CURSOR_VARIABLE_NAME = "prevCursorVariableName";
    public static final String PREV_CURSOR_VAL = "prevCursorValue";
    public static final String NEXT_LIMIT_VARIABLE_NAME = "nextLimitVariableName";
    public static final String NEXT_LIMIT_VAL = "nextLimitValue";
    public static final String NEXT_CURSOR_VARIABLE_NAME = "nextCursorVariableName";
    public static final String NEXT_CURSOR_VAL = "nextCursorValue";
    public static final String LIMIT_VARIABLE_NAME = "limitVariableName";
    public static final String LIMIT_VAL = "limitValue";
    public static final String OFFSET_VARIABLE_NAME = "offsetVariableName";
    public static final String OFFSET_VAL = "offsetValue";
    protected static String HINT_MESSAGE_FOR_DUPLICATE_VARIABLE_DEFINITION = "Your GraphQL query may not run as " +
            "expected because it has duplicate definition for variable(s): {0}. Please remove one of the definitions " +
            "- either in the query variables section or the pagination tab to resolve this issue.";
}
