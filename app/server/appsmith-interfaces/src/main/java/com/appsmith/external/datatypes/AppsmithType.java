package com.appsmith.external.datatypes;

import java.util.function.Predicate;

public interface AppsmithType extends Predicate<String> {

    String performSmartSubstitution(String s);
}
