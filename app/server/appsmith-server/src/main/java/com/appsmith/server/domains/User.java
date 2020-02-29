package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.helpers.AclHelper;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;


@Getter
@Setter
@ToString
@Document
public class User extends BaseDomain implements UserDetails {

    private String name;

    @Indexed(unique = true)
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

    // There is a many-to-many relationship with groups. If this value is modified, please also modify the list of
    // users in that particular group document as well.
    private Set<String> groupIds = new HashSet<>();

    // These permissions are in addition to the privileges provided by the groupIds. We can assign individual permissions
    // to users instead of creating a group for them. To be used only for one-off permissions.
    // During evaluation a union of the group permissions and user-specific permissions will take effect.
    private Set<String> permissions = new HashSet<>();

    private Set<Policy> policies = new HashSet<>();

    @JsonIgnore
    @Transient
    Set<String> flatPermissions = new HashSet<>();

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // TODO: Also extract the policies from associated groups
        if (this.flatPermissions != null) {
            for (Policy policy : this.policies) {
                for (String entity : policy.getEntities()) {
                    for (String permission : policy.getPermissions()) {
                        flatPermissions.add(AclHelper.concatenatePermissionWithArn(permission, entity));
                    }
                }
            }
        }

        return this.getFlatPermissions().stream()
                .map(permission -> new SimpleGrantedAuthority(permission))
                .collect(Collectors.toSet());
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
        return this.isEnabled;
    }

}
