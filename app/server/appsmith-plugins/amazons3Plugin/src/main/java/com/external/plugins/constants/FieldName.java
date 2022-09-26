package com.external.plugins.constants;

public class FieldName {

    // Common field paths
    public static final String COMMAND = "command";
    public static final String BUCKET = "bucket";
    public static final String PATH = "path";
    public static final String BODY = "body";

    // Command paths
    public static final String CREATE = "create";
    public static final String READ = "read";
    public static final String DELETE = "delete";
    public static final String LIST = "list";

    // Command field paths
    public static final String DATATYPE = "dataType";
    public static final String EXPIRY = "expiry";
    public static final String PREFIX = "prefix";
    public static final String SIGNED_URL = "signedUrl";
    public static final String UNSIGNED_URL = "unSignedUrl";
    public static final String WHERE = "where";
    public static final String SORT = "sortBy";
    public static final String PAGINATE = "pagination";

    public static final String CREATE_EXPIRY = CREATE + "." + EXPIRY;
    public static final String CREATE_DATATYPE = CREATE + "." + DATATYPE;
    public static final String READ_EXPIRY = READ + "." + EXPIRY;
    public static final String READ_DATATYPE = READ + "." + DATATYPE;
    public static final String LIST_PREFIX = LIST + "." + PREFIX;
    public static final String LIST_SIGNED_URL = LIST + "." + SIGNED_URL;
    public static final String LIST_EXPIRY = LIST + "." + EXPIRY;
    public static final String LIST_UNSIGNED_URL = LIST + "." + UNSIGNED_URL;
    public static final String LIST_WHERE = LIST + "." + WHERE;
    public static final String LIST_SORT = LIST + "." + SORT;
    public static final String LIST_PAGINATE = LIST + "." + PAGINATE;
    public static final String SMART_SUBSTITUTION = "smartSubstitution";
}

