package com.appsmith.server.services;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.AppsmithRole;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserRole;
import com.appsmith.server.dtos.InviteUsersDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.OrganizationRepository;
import lombok.extern.slf4j.Slf4j;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.function.Tuple2;
import reactor.util.function.Tuple3;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.EXECUTE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.MANAGE_ORGANIZATIONS;
import static com.appsmith.server.acl.AclPermission.ORGANIZATION_MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.ORGANIZATION_READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.READ_ORGANIZATIONS;
import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringJUnit4ClassRunner.class)
@SpringBootTest
@DirtiesContext
@Slf4j
public class OrganizationServiceTest {

    @Autowired
    OrganizationService organizationService;

    @Autowired
    UserOrganizationService userOrganizationService;

    @Autowired
    OrganizationRepository organizationRepository;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    UserService userService;

    @Autowired
    DatasourceService datasourceService;

    @Autowired
    DatasourceRepository datasourceRepository;

    Organization organization;

    @Before
    public void setup() {
        organization = new Organization();
        organization.setName("Test Name");
        organization.setDomain("example.com");
        organization.setWebsite("https://example.com");
    }

    /* Tests for the Create Organization Flow */

    @Test
    @WithUserDetails(value = "api_user")
    public void nullCreateOrganization() {
        Mono<Organization> organizationResponse = organizationService.create(null);
        StepVerifier.create(organizationResponse)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.ORGANIZATION)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void nullName() {
        organization.setName(null);
        Mono<Organization> organizationResponse = organizationService.create(organization);
        StepVerifier.create(organizationResponse)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.NAME)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void validCreateOrganizationTest() {
        Policy manageOrgAppPolicy = Policy.builder().permission(ORGANIZATION_MANAGE_APPLICATIONS.getValue())
                .users(Set.of("api_user"))
                .build();

        Policy manageOrgPolicy = Policy.builder().permission(MANAGE_ORGANIZATIONS.getValue())
                .users(Set.of("api_user"))
                .build();

        Mono<Organization> organizationResponse = organizationService.create(organization)
                .switchIfEmpty(Mono.error(new Exception("create is returning empty!!")));
        StepVerifier.create(organizationResponse)
                .assertNext(organization1 -> {
                    assertThat(organization1.getName()).isEqualTo("Test Name");
                    assertThat(organization1.getPolicies()).isNotEmpty();
                    assertThat(organization1.getPolicies()).containsAll(Set.of(manageOrgAppPolicy, manageOrgPolicy));
                    assertThat(organization1.getSlug() != null);
                })
                .verifyComplete();
    }

    /* Tests for Get Organization Flow */

    @Test
    @WithUserDetails(value = "api_user")
    public void getOrganizationInvalidId() {
        Mono<Organization> organizationMono = organizationService.getById("random-id");
        StepVerifier.create(organizationMono)
                // This would not return any organization and would complete.
                .verifyComplete();
    }

