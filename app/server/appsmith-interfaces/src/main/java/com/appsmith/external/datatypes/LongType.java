package com.appsmith.external.datatypes;

public class LongType implements AppsmithType {

    @Override
    public boolean test(String s) {
        try {
            Long.parseLong(s);
            return true;
        } catch (NumberFormatException e) {
            // Not a long
        }
        return false;
    }

    @Override
    public String performSmartSubstitution(String s) {
        return String.valueOf(s);
    }
}
