package com.appsmith.server.configurations;

import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.LoginSource;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.InviteUsersDTO;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.UserAndAccessManagementService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.boot.web.reactive.context.ReactiveWebApplicationContext;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextImpl;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.springframework.web.reactive.function.BodyInserters;
import reactor.core.publisher.Mono;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.springSecurity;

/**
 * Form signup creates an account only for an email that has none. An account that already exists stays as it
 * is, whether or not it has been activated.
 */
@SpringBootTest
class AccountActivationGuardTest {

    private static final String WORKSPACE_OWNER_EMAIL = "api_user";
    private static final String ORIGIN = "http://localhost:8080";
    private static final String SIGNUP_PASSWORD = "Signup-Password-1234";
    private static final String SIGNUP_ERROR_PARAM = "error=There%20is%20already%20an%20account%20registered";

    @Autowired
    private ReactiveWebApplicationContext context;

    @SpyBean
    private UserRepository userRepository;

    @Autowired
    private CommonConfig commonConfig;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private PermissionGroupRepository permissionGroupRepository;

    @Autowired
    private WorkspaceService workspaceService;

    @Autowired
    private UserAndAccessManagementService userAndAccessManagementService;

    private WebTestClient webTestClient;
    private User workspaceOwner;
    private String workspaceId;
    private String configuredAdminEmails;
    private final List<String> savedAccountIds = new ArrayList<>();
    private final List<String> createdEmails = new ArrayList<>();

    @BeforeEach
    void setUp() {
        webTestClient = WebTestClient.bindToApplicationContext(context)
                .apply(springSecurity())
                .build();
        workspaceOwner = userRepository.findByEmail(WORKSPACE_OWNER_EMAIL).block();
        workspaceId = null;
        configuredAdminEmails = String.join(",", commonConfig.getAdminEmails());
    }

    @AfterEach
    void tearDown() {
        commonConfig.setAdminEmails(configuredAdminEmails);
        Mockito.reset(userRepository);
        savedAccountIds.forEach(id -> userRepository.deleteById(id).block());
        savedAccountIds.clear();
        createdEmails.forEach(email -> userRepository
                .findByEmail(email)
                .flatMap(user -> userRepository.deleteById(user.getId()))
                .block());
        createdEmails.clear();
        if (workspaceId != null) {
            runAs(workspaceService.archiveById(workspaceId), workspaceOwner).block();
        }
    }

    @Test
    @DisplayName("GHSA-27hq-mrc7-w4qf")
    void should_refuseSignup_when_accountAlreadyExistsAndIsNotActivated() {
        // Given
        String invitedEmail = uniqueEmail("invited");
        String administratorGroupId = inviteAsWorkspaceAdministrator(invitedEmail);
        User beforeSignup = userRepository.findByEmail(invitedEmail).block();
        assertThat(beforeSignup).isNotNull();
        assertThat(beforeSignup.getIsEnabled()).isFalse();
        assertThat(beforeSignup.getPassword()).isNull();

        // When
        WebTestClient.ResponseSpec response = signup(invitedEmail);

        // Then
        response.expectStatus().is3xxRedirection().expectHeader().value(HttpHeaders.LOCATION, location -> assertThat(
                        location)
                .contains(SIGNUP_ERROR_PARAM));

        User afterSignup = userRepository.findByEmail(invitedEmail).block();
        assertThat(afterSignup).isNotNull();
        assertThat(afterSignup.getIsEnabled()).isFalse();
        assertThat(afterSignup.getPassword()).isNull();

        PermissionGroup administratorGroup =
                permissionGroupRepository.findById(administratorGroupId).block();
        assertThat(administratorGroup).isNotNull();
        assertThat(administratorGroup.getAssignedToUserIds()).contains(afterSignup.getId());
    }

