package com.appsmith.server.solutions;

import com.appsmith.server.authentication.handlers.AuthenticationSuccessHandler;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.CaptchaService;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.UserService;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static com.appsmith.server.helpers.ValidationUtils.LOGIN_PASSWORD_MAX_LENGTH;
import static com.appsmith.server.helpers.ValidationUtils.LOGIN_PASSWORD_MIN_LENGTH;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

@RunWith(SpringJUnit4ClassRunner.class)
public class UserSignupTest {
    @MockBean
    private UserService userService;

    @MockBean
    private UserDataService userDataService;

    @MockBean
    private CaptchaService captchaService;

    @MockBean
    private AuthenticationSuccessHandler authenticationSuccessHandler;

    @MockBean
    private ConfigService configService;

    @MockBean
    private PolicyUtils policyUtils;

    @MockBean
    private AnalyticsService analyticsService;

    @MockBean
    private ApplicationPageService applicationPageService;

    @MockBean
    private EnvManager envManager;

    @MockBean
    private CommonConfig commonConfig;

    @MockBean
    private UserUtils userUtils;

    private UserSignup userSignup;

    @Before
    public void setup() {
        userSignup = new UserSignupImpl(userService, userDataService, captchaService, authenticationSuccessHandler,
                configService, analyticsService, envManager, commonConfig, userUtils);
    }

    private String createRandomString(int length) {
        StringBuilder builder = new StringBuilder();
        builder.append("Z".repeat(Math.max(0, length)));
        return builder.toString();
    }

    @Test
    public void signupAndLogin_WhenPasswordTooShort_RaisesException() {
        User user = new User();
        user.setEmail("testemail@test123.com");
        user.setPassword(createRandomString(LOGIN_PASSWORD_MIN_LENGTH - 1));

        Mono<User> userMono = userSignup.signupAndLogin(user, null);
        StepVerifier.create(userMono)
                .expectErrorSatisfies(error -> {
                    assertTrue(error instanceof AppsmithException);

                    String expectedErrorMessage = AppsmithError.INVALID_PASSWORD_LENGTH
                            .getMessage(LOGIN_PASSWORD_MIN_LENGTH, LOGIN_PASSWORD_MAX_LENGTH);
                    assertEquals(expectedErrorMessage, error.getMessage());
                })
                .verify();

    }

    @Test
    public void signupAndLogin_WhenPasswordTooLong_RaisesException() {
        User user = new User();
        user.setEmail("testemail@test123.com");
        user.setPassword(createRandomString(LOGIN_PASSWORD_MAX_LENGTH + 1));

        Mono<User> userMono = userSignup.signupAndLogin(user, null);
        StepVerifier.create(userMono)
                .expectErrorSatisfies(error -> {
                    assertTrue(error instanceof AppsmithException);

                    String expectedErrorMessage = AppsmithError.INVALID_PASSWORD_LENGTH
                            .getMessage(LOGIN_PASSWORD_MIN_LENGTH, LOGIN_PASSWORD_MAX_LENGTH);
                    assertEquals(expectedErrorMessage, error.getMessage());
                })
                .verify();
    }
}
