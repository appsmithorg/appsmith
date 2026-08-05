package com.appsmith.server.helpers.ce;

import com.appsmith.external.helpers.EncryptionHelper;
import com.appsmith.server.domains.AIAssistantConfig;
import com.appsmith.server.exceptions.AppsmithException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Storage has to state whether a value is encrypted rather than leave it to be inferred. These tests
 * pin the marker, because the failure it prevents is irreversible: once the instance encryption
 * password changes, a "does it decrypt?" test reports existing ciphertext as cleartext, the next
 * write encrypts it a second time, and the original credential can no longer be recovered.
 */
class AIConfigSecretsCETest {

    @Test
    void encryptThenDecrypt_roundTrips() {
        String encrypted = AIConfigSecretsCE.encrypt("sk-secret-key");

        assertThat(encrypted).isNotEqualTo("sk-secret-key");
        assertThat(AIConfigSecretsCE.decrypt(encrypted)).isEqualTo("sk-secret-key");
    }

    @Test
    void encryptAndDecrypt_passNullAndBlankThrough() {
        assertThat(AIConfigSecretsCE.encrypt(null)).isNull();
        assertThat(AIConfigSecretsCE.encrypt("")).isEmpty();
        assertThat(AIConfigSecretsCE.decrypt(null)).isNull();
        assertThat(AIConfigSecretsCE.decrypt("")).isEmpty();
    }

    @Test
    void isEncrypted_isTrueOnlyForMarkedValues() {
        assertThat(AIConfigSecretsCE.isEncrypted(AIConfigSecretsCE.encrypt("sk-secret-key")))
                .isTrue();
        assertThat(AIConfigSecretsCE.isEncrypted("sk-plain-text")).isFalse();
        // Ciphertext from a build that encrypted without marking is deliberately not claimed as
        // encrypted — the migration has to normalise it before it can be trusted.
        assertThat(AIConfigSecretsCE.isEncrypted(EncryptionHelper.encrypt("sk-secret-key")))
                .isFalse();
    }

    @Test
    void decrypt_leavesUnmarkedValuesAlone() {
        assertThat(AIConfigSecretsCE.decrypt("sk-written-before-encryption-existed"))
                .isEqualTo("sk-written-before-encryption-existed");
    }

    @Test
    void decrypt_failsLoudlyWhenAMarkedValueCannotBeRead() {
        // What a changed APPSMITH_ENCRYPTION_PASSWORD looks like: the marker says encrypted, the
        // bytes do not decrypt. Returning them would hand ciphertext to the provider as the API key
        // and leave the administrator staring at "invalid API key" with no idea why.
        assertThatThrownBy(() -> AIConfigSecretsCE.decrypt("enc:v1:not-actually-ciphertext"))
                .isInstanceOf(AppsmithException.class);
    }

    @Test
    void encryptCredentialsInPlace_isIdempotent() {
        AIAssistantConfig config = new AIAssistantConfig();
        config.setClaudeApiKey("sk-claude");
        config.setOpenaiApiKey(AIConfigSecretsCE.encrypt("sk-openai"));

        AIConfigSecretsCE.encryptCredentialsInPlace(config);
        String afterFirstPass = config.getClaudeApiKey();
        AIConfigSecretsCE.encryptCredentialsInPlace(config);

        assertThat(config.getClaudeApiKey()).isEqualTo(afterFirstPass);
        assertThat(AIConfigSecretsCE.decrypt(config.getClaudeApiKey())).isEqualTo("sk-claude");
        assertThat(AIConfigSecretsCE.decrypt(config.getOpenaiApiKey())).isEqualTo("sk-openai");
    }

    @Test
    void normalizeForStorage_marksCleartext() {
        String normalized = AIConfigSecretsCE.normalizeForStorage("sk-cleartext");

        assertThat(AIConfigSecretsCE.isEncrypted(normalized)).isTrue();
        assertThat(AIConfigSecretsCE.decrypt(normalized)).isEqualTo("sk-cleartext");
    }

    @Test
    void normalizeForStorage_marksPreExistingCiphertextWithoutEncryptingItAgain() {
        String unmarkedCiphertext = EncryptionHelper.encrypt("sk-already-encrypted");

        String normalized = AIConfigSecretsCE.normalizeForStorage(unmarkedCiphertext);

        assertThat(normalized).endsWith(unmarkedCiphertext);
        assertThat(AIConfigSecretsCE.decrypt(normalized)).isEqualTo("sk-already-encrypted");
    }

    @Test
    void normalizeForStorage_returnsNullWhenThereIsNothingToWrite() {
        assertThat(AIConfigSecretsCE.normalizeForStorage(null)).isNull();
        assertThat(AIConfigSecretsCE.normalizeForStorage("")).isNull();
        assertThat(AIConfigSecretsCE.normalizeForStorage(AIConfigSecretsCE.encrypt("sk-secret-key")))
                .isNull();
    }
}
