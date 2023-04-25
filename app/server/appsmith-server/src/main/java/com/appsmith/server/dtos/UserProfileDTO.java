package com.appsmith.server.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@Data
public class UserProfileDTO {

    String email;

    Set<String> workspaceIds;

    String username;

    String name;

    String gender;

    @JsonProperty(value = "isAnonymous")
    boolean isAnonymous;

    @JsonProperty(value = "isEnabled")
    boolean isEnabled;

    boolean isEmptyInstance = false;

    @JsonProperty("isSuperUser")
    boolean isSuperUser = false;

    @JsonProperty("isConfigurable")
    boolean isConfigurable = false;

    @JsonProperty("adminSettingsVisible")
    boolean adminSettingsVisible = false;

    @JsonProperty("isIntercomConsentGiven")
    boolean isIntercomConsentGiven = false;

    String photoId;

    String role;

    String useCase;

    boolean enableTelemetry = false;

    Map<String, Object> idToken = new HashMap<>();

    public boolean isAccountNonExpired() {
        return this.isEnabled;
    }

    public boolean isAccountNonLocked() {
        return this.isEnabled;
    }

    public boolean isCredentialsNonExpired() {
        return this.isEnabled;
    }

}
