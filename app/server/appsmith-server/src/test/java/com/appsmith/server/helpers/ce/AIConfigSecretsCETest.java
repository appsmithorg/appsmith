package com.appsmith.server.helpers.ce;

import com.appsmith.external.helpers.AppsmithBeanUtils;
import com.appsmith.external.helpers.EncryptionHelper;
import com.appsmith.server.domains.AIAssistantConfig;
import com.appsmith.server.exceptions.AppsmithError;
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
        //
        // The error class is asserted, not just the type: this is a server-side fault, and reporting
        // it as caller input would give a non-retryable 4xx and keep it out of server-error metrics.
        assertThatThrownBy(() -> AIConfigSecretsCE.decrypt("enc:v1:not-actually-ciphertext"))
                .isInstanceOf(AppsmithException.class)
                .extracting(error -> ((AppsmithException) error).getError())
                .isEqualTo(AppsmithError.INTERNAL_SERVER_ERROR);
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

    /**
     * The unreadable-value check keys off the shape of {@link EncryptionHelper} output, so pin that
     * shape here rather than assume it: hex, and long enough to carry a 16-byte IV and 16-byte tag.
     */
    @Test
    void encryptedValuesAreHexAndAtLeastSixtyFourCharacters() {
        String ciphertext = EncryptionHelper.encrypt("sk-secret-key");

        assertThat(ciphertext).matches("[0-9a-fA-F]+");
        assertThat(ciphertext.length()).isGreaterThanOrEqualTo(64);
    }

    @Test
    void normalizeForStorage_leavesCiphertextItCannotDecryptUntouched() {
        // What a changed APPSMITH_ENCRYPTION_PASSWORD looks like at migration time: the value is
        // real ciphertext by shape, but this instance can no longer read it. Encrypting it again
        // would wrap the old ciphertext in the new password — after which neither the old password
        // nor the new one recovers the credential.
        String unreadable = corruptOneHexDigit(EncryptionHelper.encrypt("sk-original-key"));

        assertThatThrownBy(() -> EncryptionHelper.decrypt(unreadable)).isInstanceOf(Exception.class);
        assertThat(AIConfigSecretsCE.normalizeForStorage(unreadable)).isNull();
    }

    /**
     * The write path only ever sees keys the caller just supplied, so it must not borrow the
     * migration's caution about unreadable ciphertext. A 64-character hexadecimal key is a
     * perfectly valid credential and would otherwise be persisted in cleartext.
     */
    @Test
    void encryptCredentialsInPlace_encryptsAKeyThatMerelyLooksLikeCiphertext() {
        String hexShapedKey = "a".repeat(64);
        AIAssistantConfig config = new AIAssistantConfig();
        config.setClaudeApiKey(hexShapedKey);

        AIConfigSecretsCE.encryptCredentialsInPlace(config);

        assertThat(config.getClaudeApiKey()).isNotEqualTo(hexShapedKey);
        assertThat(AIConfigSecretsCE.isEncrypted(config.getClaudeApiKey())).isTrue();
        assertThat(AIConfigSecretsCE.decrypt(config.getClaudeApiKey())).isEqualTo(hexShapedKey);
    }

    /**
     * One destination policy guards every request that attaches a stored key — the Ask AI request
     * path and the settings "test key" path both call this.
     */
    @Test
    void allowsStoredCredential_permitsHttpsOnly() {
        // No override configured: the caller falls back to the provider's own HTTPS endpoint.
        assertThat(AIConfigSecretsCE.allowsStoredCredential(null)).isTrue();
        assertThat(AIConfigSecretsCE.allowsStoredCredential("")).isTrue();
        assertThat(AIConfigSecretsCE.allowsStoredCredential("   ")).isTrue();

        assertThat(AIConfigSecretsCE.allowsStoredCredential("https://api.openai.com"))
                .isTrue();
        assertThat(AIConfigSecretsCE.allowsStoredCredential("HTTPS://api.anthropic.com"))
                .isTrue();

        // Cleartext is refused everywhere, loopback included. WebClientUtils denies loopback both
        // as a literal host and after DNS resolution, so allowing it here would only advertise a
        // capability the HTTP layer rejects.
        assertThat(AIConfigSecretsCE.allowsStoredCredential("http://localhost:11434"))
                .isFalse();
        assertThat(AIConfigSecretsCE.allowsStoredCredential("http://127.0.0.1:8000"))
                .isFalse();
        assertThat(AIConfigSecretsCE.allowsStoredCredential("http://attacker.example.com"))
                .isFalse();
        assertThat(AIConfigSecretsCE.allowsStoredCredential("not a url")).isFalse();
    }

    /** Keeps the value hex and the same length, so only decryption fails. */
    private static String corruptOneHexDigit(String ciphertext) {
        char last = ciphertext.charAt(ciphertext.length() - 1);
        char replacement = last == 'a' ? 'b' : 'a';
        return ciphertext.substring(0, ciphertext.length() - 1) + replacement;
    }

    @Test
    void normalizeForStorage_returnsNullWhenThereIsNothingToWrite() {
        assertThat(AIConfigSecretsCE.normalizeForStorage(null)).isNull();
        assertThat(AIConfigSecretsCE.normalizeForStorage("")).isNull();
        assertThat(AIConfigSecretsCE.normalizeForStorage(AIConfigSecretsCE.encrypt("sk-secret-key")))
                .isNull();
    }

    // ---- destination binding ----------------------------------------------------------------

    private static AIAssistantConfig config(
            String claudeKey,
            String claudeUrl,
            String azureKey,
            String azureEndpoint,
            String copilotKey,
            String copilotEndpoint) {
        AIAssistantConfig c = new AIAssistantConfig();
        c.setClaudeApiKey(claudeKey);
        c.setClaudeBaseUrl(claudeUrl);
        c.setAzureOpenaiApiKey(azureKey);
        c.setAzureOpenaiEndpoint(azureEndpoint);
        c.setCopilotApiKey(copilotKey);
        c.setCopilotEndpoint(copilotEndpoint);
        return c;
    }

    /**
     * Azure resolves its key as azureOpenaiApiKey then copilotApiKey, and its destination as
     * azureOpenaiEndpoint then copilotEndpoint. Treating those as two independent pairs let a changed
     * Azure endpoint keep a stored Copilot key, which the read paths would then pair together.
     */
    @Test
    void unbind_clearsTheCopilotKey_whenTheAzureEndpointTakesOverAsTheDestination() {
        AIAssistantConfig before = config(null, null, null, null, "enc-copilot", "https://copilot.example.com");
        AIAssistantConfig after =
                config(null, null, null, "https://attacker.example.com", "enc-copilot", "https://copilot.example.com");

        AIConfigSecretsCE.unbindCredentialsWithChangedDestination(before, after);

        assertThat(after.getCopilotApiKey()).isNull();
    }

    @Test
    void unbind_clearsTheAzureKey_whenTheCopilotEndpointBecomesTheDestination() {
        AIAssistantConfig before = config(null, null, "enc-azure", "https://azure.example.com", null, null);
        AIAssistantConfig after = config(null, null, "enc-azure", null, null, "https://attacker.example.com");

        AIConfigSecretsCE.unbindCredentialsWithChangedDestination(before, after);

        assertThat(after.getAzureOpenaiApiKey()).isNull();
    }

    /** The client submits the provider default where storage holds null; that is not a change. */
    @Test
    void unbind_keepsTheKey_whenNullIsReplacedByTheProviderDefault() {
        AIAssistantConfig before = config("enc-claude", null, null, null, null, null);
        AIAssistantConfig after = config("enc-claude", "https://api.anthropic.com", null, null, null, null);

        AIConfigSecretsCE.unbindCredentialsWithChangedDestination(before, after);

        assertThat(after.getClaudeApiKey()).isEqualTo("enc-claude");
    }

    @Test
    void unbind_keepsTheKey_whenTheDestinationIsUnchanged() {
        AIAssistantConfig before = config("enc-claude", "https://api.anthropic.com", null, null, null, null);
        AIAssistantConfig after = config("enc-claude", "https://api.anthropic.com", null, null, null, null);

        AIConfigSecretsCE.unbindCredentialsWithChangedDestination(before, after);

        assertThat(after.getClaudeApiKey()).isEqualTo("enc-claude");
    }

    @Test
    void unbind_keepsAReplacementKeySuppliedAlongsideTheNewDestination() {
        AIAssistantConfig before = config("enc-old", "https://api.anthropic.com", null, null, null, null);
        AIAssistantConfig after = config("enc-new", "https://proxy.example.com", null, null, null, null);

        AIConfigSecretsCE.unbindCredentialsWithChangedDestination(before, after);

        assertThat(after.getClaudeApiKey()).isEqualTo("enc-new");
    }

    @Test
    void unbind_clearsOnlyTheGroupWhoseDestinationMoved() {
        AIAssistantConfig before =
                config("enc-claude", "https://api.anthropic.com", "enc-azure", "https://a.example.com", null, null);
        AIAssistantConfig after =
                config("enc-claude", "https://api.anthropic.com", "enc-azure", "https://b.example.com", null, null);

        AIConfigSecretsCE.unbindCredentialsWithChangedDestination(before, after);

        assertThat(after.getClaudeApiKey()).isEqualTo("enc-claude");
        assertThat(after.getAzureOpenaiApiKey()).isNull();
    }

    @Test
    void allowsStoredCredential_rejectsAnHttpsUrlWithNoHost() {
        assertThat(AIConfigSecretsCE.allowsStoredCredential("https:///v1/messages"))
                .isFalse();
        assertThat(AIConfigSecretsCE.allowsStoredCredential("https://")).isFalse();
    }

    /**
     * The generic PUT /organizations endpoint merges sparse request fields into the saved document,
     * so a provider URL can arrive there and move underneath a key that stays put — the same
     * redirection /ai-config refuses. This runs the real merge utility in the order
     * OrganizationServiceCEImpl uses it, because the ordering is what makes the rule work: snapshot
     * the saved state, merge, then invalidate against the merged result.
     */
    @Test
    void sparseOrganizationMerge_clearsACarriedKeyWhoseDestinationTheMergeMoved() {
        AIAssistantConfig saved = new AIAssistantConfig();
        saved.setCopilotApiKey("enc-copilot");
        saved.setCopilotEndpoint("https://copilot.example.com");

        // Only the Azure endpoint is supplied, which takes over as the effective destination.
        AIAssistantConfig sparseRequest = new AIAssistantConfig();
        sparseRequest.setAzureOpenaiEndpoint("https://attacker.example.com");

        AIAssistantConfig before = AIConfigSecretsCE.snapshotCredentials(saved);
        AppsmithBeanUtils.copyNestedNonNullProperties(sparseRequest, saved);
        AIConfigSecretsCE.unbindCredentialsWithChangedDestination(before, saved);

        assertThat(saved.getAzureOpenaiEndpoint()).isEqualTo("https://attacker.example.com");
        assertThat(saved.getCopilotApiKey()).isNull();
    }

    @Test
    void sparseOrganizationMerge_keepsAKeyWhenTheMergeDoesNotMoveItsDestination() {
        AIAssistantConfig saved = new AIAssistantConfig();
        saved.setClaudeApiKey("enc-claude");
        saved.setClaudeBaseUrl("https://api.anthropic.com");

        AIAssistantConfig sparseRequest = new AIAssistantConfig();
        sparseRequest.setClaudeModel("claude-sonnet-4");

        AIAssistantConfig before = AIConfigSecretsCE.snapshotCredentials(saved);
        AppsmithBeanUtils.copyNestedNonNullProperties(sparseRequest, saved);
        AIConfigSecretsCE.unbindCredentialsWithChangedDestination(before, saved);

        assertThat(saved.getClaudeApiKey()).isEqualTo("enc-claude");
    }

    @Test
    void sparseOrganizationMerge_keepsAReplacementSuppliedWithTheNewDestination() {
        AIAssistantConfig saved = new AIAssistantConfig();
        saved.setClaudeApiKey("enc-old");
        saved.setClaudeBaseUrl("https://api.anthropic.com");

        AIAssistantConfig sparseRequest = new AIAssistantConfig();
        sparseRequest.setClaudeBaseUrl("https://proxy.example.com");
        sparseRequest.setClaudeApiKey("enc-new");

        AIAssistantConfig before = AIConfigSecretsCE.snapshotCredentials(saved);
        AppsmithBeanUtils.copyNestedNonNullProperties(sparseRequest, saved);
        AIConfigSecretsCE.unbindCredentialsWithChangedDestination(before, saved);

        assertThat(saved.getClaudeApiKey()).isEqualTo("enc-new");
    }
}
