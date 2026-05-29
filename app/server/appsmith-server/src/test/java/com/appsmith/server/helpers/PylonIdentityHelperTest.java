package com.appsmith.server.helpers;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PylonIdentityHelperTest {

    // 32-byte hex secret used to generate the reference HMAC vector below. Not a real
    // secret — gitleaks:allow
    private static final String VALID_SECRET_HEX =
            "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"; // gitleaks:allow

    // Reference vector computed with Python's hmac.new(bytes.fromhex(secret), email, sha256).hexdigest()
    private static final String EXPECTED_HASH = "36d0c6e218fbaf3177bcc2fecd3df6f1a371ecdb0a0a0113240b3384ad69a5b7";

    @Test
    void computeEmailHash_matchesReferenceVector() {
        assertThat(PylonIdentityHelper.computeEmailHash(VALID_SECRET_HEX, "user@example.com"))
                .isEqualTo(EXPECTED_HASH);
    }

    @Test
    void computeEmailHash_returnsNullWhenSecretIsBlank() {
        assertThat(PylonIdentityHelper.computeEmailHash(null, "user@example.com"))
                .isNull();
        assertThat(PylonIdentityHelper.computeEmailHash("", "user@example.com")).isNull();
        assertThat(PylonIdentityHelper.computeEmailHash("   ", "user@example.com"))
                .isNull();
    }

    @Test
    void computeEmailHash_returnsNullWhenEmailIsBlank() {
        assertThat(PylonIdentityHelper.computeEmailHash(VALID_SECRET_HEX, null)).isNull();
        assertThat(PylonIdentityHelper.computeEmailHash(VALID_SECRET_HEX, "")).isNull();
    }

    @Test
    void computeEmailHash_returnsNullWhenSecretIsNotValidHex() {
        assertThat(PylonIdentityHelper.computeEmailHash("not-hex-zzz", "user@example.com"))
                .isNull();
    }
}
