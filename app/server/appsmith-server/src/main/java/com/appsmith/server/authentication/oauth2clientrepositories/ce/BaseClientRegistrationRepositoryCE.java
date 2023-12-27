package com.appsmith.server.authentication.oauth2clientrepositories.ce;

import org.springframework.security.oauth2.client.registration.ClientRegistration;
import reactor.core.publisher.Mono;

public interface BaseClientRegistrationRepositoryCE {
    Mono<ClientRegistration> findByRegistrationId(String registrationId);
}
