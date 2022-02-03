package com.appsmith.server.services;

import com.appsmith.external.models.Policy;
import com.appsmith.external.services.EncryptionService;
import com.appsmith.server.acl.AppsmithRole;
import com.appsmith.server.configurations.WithMockAppsmithUser;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.InviteUser;
import com.appsmith.server.domains.LoginSource;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.PasswordResetToken;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.dtos.InviteUsersDTO;
import com.appsmith.server.dtos.ResetUserPasswordDTO;
import com.appsmith.server.dtos.UserSignupDTO;
import com.appsmith.server.dtos.UserUpdateDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.PasswordResetTokenRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.solutions.UserSignup;
import lombok.extern.slf4j.Slf4j;
import org.apache.http.NameValuePair;
import org.apache.http.client.utils.URLEncodedUtils;
import org.apache.http.message.BasicNameValuePair;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.util.CollectionUtils;
import org.springframework.util.LinkedCaseInsensitiveMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.function.Tuple2;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_USERS;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_USERS;
import static com.appsmith.server.acl.AclPermission.USER_MANAGE_ORGANIZATIONS;
import static com.appsmith.server.acl.AclPermission.USER_READ_ORGANIZATIONS;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

@Slf4j
@RunWith(SpringRunner.class)
@SpringBootTest
@DirtiesContext
public class UserServiceTest {

    @Autowired
    UserService userService;

    @Autowired
    OrganizationService organizationService;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    UserRepository userRepository;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Autowired
    EncryptionService encryptionService;

    @Autowired
    UserDataService userDataService;

    @MockBean
    PasswordResetTokenRepository passwordResetTokenRepository;

    Mono<User> userMono;

    Mono<Organization> organizationMono;

    @Autowired
    UserSignup userSignup;

    @Before
    public void setup() {
        userMono = userService.findByEmail("usertest@usertest.com");
        organizationMono = organizationService.getBySlug("spring-test-organization");
    }

    //Test if email params are updating correctly
    @Test
    public void checkEmailParamsForExistingUser() {
        Organization organization = new Organization();
        organization.setName("UserServiceTest Update Org");
        organization.setSlug("userservicetest-update-org");

        User inviter = new User();
        inviter.setName("inviterUserToApplication");

        String inviteUrl = "http://localhost:8080";
        String expectedUrl = inviteUrl + "/applications#userservicetest-update-org";

        Map<String, String> params = userService.getEmailParams(organization, inviter, inviteUrl, false);
        assertEquals(expectedUrl, params.get("inviteUrl"));
        assertEquals("inviterUserToApplication", params.get("Inviter_First_Name"));
        assertEquals("UserServiceTest Update Org", params.get("inviter_org_name"));
    }

    @Test
    public void checkEmailParamsForNewUser() {
        Organization organization = new Organization();
        organization.setName("UserServiceTest Update Org");
        organization.setSlug("userservicetest-update-org");

        User inviter = new User();
        inviter.setName("inviterUserToApplication");

        String inviteUrl = "http://localhost:8080";

        Map<String, String> params = userService.getEmailParams(organization, inviter, inviteUrl, true);
        assertEquals(inviteUrl, params.get("inviteUrl"));
        assertEquals("inviterUserToApplication", params.get("Inviter_First_Name"));
        assertEquals("UserServiceTest Update Org", params.get("inviter_org_name"));
    }

