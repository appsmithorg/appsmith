package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.OidcUserInfo;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.util.StringUtils;

import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;


@Getter
@Setter
@ToString
@Document
public class User extends BaseDomain implements UserDetails, OidcUser {

    @JsonView(Views.Api.class)
    private String name;

    @JsonView(Views.Api.class)
    private String email;

    @JsonView(Views.Api.class)
    private String hashedEmail;

    //TODO: This is deprecated in favour of groups
    @JsonView(Views.Api.class)
    private Set<Role> roles;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @JsonView(Views.Api.class)
    private String password;

    @JsonView(Views.Internal.class)
    private Boolean passwordResetInitiated = false;

    @JsonView(Views.Api.class)
    private LoginSource source = LoginSource.FORM;

    @JsonView(Views.Api.class)
    private UserState state;

    @JsonView(Views.Api.class)
    private Boolean isEnabled = true;

    //Organizations migrated to workspaces, kept the field as depricated to support the old migration
    @Deprecated
    @JsonView(Views.Api.class)
    private String currentOrganizationId;
    
    @JsonView(Views.Api.class)
    private String currentWorkspaceId;

    //Organizations migrated to workspaces, kept the field as depricated to support the old migration
    @Deprecated
    @JsonView(Views.Api.class)
    private Set<String> organizationIds;
    
    @JsonView(Views.Api.class)
    private Set<String> workspaceIds;

    //Organizations migrated to workspaces, kept the field as depricated to support the old migration
    @Deprecated
    @JsonView(Views.Api.class)
    private String examplesOrganizationId;
    
    @JsonView(Views.Api.class)
    private String examplesWorkspaceId;

    // There is a many-to-many relationship with groups. If this value is modified, please also modify the list of
    // users in that particular group document as well.
    @JsonView(Views.Api.class)
    private Set<String> groupIds = new HashSet<>();

    // These permissions are in addition to the privileges provided by the groupIds. We can assign individual permissions
    // to users instead of creating a group for them. To be used only for one-off permissions.
    // During evaluation a union of the group permissions and user-specific permissions will take effect.
    @JsonView(Views.Api.class)
    private Set<String> permissions = new HashSet<>();

    // This field is used when a user is invited to appsmith. This inviteToken is used to confirm the identity in verify
    // token flow.
    @JsonView(Views.Internal.class)
    private String inviteToken;

    @JsonView(Views.Api.class)
    Boolean isAnonymous = false;

    @JsonView(Views.Api.class)
    private String tenantId;

    // TODO: Populate these attributes for a user. Generally required for OAuth2 logins
    @Override
    @JsonView(Views.Api.class)
    public Map<String, Object> getAttributes() {
        return null;
    }

    @Override
    @JsonView(Views.Api.class)
    public Collection<GrantedAuthority> getAuthorities() {
        return null;
    }

    @Override
    @JsonView(Views.Api.class)
    public String getUsername() {
        return this.email;
    }

    @Override
    @JsonView(Views.Api.class)
    public boolean isAccountNonExpired() {
        return this.isEnabled;
    }

    @Override
    @JsonView(Views.Api.class)
    public boolean isAccountNonLocked() {
        return this.isEnabled;
    }

    @Override
    @JsonView(Views.Api.class)
    public boolean isCredentialsNonExpired() {
        return this.isEnabled;
    }

    @Override
    @JsonView(Views.Api.class)
    public boolean isEnabled() {
        // The `isEnabled` field is `Boolean` whereas we are returning `boolean` here. If `isEnabled` field value is
        // `null`, this would throw a `NullPointerException`. Hence, checking equality with `Boolean.TRUE` instead.
        return Boolean.TRUE.equals(this.isEnabled);
    }

    // TODO: Check the return value for the functions below to ensure that correct values are being returned
    @Override
    @JsonView(Views.Api.class)
    public Map<String, Object> getClaims() {
        return new HashMap<>();
    }

    @Override
    @JsonView(Views.Api.class)
    public OidcUserInfo getUserInfo() {
        return null;
    }

    @Override
    @JsonView(Views.Api.class)
    public OidcIdToken getIdToken() {
        return null;
    }

    @Transient
    @JsonView(Views.Internal.class)
    public boolean isAnonymous() {
        return Boolean.TRUE.equals(isAnonymous);
    }

    @Transient
    @JsonView(Views.Internal.class)
    public String computeFirstName() {
        return (StringUtils.isEmpty(name) ? email : name).split("[\\s@]+", 2)[0];
    }
}
