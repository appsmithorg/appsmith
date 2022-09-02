package com.external.plugins.datatypes;

import com.appsmith.external.constants.DataType;
import com.appsmith.external.datatypes.AppsmithType;

public class MySQLBooleanType implements AppsmithType {

    @Override
    public boolean test(String s) {
        return "true".equalsIgnoreCase(s) || "false".equalsIgnoreCase(s);
    }

    @Override
    public String performSmartSubstitution(String s) {
        if ("true".equalsIgnoreCase(s)) {
            return String.valueOf(1);
        }
        return String.valueOf(0);
    }

    @Override
    public DataType type() {
        return DataType.BOOLEAN;
    }
}
