package com.appsmith.server.dtos.ce;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;
import java.util.Set;

@Data
public class UserProfileCE_DTO {

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

    /**
     * Health signal driving the admin warning banner introduced for
     * <a href="https://github.com/appsmithorg/appsmith/security/advisories/GHSA-j9gf-vw2f-9hrw">GHSA-j9gf-vw2f-9hrw</a>.
     * Reflects the answer of {@code SecureBaseUrlResolverCE#isBaseUrlConfigurationHealthy()}.
     * Default {@code true} so any DTO instance built outside the real assembler (test fixtures,
     * mocks) does not false-positive the banner.
     */
    @JsonProperty("instanceBaseUrlConfigurationHealthy")
    boolean instanceBaseUrlConfigurationHealthy = true;

    String photoId;

    String useCase;

    boolean enableTelemetry = false;

    List<String> roles;

    List<String> groups;

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
