package com.appsmith.server.meta.validations;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.regex.Pattern;

public class IconNameValidator implements ConstraintValidator<IconName, String> {

    private static final Pattern PATTERN = Pattern.compile("[-a-z]{1,20}");

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        return value == null || PATTERN.matcher(value).matches();
    }
}
