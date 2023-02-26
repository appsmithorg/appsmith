package com.appsmith.server.dtos;

import lombok.Data;

/**
 * Includes **only** those fields that can be updated for a user, via an API call.
 */
@Data
public class UserUpdateDTO {

    private String name;

    private String role;

    private String useCase;

    public boolean hasUserUpdates() {
        return name != null;
    }

    public boolean hasUserDataUpdates() {
        return role != null || useCase != null;
    }

}
