package com.appsmith.server.dtos;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record McpTokenResponseDTO(String id, String token, String name, Instant createdAt, Instant expiresAt) {

    /**
     * Overridden so the raw token secret can never reach a log line. The compiler-generated record toString()
     * interpolates every component, so a single {@code log.debug("{}", dto)} — or an exception message that embeds
     * the DTO — would leak a live credential in plaintext. {@code token} is populated only on create/rotate and is
     * the one value that is never recoverable afterwards, so it is redacted here rather than trusted to callers.
     * Mirrors the {@code @ToString.Exclude} on {@code UserMcpTokenCE.tokenHash}.
     */
    @Override
    public String toString() {
        return "McpTokenResponseDTO[id=" + id + ", token=" + (token == null ? "null" : "***REDACTED***") + ", name="
                + name + ", createdAt=" + createdAt + ", expiresAt=" + expiresAt + "]";
    }
}
