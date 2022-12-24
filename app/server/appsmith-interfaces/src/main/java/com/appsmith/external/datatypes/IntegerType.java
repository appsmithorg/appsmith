package com.appsmith.external.datatypes;

import com.appsmith.external.constants.DataType;

public class IntegerType implements AppsmithType{
    @Override
    public String performSmartSubstitution(String s) {
        return s;
    }

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
    public DataType type() {
        return DataType.INTEGER;
    }
}
