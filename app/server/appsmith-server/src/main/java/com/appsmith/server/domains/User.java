package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.views.Views;
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

    @JsonView(Views.Public.class)
    private String name;

    @JsonView(Views.Public.class)
    private String email;

    @JsonView(Views.Public.class)
    private String hashedEmail;

    //TODO: This is deprecated in favour of groups
    @JsonView(Views.Public.class)
    private Set<Role> roles;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @JsonView(Views.Public.class)
    private String password;

    @JsonView(Views.Internal.class)
    private Boolean passwordResetInitiated = false;

    @JsonView(Views.Public.class)
    private LoginSource source = LoginSource.FORM;

    @JsonView(Views.Public.class)
    private UserState state;

    @JsonView(Views.Public.class)
    private Boolean isEnabled = true;

    //Organizations migrated to workspaces, kept the field as depricated to support the old migration
    @Deprecated
    @JsonView(Views.Public.class)
    private String currentOrganizationId;
    
    @JsonView(Views.Public.class)
    private String currentWorkspaceId;

    //Organizations migrated to workspaces, kept the field as depricated to support the old migration
    @Deprecated
    @JsonView(Views.Public.class)
    private Set<String> organizationIds;
    
    @JsonView(Views.Public.class)
    private Set<String> workspaceIds;

    //Organizations migrated to workspaces, kept the field as depricated to support the old migration
    @Deprecated
    @JsonView(Views.Public.class)
    private String examplesOrganizationId;
    
    @JsonView(Views.Public.class)
    private String examplesWorkspaceId;

    // There is a many-to-many relationship with groups. If this value is modified, please also modify the list of
    // users in that particular group document as well.
    @JsonView(Views.Public.class)
    private Set<String> groupIds = new HashSet<>();

    // These permissions are in addition to the privileges provided by the groupIds. We can assign individual permissions
    // to users instead of creating a group for them. To be used only for one-off permissions.
    // During evaluation a union of the group permissions and user-specific permissions will take effect.
    @JsonView(Views.Public.class)
    private Set<String> permissions = new HashSet<>();

    // This field is used when a user is invited to appsmith. This inviteToken is used to confirm the identity in verify
    // token flow.
    @JsonView(Views.Internal.class)
    private String inviteToken;

    @JsonView(Views.Public.class)
    Boolean isAnonymous = false;

    @JsonView(Views.Public.class)
    private String tenantId;

    // TODO: Populate these attributes for a user. Generally required for OAuth2 logins
    @Override
    @JsonView(Views.Public.class)
    public Map<String, Object> getAttributes() {
        return null;
    }

    @Override
    @JsonView(Views.Public.class)
    public Collection<GrantedAuthority> getAuthorities() {
        return null;
    }

    @Override
    @JsonView(Views.Public.class)
    public String getUsername() {
        return this.email;
    }

    @Override
    @JsonView(Views.Public.class)
    public boolean isAccountNonExpired() {
        return this.isEnabled;
    }

    @Override
    @JsonView(Views.Public.class)
    public boolean isAccountNonLocked() {
        return this.isEnabled;
    }

    @Override
    @JsonView(Views.Public.class)
    public boolean isCredentialsNonExpired() {
        return this.isEnabled;
    }

    @Override
    @JsonView(Views.Public.class)
    public boolean isEnabled() {
        // The `isEnabled` field is `Boolean` whereas we are returning `boolean` here. If `isEnabled` field value is
        // `null`, this would throw a `NullPointerException`. Hence, checking equality with `Boolean.TRUE` instead.
        return Boolean.TRUE.equals(this.isEnabled);
    }

    // TODO: Check the return value for the functions below to ensure that correct values are being returned
    @Override
    @JsonView(Views.Public.class)
    public Map<String, Object> getClaims() {
        return new HashMap<>();
    }

    @Override
    @JsonView(Views.Public.class)
    public OidcUserInfo getUserInfo() {
        return null;
    }

    @Override
    @JsonView(Views.Public.class)
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
