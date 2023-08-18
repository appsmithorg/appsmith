package com.appsmith.external.constants;

/*
   There are a lot of occurrences where DataType enum is used. We already do have so many classes to define data types
   e.g. ClientDataType, AppsmithType, DataType. Removing all the dependencies from the DataType enum might require a dedicated effort.
   Let's consider this a tech-debt and we should pay back before it's too late.
*/
public enum DataType {
    INTEGER,
    LONG,
    FLOAT,
    DOUBLE,
    BOOLEAN,
    DATE,
    TIME,
    ASCII,
    BINARY,
    BYTES,
    STRING,
    NULL,
    ARRAY,
    JSON_OBJECT,
    TIMESTAMP,
    BSON,
    BSON_SPECIAL_DATA_TYPES,
    BIGDECIMAL,
    NULL_ARRAY
}
