package com.appsmith.server.domains;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Set;
import java.util.stream.Collectors;


@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
public class User extends BaseDomain implements UserDetails {

    private String name;

    private String email;

    private Set<Role> roles;

    private String password;

    private LoginSource source;

    private UserState state;

    private Boolean isEnabled;

    private Tenant tenant;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {

        if (roles == null || roles.isEmpty()) //No existing roles found.
            return null;

        Collection<SimpleGrantedAuthority> authorities = roles.stream()
                .map(role -> new SimpleGrantedAuthority(role.toString()))
                .collect(Collectors.toList());

        return authorities;
    }

    @Override
    public String getUsername() {
        return this.name;
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
