package com.appsmith.server.helpers;

import org.apache.commons.validator.routines.EmailValidator;
import org.springframework.util.StringUtils;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class ValidationUtils {
    public static final int LOGIN_PASSWORD_MIN_LENGTH = 6;
    public static final int LOGIN_PASSWORD_MAX_LENGTH = 48;
    private static final String EMAIL_PATTERN = "[\\w+\\-.%]+@[\\w\\-.]+\\.[A-Za-z]+";

    private static final Pattern EMAIL_CSV_PATTERN = Pattern.compile(
            "^\\s*(" + EMAIL_PATTERN + "\\s*,\\s*)*(" + EMAIL_PATTERN + ")\\s*$"
    );

    public static boolean validateEmail(String emailStr) {
        return EmailValidator.getInstance().isValid(emailStr);
    }

    public static boolean validateLoginPassword(String password) {
        int passwordLength = password.length();
        return passwordLength >= LOGIN_PASSWORD_MIN_LENGTH && passwordLength <= LOGIN_PASSWORD_MAX_LENGTH;
    }

    /**
     * Validates whether the provided string is a valid csv of emails.
     * It considers the following cases:<ul>
     * <li>At least one email must be present. Empty string is not allowed.</li>
     * <li>Space is allowed before and after comma</li>
     * </ul>
     * @param inputString input source
     * @return true if input is valid, false otherwise
     */
    public static boolean validateEmailCsv(String inputString) {
        if(!StringUtils.hasLength(inputString)) { // check for null and empty string
            return false;
        }
        final Matcher matcher = EMAIL_CSV_PATTERN.matcher(inputString);
        return matcher.matches();
    }
}
