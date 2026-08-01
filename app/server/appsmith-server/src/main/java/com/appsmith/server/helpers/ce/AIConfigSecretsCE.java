package com.appsmith.server.helpers.ce;

import com.appsmith.external.helpers.EncryptionHelper;
import com.appsmith.server.domains.AIAssistantConfig;
import lombok.extern.slf4j.Slf4j;

/**
 * Encryption for the AI Assistant provider credentials stored on the organization document.
 *
 * <p>These fields carry {@code @Encrypted}, but that annotation never applies to them: the
 * encryption traversal in {@code EncryptionHandler} only descends into fields whose declared type
 * is an {@code AppsmithDomain}, and both {@code OrganizationConfigurationCE} and
 * {@code AIAssistantConfig} are plain {@code Serializable}. Independently, the write path is a
 * sparse {@code updateById} rather than an entity {@code save}, so the Mongo lifecycle listener
 * that would perform the encryption never fires. Rather than change encryption traversal for the
 * whole organization document — and the write path for all organization configuration — the AI
 * config encrypts and decrypts its own secrets here, at the few points they are written and read.
 */
@Slf4j
public final class AIConfigSecretsCE {

    private AIConfigSecretsCE() {}

    /** Encrypts a provider credential for storage. Null and blank values are passed through. */
    public static String encrypt(String plaintext) {
        if (plaintext == null || plaintext.isEmpty()) {
            return plaintext;
        }
        return EncryptionHelper.encrypt(plaintext);
    }

    /**
     * Decrypts a stored provider credential.
     *
     * <p>Values written before this encryption existed are stored in cleartext, and the ciphertext
     * carries no marker that would distinguish the two. A value that does not decrypt is therefore
     * treated as legacy cleartext and returned unchanged, so an instance keeps working between the
     * upgrade and the migration that encrypts those values in place. That fallback is also what
     * makes the migration itself idempotent.
     */
    public static String decrypt(String stored) {
        if (stored == null || stored.isEmpty()) {
            return stored;
        }
        try {
            return EncryptionHelper.decrypt(stored);
        } catch (Exception e) {
            // Do not log the value or the exception detail — both can echo key material.
            log.debug("AI provider credential is not encrypted yet; treating it as legacy cleartext.");
            return stored;
        }
    }

    /** True when the value is already encrypted, i.e. it round-trips through the decryptor. */
    public static boolean isEncrypted(String stored) {
        if (stored == null || stored.isEmpty()) {
            return true;
        }
        try {
            EncryptionHelper.decrypt(stored);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Encrypts every provider credential on the given config in place, unless it is already encrypted.
     *
     * <p>{@code /ai-config} is the supported way to set these, and it encrypts on the way in. But the generic
     * {@code PUT /organizations} endpoint binds the whole {@code OrganizationConfiguration}, and {@code @JsonView}
     * does not filter a request body unless a view is active — so the credential fields deserialize there too and
     * {@code copyNestedNonNullProperties} + {@code updateById} would persist them in cleartext, silently defeating
     * the at-rest guarantee. {@code decrypt}'s legacy-cleartext fallback means nothing would ever look broken.
     * Normalising here makes encryption a property of the data reaching storage rather than of one code path.
     */
    public static void encryptCredentialsInPlace(AIAssistantConfig config) {
        if (config == null) {
            return;
        }
        config.setClaudeApiKey(encryptIfNeeded(config.getClaudeApiKey()));
        config.setOpenaiApiKey(encryptIfNeeded(config.getOpenaiApiKey()));
        config.setCopilotApiKey(encryptIfNeeded(config.getCopilotApiKey()));
        config.setAzureOpenaiApiKey(encryptIfNeeded(config.getAzureOpenaiApiKey()));
    }

    private static String encryptIfNeeded(String value) {
        if (value == null || value.isEmpty() || isEncrypted(value)) {
            return value;
        }
        return encrypt(value);
    }
}
