package com.appsmith.server.configurations;

import org.apache.commons.lang3.StringUtils;
import org.springframework.boot.autoconfigure.security.oauth2.client.OAuth2ClientProperties;
import org.springframework.boot.autoconfigure.security.oauth2.client.OAuth2ClientPropertiesRegistrationAdapter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.InMemoryReactiveClientRegistrationRepository;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * We have overridden the Bean creation of clientRegistrationRepository which is by default instantiated in
 * ReactiveOAuth2ClientConfigurations.
 * <br>
 * The overriding is required because we need to intercept the OAuth2ClientProperties, and ignore the issuerUri within,
 * if it is either not present or invalid pre-emptively. This is necessary, because Spring Security doesn't spin up the
 * instance if the issuerUri is invalid.
 * <br>
 * Now, why this is required. 2 reasons.
 * <ol>
 * <li>For Keycloak: Local Development is affected, because the keycloak is not spawned in local environments.</li>
 * <li>For OIDC: We don't want to provide any random URI as issuerUri, because that would mean providing incorrect
 * information.</li>
 * </ol>
 */
@Configuration
public class InMemoryReactiveClientRegistrationRepositoryConfiguration {

    @Bean
    InMemoryReactiveClientRegistrationRepository clientRegistrationRepository(OAuth2ClientProperties properties) {
        removeIssuerURIFromOAuth2ClientPropertiesIfNotReachable(properties);
        List<ClientRegistration> registrations =
                new ArrayList<>(OAuth2ClientPropertiesRegistrationAdapter.getClientRegistrations(properties)
                        .values());
        return new InMemoryReactiveClientRegistrationRepository(registrations);
    }

    private void removeIssuerURIFromOAuth2ClientPropertiesIfNotReachable(OAuth2ClientProperties properties) {
        Map<String, OAuth2ClientProperties.Provider> providers = properties.getProvider();
        RestTemplate restTemplate = new RestTemplate();
        providers.forEach((key, value) -> {
            if (!StringUtils.isEmpty(value.getIssuerUri())) {
                String issuerUri = value.getIssuerUri();
                try {
                    restTemplate.getForObject(issuerUri, String.class);
                } catch (Exception exception) {
                    value.setIssuerUri(null);
                }
            }
        });
    }
}
