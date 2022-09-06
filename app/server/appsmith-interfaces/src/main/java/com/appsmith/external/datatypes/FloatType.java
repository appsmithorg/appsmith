package com.appsmith.external.datatypes;

import com.appsmith.external.constants.DataType;

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

    @Override
    public DataType type() {
        return DataType.FLOAT;
    }
}