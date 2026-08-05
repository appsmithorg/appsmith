package com.appsmith.server.helpers.ce;

import com.appsmith.external.helpers.EncryptionHelper;
import com.appsmith.server.domains.AIAssistantConfig;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import lombok.extern.slf4j.Slf4j;

import java.net.URI;
import java.util.List;

import static com.appsmith.server.constants.AIConstants.DEFAULT_CLAUDE_BASE_URL;
import static com.appsmith.server.constants.AIConstants.DEFAULT_OPENAI_BASE_URL;

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
            URI uri = URI.create(url.trim());
            // A host is required as well as the scheme: "https:///path" and "https://" parse but name
            // no destination, and accepting them would hand the decision to whatever the HTTP client
            // makes of them.
            return "https".equalsIgnoreCase(uri.getScheme())
                    && uri.getHost() != null
                    && !uri.getHost().isEmpty();
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
     * The credential groups, each pairing every key the read paths can select with every field
     * those paths can take the destination from. Both {@code AIConfigServiceCEImpl.testApiKeyInternal}
     * and {@code AIAssistantServiceCEImpl} resolve Azure this way — {@code azureOpenaiApiKey} falling
     * back to {@code copilotApiKey}, {@code azureOpenaiEndpoint} to {@code copilotEndpoint} — and the
     * COPILOT provider reaches the same code, so the four fields are one group rather than two pairs.
     * Comparing them independently is what let a changed Azure endpoint keep a stored Copilot key.
     */
    private enum CredentialGroup {
        CLAUDE(DEFAULT_CLAUDE_BASE_URL),
        OPENAI(DEFAULT_OPENAI_BASE_URL),
        AZURE(null);

        private final String defaultDestination;

        CredentialGroup(String defaultDestination) {
            this.defaultDestination = defaultDestination;
        }

        private List<String> destinations(AIAssistantConfig config) {
            return switch (this) {
                case CLAUDE -> List.of(orEmpty(config.getClaudeBaseUrl()));
                case OPENAI -> List.of(orEmpty(config.getOpenaiBaseUrl()));
                // Order matters: it mirrors the fallback the read paths apply.
                case AZURE -> List.of(orEmpty(config.getAzureOpenaiEndpoint()), orEmpty(config.getCopilotEndpoint()));
            };
        }

        private List<String> keys(AIAssistantConfig config) {
            return switch (this) {
                case CLAUDE -> List.of(orEmpty(config.getClaudeApiKey()));
                case OPENAI -> List.of(orEmpty(config.getOpenaiApiKey()));
                case AZURE -> List.of(orEmpty(config.getAzureOpenaiApiKey()), orEmpty(config.getCopilotApiKey()));
            };
        }

        private void clearCarriedOverKeys(AIAssistantConfig before, AIAssistantConfig after) {
            switch (this) {
                case CLAUDE -> {
                    if (isCarriedOver(before.getClaudeApiKey(), after.getClaudeApiKey())) {
                        after.setClaudeApiKey(null);
                    }
                }
                case OPENAI -> {
                    if (isCarriedOver(before.getOpenaiApiKey(), after.getOpenaiApiKey())) {
                        after.setOpenaiApiKey(null);
                    }
                }
                case AZURE -> {
                    if (isCarriedOver(before.getAzureOpenaiApiKey(), after.getAzureOpenaiApiKey())) {
                        after.setAzureOpenaiApiKey(null);
                    }
                    if (isCarriedOver(before.getCopilotApiKey(), after.getCopilotApiKey())) {
                        after.setCopilotApiKey(null);
                    }
                }
            }
        }

        /** The destination the read paths would actually use: first non-blank, else the default. */
        private String effectiveDestination(AIAssistantConfig config) {
            return destinations(config).stream()
                    .filter(destination -> !destination.isEmpty())
                    .findFirst()
                    .orElseGet(() -> orEmpty(defaultDestination));
        }

        private boolean holdsAnyKey(AIAssistantConfig config) {
            return keys(config).stream().anyMatch(key -> !key.isEmpty());
        }
    }

    /**
     * Invalidates every stored credential whose destination changed, unless the same write supplied a
     * replacement for it.
     *
     * <p>A key is bound to the URL it was entered for. Without that, an administrator — who can manage
     * the configuration but is not meant to be able to read a key back, since the UI masks it — could
     * point a saved key at a destination of their choosing and have the server send it there, either
     * through the settings "test key" action or by simply using the assistant.
     *
     * <p>Takes the whole configuration before and after the write rather than the request fields, so
     * that {@code /ai-config} and the generic organization update are held to the same rule: the
     * latter merges sparse request fields into the saved document, and a URL arriving that way would
     * otherwise move underneath a key that stays put.
     *
     * <p>A key counts as replaced when its stored value differs from the one already there. Comparing
     * effective destinations rather than raw fields also means a save that only changes a model name
     * no longer looks like a destination change, which would have deleted a working key.
     */
    public static void unbindCredentialsWithChangedDestination(AIAssistantConfig before, AIAssistantConfig after) {
        if (before == null || after == null) {
            return;
        }

        for (CredentialGroup group : CredentialGroup.values()) {
            if (!group.holdsAnyKey(before)) {
                continue;
            }
            if (!group.effectiveDestination(before).equals(group.effectiveDestination(after))) {
                group.clearCarriedOverKeys(before, after);
            }
        }
    }

    /** A snapshot of the credential-bearing fields, taken before a write mutates them in place. */
    public static AIAssistantConfig snapshotCredentials(AIAssistantConfig config) {
        AIAssistantConfig snapshot = new AIAssistantConfig();
        if (config == null) {
            return snapshot;
        }
        snapshot.setClaudeApiKey(config.getClaudeApiKey());
        snapshot.setOpenaiApiKey(config.getOpenaiApiKey());
        snapshot.setCopilotApiKey(config.getCopilotApiKey());
        snapshot.setAzureOpenaiApiKey(config.getAzureOpenaiApiKey());
        snapshot.setClaudeBaseUrl(config.getClaudeBaseUrl());
        snapshot.setOpenaiBaseUrl(config.getOpenaiBaseUrl());
        snapshot.setAzureOpenaiEndpoint(config.getAzureOpenaiEndpoint());
        snapshot.setCopilotEndpoint(config.getCopilotEndpoint());
        return snapshot;
    }

    private static boolean isCarriedOver(String before, String after) {
        return !orEmpty(after).isEmpty() && orEmpty(before).equals(orEmpty(after));
    }

    private static String orEmpty(String value) {
        return value == null ? "" : value.trim();
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
