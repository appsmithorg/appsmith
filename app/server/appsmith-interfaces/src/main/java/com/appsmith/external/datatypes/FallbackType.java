package com.appsmith.external.datatypes;

import com.appsmith.external.constants.DataType;

public class FallbackType implements AppsmithType {

    @Override
    public boolean test(String s) {
        return true;
    }

    @Override
    public String performSmartSubstitution(String s) {
        return s;
    }

    @Override
    public DataType type() {
        return DataType.STRING;
    }
}
