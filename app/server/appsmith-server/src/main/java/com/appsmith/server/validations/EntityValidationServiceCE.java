package com.appsmith.server.validations;

public interface EntityValidationServiceCE {

    boolean validateName(String name, Boolean isInternal);

    default boolean validateName(String name) {
        return this.validateName(name, false);
    }
}
