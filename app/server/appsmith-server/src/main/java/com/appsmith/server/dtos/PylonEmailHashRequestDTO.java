package com.appsmith.server.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request body for the Cloud Services {@code POST /api/v1/pylon/email-hash} endpoint.
 *
 * <p>The instance no longer holds the Pylon identity secret; Cloud Services computes the HMAC hash. The nested
 * {@code licenseValidationRequest} reuses the CS LicenseValidationRequest transport shape (instanceId / organizationId
 * / appsmithVersion) for caller identification and rate-limiting. {@code licenseKey} is intentionally omitted — chat
 * is available to everyone, so a valid license is never required to receive a hash.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PylonEmailHashRequestDTO {
    private String email;
    private InstanceMetadata licenseValidationRequest;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InstanceMetadata {
        private String instanceId;
        private String organizationId;
        private String appsmithVersion;
    }
}
