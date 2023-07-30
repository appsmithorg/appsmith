package com.appsmith.server.configurations;

import com.appsmith.server.services.TenantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.oauth2.client.CommonOAuth2Provider;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ReactiveClientRegistrationRepository;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

// This class may not be needed anymore.
@Component
@RequiredArgsConstructor
public class OAuth2ClientRegistrationRepository implements ReactiveClientRegistrationRepository {

    private final TenantService tenantService;

    @Override
    public Mono<ClientRegistration> findByRegistrationId(String registrationId) {
        return tenantService.getDefaultTenant().flatMap(tenant -> {
            var config = tenant.getTenantConfiguration();
            if ("google".equals(registrationId)) {
                return Mono.just(CommonOAuth2Provider.GOOGLE
                        .getBuilder("google")
                        .clientId(config.getGoogleClientId())
                        .clientSecret(config.getGoogleClientSecret())
                        .userNameAttributeName("email")
                        .build());
            } else if ("github".equals(registrationId)) {
                return Mono.just(CommonOAuth2Provider.GITHUB
                        .getBuilder("github")
                        .clientId(config.getGithubClientId())
                        .clientSecret(config.getGithubClientSecret())
                        .userNameAttributeName("login")
                        .build());
            }
            return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid client registration id"));
        });
    }
}
