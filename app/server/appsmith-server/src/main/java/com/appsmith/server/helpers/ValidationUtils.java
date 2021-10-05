package com.appsmith.server.helpers;

import org.apache.commons.validator.routines.EmailValidator;

public final class ValidationUtils {
    public static final int LOGIN_PASSWORD_MIN_LENGTH = 6;
    public static final int LOGIN_PASSWORD_MAX_LENGTH = 48;

    public static boolean validateEmail(String emailStr) {
        return EmailValidator.getInstance().isValid(emailStr);
    }

    public static boolean validateLoginPassword(String password) {
        int passwordLength = password.length();
        return passwordLength >= LOGIN_PASSWORD_MIN_LENGTH && passwordLength <= LOGIN_PASSWORD_MAX_LENGTH;
    }
}
