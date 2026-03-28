package com.appsmith.server.helpers;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class EmailNormalizerTest {

    @Test
    void normalizeEmail_stripsWordJoiner() {
        assertThat(EmailNormalizer.normalizeEmail("\u2060user@example.com")).isEqualTo("user@example.com");
    }

    @Test
    void normalizeEmail_stripsZeroWidthSpace() {
        assertThat(EmailNormalizer.normalizeEmail("\u200Buser@example.com")).isEqualTo("user@example.com");
    }

    @Test
    void normalizeEmail_stripsMultipleInvisibleChars() {
        assertThat(EmailNormalizer.normalizeEmail("\u200B\u200C\u2060user@example\uFEFF.com"))
                .isEqualTo("user@example.com");
    }

    @Test
    void normalizeEmail_lowercasesAndTrims() {
        assertThat(EmailNormalizer.normalizeEmail("  User@Example.COM  ")).isEqualTo("user@example.com");
    }

    @Test
    void normalizeEmail_returnsNullForNull() {
        assertThat(EmailNormalizer.normalizeEmail(null)).isNull();
    }

    @Test
    void normalizeEmail_returnsNullForOnlyInvisibleChars() {
        assertThat(EmailNormalizer.normalizeEmail("\u200B\u2060")).isNull();
    }

    @Test
    void normalizeEmail_cleanEmailUnchanged() {
        assertThat(EmailNormalizer.normalizeEmail("user@example.com")).isEqualTo("user@example.com");
    }

    @Test
    void normalizeEmail_isIdempotent() {
        String once = EmailNormalizer.normalizeEmail("\u2060user@example.com");
        String twice = EmailNormalizer.normalizeEmail(once);
        assertThat(once).isEqualTo(twice);
    }

    @Test
    void containsInvisibleCharacters_detectsWordJoiner() {
        assertThat(EmailNormalizer.containsInvisibleCharacters("\u2060user@example.com"))
                .isTrue();
    }

    @Test
    void containsInvisibleCharacters_falseForCleanEmail() {
        assertThat(EmailNormalizer.containsInvisibleCharacters("user@example.com"))
                .isFalse();
    }

    @Test
    void containsInvisibleCharacters_falseForNull() {
        assertThat(EmailNormalizer.containsInvisibleCharacters(null)).isFalse();
    }
}
