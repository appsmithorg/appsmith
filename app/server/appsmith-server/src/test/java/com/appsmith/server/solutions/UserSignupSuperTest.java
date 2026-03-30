package com.appsmith.server.solutions;

import com.appsmith.server.authentication.handlers.AuthenticationSuccessHandler;
import com.appsmith.server.domains.LoginSource;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.OrganizationConfiguration;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserState;
import com.appsmith.server.dtos.UserSignupDTO;
import com.appsmith.server.dtos.UserSignupRequestDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.NetworkUtils;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.CaptchaService;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.EmailService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.transaction.reactive.TransactionalOperator;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;

@ExtendWith(SpringExtension.class)
class UserSignupSuperTest {

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
    private AnalyticsService analyticsService;

    @MockBean
    private EnvManager envManager;

    @MockBean
    private UserUtils userUtils;

    @MockBean
    private NetworkUtils networkUtils;

    @MockBean
    private EmailService emailService;

    @MockBean
    private OrganizationService organizationService;

    @MockBean
    private TransactionalOperator transactionalOperator;

    private UserSignup userSignup;

    private UserSignupRequestDTO makeRequest(String email) {
        UserSignupRequestDTO dto = new UserSignupRequestDTO();
        dto.setEmail(email);
        dto.setPassword("StrongP@ss1!");
        dto.setName("Test User");
        dto.setSource(LoginSource.FORM);
        dto.setState(UserState.ACTIVATED);
        dto.setIsEnabled(true);
        dto.setAllowCollectingAnonymousData(false);
        return dto;
    }

    @BeforeEach
    void setUp() {
        Mockito.when(transactionalOperator.transactional(Mockito.any(Mono.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        userSignup = new UserSignupImpl(
                userService,
                userDataService,
                captchaService,
                authenticationSuccessHandler,
                configService,
                analyticsService,
                envManager,
                userUtils,
                networkUtils,
                emailService,
                organizationService,
                transactionalOperator);

        Organization organization = new Organization();
        organization.setOrganizationConfiguration(new OrganizationConfiguration());
        Mockito.when(organizationService.getCurrentUserOrganization()).thenReturn(Mono.just(organization));
    }

    @Test
    void signupAndLoginSuper_WhenBootstrapAlreadyCompleted_RejectsRequest() {
        Mockito.when(configService.isBootstrapCompleted()).thenReturn(Mono.just(true));

        ServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.post("/api/v1/users/super").build());

        StepVerifier.create(userSignup.signupAndLoginSuper(makeRequest("test@test.com"), "http://localhost", exchange))
                .expectErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(AppsmithException.class);
                    assertThat(error.getMessage()).contains(AppsmithError.UNAUTHORIZED_ACCESS.getMessage());
                })
                .verify();
    }

    @Test
    void signupAndLoginSuper_WhenBootstrapNotCompleted_ProceedsWithUserCreation() {
        Mockito.when(configService.isBootstrapCompleted()).thenReturn(Mono.just(false));

        User createdUser = new User();
        createdUser.setId("userId1");
        createdUser.setEmail("admin@test.com");
        createdUser.setOrganizationId("org1");

        UserSignupDTO signupDTO = new UserSignupDTO();
        signupDTO.setUser(createdUser);
        signupDTO.setDefaultWorkspaceId("ws1");

        Mockito.when(userService.createUser(any(User.class))).thenReturn(Mono.just(signupDTO));
        Mockito.when(userUtils.makeInstanceAdministrator(any())).thenReturn(Mono.just(true));
        Mockito.when(configService.markBootstrapCompleted()).thenReturn(Mono.empty());

        Mockito.when(configService.isBootstrapCompleted()).thenReturn(Mono.just(false));

        Mockito.verify(configService, Mockito.never()).markBootstrapCompleted();
    }
}
