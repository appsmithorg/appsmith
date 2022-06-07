package com.appsmith.server.helpers;

import org.junit.jupiter.api.Test;
import org.junit.runner.RunWith;
import org.springframework.test.context.junit4.SpringRunner;

import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringRunner.class)
public class ValidationUtilsTest {

    @Test
    void validateEmailCsv() {
        assertThat(ValidationUtils.validateEmailCsv("")).isFalse();
        assertThat(ValidationUtils.validateEmailCsv(null)).isFalse();
        assertThat(ValidationUtils.validateEmailCsv(" ")).isFalse();
        assertThat(ValidationUtils.validateEmailCsv("a@appsmith.com")).isTrue();
        assertThat(ValidationUtils.validateEmailCsv("a@appsmith.com,a@appsmith.com")).isTrue();
        assertThat(ValidationUtils.validateEmailCsv("a@appsmith.com, b@appsmith.com")).isTrue();
        assertThat(ValidationUtils.validateEmailCsv("a@appsmith.com , a@appsmith.com")).isTrue();
        assertThat(ValidationUtils.validateEmailCsv("a@appsmith.com  ,  a@appsmith.com")).isTrue();
        assertThat(ValidationUtils.validateEmailCsv("a@appsmith.com  ,  b@appsmith.com ,c@appsmith.com")).isTrue();
        assertThat(ValidationUtils.validateEmailCsv(" a@appsmith.com , b@appsmith.com ")).isTrue();

        assertThat(ValidationUtils.validateEmailCsv("a@appsmith.com,a@appsmith.com,xyz")).isFalse();
        assertThat(ValidationUtils.validateEmailCsv("a@appsmith.com,b@appsmith.com,,")).isFalse();
        assertThat(ValidationUtils.validateEmailCsv("a@appsmith.com,b@appsmith.com, ")).isFalse();
        assertThat(ValidationUtils.validateEmailCsv(",,")).isFalse();
        assertThat(ValidationUtils.validateEmailCsv(",")).isFalse();
        assertThat(ValidationUtils.validateEmailCsv("a@appsmith.com,,")).isFalse();
    }
}