    @Test
    @DisplayName("GHSA-27hq-mrc7-w4qf")
    void should_refuseSignup_when_accountIsSystemGenerated() {
        // Given
        String systemEmail = uniqueEmail("system");
        User systemAccount = new User();
        systemAccount.setEmail(systemEmail);
        systemAccount.setIsEnabled(false);
        systemAccount.setIsSystemGenerated(true);
        systemAccount.setOrganizationId(workspaceOwner.getOrganizationId());
        savedAccountIds.add(userRepository.save(systemAccount).block().getId());

        // When
        WebTestClient.ResponseSpec response = signup(systemEmail);

        // Then
        response.expectStatus().is3xxRedirection().expectHeader().value(HttpHeaders.LOCATION, location -> assertThat(
                        location)
                .contains(SIGNUP_ERROR_PARAM));

        User afterSignup = userRepository.findByEmail(systemEmail).block();
        assertThat(afterSignup).isNotNull();
        assertThat(afterSignup.getIsEnabled()).isFalse();
        assertThat(afterSignup.getPassword()).isNull();
    }

    @Test
    @DisplayName("GHSA-27hq-mrc7-w4qf")
    void should_returnSameSignupResponse_when_accountAlreadyExists() {
        // Given
        String activatedEmail = uniqueEmail("activated");
        signup(activatedEmail).expectStatus().is3xxRedirection();
        User activated = userRepository.findByEmail(activatedEmail).block();
        assertThat(activated).isNotNull();
        assertThat(activated.getIsEnabled()).isTrue();

        String invitedEmail = uniqueEmail("pending");
        inviteAsWorkspaceAdministrator(invitedEmail);

        // When
        String activatedLocation = signupLocation(activatedEmail);
        String invitedLocation = signupLocation(invitedEmail);

        // Then
        assertThat(activatedLocation).contains("error=There is already an account registered");
        assertThat(invitedLocation.replace(invitedEmail, "EMAIL"))
                .isEqualTo(activatedLocation.replace(activatedEmail, "EMAIL"));
    }

    @Test
    void should_createAndActivateAccount_when_emailHasNoAccount() {
        // Given
        String newEmail = uniqueEmail("new");
        assertThat(userRepository.findByEmail(newEmail).block()).isNull();

        // When
        WebTestClient.ResponseSpec response = signup(newEmail);

        // Then
        response.expectStatus().is3xxRedirection().expectHeader().value(HttpHeaders.LOCATION, location -> assertThat(
                        location)
                .doesNotContain(SIGNUP_ERROR_PARAM));

        User created = userRepository.findByEmail(newEmail).block();
        assertThat(created).isNotNull();
        assertThat(created.getIsEnabled()).isTrue();
        assertThat(created.getPassword()).isNotBlank();
    }

    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    void should_activateConfiguredAdminAccount_when_instanceHasNoActiveAccount(boolean configuredInUpperCase) {
        // Given
        String adminEmail = uniqueEmail("configured-admin");
        savePendingAccount(adminEmail);
        commonConfig.setAdminEmails(configuredInUpperCase ? adminEmail.toUpperCase(Locale.ROOT) : adminEmail);
        Mockito.doReturn(Mono.just(true)).when(userRepository).hasNoActivatedUser();

        // When
        WebTestClient.ResponseSpec response = signup(adminEmail);

        // Then
        response.expectStatus().is3xxRedirection().expectHeader().value(HttpHeaders.LOCATION, location -> assertThat(
                        location)
                .doesNotContain(SIGNUP_ERROR_PARAM));

        User afterSignup = userRepository.findByEmail(adminEmail).block();
        assertThat(afterSignup).isNotNull();
        assertThat(afterSignup.getIsEnabled()).isTrue();
        assertThat(afterSignup.getPassword()).isNotBlank();
    }

