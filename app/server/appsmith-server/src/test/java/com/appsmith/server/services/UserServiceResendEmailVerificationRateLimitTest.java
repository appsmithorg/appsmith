package com.appsmith.server.services;

import com.appsmith.server.configurations.RedisTestContainerConfig;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ResendEmailVerificationDTO;
import com.appsmith.server.helpers.RedisUtils;
import com.appsmith.server.instanceconfigs.helpers.InstanceVariablesHelper;
import com.appsmith.server.repositories.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithUserDetails;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.UUID;

import static com.appsmith.server.constants.Appsmith.DEFAULT_ORIGIN_HEADER;
import static org.mockito.ArgumentMatchers.any;

/**
 * Exercises the in-service per-email throttle on {@code resendEmailVerification} against a real Redis
 * (testcontainer) bucket4j bucket, complementing the mocked-limiter unit coverage in {@code UserServiceTest}.
 *
 * <p>Pins two properties:
 * <ol>
 *   <li>The throttle triggers: after the configured per-email cap (5 / 24h) is reached, further resend
 *       requests for that address stop dispatching verification emails.</li>
 *   <li>The throttle is silent (anti-enumeration, CWE-204): an over-limit request returns the exact same
 *       generic success ({@code true}) as an under-limit one, so an unauthenticated caller cannot observe
 *       that the limit was hit — no distinguishable 429 is surfaced.</li>
 * </ol>
 */
@Slf4j
@SpringBootTest
@Import({RedisTestContainerConfig.class, RedisUtils.class})
public class UserServiceResendEmailVerificationRateLimitTest {

    // Must match RateLimitConfig registration for BUCKET_KEY_FOR_RESEND_EMAIL_VERIFICATION_API.
    private static final int PER_EMAIL_LIMIT = 5;

    @Autowired
    UserService userService;

    @Autowired
    OrganizationService organizationService;

    @Autowired
    UserRepository userRepository;

    // Spied so the under-limit successes do not attempt a real email send, and so send attempts can be counted.
    @SpyBean
    EmailService emailService;

    // Spied to enable instance-level email verification (it is read from the instance-variables config doc,
    // not the organization config) without mutating shared instance state.
    @SpyBean
    InstanceVariablesHelper instanceVariablesHelper;

    private ResendEmailVerificationDTO dtoFor(String email) {
        ResendEmailVerificationDTO dto = new ResendEmailVerificationDTO();
        dto.setEmail(email);
        dto.setBaseUrl(DEFAULT_ORIGIN_HEADER);
        return dto;
    }

    @Test
    @WithUserDetails("api_user")
    public void resendEmailVerification_perEmailThrottle_triggersSilentlyAndStopsSendingAfterLimit() {
        // A fresh, unverified account in the current org, with instance-level verification enabled.
        String email = "resend-throttle-" + UUID.randomUUID() + "@example.com";

        Organization organization =
                organizationService.getCurrentUserOrganization().block();

        User newUser = new User();
        newUser.setEmail(email);
        newUser.setEmailVerified(Boolean.FALSE);
        newUser.setOrganizationId(organization.getId());
        userRepository.save(newUser).block();

        // Email verification is gated on the instance-variables config, not the org config; enable it here.
        Mockito.doReturn(Mono.just(true)).when(instanceVariablesHelper).isEmailVerificationEnabled();
        Mockito.doReturn(Mono.just(true)).when(emailService).sendEmailVerificationEmail(any(), any(), any());

        // Under the limit: each request returns the generic success AND dispatches a verification email.
        for (int i = 0; i < PER_EMAIL_LIMIT; i++) {
            StepVerifier.create(userService.resendEmailVerification(dtoFor(email), null))
                    .expectNext(true)
                    .verifyComplete();
        }
        Mockito.verify(emailService, Mockito.times(PER_EMAIL_LIMIT)).sendEmailVerificationEmail(any(), any(), any());

        // Over the limit: same generic success, but no further email is dispatched — the throttle is silent.
        Mockito.clearInvocations(emailService);
        StepVerifier.create(userService.resendEmailVerification(dtoFor(email), null))
                .expectNext(true)
                .verifyComplete();
        Mockito.verify(emailService, Mockito.never()).sendEmailVerificationEmail(any(), any(), any());
    }
}
