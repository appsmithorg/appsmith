package com.appsmith.server.helpers;

import org.apache.commons.validator.routines.EmailValidator;

public final class ValidationUtils {

    public static boolean validateEmail(String emailStr) {
        return EmailValidator.getInstance().isValid(emailStr);
    }
}
