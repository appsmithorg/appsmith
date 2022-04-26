package com.appsmith.server.solutions;

import reactor.core.publisher.Mono;

import java.util.Map;

public interface KeycloakIntegrationService {

    Mono<Boolean> createRealm();

    Mono<Boolean> createClient(String exchange);

    Mono<String> generateClientSecret();

    Mono<Map<String, Object>> importSamlConfigFromUrl(Map<String, String> config, String baseUrl);

    Mono<Boolean> createSamlIdentityProviderOnKeycloak(Map<String, Object> identityProviderRequest);

    Mono<Boolean> createSamlIdentityProviderExplicitConfiguration(Map<String, Object> configuration, String baseUrl);

    Mono<Boolean> createSamlIdentityProviderFromIdpConfigFromUrl(Map<String, String> request, String baseUrl);

    Mono<Boolean> deleteRealm();

    Mono<Boolean> createSamlIdentityProviderFromXml(String importFromXml, String baseUrl);
}
