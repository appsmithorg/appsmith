package com.appsmith.server.configurations;

import com.appsmith.server.domains.LoginSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.security.oauth2.client.OAuth2ClientProperties;
import org.springframework.boot.autoconfigure.security.oauth2.client.OAuth2ClientPropertiesRegistrationAdapter;
import org.springframework.boot.context.properties.PropertyMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.InMemoryReactiveClientRegistrationRepository;
import org.springframework.security.oauth2.core.AuthenticationMethod;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.core.oidc.IdTokenClaimNames;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.ArrayList;
import java.util.HashMap;
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
@Slf4j
public class InMemoryReactiveClientRegistrationRepositoryConfiguration {

    private static final String KEYCLOAK = LoginSource.KEYCLOAK.name().toLowerCase();

    /**
     * <p>
     * Configures and creates an ReactiveClientRegistrationRepository bean for Spring Security OAuth2
     * based on the provided OAuth2 client properties.
     * </p>
     *
     * <p>
     * This method removes the KEYCLOAK registration and provider from the properties, builds a ClientRegistration
     * specifically for Keycloak, and adds it to the list of registrations. Finally, creates and returns an
     * InMemoryReactiveClientRegistrationRepository with the configured list of client registrations.
     * </p>
     *
     * @param properties The OAuth2 client properties used to configure client registrations.
     * @return An InMemoryReactiveClientRegistrationRepository bean initialized with the configured client registrations.
     * @see org.springframework.context.annotation.Bean
     * @see org.springframework.security.oauth2.client.registration.InMemoryReactiveClientRegistrationRepository
     */
    @Bean
    InMemoryReactiveClientRegistrationRepository clientRegistrationRepository(OAuth2ClientProperties properties) {
        OAuth2ClientProperties.Registration registration =
                properties.getRegistration().get(KEYCLOAK);
        OAuth2ClientProperties.Provider provider = properties.getProvider().get(KEYCLOAK);
        properties.getRegistration().remove(KEYCLOAK);
        properties.getProvider().remove(KEYCLOAK);
        List<ClientRegistration> registrations =
                new ArrayList<>(OAuth2ClientPropertiesRegistrationAdapter.getClientRegistrations(properties)
                        .values());

        ClientRegistration clientRegistrationForKeycloak = buildClientRegistrationForKeycloak(registration, provider);
        registrations.add(clientRegistrationForKeycloak);
        return new InMemoryReactiveClientRegistrationRepository(registrations);
    }

    /**
     * <p>
     * Builds a ClientRegistration specifically for Keycloak based on the provided registration and provider information.
     * </p>
     *
     * <p>
     * This method constructs a ClientRegistration.Builder with the necessary configuration for Keycloak.
     * It maps the properties from the registration and provider objects to the corresponding builder methods.
     * Additionally, it sets the end session endpoint in the provider configuration metadata.
     * </p>
     *
     * @param registration The registration information for the OAuth2 client.
     * @param provider The provider information for the OAuth2 client.
     * @return A ClientRegistration specifically configured for Keycloak.
     * @see org.springframework.security.oauth2.client.registration.ClientRegistration
     */
    ClientRegistration buildClientRegistrationForKeycloak(
            OAuth2ClientProperties.Registration registration, OAuth2ClientProperties.Provider provider) {
        PropertyMapper map = PropertyMapper.get().alwaysApplyingWhenNonNull();
        String authorizationUri = provider.getAuthorizationUri();
        URI uri = URI.create(authorizationUri);
        String endSessionEndpoint = UriComponentsBuilder.newInstance()
                .scheme(uri.getScheme())
                .host(uri.getHost())
                .path("/auth/realms/appsmith/protocol/openid-connect/logout")
                .build()
                .toUriString();
        Map<String, Object> configurationMetadata = new HashMap<>();
        configurationMetadata.put("end_session_endpoint", endSessionEndpoint);
        ClientRegistration.Builder builder = ClientRegistration.withRegistrationId(KEYCLOAK)
                .userNameAttributeName(IdTokenClaimNames.SUB)
                .providerConfigurationMetadata(configurationMetadata);
        map.from(registration::getClientSecret).to(builder::clientSecret);
        map.from(registration::getRedirectUri).to(builder::redirectUri);
        map.from(registration::getScope)
                .as(org.springframework.util.StringUtils::toStringArray)
                .to(builder::scope);
        map.from(registration::getClientSecret).to(builder::clientSecret);
        map.from(registration::getClientAuthenticationMethod)
                .as(ClientAuthenticationMethod::new)
                .to(builder::clientAuthenticationMethod);
        map.from(registration::getAuthorizationGrantType)
                .as(AuthorizationGrantType::new)
                .to(builder::authorizationGrantType);
        map.from(registration::getClientName).to(builder::clientName);
        map.from(registration::getClientId).to(builder::clientId);
        map.from(provider::getAuthorizationUri).to(builder::authorizationUri);
        map.from(provider::getTokenUri).to(builder::tokenUri);
        map.from(provider::getJwkSetUri).to(builder::jwkSetUri);
        map.from(provider::getUserInfoUri).to(builder::userInfoUri);
        map.from(provider::getUserInfoAuthenticationMethod)
                .as(AuthenticationMethod::new)
                .to(builder::userInfoAuthenticationMethod);
        map.from(provider::getUserNameAttribute).to(builder::userNameAttributeName);
        return builder.build();
    }
}
