package com.appsmith.external.datatypes;

public class FloatType implements AppsmithType {

    @Override
    public boolean test(String s) {
        try {
            Float.parseFloat(s);
            return true;
        } catch (NumberFormatException e) {
            // Not a float
        }
        return false;
    }

    @Override
    public String performSmartSubstitution(String s) {
        return String.valueOf(s);
    }
}
