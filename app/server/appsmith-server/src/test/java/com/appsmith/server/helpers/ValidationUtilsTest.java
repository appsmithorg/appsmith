package com.appsmith.server.helpers;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

public class ValidationUtilsTest {

    private String createRandomString(
            int length,
            boolean includeSpecialChars,
            boolean includeUpperCase,
            boolean includeLowerCase,
            boolean includeDigits) {
        String specialChars = "!@#$%^&*()_\\-\\[\\]+{}|:<>?`=;',./~";
        String upperCase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        String lowerCase = "abcdefghijklmnopqrstuvwxyz";
        String digits = "0123456789";
        String allowedChars = "z";
        if (includeSpecialChars) {
            allowedChars += specialChars;
        }
        if (includeUpperCase) {
            allowedChars += upperCase;
        }
        if (includeLowerCase) {
            allowedChars += lowerCase;
        }
        if (includeDigits) {
            allowedChars += digits;
        }
        StringBuilder randomString = new StringBuilder();
        for (int i = 0; i < length; i++) {
            randomString.append(allowedChars.charAt((int) (Math.random() * allowedChars.length())));
        }
        return randomString.toString();
    }

    private String createRandomString(int length) {
        return createRandomString(length, false, false, false, false);
    }

    @Test
    public void validateEmailCsv() {
        assertThat(ValidationUtils.validateEmailCsv("")).isFalse();
        assertThat(ValidationUtils.validateEmailCsv(null)).isFalse();
        assertThat(ValidationUtils.validateEmailCsv(" ")).isFalse();
        assertThat(ValidationUtils.validateEmailCsv("a@appsmith.com")).isTrue();
        assertThat(ValidationUtils.validateEmailCsv("a@appsmith.com,a@appsmith.com"))
                .isTrue();
        assertThat(ValidationUtils.validateEmailCsv("a@appsmith.com, b@appsmith.com"))
                .isTrue();
        assertThat(ValidationUtils.validateEmailCsv("a@appsmith.com , a@appsmith.com"))
                .isTrue();
        assertThat(ValidationUtils.validateEmailCsv("a@appsmith.com  ,  a@appsmith.com"))
                .isTrue();
        assertThat(ValidationUtils.validateEmailCsv("a@appsmith.com  ,  b@appsmith.com ,c@appsmith.com"))
                .isTrue();
        assertThat(ValidationUtils.validateEmailCsv(" a@appsmith.com , b@appsmith.com "))
                .isTrue();

        assertThat(ValidationUtils.validateEmailCsv("a@appsmith.com,a@appsmith.com,xyz"))
                .isFalse();
        assertThat(ValidationUtils.validateEmailCsv("a@appsmith.com,b@appsmith.com,,"))
                .isFalse();
        assertThat(ValidationUtils.validateEmailCsv("a@appsmith.com,b@appsmith.com, "))
                .isFalse();
        assertThat(ValidationUtils.validateEmailCsv(",,")).isFalse();
        assertThat(ValidationUtils.validateEmailCsv(",")).isFalse();
        assertThat(ValidationUtils.validateEmailCsv("a@appsmith.com,,")).isFalse();
    }

    @Test
    public void validateUserPassword_whenStrongPasswordPolicyIsDisabled() {
        assertThat(ValidationUtils.validateUserPassword("", false)).isFalse();
        assertThat(ValidationUtils.validateUserPassword(null, false)).isFalse();
        assertThat(ValidationUtils.validateUserPassword(" ", false)).isFalse();
        assertThat(ValidationUtils.validateUserPassword(createRandomString(7), false))
                .isFalse();
        assertThat(ValidationUtils.validateUserPassword(createRandomString(49), false))
                .isFalse();
        assertThat(ValidationUtils.validateUserPassword(createRandomString(8), false))
                .isTrue();
        assertThat(ValidationUtils.validateUserPassword(createRandomString(48), false))
                .isTrue();
    }

    @Test
    public void validateUserPassword_whenStrongPasswordPolicyIsEnabled() {
        assertThat(ValidationUtils.validateUserPassword("", true)).isFalse();
        assertThat(ValidationUtils.validateUserPassword(null, true)).isFalse();
        assertThat(ValidationUtils.validateUserPassword(" ", true)).isFalse();
        assertThat(ValidationUtils.validateUserPassword(createRandomString(7), true))
                .isFalse();
        assertThat(ValidationUtils.validateUserPassword(createRandomString(49), true))
                .isFalse();
        assertThat(ValidationUtils.validateUserPassword(createRandomString(10, false, true, true, true), true))
                .isFalse();
        assertThat(ValidationUtils.validateUserPassword(createRandomString(10, true, false, true, true), true))
                .isFalse();
        assertThat(ValidationUtils.validateUserPassword(createRandomString(10, true, true, false, true), true))
                .isFalse();
        assertThat(ValidationUtils.validateUserPassword(createRandomString(10, true, true, true, false), true))
                .isFalse();
        assertThat(ValidationUtils.validateUserPassword(createRandomString(10, true, true, true, true), true))
                .isTrue();
    }
}
