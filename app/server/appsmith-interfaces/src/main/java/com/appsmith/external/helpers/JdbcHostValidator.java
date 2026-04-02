package com.appsmith.external.helpers;

import com.appsmith.external.exceptions.pluginExceptions.BasePluginErrorMessages;
import com.appsmith.util.WebClientUtils;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

import java.util.Optional;
import java.util.regex.Pattern;

/**
 * Shared hostname validation utility for JDBC database plugins.
 * Blocks URI-special characters that can alter JDBC URL semantics (e.g., '#' fragment injection)
 * and provides SSRF protection via {@link WebClientUtils#resolveIfAllowed(String)}.
 */
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class JdbcHostValidator {

    private static final Pattern DISALLOWED_HOST_CHARS = Pattern.compile("[/:@#?\\\\]");

    /**
     * Validates that a hostname does not contain URI-special characters that could
     * alter JDBC URL parsing (e.g., '#' for fragment injection, '/' for path injection).
     *
     * @return {@link Optional#empty()} if valid, or an error message string if invalid.
     */
    public static Optional<String> validateHostname(String host) {
        if (host == null || host.isBlank()) {
            return Optional.of(BasePluginErrorMessages.DS_MISSING_HOSTNAME_ERROR_MSG);
        }

        var matcher = DISALLOWED_HOST_CHARS.matcher(host);
        if (matcher.find()) {
            return Optional.of(
                    String.format(BasePluginErrorMessages.DS_INVALID_HOSTNAME_CHARS_ERROR_MSG, matcher.group(), host));
        }

        return Optional.empty();
    }

    /**
     * Checks whether the hostname is allowed by SSRF protection rules.
     * Blocks cloud metadata endpoints, loopback, and link-local addresses.
     * Allows RFC 1918 private ranges for self-hosted deployments.
     *
     * @return {@link Optional#empty()} if allowed, or an error message string if blocked.
     */
    public static Optional<String> checkSsrfProtection(String host) {
        if (host == null || host.isBlank()) {
            return Optional.of(BasePluginErrorMessages.DS_MISSING_HOSTNAME_ERROR_MSG);
        }

        var resolved = WebClientUtils.resolveIfAllowed(host);
        if (resolved.isEmpty()) {
            return Optional.of(String.format(BasePluginErrorMessages.DS_SSRF_HOST_BLOCKED_ERROR_MSG, host));
        }

        return Optional.empty();
    }
}
