package com.appsmith.external.datatypes;

import com.appsmith.external.constants.DataType;

public class BooleanType implements AppsmithType {

    @Override
    public boolean test(String s) {
        return "true".equalsIgnoreCase(s) || "false".equalsIgnoreCase(s);
    }

    @Override
    public String performSmartSubstitution(String s) {
        return String.valueOf(s);
    }

    @Override
    public DataType type() {
        return DataType.BOOLEAN;
    }
}
