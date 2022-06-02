package com.external.utils;

public class GraphQLConstants {
    public static final String PREV = "previous";
    public static final String NEXT = "next";
    public static final String CURSOR = "cursor";
    public static final String LIMIT = "limit";
    public static final String OFFSET = "offset";
    public static final String NAME = "name";
    public static final String VALUE = "value";

    protected static String HINT_MESSAGE_FOR_DUPLICATE_VARIABLE_DEFINITION = "Your GraphQL query may not run as " +
            "expected because it has duplicate definition for variable(s): {0}. Please remove one of the definitions " +
            "- either in the query variables section or the pagination tab to resolve this issue.";
}
