package com.external.plugins.constants;

public class FieldName {

    // Common field paths
    public static final String COMMAND = "command.data";
    public static final String BUCKET = "bucket.data";
    public static final String PATH = "path.data";
    public static final String BODY = "body.data";

    // Command paths
    public static final String CREATE = "create";
    public static final String READ = "read";
    public static final String DELETE = "delete";
    public static final String LIST = "list";

    // Command field paths
    public static final String DATATYPE = "dataType.data";
    public static final String EXPIRY = "expiry.data";
    public static final String PREFIX = "prefix.data";
    public static final String SIGNED_URL = "signedUrl.data";
    public static final String UNSIGNED_URL = "unSignedUrl.data";
    public static final String WHERE = "where.data";
    public static final String SORT = "sortBy.data";
    public static final String PAGINATE = "pagination.data";

    public static final String CREATE_EXPIRY = CREATE + "." + EXPIRY;
    public static final String CREATE_AppsmithType = CREATE + "." + AppsmithType;
    public static final String READ_EXPIRY = READ + "." + EXPIRY;
    public static final String READ_AppsmithType = READ + "." + AppsmithType;
    public static final String LIST_PREFIX = LIST + "." + PREFIX;
    public static final String LIST_SIGNED_URL = LIST + "." + SIGNED_URL;
    public static final String LIST_EXPIRY = LIST + "." + EXPIRY;
    public static final String LIST_UNSIGNED_URL = LIST + "." + UNSIGNED_URL;
    public static final String LIST_WHERE = LIST + "." + WHERE;
    public static final String LIST_SORT = LIST + "." + SORT;
    public static final String LIST_PAGINATE = LIST + "." + PAGINATE;
    public static final String SMART_SUBSTITUTION = "smartSubstitution.data";
}

