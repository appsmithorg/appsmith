package com.appsmith.server.meta.validations;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.Set;
import java.util.regex.Pattern;

public class FileNameValidator implements ConstraintValidator<FileName, String> {

    // Checks built to exclude characters listed in https://stackoverflow.com/a/31976060/151048.
    private static final Pattern DISALLOWED_CHARS = Pattern.compile("[\\\\/:<>\"|?*\\x00-\\x1f]");

    // These are not allowed on Windows, even with an extension.
    private static final Set<String> DISALLOWED_NAMES = Set.of(
            "CON", "PRN", "AUX", "NUL", "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9", "LPT1",
            "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9");

    private boolean isNullValid;

    @Override
    public void initialize(FileName constraintAnnotation) {
        ConstraintValidator.super.initialize(constraintAnnotation);
        isNullValid = constraintAnnotation.isNullValid();
    }

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null) {
            return isNullValid;
        }

        if (value.isBlank() || value.startsWith(".") || value.endsWith(".") || value.length() > 255) {
            return false;
        }

        if (DISALLOWED_CHARS.matcher(value).find()) {
            return false;
        }

        return !DISALLOWED_NAMES.contains(value.split("\\.")[0].toUpperCase());
    }
}
