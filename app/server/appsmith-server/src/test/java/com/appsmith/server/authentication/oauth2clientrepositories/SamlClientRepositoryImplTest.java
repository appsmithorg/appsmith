package com.appsmith.server.authentication.oauth2clientrepositories;

import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.services.FeatureFlagService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ReactiveClientRegistrationRepository;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
@ExtendWith(SpringExtension.class)
class SamlClientRepositoryImplTest {

    @SpyBean
    FeatureFlagService featureFlagService;

    @MockBean
    ReactiveClientRegistrationRepository clientUserRepository;

    @Autowired
    SamlClientRepositoryImpl samlClientRepository;

    @BeforeEach
    void setup() {
        Mockito.when(featureFlagService.check(FeatureFlagEnum.license_sso_saml_enabled))
                .thenReturn(Mono.just(true));
    }

    @Test
    void findByRegistrationId_validRegistrationId_fetchClientRegistrationFromSpringRepository() {
        ClientRegistration clientRegistration = ClientRegistration.withRegistrationId("keycloak")
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .clientId("clientId")
                .redirectUri("redirectUri")
                .authorizationUri("authorizationUri")
                .tokenUri("tokenUri")
                .build();

        Mockito.when(clientUserRepository.findByRegistrationId("keycloak")).thenReturn(Mono.just(clientRegistration));
        Mono<ClientRegistration> clientRegistrationMono = samlClientRepository.findByRegistrationId("keycloak");
        assertEquals(clientRegistrationMono.block(), clientRegistration);
    }
}
