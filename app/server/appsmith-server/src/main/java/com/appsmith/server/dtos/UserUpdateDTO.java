package com.appsmith.server.dtos;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Data;

/**
 * Includes **only** those fields that can be updated for a user, via an API call.
 */
@Data
public class UserUpdateDTO {

    @JsonView(Views.Api.class)
    private String name;

    @JsonView(Views.Api.class)
    private String role;

    @JsonView(Views.Api.class)
    private String useCase;

    @JsonView(Views.Api.class)
    public boolean hasUserUpdates() {
        return name != null;
    }

    @JsonView(Views.Api.class)
    public boolean hasUserDataUpdates() {
        return role != null || useCase != null;
    }

}
