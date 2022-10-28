package com.appsmith.server.services;

import com.appsmith.server.dtos.AuthenticationConfigurationDTO;
import com.appsmith.server.dtos.EnvChangesResponseDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.solutions.EnvManager;
import com.appsmith.server.solutions.KeycloakIntegrationService;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.Map;

import static com.appsmith.server.constants.EnvVariables.APPSMITH_BASE_URL;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_SSO_SAML_ENABLED;

@Service
public class SamlConfigurationServiceImpl implements SamlConfigurationService {

    private final KeycloakIntegrationService keycloakIntegrationService;
    private final EnvManager envManager;

    public SamlConfigurationServiceImpl(KeycloakIntegrationService keycloakIntegrationService, EnvManager envManager) {
        this.keycloakIntegrationService = keycloakIntegrationService;
        this.envManager = envManager;
    }

    @Override
    public Mono<EnvChangesResponseDTO> configure(AuthenticationConfigurationDTO configuration, ServerWebExchange exchange) {

        if (configuration.getIsEnabled() == null || !configuration.getIsEnabled()) {
            // Delete the realm to delete all existing configuration and then update the environment with SAML disabled.
            return keycloakIntegrationService.deleteRealm()
                    .then(
                            envManager.applyChanges(Map.of(
                                            APPSMITH_SSO_SAML_ENABLED.toString(), "false",
                                            APPSMITH_BASE_URL.toString(), ""
                                    )
                            )
                    );
        }

        String origin = exchange.getRequest().getHeaders().getOrigin();

        if (origin == null || origin.isEmpty()) {
            return Mono.error(new AppsmithException(AppsmithError.GENERIC_BAD_REQUEST, "Origin header is missing"));
        }

        // If a trailing "/" exists in the origin header, trim it
        if (origin.endsWith("/")) {
            origin = origin.substring(0, origin.length() - 1);
        }

        // New configuration for SAML is being configured for the tenant

        String baseUrl = origin;
        return envManager.getAll()
                .flatMap(envVarMap -> {
                    String samlEnabledString = envVarMap.get(APPSMITH_SSO_SAML_ENABLED);
                    if (samlEnabledString != null && Boolean.parseBoolean(samlEnabledString)) {
                        // SAML seems to be already configured.
                        return Mono.error(new AppsmithException(AppsmithError.SAML_ALREADY_CONFIGURED));
                    }

                    // In Keycloak, create a realm and client
                    Mono<Boolean> initializeKeycloakMono = keycloakIntegrationService.createRealm()
                            .then(keycloakIntegrationService.createClient(baseUrl));


                    if (configuration.getImportFromUrl() != null && !configuration.getImportFromUrl().isEmpty()) {

                        // We seem to be importing from a URL
                        return initializeKeycloakMono
                                .then(keycloakIntegrationService.createSamlIdentityProviderFromIdpConfigFromUrl(
                                        Map.of("url", configuration.getImportFromUrl()), baseUrl)
                                );
                    } else if (configuration.getImportFromXml() != null && !configuration.getImportFromXml().isEmpty()) {

                        // We seem to be importing from XML

                        return initializeKeycloakMono
                                .then(keycloakIntegrationService.createSamlIdentityProviderFromXml(configuration.getImportFromXml(), baseUrl));

                    } else if (configuration.getConfiguration() != null) {

                        return initializeKeycloakMono
                                .then(keycloakIntegrationService.createSamlIdentityProviderExplicitConfiguration(configuration.getConfiguration(), baseUrl));
                    }

                    return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));

                })
                .onErrorResume(AppsmithException.class, error -> {
                    if (error instanceof AppsmithException &&
                            error.getAppErrorCode().equals(AppsmithError.SAML_CONFIGURATION_FAILURE.getAppErrorCode())) {
                        // In case there was an error in configuring SAML, clean up the realm created before
                        // creating the identity provider
                        return keycloakIntegrationService.deleteRealm()
                                .then(Mono.error(error));
                    }

                    return Mono.error(error);
                })
                .flatMap(updatedConfig -> envManager.applyChanges(
                        Map.of(
                                APPSMITH_SSO_SAML_ENABLED.toString(), "true",
                                APPSMITH_BASE_URL.toString(), baseUrl
                        )
                ));

    }
}
