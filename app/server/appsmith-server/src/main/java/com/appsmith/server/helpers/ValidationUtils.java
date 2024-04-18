package com.appsmith.server.helpers;

import org.apache.commons.validator.routines.EmailValidator;
import org.springframework.util.StringUtils;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class ValidationUtils {
    public static final int LOGIN_PASSWORD_MIN_LENGTH = 8;
    public static final int LOGIN_PASSWORD_MAX_LENGTH = 48;
    private static final String SPECIAL_CHARACTERS = "!@#$%^&*()_\\-\\[\\]+{}|:<>?`=;',./~\\\\";
    private static final String EMAIL_PATTERN = "[\\w+\\-.%]+@[\\w\\-.]+\\.[A-Za-z]+";
    private static final Pattern EMAIL_CSV_PATTERN =
            Pattern.compile("^\\s*(" + EMAIL_PATTERN + "\\s*,\\s*)*(" + EMAIL_PATTERN + ")\\s*$");

    // This regex is used to validate the password strength. The password should contain at least one digit, one lower
    // case letter, one upper case letter, one special character, and no whitespace. The length of the password should
    // be between 8 and 48 characters.
    private static final String STRONG_PASSWORD_REGEX = String.format(
            "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[%s])(?!.*\\s).{%d,%d}$",
            SPECIAL_CHARACTERS, LOGIN_PASSWORD_MIN_LENGTH, LOGIN_PASSWORD_MAX_LENGTH);

    public static boolean validateEmail(String emailStr) {
        // Limits defined by RFC 5321 at https://datatracker.ietf.org/doc/html/rfc5321#section-4.5.3.1.
        if (!StringUtils.hasLength(emailStr)) {
            return false;
        }

        final String[] parts = emailStr.split("@");
        if (parts.length != 2 || parts[0].length() > 64 || parts[1].length() > 255) {
            return false;
        }

        return EmailValidator.getInstance().isValid(emailStr);
    }

    public static boolean validateUserPassword(String password, boolean isStrongPasswordPolicyEnabled) {
        if (!StringUtils.hasLength(password)) {
            return false;
        }
        int passwordLength = password.length();
        if (isStrongPasswordPolicyEnabled) {
            return validateStrongPassword(password);
        }
        return passwordLength >= LOGIN_PASSWORD_MIN_LENGTH && passwordLength <= LOGIN_PASSWORD_MAX_LENGTH;
    }

    /**
     * Criteria for the stronger password:
     * 1. Password length should be between 8 and 48 characters
     * 2. Password should contain at least one digit
     * 3. Password should contain at least one lower case letter
     * 4. Password should contain at least one upper case letter
     * 5. Password should contain at least one special character
     * 6. Password should not contain any white space
     * 7. Password should not contain the username
     *
     * @param password                      The password to be validated
     * @return True if the password is strong, false otherwise
     */
    private static boolean validateStrongPassword(String password) {
        return password.matches(STRONG_PASSWORD_REGEX);
    }

    /**
     * Validates whether the provided string is a valid csv of emails.
     * It considers the following cases:<ul>
     * <li>At least one email must be present. Empty string is not allowed.</li>
     * <li>Space is allowed before and after comma</li>
     * </ul>
     *
     * @param inputString input source
     * @return true if input is valid, false otherwise
     */
    public static boolean validateEmailCsv(String inputString) {
        if (!StringUtils.hasLength(inputString)) { // check for null and empty string
            return false;
        }
        final Matcher matcher = EMAIL_CSV_PATTERN.matcher(inputString);
        return matcher.matches();
    }
}
