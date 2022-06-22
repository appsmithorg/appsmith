package com.appsmith.external.datatypes;

public class IntegerType implements AppsmithType {

    @Override
    public boolean test(String s) {
        try {
            Integer.parseInt(s);
            return true;
        } catch (NumberFormatException e) {
            // Not an integer
        }
        return false;
    }

    @Override
    public String performSmartSubstitution(String s) {
        return String.valueOf(s);
    }
}
