package com.appsmith.server.services;

import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.dtos.AuthenticationConfigurationDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.services.ce_compatible.SamlConfigurationServiceCECompatibleImpl;
import com.appsmith.server.solutions.EnvManager;
import com.appsmith.server.solutions.KeycloakIntegrationService;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import reactor.core.publisher.Mono;

import java.util.Map;

import static com.appsmith.server.constants.EnvVariables.APPSMITH_BASE_URL;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_SSO_SAML_ENABLED;
import static java.lang.Boolean.TRUE;

@Service
public class SamlConfigurationServiceImpl extends SamlConfigurationServiceCECompatibleImpl
        implements SamlConfigurationService {

    private final KeycloakIntegrationService keycloakIntegrationService;
    private final EnvManager envManager;

    public SamlConfigurationServiceImpl(KeycloakIntegrationService keycloakIntegrationService, EnvManager envManager) {
        this.keycloakIntegrationService = keycloakIntegrationService;
        this.envManager = envManager;
    }

    @Override
    public Mono<Void> configure(AuthenticationConfigurationDTO configuration, String origin) {

        if (configuration.getIsEnabled() == null || !configuration.getIsEnabled()) {
            // Delete the realm to delete all existing configuration and then update the environment with SAML disabled.
            return keycloakIntegrationService
                    .deleteRealm()
                    // TODO : Remove the check here and instead move it to deleteRealm() method to return success if the
                    // realm already exists.
                    .onErrorResume(AppsmithException.class, error -> {
                        if (error instanceof AppsmithException
                                && error.getAppErrorCode()
                                        .equals(AppsmithError.SAML_CONFIGURATION_FAILURE.getAppErrorCode())) {
                            // Looks like the realm was already deleted. Let's continue.
                            return Mono.just(TRUE);
                        }

                        return Mono.error(error);
                    })
                    .then(envManager.applyChanges(Map.of(APPSMITH_SSO_SAML_ENABLED.toString(), "false"), origin));
        }

        // If a trailing "/" exists in the origin header, trim it
        final String baseUrl = StringUtils.stripEnd(origin, "/");

        // New configuration for SAML is being configured for the tenant
        return envManager
                .getAll()
                .flatMap(envVarMap -> {
                    String samlEnabledString = envVarMap.get(APPSMITH_SSO_SAML_ENABLED);
                    if (samlEnabledString != null && Boolean.parseBoolean(samlEnabledString)) {
                        // SAML seems to be already configured.
                        return Mono.error(new AppsmithException(AppsmithError.SAML_ALREADY_CONFIGURED));
                    }

                    return Mono.just(envVarMap);
                })
                .flatMap(envVarMap -> {

                    // In Keycloak, create a realm and client
                    Mono<Boolean> initializeKeycloakMono = keycloakIntegrationService
                            .createRealm()
                            .then(keycloakIntegrationService.createClient(baseUrl));

                    return initializeKeycloakMono;
                })
                .flatMap(keyclaokInitialized -> {
                    if (configuration.getImportFromUrl() != null
                            && !configuration.getImportFromUrl().isEmpty()) {

                        // We seem to be importing from a URL
                        return keycloakIntegrationService.createSamlIdentityProviderFromIdpConfigFromUrl(
                                Map.of("url", configuration.getImportFromUrl()), baseUrl, configuration.getClaims());

                    } else if (configuration.getImportFromXml() != null
                            && !configuration.getImportFromXml().isEmpty()) {

                        // We seem to be importing from XML
                        return keycloakIntegrationService.createSamlIdentityProviderFromXml(
                                configuration.getImportFromXml(), baseUrl, configuration.getClaims());

                    } else if (configuration.getConfiguration() != null) {

                        // The user has explicitly configured the individual fields
                        return keycloakIntegrationService.createSamlIdentityProviderExplicitConfiguration(
                                configuration.getConfiguration(), baseUrl, configuration.getClaims());
                    }

                    return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
                })
                .flatMap(identityProviderCreated -> {
                    // Now update the client with custom claims so that they are exposed in Appsmith
                    if (CollectionUtils.isEmpty(configuration.getClaims())) {
                        return Mono.just(TRUE);
                    }

                    return keycloakIntegrationService.addClientClaims(configuration.getClaims(), baseUrl);
                })
                .onErrorResume(AppsmithException.class, error -> {
                    if (error instanceof AppsmithException
                            && error.getAppErrorCode()
                                    .equals(AppsmithError.SAML_CONFIGURATION_FAILURE.getAppErrorCode())) {
                        // In case there was an error in configuring SAML, clean up the realm created before
                        // creating the identity provider
                        return keycloakIntegrationService.deleteRealm().then(Mono.error(error));
                    }

                    return Mono.error(error);
                })
                .flatMap(updatedConfig -> envManager.applyChanges(
                        Map.of(APPSMITH_SSO_SAML_ENABLED.toString(), "true", APPSMITH_BASE_URL.toString(), baseUrl),
                        origin));
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_sso_saml_enabled)
    public TenantConfiguration getTenantConfiguration(TenantConfiguration tenantConfiguration) {
        if ("true".equals(System.getenv("APPSMITH_SSO_SAML_ENABLED"))) {
            tenantConfiguration.addThirdPartyAuth("saml");
        }
        return tenantConfiguration;
    }
}
