package com.appsmith.server.helpers;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

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
        List<String> allowedChars = new ArrayList<>();
        if (includeSpecialChars) {
            allowedChars.add(specialChars);
        }
        if (includeUpperCase) {
            allowedChars.add(upperCase);
        }
        if (includeLowerCase) {
            allowedChars.add(lowerCase);
        }
        if (includeDigits) {
            allowedChars.add(digits);
        }
        if (allowedChars.isEmpty()) {
            return "z".repeat(length);
        }
        StringBuilder randomString = new StringBuilder();
        for (int i = 0; i < length; i++) {
            String allowedCharsString = allowedChars.get(i % allowedChars.size());
            randomString.append(allowedCharsString.charAt((int) (Math.random() * allowedCharsString.length())));
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
