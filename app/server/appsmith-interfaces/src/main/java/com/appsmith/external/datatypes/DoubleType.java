package com.appsmith.external.datatypes;

import com.appsmith.external.constants.DataType;

public class DoubleType implements AppsmithType{
    @Override
    public String performSmartSubstitution(String value) {
        return String.valueOf(value);
    }

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
    public DataType type() {
        return DataType.DOUBLE;
    }
}
