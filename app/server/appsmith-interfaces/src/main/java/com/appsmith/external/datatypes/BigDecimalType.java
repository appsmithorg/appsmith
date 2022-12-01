package com.appsmith.external.datatypes;

import com.appsmith.external.constants.DataType;

import java.math.BigDecimal;

public class BigDecimalType implements AppsmithType{
    @Override
    public String performSmartSubstitution(String s) {
        return s;
    }

    @Override
    public boolean test(String s) {
        try {
            new BigDecimal(s);
            return true;
        } catch (NumberFormatException e) {
            // Not a BigDecimal
        }
        return false;
    }

    @Override
    public DataType type() {
        return DataType.BIGDECIMAL;
    }
}
