package com.appsmith.external.models;

import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public enum ApiContentType {
    NONE("none"),
    JSON("application/json"),
    FORM_URLENCODED("application/x-www-form-urlencoded"),
    MULTIPART_FORM_DATA("multipart/form-data"),
    RAW("raw")
    ;

    private String value;

    private static final Map<String, ApiContentType> map = Stream.of(ApiContentType.values()).collect(
            Collectors.toMap(ApiContentType::getValue, Function.identity()));

    ApiContentType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static ApiContentType getValueFromString(String value) {
        return (value == null) ? null : map.get(value);
    }

}
