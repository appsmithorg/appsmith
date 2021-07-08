package com.external.plugins.constants;

public class ConfigurationIndex {
    public static final int SMART_BSON_SUBSTITUTION = 0;

    @Deprecated
    public static final int INPUT_TYPE = 1; // Input type is no longer used. Raw type is now a type of command

    public static final int COMMAND = 2;
    public static final int COLLECTION = 19;
    public static final int FIND_QUERY = 3;
    public static final int FIND_SORT = 4;
    public static final int FIND_PROJECTION = 5;
    public static final int FIND_LIMIT = 6;
    public static final int FIND_SKIP = 7;
    public static final int UPDATE_ONE_QUERY = 8;
    public static final int UPDATE_ONE_SORT = 9;
    public static final int UPDATE_ONE_UPDATE = 10;
    public static final int UPDATE_QUERY = 11;
    public static final int UPDATE_UPDATE = 12;
    public static final int UPDATE_LIMIT = 21;
    public static final int DELETE_QUERY = 13;
    public static final int DELETE_LIMIT = 20;
    public static final int COUNT_QUERY = 14;
    public static final int DISTINCT_QUERY = 15;
    public static final int DISTINCT_KEY = 16;
    public static final int AGGREGATE_PIPELINE = 17;
    public static final int INSERT_DOCUMENT = 18;

    /**
     * !!! WARNING !!!
     * Please update the size variable below whenever adding a new property in plugin specified templates
     */
    public static final int MAX_SIZE = 22;
}
