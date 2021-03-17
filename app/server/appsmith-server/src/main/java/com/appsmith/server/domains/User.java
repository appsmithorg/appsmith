package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
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

    private String name;

    private String email;

    //TODO: This is deprecated in favour of groups
    private Set<Role> roles;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    @JsonIgnore
    private Boolean passwordResetInitiated = false;

    private LoginSource source = LoginSource.FORM;

    private UserState state;

    private Boolean isEnabled = true;

    private String currentOrganizationId;

    private Set<String> organizationIds;

    private String examplesOrganizationId;

    // There is a many-to-many relationship with groups. If this value is modified, please also modify the list of
    // users in that particular group document as well.
    private Set<String> groupIds = new HashSet<>();

    // These permissions are in addition to the privileges provided by the groupIds. We can assign individual permissions
    // to users instead of creating a group for them. To be used only for one-off permissions.
    // During evaluation a union of the group permissions and user-specific permissions will take effect.
    private Set<String> permissions = new HashSet<>();

    // This field is used when a user is invited to appsmith. This inviteToken is used to confirm the identity in verify
    // token flow.
    @JsonIgnore
    private String inviteToken;

    @Transient
    Boolean isAnonymous = false;

    // TODO: Populate these attributes for a user. Generally required for OAuth2 logins
    @Override
    public Map<String, Object> getAttributes() {
        return null;
    }

    @Override
    public Collection<GrantedAuthority> getAuthorities() {
        return null;
    }

    @Override
    public String getUsername() {
        return this.email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return this.isEnabled;
    }

    @Override
    public boolean isAccountNonLocked() {
        return this.isEnabled;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return this.isEnabled;
    }

    @Override
    public boolean isEnabled() {
        // The `isEnabled` field is `Boolean` whereas we are returning `boolean` here. If `isEnabled` field value is
        // `null`, this would throw a `NullPointerException`. Hence, checking equality with `Boolean.TRUE` instead.
        return Boolean.TRUE.equals(this.isEnabled);
    }

    // TODO: Check the return value for the functions below to ensure that correct values are being returned
    @Override
    public Map<String, Object> getClaims() {
        return new HashMap<>();
    }

    @Override
    public OidcUserInfo getUserInfo() {
        return null;
    }

    @Override
    public OidcIdToken getIdToken() {
        return null;
    }

    @Transient
    @JsonIgnore
    public boolean isAnonymous() {
        return Boolean.TRUE.equals(isAnonymous);
    }

    @Transient
    @JsonIgnore
    public String computeFirstName() {
        return (StringUtils.isEmpty(name) ? email : name).split("[\\s@]+", 2)[0];
    }
}
