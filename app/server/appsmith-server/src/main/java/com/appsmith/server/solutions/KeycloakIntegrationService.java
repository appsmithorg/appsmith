package com.appsmith.server.solutions;

import reactor.core.publisher.Mono;

import java.util.Map;

public interface KeycloakIntegrationService {

    Mono<Boolean> createRealm();

    Mono<Boolean> createClient(String exchange);

    Mono<String> generateClientSecret();

    Mono<Map<String, Object>> importSamlConfigFromUrl(Map<String, String> config, String baseUrl);

    Mono<Boolean> createSamlIdentityProviderOnKeycloak(Map<String, Object> identityProviderRequest, Map<String, String> claims);

    Mono<Boolean> createSamlIdentityProviderExplicitConfiguration(Map<String, Object> configuration, String baseUrl, Map<String, String> claims);

    Mono<Boolean> createSamlIdentityProviderFromIdpConfigFromUrl(Map<String, String> request, String baseUrl, Map<String, String> claims);

    Mono<Boolean> deleteRealm();

    Mono<Boolean> createSamlIdentityProviderFromXml(String importFromXml, String baseUrl, Map<String, String> claims);

    Mono<Boolean> addClientClaims(Map<String, String> claims, String baseUrl);
}
