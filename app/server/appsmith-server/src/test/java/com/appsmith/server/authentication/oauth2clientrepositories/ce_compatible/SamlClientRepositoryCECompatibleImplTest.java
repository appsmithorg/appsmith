package com.appsmith.server.authentication.oauth2clientrepositories.ce_compatible;

import com.appsmith.server.authentication.oauth2clientrepositories.SamlClientRepositoryImpl;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

@SpringBootTest
@ExtendWith(SpringExtension.class)
class SamlClientRepositoryCECompatibleImplTest {

    @Autowired
    SamlClientRepositoryImpl samlClientRepository;

    @Test
    void findByRegistrationId_featureIsNotSupported_throwUnsupportedOperationException() {
        Mono<ClientRegistration> clientRegistrationMono = samlClientRepository.findByRegistrationId("keycloak");

        StepVerifier.create(clientRegistrationMono)
                .expectErrorSatisfies(throwable -> {
                    Assertions.assertEquals(throwable.getMessage(), AppsmithError.UNSUPPORTED_OPERATION.getMessage());
                    Assertions.assertEquals(throwable.getClass(), AppsmithException.class);
                })
                .verify();
    }
}
