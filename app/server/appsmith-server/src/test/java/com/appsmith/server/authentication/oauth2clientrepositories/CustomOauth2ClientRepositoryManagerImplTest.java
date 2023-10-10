package com.appsmith.server.authentication.oauth2clientrepositories;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ExtendWith(SpringExtension.class)
class CustomOauth2ClientRepositoryManagerImplTest {

    @Autowired
    CustomOauth2ClientRepositoryManager customOauth2ClientRepositoryManager;

    @Test
    void findClientRegistrationRepositoryByRegistrationId_nullRegistrationId_returnsNull() {
        BaseClientRegistrationRepository baseClientRegistrationRepository =
                customOauth2ClientRepositoryManager.findClientRegistrationRepositoryByRegistrationId(null);
        assertNull(baseClientRegistrationRepository);
    }

    @Test
    void findClientRegistrationRepositoryByRegistrationId_validRegistrationId_returnsActualRepository() {
        BaseClientRegistrationRepository baseClientRegistrationRepository =
                customOauth2ClientRepositoryManager.findClientRegistrationRepositoryByRegistrationId("oidc");
        assertTrue(baseClientRegistrationRepository instanceof OidcClientRepositoryImpl);

        baseClientRegistrationRepository =
                customOauth2ClientRepositoryManager.findClientRegistrationRepositoryByRegistrationId("keycloak");
        assertTrue(baseClientRegistrationRepository instanceof SamlClientRepositoryImpl);
    }
}
