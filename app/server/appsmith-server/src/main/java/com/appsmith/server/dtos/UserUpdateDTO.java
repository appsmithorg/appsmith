package com.appsmith.server.dtos;

import lombok.Data;

/**
 * Includes **only** those fields that can be updated for a user, via an API call.
 */
@Data
public class UserUpdateDTO {

    private String name;

    private String proficiency;

    private String useCase;

    private boolean isIntercomConsentGiven;

    public boolean hasUserUpdates() {
        return name != null;
    }

    public boolean hasUserDataUpdates() {
        return proficiency != null || useCase != null || isIntercomConsentGiven;
    }
}
