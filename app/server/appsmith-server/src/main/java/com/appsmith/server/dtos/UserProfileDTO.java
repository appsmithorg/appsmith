package com.appsmith.server.dtos;

import com.appsmith.server.constants.CommentOnboardingState;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.Set;

@Data
public class UserProfileDTO {

    String email;

    Set<String> organizationIds;

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

    boolean isConfigurable = false;

    CommentOnboardingState commentOnboardingState;

    String photoId;

    String role;

    String useCase;

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