    //Test the update organization flow.
    @Test
    public void updateInvalidUserWithAnything() {
        User updateUser = new User();
        updateUser.setName("Random User whose updates don't matter");

        User existingUser = new User();
        existingUser.setId("Random-UserId-%Not-In_The-System_For_SUre");

        Mono<User> userMono1 = Mono.just(existingUser).flatMap(user -> userService.update(user.getId(), updateUser));

        StepVerifier.create(userMono1)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.NO_RESOURCE_FOUND.getMessage(FieldName.USER, "Random-UserId-%Not-In_The-System_For_SUre")))
                .verify();
    }

    /**
     * The following function tests for switch organization
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void updateUserWithValidOrganization() {
        // Create a new organization
        Organization updateOrg = new Organization();
        updateOrg.setName("UserServiceTest Update Org");

        User updateUser = new User();

        Mono<User> userMono1 = userService.findByEmail("api_user")
                .switchIfEmpty(Mono.error(new Exception("Unable to find user")));

        //Add valid organization id to the updateUser object.
        Mono<User> userMono = organizationService.create(updateOrg)
                .flatMap(org -> {
                    updateUser.setCurrentOrganizationId(org.getId());
                    return userMono1.flatMap(user -> userService.update(user.getId(), updateUser));
                });

        StepVerifier.create(userMono)
                .assertNext(user -> {
                    assertThat(user.getCurrentOrganizationId()).isEqualTo(updateUser.getCurrentOrganizationId());
                })
                .verifyComplete();
    }

    @Test
    @WithMockAppsmithUser
    public void createNewUserFormSignupNullPassword() {
        User newUser = new User();
        newUser.setEmail("new-user-email-with-null-password@email.com");

        Mono<User> userMono = userService.create(newUser);

        StepVerifier.create(userMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.INVALID_CREDENTIALS.getMessage()))
                .verify();
    }

    @Test
    @WithMockAppsmithUser
    public void createNewUserValid() {
        User newUser = new User();
        newUser.setEmail("new-user-email@email.com");
        newUser.setPassword("new-user-test-password");

        Policy manageUserPolicy = Policy.builder()
                .permission(MANAGE_USERS.getValue())
                .users(Set.of(newUser.getUsername())).build();

        Policy manageUserOrgPolicy = Policy.builder()
                .permission(USER_MANAGE_ORGANIZATIONS.getValue())
                .users(Set.of(newUser.getUsername())).build();

        Policy readUserPolicy = Policy.builder()
                .permission(READ_USERS.getValue())
                .users(Set.of(newUser.getUsername())).build();

        Policy readUserOrgPolicy = Policy.builder()
                .permission(USER_READ_ORGANIZATIONS.getValue())
                .users(Set.of(newUser.getUsername())).build();

        Mono<User> userMono = userService.create(newUser);

        StepVerifier.create(userMono)
                .assertNext(user -> {
                    assertThat(user).isNotNull();
                    assertThat(user.getId()).isNotNull();
                    assertThat(user.getEmail()).isEqualTo("new-user-email@email.com");
                    assertThat(user.getName()).isNullOrEmpty();
                    assertThat(user.getPolicies()).isNotEmpty();
                    assertThat(user.getPolicies()).containsAll(Set.of(manageUserPolicy, manageUserOrgPolicy, readUserPolicy, readUserOrgPolicy));
                    // Since there is a template organization, the user won't have an empty default organization. They
                    // will get a clone of the default organization when they first login. So, we expect it to be
                    // empty here.
                    assertThat(user.getOrganizationIds()).hasSize(1);
                })
                .verifyComplete();
    }

    @Test
    @WithMockAppsmithUser
    public void createNewUser_WhenEmailHasUpperCase_SavedInLowerCase() {
        String sampleEmail = "User-email@Email.cOm";
        String sampleEmailLowercase = sampleEmail.toLowerCase();

        User newUser = new User();
        newUser.setEmail(sampleEmail);
        newUser.setPassword("new-user-test-password");

        Policy manageUserPolicy = Policy.builder()
                .permission(MANAGE_USERS.getValue())
                .users(Set.of(sampleEmailLowercase)).build();

        Policy manageUserOrgPolicy = Policy.builder()
                .permission(USER_MANAGE_ORGANIZATIONS.getValue())
                .users(Set.of(sampleEmailLowercase)).build();

        Policy readUserPolicy = Policy.builder()
                .permission(READ_USERS.getValue())
                .users(Set.of(sampleEmailLowercase)).build();

        Policy readUserOrgPolicy = Policy.builder()
                .permission(USER_READ_ORGANIZATIONS.getValue())
                .users(Set.of(sampleEmailLowercase)).build();

        Mono<User> userMono = userService.create(newUser);

        StepVerifier.create(userMono)
                .assertNext(user -> {
                    assertThat(user).isNotNull();
                    assertThat(user.getId()).isNotNull();
                    assertThat(user.getEmail()).isEqualTo(sampleEmailLowercase);
                    assertThat(user.getName()).isNullOrEmpty();
                    assertThat(user.getPolicies()).isNotEmpty();
                    assertThat(user.getPolicies()).containsAll(
                            Set.of(manageUserPolicy, manageUserOrgPolicy, readUserPolicy, readUserOrgPolicy)
                    );
                    // Since there is a template organization, the user won't have an empty default organization. They
                    // will get a clone of the default organization when they first login. So, we expect it to be
                    // empty here.
                    assertThat(user.getOrganizationIds()).hasSize(1);
                })
                .verifyComplete();
    }

    @Test
    @DirtiesContext
    @WithUserDetails(value = "api_user")
    public void inviteUserToApplicationValidAsAdmin() {
        InviteUser inviteUser = new InviteUser();
        inviteUser.setEmail("inviteUserToApplication@test.com");
        inviteUser.setRole(AppsmithRole.APPLICATION_ADMIN);

        Mono<Application> applicationMono = applicationService.findByName("LayoutServiceTest TestApplications", MANAGE_APPLICATIONS)
                .switchIfEmpty(Mono.error(new Exception("No such app")));

        Mono<User> userMono = applicationMono.flatMap(application -> userService
                .inviteUserToApplication(inviteUser, "http://localhost:8080", application.getId())).cache();

        Mono<Application> updatedApplication = userMono.then(applicationService.findByName("LayoutServiceTest TestApplications", MANAGE_APPLICATIONS));

        StepVerifier.create(Mono.zip(updatedApplication, userMono))
                .assertNext(tuple -> {
                    Application application = tuple.getT1();
                    User user = tuple.getT2();

                    Policy manageAppPolicy = Policy.builder()
                            .permission(MANAGE_APPLICATIONS.getValue())
                            .users(Set.of("api_user", user.getUsername()))
                            .groups(new HashSet<>())
                            .build();

                    Policy readAppPolicy = Policy.builder()
                            .permission(READ_APPLICATIONS.getValue())
                            .users(Set.of("api_user", user.getUsername()))
                            .groups(new HashSet<>())
                            .build();


                    assertThat(application).isNotNull();
                    assertThat(application.getPolicies()).isNotEmpty();
                    assertThat(application.getPolicies()).containsAll(Set.of(manageAppPolicy, readAppPolicy));

                    assertThat(user).isNotNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void inviteUserToApplicationValidAsViewer() {
        InviteUser inviteUser = new InviteUser();
        inviteUser.setEmail("inviteUserToApplication@test.com");
        inviteUser.setRole(AppsmithRole.APPLICATION_VIEWER);

        Mono<Application> applicationMono = applicationService.findByName("LayoutServiceTest TestApplications", READ_APPLICATIONS)
                .switchIfEmpty(Mono.error(new Exception("No such app")));

        Mono<User> userMono = applicationMono.flatMap(application -> userService
                .inviteUserToApplication(inviteUser, "http://localhost:8080", application.getId())).cache();

        Mono<Application> updatedApplication = userMono.then(applicationService.findByName("LayoutServiceTest TestApplications", READ_APPLICATIONS));


        StepVerifier.create(Mono.zip(updatedApplication, userMono))
                .assertNext(tuple -> {
                    Application application = tuple.getT1();
                    User user = tuple.getT2();

                    Policy readAppPolicy = Policy.builder()
                            .permission(READ_APPLICATIONS.getValue())
                            .users(Set.of("api_user", user.getUsername()))
                            .groups(new HashSet<>())
                            .build();

                    Policy manageAppPolicy = Policy.builder()
                            .permission(MANAGE_APPLICATIONS.getValue())
                            .users(Set.of("api_user"))
                            .build();

                    assertThat(application).isNotNull();
                    assertThat(application.getPolicies()).isNotEmpty();
                    assertThat(application.getPolicies()).containsAll(Set.of(manageAppPolicy, readAppPolicy));

                    assertThat(user).isNotNull();
                })
                .verifyComplete();
    }

    @Test
    @WithMockAppsmithUser
    public void signUpViaFormLoginIfAlreadyInvited() {
        User newUser = new User();
        newUser.setEmail("alreadyInvited@alreadyInvited.com");
        newUser.setIsEnabled(false);

        userRepository.save(newUser).block();

        User signupUser = new User();
        signupUser.setEmail(newUser.getEmail());
        signupUser.setPassword("password");
        signupUser.setSource(LoginSource.FORM);

        Mono<User> userMono = userService.create(signupUser);

        StepVerifier.create(userMono)
                .assertNext(user -> {
                    assertThat(user.getEmail().equals(newUser.getEmail()));
                    assertThat(user.getSource().equals(LoginSource.FORM));
                    assertThat(user.getIsEnabled()).isTrue();
                })
                .verifyComplete();
    }

    @Test
    @WithMockAppsmithUser
    public void signUpViaGoogleIfAlreadyInvited() {
        User newUser = new User();
        newUser.setEmail("alreadyInvited@google-gmail.com");
        newUser.setIsEnabled(false);

        userRepository.save(newUser).block();

        User signupUser = new User();
        signupUser.setEmail(newUser.getEmail());
        signupUser.setPassword("password");
        signupUser.setSource(LoginSource.GOOGLE);

        Mono<User> userMono = userService.create(signupUser);

        StepVerifier.create(userMono)
                .assertNext(user -> {
                    assertThat(user.getEmail().equals(newUser.getEmail()));
                    assertThat(user.getSource().equals(LoginSource.GOOGLE));
                    assertThat(user.getIsEnabled()).isTrue();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void signUpAfterBeingInvitedToAppsmithOrganization() {
        Organization organization = new Organization();
        organization.setName("SignUp after adding user to Test Organization");
        organization.setDomain("example.com");
        organization.setWebsite("https://example.com");

        Mono<Organization> organizationMono = organizationService
                .create(organization)
                .cache();

        String newUserEmail = "inviteUserToApplicationWithoutExisting@test.com";

        organizationMono
                .flatMap(organization1 -> {
                    // Add user to organization
                    InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
                    ArrayList<String> users = new ArrayList<>();
                    users.add(newUserEmail);
                    inviteUsersDTO.setUsernames(users);
                    inviteUsersDTO.setOrgId(organization1.getId());
                    inviteUsersDTO.setRoleName(AppsmithRole.ORGANIZATION_VIEWER.getName());

                    return userService.inviteUsers(inviteUsersDTO, "http://localhost:8080");
                }).block();

        // Now Sign Up as the new user
        User signUpUser = new User();
        signUpUser.setEmail(newUserEmail);
        signUpUser.setPassword("123456");

        Mono<User> invitedUserSignUpMono =
                userService.createUserAndSendEmail(signUpUser, "http://localhost:8080")
                        .map(UserSignupDTO::getUser);

        StepVerifier.create(invitedUserSignUpMono)
                .assertNext(user -> {
                    assertThat(user.getIsEnabled().equals(true));
                    assertThat(passwordEncoder.matches("123456", user.getPassword())).isTrue();
                })
                .verifyComplete();

    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getAllUsersTest() {
        Flux<User> userFlux = userService.get(CollectionUtils.toMultiValueMap(new LinkedCaseInsensitiveMap<>()));

        StepVerifier.create(userFlux)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.UNSUPPORTED_OPERATION.getMessage()))
                .verify();

    }

    @Test
    public void createUserWithInvalidEmailAddress() {
        List<String> invalidAddresses = Arrays.asList(
                "plainaddress",
                "#@%^%#$@#$@#.com",
                "@example.com",
                "Joe Smith <email@example.com>",
                "email.example.com",
                "email@example@example.com",
                ".email@example.com",
                "email.@example.com",
                "email..email@example.com",
                "email@example.com (Joe Smith)",
                "email@-example.com",
                "email@example..com",
                "Abc..123@example.com"
        );
        for (String invalidAddress : invalidAddresses) {
            User user = new User();
            user.setEmail(invalidAddress);
            user.setPassword("test-password");
            user.setName("test-name");
            StepVerifier.create(userSignup.signupAndLogin(user, null))
                    .expectErrorMessage(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.EMAIL));
        }
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void updateNameOfUser() {
        UserUpdateDTO updateUser = new UserUpdateDTO();
        updateUser.setName("New name of api_user");
        StepVerifier.create(userService.updateCurrentUser(updateUser, null))
                .assertNext(user -> {
                    assertNotNull(user);
                    assertThat(user.getEmail()).isEqualTo("api_user");
                    assertThat(user.getName()).isEqualTo("New name of api_user");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void updateRoleOfUser() {
        UserUpdateDTO updateUser = new UserUpdateDTO();
        updateUser.setRole("New role of user");
        final Mono<UserData> resultMono = userService.updateCurrentUser(updateUser, null)
                .then(userDataService.getForUserEmail("api_user"));
        StepVerifier.create(resultMono)
                .assertNext(userData -> {
                    assertNotNull(userData);
                    assertThat(userData.getRole()).isEqualTo("New role of user");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void updateNameRoleAndUseCaseOfUser() {
        UserUpdateDTO updateUser = new UserUpdateDTO();
        updateUser.setName("New name of user here");
        updateUser.setRole("New role of user");
        updateUser.setUseCase("New use case");
        final Mono<Tuple2<User, UserData>> resultMono = userService.updateCurrentUser(updateUser, null)
                .flatMap(user -> Mono.zip(
                        Mono.just(user),
                        userDataService.getForUserEmail("api_user")
                ));
        StepVerifier.create(resultMono)
                .assertNext(tuple -> {
                    final User user = tuple.getT1();
                    final UserData userData = tuple.getT2();
                    assertNotNull(user);
                    assertNotNull(userData);
                    assertThat(user.getName()).isEqualTo("New name of user here");
                    assertThat(userData.getRole()).isEqualTo("New role of user");
                    assertThat(userData.getUseCase()).isEqualTo("New use case");
                })
                .verifyComplete();
    }

    @Test
    public void createUserAndSendEmail_WhenUserExistsWithEmailInOtherCase_ThrowsException() {
        User existingUser = new User();
        existingUser.setEmail("abcd@gmail.com");
        userRepository.save(existingUser).block();

        User newUser = new User();
        newUser.setEmail("abCd@gmail.com"); // same as above except c in uppercase
        newUser.setSource(LoginSource.FORM);
        newUser.setPassword("abcdefgh");
        Mono<User> userAndSendEmail = userService.createUserAndSendEmail(newUser, null)
                .map(UserSignupDTO::getUser);

        StepVerifier.create(userAndSendEmail)
                .expectErrorMessage(
                        AppsmithError.USER_ALREADY_EXISTS_SIGNUP.getMessage(existingUser.getEmail())
                );
    }

    @Test
    public void forgotPasswordTokenGenerate_AfterTrying3TimesIn24Hours_ThrowsException() {
        String testEmail = "test-email-for-password-reset";
        PasswordResetToken passwordResetToken = new PasswordResetToken();
        passwordResetToken.setRequestCount(3);
        passwordResetToken.setFirstRequestTime(Instant.now());

        // mock the passwordResetTokenRepository to return request count 3 in 24 hours
        Mockito.when(passwordResetTokenRepository.findByEmail(testEmail)).thenReturn(Mono.just(passwordResetToken));

        ResetUserPasswordDTO resetUserPasswordDTO = new ResetUserPasswordDTO();
        resetUserPasswordDTO.setEmail("test-email-for-password-reset");

        StepVerifier.create(userService.forgotPasswordTokenGenerate(resetUserPasswordDTO))
                .expectError(AppsmithException.class)
                .verify();
    }

    @Test
    public void verifyPasswordResetToken_WhenMalformedToken_ThrowsException() {
        String encryptedToken = "abcdef"; // malformed token
        StepVerifier.create(userService.verifyPasswordResetToken(encryptedToken))
                .verifyError(AppsmithException.class);
    }

    private String getEncodedToken(String emailAddress, String token) {
        List<NameValuePair> nameValuePairs = new ArrayList<>(2);
        nameValuePairs.add(new BasicNameValuePair("email", emailAddress));
        nameValuePairs.add(new BasicNameValuePair("token", token));
        String urlParams = URLEncodedUtils.format(nameValuePairs, StandardCharsets.UTF_8);
        return encryptionService.encryptString(urlParams);
    }

    @Test
    public void verifyPasswordResetToken_WhenTokenDoesNotExist_ThrowsException() {
        String testEmail = "abc@example.org";
        // mock the passwordResetTokenRepository to return empty
        Mockito.when(passwordResetTokenRepository.findByEmail(testEmail)).thenReturn(Mono.empty());

        StepVerifier.create(userService.verifyPasswordResetToken(getEncodedToken(testEmail, "123456789")))
                .expectErrorMessage(AppsmithError.INVALID_PASSWORD_RESET.getMessage())
                .verify();
    }

    private void testResetPasswordTokenMatch(String token1, String token2, boolean expectedResult) {
        String testEmail = "abc@example.org";
        PasswordResetToken passwordResetToken = new PasswordResetToken();
        passwordResetToken.setTokenHash(passwordEncoder.encode(token1));

        // mock the passwordResetTokenRepository to return empty
        Mockito.when(passwordResetTokenRepository.findByEmail(testEmail)).thenReturn(Mono.just(passwordResetToken));

        StepVerifier.create(userService.verifyPasswordResetToken(getEncodedToken(testEmail, token2)))
                .expectNext(expectedResult)
                .verifyComplete();
    }

    @Test
    public void verifyPasswordResetToken_WhenTokenDoesNotMatch_ReturnsFalse() {
        testResetPasswordTokenMatch("0123456789", "123456789", false); // different tokens
    }

    @Test
    public void verifyPasswordResetToken_WhenTokenMatches_ReturnsTrue() {
        testResetPasswordTokenMatch("0123456789", "0123456789", true); // same token
    }

    @Test
    public void resetPasswordAfterForgotPassword_WhenMalformedToken_ThrowsException() {
        String encryptedToken = "abcdef"; // malformed token
        StepVerifier.create(userService.resetPasswordAfterForgotPassword(encryptedToken, null))
                .verifyError(AppsmithException.class);
    }

    @Test
    public void resetPasswordAfterForgotPassword_WhenTokenDoesNotMatch_ThrowsException() {
        String testEmail = "abc@example.org";
        String token = getEncodedToken(testEmail, "123456789");

        // ** check if token is not present in DB ** //
        // mock the passwordResetTokenRepository to return empty
        Mockito.when(passwordResetTokenRepository.findByEmail(testEmail)).thenReturn(Mono.empty());

        StepVerifier.create(userService.resetPasswordAfterForgotPassword(token, null))
                .expectErrorMessage(AppsmithError.INVALID_PASSWORD_RESET.getMessage())
                .verify();

        // ** check if token present but hash does not match ** //
        PasswordResetToken passwordResetToken = new PasswordResetToken();
        passwordResetToken.setTokenHash(passwordEncoder.encode("abcdef"));

        // mock the passwordResetTokenRepository to return empty
        Mockito.when(passwordResetTokenRepository.findByEmail(testEmail)).thenReturn(Mono.just(passwordResetToken));

        StepVerifier.create(userService.resetPasswordAfterForgotPassword(token, null))
                .expectErrorMessage(AppsmithError.GENERIC_BAD_REQUEST.getMessage(FieldName.TOKEN))
                .verify();
    }

    @Test
    public void buildUserProfileDTO_WhenAnonymousUser_ReturnsProfile() {
        User user = new User();
        user.setIsAnonymous(true);
        user.setEmail("anonymousUser");
        StepVerifier.create(userService.buildUserProfileDTO(user)).assertNext(userProfileDTO -> {
            assertThat(userProfileDTO.getUsername()).isEqualTo("anonymousUser");
            assertThat(userProfileDTO.isAnonymous()).isTrue();
        }).verifyComplete();
    }
}
