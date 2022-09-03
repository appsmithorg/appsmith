package com.appsmith.external.datatypes;

import com.appsmith.external.constants.DataType;

import javax.naming.OperationNotSupportedException;

public class NullType implements AppsmithType {

    @Override
    public boolean test(String s) {
        if (s == null) {
            return true;
        }
        final String trimmedValue = s.trim();
        return "null".equalsIgnoreCase(trimmedValue);
    }

    @Override
    public String performSmartSubstitution(String s) {
        return null;
    }

    @Override
    public DataType type() {
        return DataType.NULL;
    }
}