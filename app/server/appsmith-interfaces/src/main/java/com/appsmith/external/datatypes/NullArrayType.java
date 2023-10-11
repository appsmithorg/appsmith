package com.appsmith.external.datatypes;

import com.appsmith.external.constants.DataType;

public class NullArrayType implements AppsmithType {
    @Override
    public boolean test(String s) {
        final String trimmedValue = s.trim();

        if (trimmedValue.startsWith("[") && trimmedValue.endsWith("]")) {
            // In case of no values in the array, set this as null. Otherwise plugins like postgres and ms-sql
            // would break while creating a SQL array.
            String betweenBraces = trimmedValue.substring(1, trimmedValue.length() - 1);
            String trimmedInputBetweenBraces = betweenBraces.trim();
            return trimmedInputBetweenBraces.isEmpty();
        }

        return false;
    }

    @Override
    public String performSmartSubstitution(String s) {
        return s;
    }

    @Override
    public DataType type() {
        return DataType.NULL_ARRAY;
    }
}
