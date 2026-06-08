package com.appsmith.server.services.ce;

import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.domains.User;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.solutions.ReleaseNotesService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.test.StepVerifier;

import static org.mockito.Mockito.verifyNoInteractions;

/**
 * Unit tests for the {@link CacheablePylonHelperCEImpl} short-circuit paths.
 *
 * <p>The end-to-end Cloud Services round-trip is intentionally out of scope here — that path is covered by Cloud
 * Services-side tests against the {@code /api/v1/pylon/email-hash} contract. What we lock down on the instance side
 * is that we never make a wasteful CS call when the user can't possibly have a verifiable Pylon identity.
 */
@ExtendWith(MockitoExtension.class)
class CacheablePylonHelperCEImplTest {

    @Mock
    ConfigService configService;

    @Mock
    CloudServicesConfig cloudServicesConfig;

    @Mock
    ReleaseNotesService releaseNotesService;

    private CacheablePylonHelperCEImpl newHelper() {
        return new CacheablePylonHelperCEImpl(configService, cloudServicesConfig, releaseNotesService);
    }

    @Test
    void getEmailHash_returnsEmpty_whenUserEmailIsNull() {
        User user = new User();
        // email left null
        StepVerifier.create(newHelper().getEmailHash(user)).verifyComplete();
        verifyNoInteractions(configService, cloudServicesConfig, releaseNotesService);
    }

    @Test
    void getEmailHash_returnsEmpty_whenUserEmailIsBlank() {
        User user = new User();
        user.setEmail("   ");
        StepVerifier.create(newHelper().getEmailHash(user)).verifyComplete();
        verifyNoInteractions(configService, cloudServicesConfig, releaseNotesService);
    }

    @Test
    void getEmailHash_returnsEmpty_whenUserIsAnonymous_evenWithEmail() {
        // The anonymous user carries a non-empty placeholder email; without the isAnonymous() short-circuit
        // every anonymous profile load would fire a useless CS round-trip.
        User user = new User();
        user.setEmail("anonymousUser");
        user.setIsAnonymous(true);
        StepVerifier.create(newHelper().getEmailHash(user)).verifyComplete();
        verifyNoInteractions(configService, cloudServicesConfig, releaseNotesService);
    }
}
