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

    @JsonView(Views.Public.class)
    String email;

    @JsonView(Views.Public.class)
    Set<String> workspaceIds;

    @JsonView(Views.Public.class)
    String username;

    @JsonView(Views.Public.class)
    String name;

    @JsonView(Views.Public.class)
    String gender;

    @JsonProperty(value = "isAnonymous")
    @JsonView(Views.Public.class)
    boolean isAnonymous;

    @JsonProperty(value = "isEnabled")
    @JsonView(Views.Public.class)
    boolean isEnabled;

    @JsonView(Views.Public.class)
    boolean isEmptyInstance = false;

    @JsonProperty("isSuperUser")
    @JsonView(Views.Public.class)
    boolean isSuperUser = false;

    @JsonProperty("isConfigurable")
    @JsonView(Views.Public.class)
    boolean isConfigurable = false;

    @JsonProperty("adminSettingsVisible")
    @JsonView(Views.Public.class)
    boolean adminSettingsVisible = false;

    @JsonView(Views.Public.class)
    CommentOnboardingState commentOnboardingState;

    @JsonView(Views.Public.class)
    String photoId;

    @JsonView(Views.Public.class)
    String role;

    @JsonView(Views.Public.class)
    String useCase;

    @JsonView(Views.Public.class)
    boolean enableTelemetry = false;

    @JsonView(Views.Public.class)
    Map<String, Object> idToken = new HashMap<>();

    @JsonView(Views.Public.class)
    public boolean isAccountNonExpired() {
        return this.isEnabled;
    }

    @JsonView(Views.Public.class)
    public boolean isAccountNonLocked() {
        return this.isEnabled;
    }

    @JsonView(Views.Public.class)
    public boolean isCredentialsNonExpired() {
        return this.isEnabled;
    }

}
