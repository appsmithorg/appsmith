package com.appsmith.server.domains;

import lombok.Data;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.util.Set;

@Data
public class UserSession {

    private String tokenType;

    private String id;

    private String email;

    private String password;

    private String source;

    private String state;

    private Boolean isEnabled;

    private String currentOrganizationId;

    private String currentWorkspaceId;

    private Set<String> organizationIds;

    private Set<String> workspaceIds;

    private String tenantId;

    private Object credentials;

    public static UserSession fromToken(Authentication authentication) {
        final UserSession session = new UserSession();
        session.tokenType = authentication.getClass().getSimpleName();
        final User user = (User) authentication.getPrincipal();
        session.id = user.getId();
        session.email = user.getEmail();
        session.password = user.getPassword();
        session.source = user.getSource().name();
        session.state = user.getState().name();
        session.isEnabled = user.isEnabled();
        session.currentOrganizationId = user.getCurrentOrganizationId();
        session.currentWorkspaceId = user.getCurrentWorkspaceId();
        session.organizationIds = user.getOrganizationIds();
        session.workspaceIds = user.getWorkspaceIds();
        session.tenantId = user.getTenantId();
        session.credentials = authentication.getCredentials();
        return session;
    }

    public Authentication makeToken() {
        if (UsernamePasswordAuthenticationToken.class.getSimpleName().equals(tokenType)) {
            final User user = new User();
            user.setEmail(email);
            user.setId(id);
            user.setPassword(password);
            user.setSource(LoginSource.valueOf(source));
            user.setState(UserState.valueOf(state));
            user.setIsEnabled(isEnabled);
            user.setCurrentOrganizationId(currentOrganizationId);
            user.setCurrentWorkspaceId(currentWorkspaceId);
            user.setOrganizationIds(organizationIds);
            user.setWorkspaceIds(workspaceIds);
            user.setTenantId(tenantId);
            return new UsernamePasswordAuthenticationToken(user, credentials);
        }

        throw new IllegalArgumentException("Invalid token type " + tokenType);
    }

}
