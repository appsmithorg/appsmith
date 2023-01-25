package com.appsmith.server.dtos;

import com.appsmith.external.models.Views;
import com.appsmith.server.constants.CommentOnboardingState;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Data;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@Data
public class UserProfileDTO {

    @JsonView(Views.Api.class)
    String email;

    @JsonView(Views.Api.class)
    Set<String> workspaceIds;

    @JsonView(Views.Api.class)
    String username;

    @JsonView(Views.Api.class)
    String name;

    @JsonView(Views.Api.class)
    String gender;

    @JsonProperty(value = "isAnonymous")
    @JsonView(Views.Api.class)
    boolean isAnonymous;

    @JsonProperty(value = "isEnabled")
    @JsonView(Views.Api.class)
    boolean isEnabled;

    @JsonView(Views.Api.class)
    boolean isEmptyInstance = false;

    @JsonProperty("isSuperUser")
    @JsonView(Views.Api.class)
    boolean isSuperUser = false;

    @JsonProperty("isConfigurable")
    @JsonView(Views.Api.class)
    boolean isConfigurable = false;

    @JsonProperty("adminSettingsVisible")
    @JsonView(Views.Api.class)
    boolean adminSettingsVisible = false;

    @JsonView(Views.Api.class)
    CommentOnboardingState commentOnboardingState;

    @JsonView(Views.Api.class)
    String photoId;

    @JsonView(Views.Api.class)
    String role;

    @JsonView(Views.Api.class)
    String useCase;

    @JsonView(Views.Api.class)
    boolean enableTelemetry = false;

    @JsonView(Views.Api.class)
    Map<String, Object> idToken = new HashMap<>();

    @JsonView(Views.Api.class)
    public boolean isAccountNonExpired() {
        return this.isEnabled;
    }

    @JsonView(Views.Api.class)
    public boolean isAccountNonLocked() {
        return this.isEnabled;
    }

    @JsonView(Views.Api.class)
    public boolean isCredentialsNonExpired() {
        return this.isEnabled;
    }

}
