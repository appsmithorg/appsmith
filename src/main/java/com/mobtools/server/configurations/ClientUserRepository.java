package com.mobtools.server.configurations;

import com.mobtools.server.domains.LoginSource;
import com.mobtools.server.domains.User;
import com.mobtools.server.domains.UserState;
import com.mobtools.server.services.TenantService;
import com.mobtools.server.services.UserService;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.web.server.ServerOAuth2AuthorizedClientRepository;
import org.springframework.security.oauth2.client.web.server.WebSessionServerOAuth2AuthorizedClientRepository;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.util.Assert;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebSession;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;


/**
 * This code has been copied from WebSessionServerOAuth2AuthorizedClientRepository.java
 * which also implements ServerOAuth2AuthorizedClientRepository. This was done to make changes
 * to saveAuthorizedClient to also handle adding users to UserRepository.
 *
 * This was done because on authorization, the user needs to be stored in appsmith domain.
 * To achieve this, saveAuthorizedClient function has been edited in the following manner.
 * In the reactive flow, post doOnSuccess transformation, another Mono.then has been added. In this,
 * Authentication object is passed to checkAndCreateUser function. This object is used to get OidcUser from which
 * user attributes like name, email, etc are extracted. If the user doesnt exist in User
 * Repository, a new user is created and saved.
 *
 * The ClientUserRepository is created during SecurityWebFilterChain Bean creation. By
 * configuring to use Oauth2Login, this ServerOAuth2AuthorizedClientRepository implementation
 * is injected. This hack is used to ensure that on successful authentication, we are able
 * to record the user in our database. Since ServerOAuth2AuthorizedClientRepository's
 * saveAuthorizedClient is called on every successful OAuth2 authentication, this solves the problem
 * of plugging a handler for the same purpose.
 */
@Configuration
public class ClientUserRepository implements ServerOAuth2AuthorizedClientRepository {

    UserService userService;
    TenantService tenantService;

    public ClientUserRepository(UserService userService, TenantService tenantService) {
        this.userService = userService;
        this.tenantService = tenantService;
    }

    private static final String DEFAULT_AUTHORIZED_CLIENTS_ATTR_NAME =
            WebSessionServerOAuth2AuthorizedClientRepository.class.getName() +  ".AUTHORIZED_CLIENTS";
    private final String sessionAttributeName = DEFAULT_AUTHORIZED_CLIENTS_ATTR_NAME;

    @Override
    @SuppressWarnings("unchecked")
    public <T extends OAuth2AuthorizedClient> Mono<T> loadAuthorizedClient(String clientRegistrationId, Authentication principal,
                                                                           ServerWebExchange exchange) {
        Assert.hasText(clientRegistrationId, "clientRegistrationId cannot be empty");
        Assert.notNull(exchange, "exchange cannot be null");
        return exchange.getSession()
                .map(this::getAuthorizedClients)
                .flatMap(clients -> Mono.justOrEmpty((T) clients.get(clientRegistrationId)));
    }

    @Override
    public Mono<Void> saveAuthorizedClient(OAuth2AuthorizedClient authorizedClient, Authentication principal,
                                           ServerWebExchange exchange) {
        Assert.notNull(authorizedClient, "authorizedClient cannot be null");
        Assert.notNull(exchange, "exchange cannot be null");
        return exchange.getSession()
                .doOnSuccess(session -> {
                    Map<String, OAuth2AuthorizedClient> authorizedClients = getAuthorizedClients(session);
                    authorizedClients.put(authorizedClient.getClientRegistration().getRegistrationId(), authorizedClient);
                    session.getAttributes().put(this.sessionAttributeName, authorizedClients);
                })
                /*
                 * TODO
                 * Need to test how this behaves in the following :
                 * 1. Clustered environment
                 * 2. Redis saved sessions
                 */
                .then(checkAndCreateUser((OidcUser) principal.getPrincipal()))
                .then(Mono.empty());
    }

    public Mono<User> checkAndCreateUser(OidcUser user) {
        User newUser = new User();
        newUser.setName(user.getFullName());
        newUser.setEmail(user.getEmail());
        newUser.setSource(LoginSource.GOOGLE);
        newUser.setState(UserState.ACTIVATED);
        newUser.setIsEnabled(true);

        /** TODO
         * Tenant here is being hardcoded. This is a stop gap measure
         * A flow needs to be added to connect a User to a Tenant. Once
         * that is done, during the login, the tenant should be picked up
         * and a user should be hence created.
         */

        return tenantService.findById("5d3e90a2dfec7c00047a81ea")
                .map(tenant -> {
                    newUser.setTenant(tenant);
                    return newUser;
                })
                .then(userService.findByEmail(user.getEmail()))
                .switchIfEmpty(userService.save(newUser));
    }

    @Override
    public Mono<Void> removeAuthorizedClient(String clientRegistrationId, Authentication principal,
                                             ServerWebExchange exchange) {
        Assert.hasText(clientRegistrationId, "clientRegistrationId cannot be empty");
        Assert.notNull(exchange, "exchange cannot be null");
        return exchange.getSession()
                .doOnSuccess(session -> {
                    Map<String, OAuth2AuthorizedClient> authorizedClients = getAuthorizedClients(session);
                    authorizedClients.remove(clientRegistrationId);
                    if (authorizedClients.isEmpty()) {
                        session.getAttributes().remove(this.sessionAttributeName);
                    } else {
                        session.getAttributes().put(this.sessionAttributeName, authorizedClients);
                    }
                })
                .then(Mono.empty());
    }

    @SuppressWarnings("unchecked")
    private Map<String, OAuth2AuthorizedClient> getAuthorizedClients(WebSession session) {
        Map<String, OAuth2AuthorizedClient> authorizedClients = session == null ? null :
                (Map<String, OAuth2AuthorizedClient>) session.getAttribute(this.sessionAttributeName);
        if (authorizedClients == null) {
            authorizedClients = new HashMap<>();
        }
        return authorizedClients;
    }
}
