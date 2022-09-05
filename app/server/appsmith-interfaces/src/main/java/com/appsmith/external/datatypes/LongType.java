package com.appsmith.external.datatypes;

import com.appsmith.external.constants.DataType;

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
        return s;
    }

    @Override
    public DataType type() {
        return DataType.LONG;
    }
}
