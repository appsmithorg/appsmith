package com.appsmith.server.helpers.ce;

import com.appsmith.external.helpers.EncryptionHelper;
import com.appsmith.server.domains.AIAssistantConfig;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import lombok.extern.slf4j.Slf4j;

import java.net.URI;

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

    /**
     * Marks a value produced by {@link #encrypt}. Storage is otherwise ambiguous: ciphertext and
     * cleartext are both just strings, and "does it decrypt?" answers the wrong question in both
     * directions. It reports false for real ciphertext once the instance encryption password
     * changes, which would let the next write encrypt that value a second time and destroy the
     * credential beyond recovery; and it reports true for any cleartext that happens to decrypt
     * without throwing, which would leave that value in cleartext forever.
     */
    private static final String ENCRYPTED_PREFIX = "enc:v1:";

    private AIConfigSecretsCE() {}

    /** Encrypts a provider credential for storage. Null and blank values are passed through. */
    public static String encrypt(String plaintext) {
        if (plaintext == null || plaintext.isEmpty()) {
            return plaintext;
        }
        return ENCRYPTED_PREFIX + EncryptionHelper.encrypt(plaintext);
    }

    /**
     * Decrypts a stored provider credential.
     *
     * <p>A marked value has to decrypt. Returning the ciphertext when it does not — the previous
     * behaviour — sent that ciphertext to the provider as the API key, so the administrator saw
     * "invalid API key" with no hint that the instance encryption password had changed. Failing
     * here surfaces the real cause instead.
     *
     * <p>An unmarked value predates this encryption and is cleartext. {@code Migration076} marks
     * and encrypts those, so this branch only covers the window before it runs.
     */
    public static String decrypt(String stored) {
        if (stored == null || stored.isEmpty()) {
            return stored;
        }
        if (!stored.startsWith(ENCRYPTED_PREFIX)) {
            return stored;
        }
        try {
            return EncryptionHelper.decrypt(stored.substring(ENCRYPTED_PREFIX.length()));
        } catch (Exception e) {
            // Do not log the value or the exception detail — both can echo key material.
            log.error("An AI provider credential could not be decrypted. The instance encryption password has"
                    + " most likely changed, which affects every secret encrypted with the previous one.");
            // A changed encryption password is a server fault rather than bad input, so this has to leave as
            // 5xx. No message is attached: INTERNAL_SERVER_ERROR has no placeholder, so one would be dropped,
            // and telling an administrator to re-enter the key would imply a fix that still leaves every other
            // secret on the instance unreadable. The log line above carries the real cause.
            throw new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR);
        }
    }

    /** True when the value carries the marker written by {@link #encrypt}. */
    public static boolean isEncrypted(String stored) {
        return stored == null || stored.isEmpty() || stored.startsWith(ENCRYPTED_PREFIX);
    }

    /**
     * The single destination policy for every request that carries a stored provider credential —
     * the Ask AI request path and the settings "test key" path alike.
     *
     * <p>A blank value means no override is configured and the caller falls back to the provider's
     * own HTTPS endpoint. An explicit destination has to keep the key off the wire in cleartext.
     *
     * <p>There is deliberately no loopback exception. It would be unreachable: every one of these
     * requests goes out through {@code WebClientUtils}, whose {@code RestrictedHostFilter} denies
     * loopback both as a literal host and after DNS resolution. Allowing {@code http://localhost}
     * here would only describe a capability the HTTP layer refuses anyway.
     */
    public static boolean allowsStoredCredential(String url) {
        if (url == null || url.trim().isEmpty()) {
            return true;
        }

        try {
            return "https".equalsIgnoreCase(URI.create(url.trim()).getScheme());
        } catch (IllegalArgumentException e) {
            // Unparseable destination — refuse rather than guess.
            return false;
        }
    }

    /**
     * Returns the marked-ciphertext form of a stored value, or null when there is nothing safe to
     * write. Used by {@code Migration076} to normalise everything written before the marker
     * existed, so that no unmarked value survives to be misread later.
     */
    public static String normalizeForStorage(String stored) {
        if (stored == null || stored.isEmpty() || isEncrypted(stored)) {
            return null;
        }
        try {
            // Ciphertext from a build that encrypted but did not yet mark. Keep the bytes as they
            // are — re-encrypting would nest one ciphertext inside another — and add the marker.
            EncryptionHelper.decrypt(stored);
            return ENCRYPTED_PREFIX + stored;
        } catch (Exception e) {
            if (looksLikeCiphertext(stored)) {
                // Shaped like ciphertext but unreadable: the instance encryption password changed.
                // Encrypting it again would wrap the old ciphertext in the new password, and then
                // restoring the old password would no longer decrypt the outer layer — the
                // credential would be unrecoverable either way. Leave it for an operator instead.
                log.error("An AI provider credential could not be decrypted and was left unchanged. Restore the"
                        + " previous instance encryption password, or clear and re-enter the affected API keys.");
                return null;
            }
            return encrypt(stored);
        }
    }

    /**
     * Whether a value has the shape of {@link EncryptionHelper} output, which is hex-encoded
     * AES-GCM carrying at least a 16-byte IV and a 16-byte tag — so 64 hex characters at minimum.
     *
     * <p>Used only by {@link #normalizeForStorage}, once a decrypt has already failed, to tell a
     * legacy value stored in cleartext apart from ciphertext this instance can no longer read. It
     * is deliberately kept off the write path, where an unmarked value is always a freshly supplied
     * key and guessing at its shape could leave a real credential unencrypted.
     */
    private static boolean looksLikeCiphertext(String value) {
        if (value.length() < 64 || value.length() % 2 != 0) {
            return false;
        }
        for (int i = 0; i < value.length(); i++) {
            if (Character.digit(value.charAt(i), 16) < 0) {
                return false;
            }
        }
        return true;
    }

    /**
     * Encrypts every provider credential on the given config in place, unless it is already encrypted.
     *
     * <p>{@code /ai-config} is the supported way to set these, and it encrypts on the way in. But the generic
     * {@code PUT /organizations} endpoint binds the whole {@code OrganizationConfiguration}, and {@code @JsonView}
     * does not filter a request body unless a view is active — so the credential fields deserialize there too and
     * {@code copyNestedNonNullProperties} + {@code updateById} would persist them in cleartext, silently defeating
     * the at-rest guarantee. Nothing would look broken either, since an unmarked value reads back as cleartext.
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

    /**
     * Everything reaching here came from a request body, so an unmarked value is a key the caller
     * just supplied in cleartext — never a legacy value read back from storage. It is therefore
     * always encrypted, with none of the migration's caution about unreadable ciphertext: applying
     * that here would let a credential that merely looks like ciphertext, such as a 64-character
     * hexadecimal key, be written to the database in cleartext.
     */
    private static String encryptIfNeeded(String value) {
        if (value == null || value.isEmpty() || isEncrypted(value)) {
            return value;
        }
        return encrypt(value);
    }
}