    @Test
    @DisplayName("GHSA-27hq-mrc7-w4qf")
    void should_keepExistingPassword_when_configuredAdminAccountIsAlreadyActive() {
        // Given
        String adminEmail = uniqueEmail("configured-admin");
        savePendingAccount(adminEmail);
        commonConfig.setAdminEmails(adminEmail);
        String firstPassword = "First-Signup-Password-1234";
        // Activation succeeds at most once per account.
        Mockito.doAnswer(invocation -> userRepository
                        .findByEmail(adminEmail)
                        .flatMap(account -> {
                            account.setIsEnabled(true);
                            account.setPassword(passwordEncoder.encode(firstPassword));
                            return userRepository.save(account);
                        })
                        .thenReturn(true))
                .when(userRepository)
                .hasNoActivatedUser();

        // When
        WebTestClient.ResponseSpec response = signup(adminEmail);

        // Then
        response.expectStatus().is3xxRedirection().expectHeader().value(HttpHeaders.LOCATION, location -> assertThat(
                        location)
                .contains(SIGNUP_ERROR_PARAM));

        User afterSignup = userRepository.findByEmail(adminEmail).block();
        assertThat(afterSignup).isNotNull();
        assertThat(passwordEncoder.matches(firstPassword, afterSignup.getPassword()))
                .isTrue();
    }

    @Test
    @DisplayName("GHSA-27hq-mrc7-w4qf")
    void should_refuseSignup_when_configuredAdminAccountIsPendingAndInstanceHasActiveAccount() {
        // Given
        String adminEmail = uniqueEmail("configured-admin");
        savePendingAccount(adminEmail);
        commonConfig.setAdminEmails(adminEmail);

        // When
        WebTestClient.ResponseSpec response = signup(adminEmail);

        // Then
        response.expectStatus().is3xxRedirection().expectHeader().value(HttpHeaders.LOCATION, location -> assertThat(
                        location)
                .contains(SIGNUP_ERROR_PARAM));

        User afterSignup = userRepository.findByEmail(adminEmail).block();
        assertThat(afterSignup).isNotNull();
        assertThat(afterSignup.getIsEnabled()).isFalse();
        assertThat(afterSignup.getPassword()).isNull();
    }

    @Test
    @DisplayName("GHSA-27hq-mrc7-w4qf")
    void should_refuseSignup_when_pendingAccountIsNotConfiguredAdminAndInstanceHasNoActiveAccount() {
        // Given
        String invitedEmail = uniqueEmail("invited");
        savePendingAccount(invitedEmail);
        Mockito.doReturn(Mono.just(true)).when(userRepository).hasNoActivatedUser();

        // When
        WebTestClient.ResponseSpec response = signup(invitedEmail);

        // Then
        response.expectStatus().is3xxRedirection().expectHeader().value(HttpHeaders.LOCATION, location -> assertThat(
                        location)
                .contains(SIGNUP_ERROR_PARAM));

        User afterSignup = userRepository.findByEmail(invitedEmail).block();
        assertThat(afterSignup).isNotNull();
        assertThat(afterSignup.getIsEnabled()).isFalse();
        assertThat(afterSignup.getPassword()).isNull();
    }

    @Test
    @DisplayName("GHSA-27hq-mrc7-w4qf")
    void should_refuseSignup_when_configuredAdminAccountIsSystemGeneratedAndInstanceHasNoActiveAccount() {
        // Given
        String systemEmail = uniqueEmail("system-admin");
        User systemAccount = new User();
        systemAccount.setEmail(systemEmail);
        systemAccount.setIsEnabled(false);
        systemAccount.setIsSystemGenerated(true);
        systemAccount.setOrganizationId(workspaceOwner.getOrganizationId());
        savedAccountIds.add(userRepository.save(systemAccount).block().getId());
        commonConfig.setAdminEmails(systemEmail);
        Mockito.doReturn(Mono.just(true)).when(userRepository).hasNoActivatedUser();

        // When
        WebTestClient.ResponseSpec response = signup(systemEmail);

        // Then
        response.expectStatus().is3xxRedirection().expectHeader().value(HttpHeaders.LOCATION, location -> assertThat(
                        location)
                .contains(SIGNUP_ERROR_PARAM));

        User afterSignup = userRepository.findByEmail(systemEmail).block();
        assertThat(afterSignup).isNotNull();
        assertThat(afterSignup.getIsEnabled()).isFalse();
        assertThat(afterSignup.getPassword()).isNull();
    }

