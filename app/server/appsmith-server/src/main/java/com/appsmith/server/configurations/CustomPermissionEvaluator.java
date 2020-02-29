package com.appsmith.server.configurations;

import com.appsmith.server.domains.User;
import com.appsmith.server.helpers.AclHelper;
import com.appsmith.server.services.AclEntity;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.io.Serializable;
import java.util.regex.Pattern;

@Slf4j
@Component
public class CustomPermissionEvaluator implements PermissionEvaluator {

    @Override
    public boolean hasPermission(Authentication authentication, Object targetDomainObject, Object permission) {
        log.debug("In hasPermission with permission: {}", permission);
        AclEntity aclEntity = targetDomainObject.getClass().getAnnotation(AclEntity.class);
        // Create the ARN
        String arn = AclHelper.createArn(aclEntity, (User) authentication.getPrincipal(), null);
        String authorityToCheck = AclHelper.concatenatePermissionWithArn((String) permission, arn);
        log.debug("Got authority to check: {}", authorityToCheck);

        boolean result = authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals(authorityToCheck)
                                || auth.getAuthority().matches(authorityToCheck)
                                || authorityToCheck.matches(auth.getAuthority())
                );
        log.debug("Got hasPermission result: {}", result);
        return result;
    }

    @Override
    public boolean hasPermission(Authentication authentication, Serializable targetId, String targetType, Object permission) {
        log.debug("In hasPermission 2");
        SimpleGrantedAuthority authority = new SimpleGrantedAuthority((String) permission);
        return authentication.getAuthorities().contains(authority);
    }
}
