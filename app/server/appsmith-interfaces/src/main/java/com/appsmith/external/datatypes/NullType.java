package com.appsmith.external.datatypes;

public class NullType implements AppsmithType {

    @Override
    public boolean test(String s) {
        if (s == null) {
            return true;
        }

        final String trimmedValue = s.trim();

        if (trimmedValue.startsWith("[") && trimmedValue.endsWith("]")) {
            String betweenBraces = trimmedValue.substring(1, trimmedValue.length() - 1);
            String trimmedInputBetweenBraces = betweenBraces.trim();
            // In case of no values in the array, set this as null. Otherwise plugins like postgres and ms-sql
            // would break while creating a SQL array.
            return trimmedInputBetweenBraces.isEmpty();
        }

        return "null".equalsIgnoreCase(trimmedValue);
    }

    @Override
    public String performSmartSubstitution(String s) {
        return String.valueOf(s);
    }
}
