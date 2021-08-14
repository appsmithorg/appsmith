package com.appsmith.server.solutions;

import com.appsmith.server.authentication.handlers.AuthenticationSuccessHandler;
import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.helpers.ValidationUtils;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.CaptchaService;
import com.appsmith.server.services.UserService;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

@RunWith(SpringJUnit4ClassRunner.class)
public class UserSignupTest {
    @MockBean
    private UserService userService;

    @MockBean
    private CaptchaService captchaService;

    @MockBean
    private AuthenticationSuccessHandler authenticationSuccessHandler;

    @MockBean
    private PolicyUtils policyUtils;

    @MockBean
    private UserRepository userRepository;

    private UserSignup userSignup;

    @Before
    public void setUp() {
        userSignup = new UserSignup(userService, captchaService, authenticationSuccessHandler, policyUtils, userRepository);
    }

    private String createRandomString(int length) {
        StringBuilder builder = new StringBuilder();
        builder.append("Z".repeat(Math.max(0, length)));
        return builder.toString();
    }

    @Test
    public void signupAndLogin_WhenPasswordTooShort_RaisesException() {
        User user = new User();
        user.setPassword(createRandomString(ValidationUtils.LOGIN_PASSWORD_MIN_LENGTH - 1));

        Mono<User> userMono = userSignup.signupAndLogin(user, null);
        StepVerifier.create(userMono).expectError(AppsmithException.class).verify();
    }

    @Test
    public void signupAndLogin_WhenPasswordTooLong_RaisesException() {
        User user = new User();
        user.setPassword(createRandomString(ValidationUtils.LOGIN_PASSWORD_MAX_LENGTH + 1));

        Mono<User> userMono = userSignup.signupAndLogin(user, null);
        StepVerifier.create(userMono).expectError(AppsmithException.class).verify();
    }
}
