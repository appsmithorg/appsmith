package com.appsmith.server.dtos;

import com.appsmith.server.domains.LoginSource;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserState;
import lombok.Data;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;

import java.time.Instant;
import java.util.Collection;
import java.util.Set;

/**
 * UserSession is a POJO class that represents a user's session. It is serialized to JSON and stored in Redis. That
 * means that this class doesn't have to be serializable, and the serialVersionUID is not required. This class can
 * change/evolve in the future, as long as pre-existing JSON session data can be safely deserialized.
 */
@Data
public class UserSessionDTO {

    private String userId;

    private String email;

    private String hashedEmail;

    private String name;

    private Long createdAt;

    private Boolean emailVerified;

    private Boolean emailVerificationRequired;

    private LoginSource source;

    private UserState state;

    private Boolean isEnabled;

    private String currentWorkspaceId;

    private Set<String> workspaceIds;

    private String organizationId;

    private Object credentials;

    private Collection<? extends GrantedAuthority> authorities;

    private String authorizedClientRegistrationId;

    private static final String PASSWORD_PROVIDER = "password";

    private static final Set<String> ALLOWED_OAUTH_PROVIDERS = LoginSource.getNonFormSources();

    /**
     * We don't expect this class to be instantiated outside this class. Remove this constructor when needed.
     */
    private UserSessionDTO() {}

    /**
     * Given an authentication token, typically from a Spring Security context, create a UserSession object. This
     * UserSession object can then be serialized to JSON and stored in Redis.
     *
     * @param authentication The token to create the UserSession from. Usually an instance of UsernamePasswordAuthenticationToken or Oauth2AuthenticationToken.
     * @return A UserSession object representing the user's session, with details from the given token.
     */
    public static UserSessionDTO fromToken(Authentication authentication) {
        final UserSessionDTO session = new UserSessionDTO();
        final User user = (User) authentication.getPrincipal();

        session.userId = user.getId();
        session.email = user.getEmail();
        session.hashedEmail = user.getHashedEmail();
        session.name = user.getName();
        // user.getCreatedAt() is null for anonymous user
        if (user.getCreatedAt() != null) {
            session.createdAt = user.getCreatedAt().getEpochSecond();
        }
        session.source = user.getSource();
        session.state = user.getState();
        session.isEnabled = user.isEnabled();
        session.workspaceIds = user.getWorkspaceIds();
        session.organizationId = user.getOrganizationId();
        session.emailVerified = Boolean.TRUE.equals(user.getEmailVerified());
        session.emailVerificationRequired = Boolean.TRUE.equals(user.getEmailVerificationRequired());

        session.credentials = authentication.getCredentials();
        session.authorities = authentication.getAuthorities();

        if (authentication instanceof OAuth2AuthenticationToken) {
            session.authorizedClientRegistrationId =
                    ((OAuth2AuthenticationToken) authentication).getAuthorizedClientRegistrationId();
        } else if (authentication instanceof UsernamePasswordAuthenticationToken) {
            session.authorizedClientRegistrationId = PASSWORD_PROVIDER;
        } else {
            throw new IllegalArgumentException("Unsupported authentication type: "
                    + authentication.getClass().getName());
        }

        return session;
    }

    /**
     * Performs the reverse of fromToken method. Given a UserSession object, create a Spring Security authentication
     * token. This authentication token can then be wrapped in a SecurityContext and used as the user's session.
     *
     * @return A Spring Security authentication token representing the user's session. Usually an instance of UsernamePasswordAuthenticationToken or Oauth2AuthenticationToken.
     */
    public Authentication makeToken() {
        final User user = new User();

        user.setId(userId);
        user.setEmail(email);
        user.setHashedEmail(hashedEmail);
        user.setName(name);
        // createdAt is null for anonymous user
        if (createdAt != null) {
            user.setCreatedAt(Instant.ofEpochSecond(createdAt));
        }
        user.setSource(source);
        user.setState(state);
        user.setIsEnabled(isEnabled);
        user.setWorkspaceIds(workspaceIds);
        user.setOrganizationId(organizationId);
        user.setEmailVerified(Boolean.TRUE.equals(emailVerified));
        user.setEmailVerificationRequired(Boolean.TRUE.equals(emailVerificationRequired));

        if (PASSWORD_PROVIDER.equals(authorizedClientRegistrationId)) {
            return new UsernamePasswordAuthenticationToken(user, credentials, authorities);

        } else if (ALLOWED_OAUTH_PROVIDERS.contains(authorizedClientRegistrationId)) {
            return new OAuth2AuthenticationToken(user, authorities, authorizedClientRegistrationId);
        }

        throw new IllegalArgumentException("Invalid registration ID " + authorizedClientRegistrationId);
    }
}
