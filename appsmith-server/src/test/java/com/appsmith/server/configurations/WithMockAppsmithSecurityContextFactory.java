package com.appsmith.server.configurations;

import com.appsmith.server.domains.User;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.test.context.support.WithSecurityContextFactory;

public class WithMockAppsmithSecurityContextFactory implements WithSecurityContextFactory<WithMockAppsmithUser> {

    @Override
    public SecurityContext createSecurityContext(WithMockAppsmithUser mockAppsmithUser) {
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        User principal = new User();
        principal.setId(mockAppsmithUser.username());
        principal.setEmail(mockAppsmithUser.username());
        principal.setName(mockAppsmithUser.name());
        Authentication auth = new UsernamePasswordAuthenticationToken(principal, "password", principal.getAuthorities());
        context.setAuthentication(auth);
        return context;
    }
}
