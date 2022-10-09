package com.appsmith.external.datatypes;

import com.appsmith.external.constants.DataType;


public class NullType implements AppsmithType {

    @Override
    public boolean test(String s) {
        if (s == null) {
            return true;
        }
        final String trimmedValue = s.trim();
        if (trimmedValue.startsWith("[") && trimmedValue.endsWith("]")) {
            // In case of no values in the array, set this as null. Otherwise plugins like postgres and ms-sql
            // would break while creating a SQL array.
            String betweenBraces = trimmedValue.substring(1, trimmedValue.length() - 1);
            String trimmedInputBetweenBraces = betweenBraces.trim();
            return trimmedInputBetweenBraces.isEmpty();
        }
        return "null".equalsIgnoreCase(trimmedValue);
    }

    @Override
    public String performSmartSubstitution(String s) {
        return null;
    }

    @Override
    public DataType type() {
        return DataType.NULL;
    }
}