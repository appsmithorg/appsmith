package com.appsmith.external.datatypes;

public class DoubleType implements AppsmithType {

    @Override
    public boolean test(String s) {
        try {
            Double.parseDouble(s);
            return true;
        } catch (NumberFormatException e) {
            // Not a double
        }
        return false;
    }

    @Override
    public String performSmartSubstitution(String s) {
        return String.valueOf(s);
    }
}