    @Test
    @DisplayName("GHSA-27hq-mrc7-w4qf")
    void should_createFormAccountWithEncodedPassword_when_formSuppliesAccountFields() {
        // Given
        String newEmail = uniqueEmail("form-fields");

        // When
        WebTestClient.ResponseSpec response = webTestClient
                .post()
                .uri(Url.USER_URL)
                .header(HttpHeaders.ORIGIN, ORIGIN)
                .header("X-Requested-By", "Appsmith")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(BodyInserters.fromFormData("email", newEmail)
                        .with("password", SIGNUP_PASSWORD)
                        .with("source", "GOOGLE")
                        .with("state", "ACTIVATED")
                        .with("isEnabled", "false"))
                .exchange();

        // Then
        response.expectStatus().is3xxRedirection();

        User created = userRepository.findByEmail(newEmail).block();
        assertThat(created).isNotNull();
        assertThat(created.getSource()).isEqualTo(LoginSource.FORM);
        assertThat(created.getState()).isNull();
        assertThat(created.getIsEnabled()).isTrue();
        assertThat(passwordEncoder.matches(SIGNUP_PASSWORD, created.getPassword()))
                .isTrue();
    }

    private void savePendingAccount(String email) {
        User pending = new User();
        pending.setEmail(email);
        pending.setIsEnabled(false);
        pending.setOrganizationId(workspaceOwner.getOrganizationId());
        savedAccountIds.add(userRepository.save(pending).block().getId());
    }

    private String inviteAsWorkspaceAdministrator(String email) {
        Workspace workspace = new Workspace();
        workspace.setName("account-activation-guard-" + UUID.randomUUID());
        Workspace created =
                runAs(workspaceService.create(workspace), workspaceOwner).block();
        workspaceId = created.getId();

        String administratorGroupId = permissionGroupRepository
                .findAllById(created.getDefaultPermissionGroups())
                .filter(group -> group.getName().startsWith("Administrator"))
                .map(PermissionGroup::getId)
                .blockFirst();
        assertThat(administratorGroupId).isNotNull();

        InviteUsersDTO invite = new InviteUsersDTO();
        invite.setUsernames(List.of(email));
        invite.setPermissionGroupId(administratorGroupId);
        runAs(userAndAccessManagementService.inviteUsers(invite, ORIGIN), workspaceOwner)
                .block();
        return administratorGroupId;
    }

    private WebTestClient.ResponseSpec signup(String email) {
        return webTestClient
                .post()
                .uri(Url.USER_URL)
                .header(HttpHeaders.ORIGIN, ORIGIN)
                .header("X-Requested-By", "Appsmith")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(BodyInserters.fromFormData("email", email).with("password", SIGNUP_PASSWORD))
                .exchange();
    }

    private String signupLocation(String email) {
        String location = signup(email)
                .expectStatus()
                .is3xxRedirection()
                .returnResult(Void.class)
                .getResponseHeaders()
                .getFirst(HttpHeaders.LOCATION);
        return URLDecoder.decode(location, StandardCharsets.UTF_8);
    }

    private <T> Mono<T> runAs(Mono<T> publisher, User user) {
        return publisher.contextWrite(reactorContext -> {
            SecurityContext securityContext = new SecurityContextImpl(
                    new UsernamePasswordAuthenticationToken(user, "password", user.getAuthorities()));
            return reactorContext.put(SecurityContext.class, Mono.just(securityContext));
        });
    }

    private String uniqueEmail(String prefix) {
        String email = prefix + "-" + UUID.randomUUID() + "@example.com";
        createdEmails.add(email);
        return email;
    }
}
