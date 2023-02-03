package com.appsmith.server.dtos;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Data;

/**
 * Includes **only** those fields that can be updated for a user, via an API call.
 */
@Data
public class UserUpdateDTO {

    @JsonView(Views.Public.class)
    private String name;

    @JsonView(Views.Public.class)
    private String role;

    @JsonView(Views.Public.class)
    private String useCase;

    @JsonView(Views.Public.class)
    public boolean hasUserUpdates() {
        return name != null;
    }

    @JsonView(Views.Public.class)
    public boolean hasUserDataUpdates() {
        return role != null || useCase != null;
    }

}
