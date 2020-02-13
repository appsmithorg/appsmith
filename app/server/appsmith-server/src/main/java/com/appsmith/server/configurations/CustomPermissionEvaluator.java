package com.appsmith.server.configurations;

import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.io.Serializable;

@Slf4j
@Component
public class CustomPermissionEvaluator implements PermissionEvaluator {

    @Override
    public boolean hasPermission(Authentication authentication, Object targetDomainObject, Object permission) {
        log.debug("In hasPermission with permission: {}", permission);
        SimpleGrantedAuthority authority = new SimpleGrantedAuthority((String) permission);
        return authentication.getAuthorities().contains(authority);
    }

    @Override
    public boolean hasPermission(Authentication authentication, Serializable targetId, String targetType, Object permission) {
        log.debug("In hasPermission 2");
        SimpleGrantedAuthority authority = new SimpleGrantedAuthority((String) permission);
        return authentication.getAuthorities().contains(authority);
    }
}
