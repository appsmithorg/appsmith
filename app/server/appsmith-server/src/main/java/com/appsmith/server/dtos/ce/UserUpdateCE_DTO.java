package com.appsmith.server.dtos.ce;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * Includes **only** those fields that can be updated for a user, via an API call.
 */
@Data
public class UserUpdateCE_DTO {
    private String name;

    private String proficiency;

    private String useCase;

    @JsonProperty("intercomConsentGiven")
    private boolean isIntercomConsentGiven;

    public boolean hasUserUpdates() {
        return name != null;
    }

    public boolean hasUserDataUpdates() {
        return proficiency != null || useCase != null || isIntercomConsentGiven;
    }
}
