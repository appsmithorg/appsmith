package com.appsmith.server.solutions;

import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.Map;

public interface KeycloakIntegrationService {

    Mono<Boolean> createRealm();

    Mono<Boolean> createClient(ServerWebExchange exchange);

    Mono<String> generateClientSecret();

    Mono<Map<String, Object>> importSamlConfigFromUrl(Map<String, String> config);

    Mono<Boolean> createSamlIdentityProviderOnKeycloak(Map<String, Object> identityProviderRequest);

    Mono<Boolean> createSamlIdentityProviderExplicitConfiguration(Map<String, Object> configuration);

    Mono<Boolean> createSamlIdentityProviderFromIdpConfigFromUrl(Map<String, String> request);

    Mono<Boolean> deleteRealm();
}
