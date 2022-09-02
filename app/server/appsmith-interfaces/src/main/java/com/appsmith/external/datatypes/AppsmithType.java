package com.appsmith.external.datatypes;

import com.appsmith.external.constants.DataType;

import java.util.function.Predicate;

public interface AppsmithType extends Predicate<String> {
    String performSmartSubstitution(String value);
    DataType type();
}