    @Test
    @WithMockUser(username = "api_user")
    public void getOrganizationNullId() {
        Mono<Organization> organizationMono = organizationService.getById(null);
        StepVerifier.create(organizationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.ID)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void validGetOrganizationByName() {
        Organization organization = new Organization();
        organization.setName("Test For Get Name");
        organization.setDomain("example.com");
        organization.setWebsite("https://example.com");
        organization.setSlug("test-for-get-name");
        Mono<Organization> createOrganization = organizationService.create(organization);
        Mono<Organization> getOrganization = createOrganization.flatMap(t -> organizationService.getById(t.getId()));
        StepVerifier.create(getOrganization)
                .assertNext(t -> {
                    assertThat(t).isNotNull();
                    assertThat(t.getName()).isEqualTo("Test For Get Name");
                })
                .verifyComplete();
    }

    /* Tests for Update Organization Flow */
    @Test
    @WithUserDetails(value = "api_user")
    public void validUpdateOrganization() {
        Organization organization = new Organization();
        organization.setName("Test Update Name");
        organization.setDomain("example.com");
        organization.setWebsite("https://example.com");
        organization.setSlug("test-update-name");

        Mono<Organization> createOrganization = organizationService.create(organization);
        Mono<Organization> updateOrganization = createOrganization
                .map(t -> {
                    t.setDomain("abc.com");
                    return t;
                })
                .flatMap(t -> organizationService.update(t.getId(), t))
                .flatMap(t -> organizationService.getById(t.getId()));

        StepVerifier.create(updateOrganization)
                .assertNext(t -> {
                    assertThat(t).isNotNull();
                    assertThat(t.getName()).isEqualTo(organization.getName());
                    assertThat(t.getId()).isEqualTo(organization.getId());
                    assertThat(t.getDomain()).isEqualTo("abc.com");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void uniqueSlugs() {
        Organization organization = new Organization();
        organization.setName("First slug org");
        organization.setDomain("example.com");
        organization.setWebsite("https://example.com");

        Mono<String> uniqueSlug = organizationService.getNextUniqueSlug("slug-org")
                .map(slug -> {
                    organization.setSlug(slug);
                    return organization;
                })
                .flatMap(organizationService::create)
                .then(organizationService.getNextUniqueSlug("slug-org"));

        StepVerifier.create(uniqueSlug)
                .assertNext(slug -> {
                    assertThat(slug).isNotEqualTo("slug-org");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createDuplicateNameOrganization() {
        Organization firstOrg = new Organization();
        firstOrg.setName("Really good org");
        firstOrg.setDomain("example.com");
        firstOrg.setWebsite("https://example.com");

        Organization secondOrg = new Organization();
        secondOrg.setName(firstOrg.getName());
        secondOrg.setDomain(firstOrg.getDomain());
        secondOrg.setWebsite(firstOrg.getWebsite());

        Mono<Organization> firstOrgCreation = organizationService.create(firstOrg).cache();
        Mono<Organization> secondOrgCreation = firstOrgCreation.then(organizationService.create(secondOrg));

        StepVerifier.create(Mono.zip(firstOrgCreation, secondOrgCreation))
                .assertNext(orgsTuple -> {
                    assertThat(orgsTuple.getT1().getSlug()).isEqualTo("really-good-org");
                    assertThat(orgsTuple.getT2().getSlug()).isEqualTo("really-good-org2");
                })
                .verifyComplete();
    }

    @Test
    public void getAllUserRolesForOrganizationDomain() {
        Mono<Map<String, String>> userRolesForOrganization = organizationService.getUserRolesForOrganization();

        StepVerifier.create(userRolesForOrganization)
                .assertNext(roles -> {
                    assertThat(roles).isNotEmpty();
                    assertThat(roles).containsKeys("Administrator", "App Viewer", "Developer");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getAllMembersForOrganization() {
        Organization testOrg = new Organization();
        testOrg.setName("Get All Members For Organization Test");
        testOrg.setDomain("test.com");
        testOrg.setWebsite("https://test.com");

        Mono<Organization> createOrganizationMono = organizationService.create(testOrg);
        Mono<List<UserRole>> usersMono = createOrganizationMono
                .flatMap(organization -> organizationService.getOrganizationMembers(organization.getId()));

        StepVerifier
                .create(usersMono)
                .assertNext(users -> {
                    assertThat(users).isNotNull();
                    UserRole userRole = users.get(0);
                    assertThat(userRole.getName()).isEqualTo("api_user");
                    assertThat(userRole.getRole()).isEqualByComparingTo(AppsmithRole.ORGANIZATION_ADMIN);
                    assertThat(userRole.getRoleName()).isEqualTo(AppsmithRole.ORGANIZATION_ADMIN.getName());
                })
                .verifyComplete();
    }

    /**
     * This test tests for an existing user being added to an organzation as admin.
     * The organization object should have permissions to manage the org for the invited user.
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void addExistingUserToOrganizationAsAdmin() {
        Mono<Organization> seedOrganization = organizationRepository.findByName("Spring Test Organization", AclPermission.READ_ORGANIZATIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND)));

        Mono<List<User>> usersAddedToOrgMono = seedOrganization
                .flatMap(organization1 -> {
                    // Add user to organization
                    InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
                    ArrayList<String> users = new ArrayList<>();
                    users.add("usertest@usertest.com");
                    inviteUsersDTO.setUsernames(users);
                    inviteUsersDTO.setOrgId(organization1.getId());
                    inviteUsersDTO.setRoleName(AppsmithRole.ORGANIZATION_ADMIN.getName());

                    return userService.inviteUser(inviteUsersDTO, "http://localhost:8080")
                            .collectList();
                })
                .cache();

        Mono<Organization> orgAfterUpdateMono = usersAddedToOrgMono
                .then(seedOrganization);

        StepVerifier
                .create(Mono.zip(usersAddedToOrgMono, orgAfterUpdateMono))
                .assertNext(tuple -> {
                    User user = tuple.getT1().get(0);
                    Organization org = tuple.getT2();

                    assertThat(org).isNotNull();
                    assertThat(org.getName()).isEqualTo("Spring Test Organization");
                    assertThat(org.getUserRoles().get(0).getUsername()).isEqualTo("usertest@usertest.com");

                    Policy manageOrgAppPolicy = Policy.builder().permission(ORGANIZATION_MANAGE_APPLICATIONS.getValue())
                            .users(Set.of("api_user", "usertest@usertest.com"))
                            .build();

                    Policy manageOrgPolicy = Policy.builder().permission(MANAGE_ORGANIZATIONS.getValue())
                            .users(Set.of("api_user", "usertest@usertest.com"))
                            .build();

                    Policy readOrgPolicy = Policy.builder().permission(READ_ORGANIZATIONS.getValue())
                            .users(Set.of("api_user", "usertest@usertest.com"))
                            .build();

                    assertThat(org.getPolicies()).isNotEmpty();
                    assertThat(org.getPolicies()).containsAll(Set.of(manageOrgAppPolicy, manageOrgPolicy, readOrgPolicy));

                    Set<String> organizationIds = user.getOrganizationIds();
                    assertThat(organizationIds).contains(org.getId());

                })
                .verifyComplete();
    }

    /**
     * This test tests for a new user being added to an organzation as admin.
     * The new user must be created at after invite flow and the new user must be disabled.
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void addNewUserToOrganizationAsAdmin() {
        Mono<Organization> seedOrganization = organizationRepository.findByName("Another Test Organization", AclPermission.READ_ORGANIZATIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND)));

        Mono<List<User>> userAddedToOrgMono = seedOrganization
                .flatMap(organization1 -> {
                    // Add user to organization
                    InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
                    ArrayList<String> users = new ArrayList<>();
                    users.add("newEmailWhichShouldntExist@usertest.com");
                    inviteUsersDTO.setUsernames(users);
                    inviteUsersDTO.setOrgId(organization1.getId());
                    inviteUsersDTO.setRoleName(AppsmithRole.ORGANIZATION_ADMIN.getName());

                    return userService.inviteUser(inviteUsersDTO, "http://localhost:8080")
                            .collectList();
                })
                .cache();

        Mono<Organization> orgAfterUpdateMono = userAddedToOrgMono
                .then(seedOrganization);

        StepVerifier
                .create(Mono.zip(userAddedToOrgMono, orgAfterUpdateMono))
                .assertNext(tuple -> {
                    User user = tuple.getT1().get(0);
                    Organization org = tuple.getT2();
                    log.debug("org user roles : {}", org.getUserRoles());

                    assertThat(org).isNotNull();
                    assertThat(org.getName()).isEqualTo("Another Test Organization");
                    assertThat(org.getUserRoles().stream()
                            .map(role -> role.getUsername())
                            .filter(username -> username.equals("newEmailWhichShouldntExist@usertest.com"))
                            .collect(Collectors.toSet())
                    ).hasSize(1);

                    Policy manageOrgAppPolicy = Policy.builder().permission(ORGANIZATION_MANAGE_APPLICATIONS.getValue())
                            .users(Set.of("api_user", "newEmailWhichShouldntExist@usertest.com"))
                            .build();

                    Policy manageOrgPolicy = Policy.builder().permission(MANAGE_ORGANIZATIONS.getValue())
                            .users(Set.of("api_user", "newEmailWhichShouldntExist@usertest.com"))
                            .build();

                    Policy readOrgPolicy = Policy.builder().permission(READ_ORGANIZATIONS.getValue())
                            .users(Set.of("api_user", "newEmailWhichShouldntExist@usertest.com"))
                            .build();

                    assertThat(org.getPolicies()).isNotEmpty();
                    assertThat(org.getPolicies()).containsAll(Set.of(manageOrgAppPolicy, manageOrgPolicy, readOrgPolicy));

                    assertThat(user).isNotNull();
                    assertThat(user.getIsEnabled()).isFalse();
                    Set<String> organizationIds = user.getOrganizationIds();
                    assertThat(organizationIds).contains(org.getId());

                })
                .verifyComplete();
    }

    /**
     * This test tests for a new user being added to an organzation as viewer.
     * The new user must be created at after invite flow and the new user must be disabled.
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void addNewUserToOrganizationAsViewer() {
        Organization organization = new Organization();
        organization.setName("Add Viewer to Test Organization");
        organization.setDomain("example.com");
        organization.setWebsite("https://example.com");

        Mono<Organization> organizationMono = organizationService
                .create(organization)
                .cache();

        Mono<List<User>> userAddedToOrgMono = organizationMono
                .flatMap(organization1 -> {
                    // Add user to organization
                    InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
                    ArrayList<String> users = new ArrayList<>();
                    users.add("newEmailWhichShouldntExistAsViewer@usertest.com");
                    inviteUsersDTO.setUsernames(users);
                    inviteUsersDTO.setOrgId(organization1.getId());
                    inviteUsersDTO.setRoleName(AppsmithRole.ORGANIZATION_VIEWER.getName());

                    return userService.inviteUser(inviteUsersDTO, "http://localhost:8080")
                            .collectList();
                })
                .cache();

        Mono<Organization> readOrgMono = organizationRepository.findByName("Add Viewer to Test Organization");

        Mono<Organization> orgAfterUpdateMono = userAddedToOrgMono
                .then(readOrgMono);

        StepVerifier
                .create(Mono.zip(userAddedToOrgMono, orgAfterUpdateMono))
                .assertNext(tuple -> {
                    User user = tuple.getT1().get(0);
                    Organization org = tuple.getT2();

                    assertThat(org).isNotNull();
                    assertThat(org.getName()).isEqualTo("Add Viewer to Test Organization");
                    assertThat(org.getUserRoles().stream()
                            .filter(role -> role.getUsername().equals("newEmailWhichShouldntExistAsViewer@usertest.com"))
                            .collect(Collectors.toSet())
                    ).hasSize(1);

                    Policy readOrgAppsPolicy = Policy.builder().permission(ORGANIZATION_READ_APPLICATIONS.getValue())
                            .users(Set.of("api_user", "newEmailWhichShouldntExistAsViewer@usertest.com"))
                            .build();

                    Policy readOrgPolicy = Policy.builder().permission(READ_ORGANIZATIONS.getValue())
                            .users(Set.of("api_user", "newEmailWhichShouldntExistAsViewer@usertest.com"))
                            .build();

                    assertThat(org.getPolicies()).isNotEmpty();
                    assertThat(org.getPolicies()).containsAll(Set.of(readOrgAppsPolicy, readOrgPolicy));

                    assertThat(user).isNotNull();
                    assertThat(user.getIsEnabled()).isFalse();
                    Set<String> organizationIds = user.getOrganizationIds();
                    assertThat(organizationIds).contains(org.getId());

                })
                .verifyComplete();
    }

    /**
     * This test checks for application and datasource permissions if a user is invited to the organization as an Admin.
     * The existing applications in the organization should now have the new user be included in both
     * manage:applications and read:applications policies.
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void addUserToOrganizationAsAdminAndCheckApplicationAndDatasourcePermissions() {
        Organization organization = new Organization();
        organization.setName("Member Management Admin Test Organization");
        organization.setDomain("example.com");
        organization.setWebsite("https://example.com");

        Mono<Organization> organizationMono = organizationService
                .create(organization)
                .cache();

        // Create an application for this organization
        Mono<Application> applicationMono = organizationMono
                .flatMap(org -> {
                    Application application = new Application();
                    application.setName("User Management Admin Test Application");
                    return applicationPageService.createApplication(application, org.getId());
                });

        // Create datasource for this organization
        Mono<Datasource> datasourceMono = organizationMono
                .flatMap(org -> {
                    Datasource datasource = new Datasource();
                    datasource.setName("test datasource");
                    datasource.setOrganizationId(org.getId());
                    return datasourceService.create(datasource);
                });

        Mono<Organization> userAddedToOrgMono = organizationMono
                .flatMap(organization1 -> {
                    // Add user to organization
                    UserRole userRole = new UserRole();
                    userRole.setRoleName(AppsmithRole.ORGANIZATION_ADMIN.getName());
                    userRole.setUsername("usertest@usertest.com");
                    return userOrganizationService.addUserRoleToOrganization(organization1.getId(), userRole);
                })
                .map(organization1 -> {
                    log.debug("Organization policies after adding user is : {}", organization1.getPolicies());
                    return organization1;
                });

        Mono<Application> readApplicationByNameMono = applicationService.findByName("User Management Admin Test Application",
                AclPermission.READ_APPLICATIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "application by name")));

        Mono<Organization> readOrganizationByNameMono = organizationRepository.findByName("Member Management Admin Test Organization")
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "organization by name")));

        Mono<Datasource> readDatasourceByNameMono = datasourceRepository.findByName("test datasource", READ_DATASOURCES)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "Datasource")));

        Mono<Tuple3<Application, Organization, Datasource>> testMono = organizationMono
                // create application and datasource
                .then(Mono.zip(applicationMono, datasourceMono))
                // Now add the user
                .then(userAddedToOrgMono)
                // Read application, organization and datasource now to confirm the policies.
                .then(Mono.zip(readApplicationByNameMono, readOrganizationByNameMono, readDatasourceByNameMono));

        StepVerifier
                .create(testMono)
                .assertNext(tuple -> {
                    Application application = tuple.getT1();
                    Organization org = tuple.getT2();
                    Datasource datasource = tuple.getT3();
                    assertThat(org).isNotNull();
                    assertThat(org.getUserRoles().get(1).getUsername()).isEqualTo("usertest@usertest.com");

                    Policy manageAppPolicy = Policy.builder().permission(MANAGE_APPLICATIONS.getValue())
                            .users(Set.of("api_user", "usertest@usertest.com"))
                            .build();
                    Policy readAppPolicy = Policy.builder().permission(READ_APPLICATIONS.getValue())
                            .users(Set.of("api_user", "usertest@usertest.com"))
                            .build();

                    assertThat(application.getPolicies()).isNotEmpty();
                    assertThat(application.getPolicies()).containsAll(Set.of(manageAppPolicy, readAppPolicy));

                    /*
                     * Check for datasource permissions after the user addition
                     */
                    Policy manageDatasourcePolicy = Policy.builder().permission(MANAGE_DATASOURCES.getValue())
                            .users(Set.of("api_user", "usertest@usertest.com"))
                            .build();
                    Policy readDatasourcePolicy = Policy.builder().permission(READ_DATASOURCES.getValue())
                            .users(Set.of("api_user", "usertest@usertest.com"))
                            .build();
                    Policy executeDatasourcePolicy = Policy.builder().permission(EXECUTE_DATASOURCES.getValue())
                            .users(Set.of("api_user", "usertest@usertest.com"))
                            .build();

                    assertThat(datasource.getPolicies()).isNotEmpty();
                    assertThat(datasource.getPolicies()).containsAll(Set.of(manageDatasourcePolicy, readDatasourcePolicy,
                                                                            executeDatasourcePolicy));

                })
                .verifyComplete();
    }

    /**
     * This test checks for application permissions if a user is invited to the organization as a Viewer.
     * The existing applications in the organization should now have the new user be included in both
     * manage:applications and read:applications policies.
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void addUserToOrganizationAsViewerAndCheckApplicationPermissions() {
        Organization organization = new Organization();
        organization.setName("Member Management Viewer Test Organization");
        organization.setDomain("example.com");
        organization.setWebsite("https://example.com");

        Mono<Organization> organizationMono = organizationService
                .create(organization)
                .cache();

        // Create an application for this organization
        Mono<Application> applicationMono = organizationMono
                .flatMap(org -> {
                    Application application = new Application();
                    application.setName("User Management Viewer Test Application");
                    return applicationPageService.createApplication(application, org.getId());
                });

        Mono<Organization> userAddedToOrgMono = organizationMono
                .flatMap(organization1 -> {
                    // Add user to organization
                    UserRole userRole = new UserRole();
                    userRole.setRoleName(AppsmithRole.ORGANIZATION_VIEWER.getName());
                    userRole.setUsername("usertest@usertest.com");
                    return userOrganizationService.addUserRoleToOrganization(organization1.getId(), userRole);
                });

        Mono<Application> readApplicationByNameMono = applicationService.findByName("User Management Viewer Test Application",
                AclPermission.READ_APPLICATIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "application by name")));

        Mono<Organization> readOrganizationByNameMono = organizationRepository.findByName("Member Management Viewer Test Organization")
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "organization by name")));

        Mono<Tuple2<Application, Organization>> testMono = organizationMono
                .then(applicationMono)
                .then(userAddedToOrgMono)
                .then(Mono.zip(readApplicationByNameMono, readOrganizationByNameMono));

        StepVerifier
                .create(testMono)
                .assertNext(tuple -> {
                    Application application = tuple.getT1();
                    Organization org = tuple.getT2();
                    assertThat(org).isNotNull();
                    assertThat(org.getUserRoles().get(1).getUsername()).isEqualTo("usertest@usertest.com");

                    log.debug("App policies are {}", application.getPolicies());

                    Policy manageAppPolicy = Policy.builder().permission(MANAGE_APPLICATIONS.getValue())
                            .users(Set.of("api_user"))
                            .build();
                    Policy readAppPolicy = Policy.builder().permission(READ_APPLICATIONS.getValue())
                            .users(Set.of("usertest@usertest.com", "api_user"))
                            .build();

                    assertThat(application.getPolicies()).isNotEmpty();
                    assertThat(application.getPolicies()).containsAll(Set.of(manageAppPolicy, readAppPolicy));

                })
                .verifyComplete();
    }

    /**
     * This test checks for application permissions after changing the role of a user in an organization
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void changeUserRoleAndCheckApplicationPermissionChanges() {
        Organization organization = new Organization();
        organization.setName("Member Management Test Organization");
        organization.setDomain("example.com");
        organization.setWebsite("https://example.com");

        Mono<Organization> organizationMono = organizationService
                .create(organization)
                .cache();

        // Create an application for this organization
        Mono<Application> createApplicationMono = organizationMono
                .flatMap(org -> {
                    Application application = new Application();
                    application.setName("User Management Test Application");
                    return applicationPageService.createApplication(application, org.getId());
                });

        Mono<Organization> userAddedToOrgMono = organizationMono
                .flatMap(organization1 -> {
                    // Add user to organization
                    UserRole userRole = new UserRole();
                    userRole.setRoleName(AppsmithRole.ORGANIZATION_ADMIN.getName());
                    userRole.setUsername("usertest@usertest.com");
                    return userOrganizationService.addUserRoleToOrganization(organization1.getId(), userRole);
                });

        Mono<Application> readApplicationByNameMono = applicationService.findByName("User Management Test Application",
                AclPermission.READ_APPLICATIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "application by name")));

        Mono<UserRole> userRoleChangeMono = organizationMono
                .flatMap(org -> {
                    UserRole userRole = new UserRole();
                    userRole.setUsername("usertest@usertest.com");
                    userRole.setRoleName("App Viewer");
                    return userOrganizationService.updateRoleForMember(org.getId(), userRole);
                });

        Mono<Application> applicationAfterRoleChange = organizationMono
                .then(createApplicationMono)
                .then(userAddedToOrgMono)
                .then(userRoleChangeMono)
                .then(readApplicationByNameMono);


        StepVerifier
                .create(applicationAfterRoleChange)
                .assertNext(application -> {

                    log.debug("app polcies : {}", application.getPolicies());

                    Policy manageAppPolicy = Policy.builder().permission(MANAGE_APPLICATIONS.getValue())
                            .users(Set.of("api_user"))
                            .build();
                    Policy readAppPolicy = Policy.builder().permission(READ_APPLICATIONS.getValue())
                            .users(Set.of("api_user", "usertest@usertest.com"))
                            .build();

                    assertThat(application.getPolicies()).isNotEmpty();
                    assertThat(application.getPolicies()).containsAll(Set.of(manageAppPolicy, readAppPolicy));

                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void deleteUserRoleFromOrganizationTest() {
        Organization organization = new Organization();
        organization.setName("Member Management Delete Test Organization");
        organization.setDomain("example.com");
        organization.setWebsite("https://example.com");

        Mono<Organization> organizationMono = organizationService
                .create(organization)
                .cache();

        // Create an application for this organization
        Mono<Application> createApplicationMono = organizationMono
                .flatMap(org -> {
                    Application application = new Application();
                    application.setName("User Management Delete Test Application");
                    return applicationPageService.createApplication(application, org.getId());
                });

        Mono<Organization> userAddedToOrgMono = organizationMono
                .flatMap(organization1 -> {
                    // Add user to organization
                    UserRole userRole = new UserRole();
                    userRole.setRoleName(AppsmithRole.ORGANIZATION_ADMIN.getName());
                    userRole.setUsername("usertest@usertest.com");
                    return userOrganizationService.addUserRoleToOrganization(organization1.getId(), userRole);
                });

        Mono<Application> readApplicationByNameMono = applicationService.findByName("User Management Delete Test Application",
                AclPermission.READ_APPLICATIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "application by name")));

        Mono<Organization> readOrganizationByNameMono = organizationRepository.findByName("Member Management Delete Test Organization")
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "organization by name")));

        Mono<UserRole> userRoleChangeMono = organizationMono
                .flatMap(org -> {
                    UserRole userRole = new UserRole();
                    userRole.setUsername("usertest@usertest.com");
                    // Setting the role name to null ensures that user is deleted from the organization
                    userRole.setRoleName(null);
                    return userOrganizationService.updateRoleForMember(org.getId(), userRole);
                });

        Mono<Tuple2<Application, Organization>> tupleMono = organizationMono
                .then(createApplicationMono)
                .then(userAddedToOrgMono)
                .then(userRoleChangeMono)
                .then(Mono.zip(readApplicationByNameMono, readOrganizationByNameMono));


        StepVerifier
                .create(tupleMono)
                .assertNext(tuple -> {
                    Application application = tuple.getT1();
                    Organization org = tuple.getT2();
                    assertThat(org.getUserRoles().size()).isEqualTo(1);

                    Policy manageAppPolicy = Policy.builder().permission(MANAGE_APPLICATIONS.getValue())
                            .users(Set.of("api_user"))
                            .build();
                    Policy readAppPolicy = Policy.builder().permission(READ_APPLICATIONS.getValue())
                            .users(Set.of("api_user"))
                            .build();

                    assertThat(application.getPolicies()).isNotEmpty();
                    assertThat(application.getPolicies()).containsAll(Set.of(manageAppPolicy, readAppPolicy));

                })
                .verifyComplete();
    }

    /**
     * This test tests for a multiple new users being added to an organzation as viewer.
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void addNewUsersBulkToOrganizationAsViewer() {
        Organization organization = new Organization();
        organization.setName("Add Bulk Viewers to Test Organization");
        organization.setDomain("example.com");
        organization.setWebsite("https://example.com");

        Mono<Organization> organizationMono = organizationService
                .create(organization)
                .cache();

        Mono<List<User>> userAddedToOrgMono = organizationMono
                .flatMap(organization1 -> {
                    // Add user to organization
                    InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
                    ArrayList<String> users = new ArrayList<>();
                    users.add("newEmailWhichShouldntExistAsViewer1@usertest.com");
                    users.add("newEmailWhichShouldntExistAsViewer2@usertest.com");
                    users.add("newEmailWhichShouldntExistAsViewer3@usertest.com");
                    inviteUsersDTO.setUsernames(users);
                    inviteUsersDTO.setOrgId(organization1.getId());
                    inviteUsersDTO.setRoleName(AppsmithRole.ORGANIZATION_VIEWER.getName());

                    return userService.inviteUser(inviteUsersDTO, "http://localhost:8080")
                            .collectList();
                })
                .cache();

        Mono<Organization> readOrgMono = organizationRepository.findByName("Add Bulk Viewers to Test Organization");

        Mono<Organization> orgAfterUpdateMono = userAddedToOrgMono
                .then(readOrgMono);

        StepVerifier
                .create(Mono.zip(userAddedToOrgMono, orgAfterUpdateMono))
                .assertNext(tuple -> {
                    User user = tuple.getT1().get(0);
                    Organization org = tuple.getT2();

                    assertThat(org).isNotNull();
                    assertThat(org.getName()).isEqualTo("Add Bulk Viewers to Test Organization");
                    assertThat(org.getUserRoles().stream()
                            .map(userRole -> userRole.getUsername())
                            .filter(username -> !username.equals("api_user"))
                            .collect(Collectors.toSet())
                    ).containsAll(Set.of("newEmailWhichShouldntExistAsViewer1@usertest.com", "newEmailWhichShouldntExistAsViewer2@usertest.com",
                            "newEmailWhichShouldntExistAsViewer3@usertest.com"));

                    Policy readOrgAppsPolicy = Policy.builder().permission(ORGANIZATION_READ_APPLICATIONS.getValue())
                            .users(Set.of("api_user", "newEmailWhichShouldntExistAsViewer1@usertest.com",
                                    "newEmailWhichShouldntExistAsViewer2@usertest.com",
                                    "newEmailWhichShouldntExistAsViewer3@usertest.com"))
                            .build();

                    Policy readOrgPolicy = Policy.builder().permission(READ_ORGANIZATIONS.getValue())
                            .users(Set.of("api_user", "newEmailWhichShouldntExistAsViewer1@usertest.com",
                                    "newEmailWhichShouldntExistAsViewer2@usertest.com",
                                    "newEmailWhichShouldntExistAsViewer3@usertest.com"))
                            .build();

                    assertThat(org.getPolicies()).isNotEmpty();
                    assertThat(org.getPolicies()).containsAll(Set.of(readOrgAppsPolicy, readOrgPolicy));

                    assertThat(user).isNotNull();
                    assertThat(user.getIsEnabled()).isFalse();
                    Set<String> organizationIds = user.getOrganizationIds();
                    assertThat(organizationIds).contains(org.getId());

                })
                .verifyComplete();
    }

}
