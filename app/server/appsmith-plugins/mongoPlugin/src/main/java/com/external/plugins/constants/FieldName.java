package com.external.plugins.constants;

public class FieldName {

    public static final String SMART_SUBSTITUTION = "smartSubstitution";
    public static final String COMMAND = "command";
    public static final String COLLECTION = "collection";

    public static final String FIND = "find";
    public static final String UPDATE_MANY = "updateMany";
    public static final String DELETE = "delete";
    public static final String COUNT = "count";
    public static final String DISTINCT = "distinct";
    public static final String AGGREGATE = "aggregate";
    public static final String INSERT = "insert";

    public static final String QUERY = "query";
    public static final String SORT = "sort";
    public static final String PROJECTION = "projection";
    public static final String LIMIT = "limit";
    public static final String SKIP = "skip";
    public static final String UPDATE = "update";
    public static final String KEY = "key";
    public static final String PIPELINES = "arrayPipelines";
    public static final String DOCUMENTS = "documents";

    public static final String AGGREGATE_PIPELINE = AGGREGATE + "." + "arrayPipelines";
    public static final String AGGREGATE_LIMIT = AGGREGATE + "." + LIMIT;
    public static final String COUNT_QUERY = COUNT + "." + QUERY;
    public static final String DELETE_QUERY = DELETE + "." + QUERY;
    public static final String DELETE_LIMIT = DELETE + "." + LIMIT;
    public static final String DISTINCT_QUERY = DISTINCT + "." + QUERY;
    public static final String FIND_QUERY = FIND + "." + QUERY;
    public static final String FIND_SORT = FIND + "." + SORT;
    public static final String FIND_PROJECTION = FIND + "." + PROJECTION;
    public static final String INSERT_DOCUMENT = INSERT + "." + DOCUMENTS;
    public static final String UPDATE_QUERY = UPDATE_MANY + "." + QUERY;
    public static final String UPDATE_OPERATION = UPDATE_MANY + "." + UPDATE;
    public static final String DISTINCT_KEY = DISTINCT + "." + KEY;
    public static final String FIND_LIMIT = FIND + "." + LIMIT;
    public static final String FIND_SKIP = FIND + "." + SKIP;
    public static final String UPDATE_LIMIT = UPDATE_MANY + "." + LIMIT;

    public static final String RAW = "RAW";

}
