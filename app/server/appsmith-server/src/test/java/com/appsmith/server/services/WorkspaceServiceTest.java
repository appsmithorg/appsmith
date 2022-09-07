package com.appsmith.server.services;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.AppsmithRole;
import com.appsmith.server.acl.RoleGraph;
import com.appsmith.server.configurations.WithMockAppsmithUser;
import com.appsmith.server.constants.Constraint;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Asset;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserRole;
import com.appsmith.server.dtos.InviteUsersDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.TextUtils;
import com.appsmith.server.repositories.AssetRepository;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.repositories.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.function.Tuple2;
import reactor.util.function.Tuple3;

import java.io.IOException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.EXECUTE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.MANAGE_WORKSPACES;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.READ_WORKSPACES;
import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringJUnit4ClassRunner.class)
@SpringBootTest
@DirtiesContext
@Slf4j
public class WorkspaceServiceTest {

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    UserWorkspaceService userWorkspaceService;

    @Autowired
    WorkspaceRepository workspaceRepository;

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

    @Autowired
    UserRepository userRepository;

    @Autowired
    RoleGraph roleGraph;

    @Autowired
    private AssetRepository assetRepository;

    Workspace workspace;

    @Before
    public void setup() {
        workspace = new Workspace();
        workspace.setName("Test Name");
        workspace.setDomain("example.com");
        workspace.setWebsite("https://example.com");
    }

    /* Tests for the Create Workspace Flow */

    @Test
    @WithUserDetails(value = "api_user")
    public void createDefaultWorkspace() {

        Mono<User> userMono = userRepository.findByEmail("api_user").cache();

        Mono<Workspace> workspaceMono = userMono
                .flatMap(user -> workspaceService.createDefault(new Workspace(), user))
                .switchIfEmpty(Mono.error(new Exception("createDefault is returning empty!!")));

        StepVerifier.create(Mono.zip(workspaceMono, userMono))
                .assertNext(tuple -> {
                    Workspace workspace1 = tuple.getT1();
                    User user = tuple.getT2();
                    assertThat(workspace1.getName()).isEqualTo("api_user's apps");
                    assertThat(workspace1.getSlug()).isNotNull();
                    assertThat(workspace1.getEmail()).isEqualTo("api_user");
                    assertThat(workspace1.getIsAutoGeneratedWorkspace()).isTrue();
                    assertThat(workspace1.getTenantId()).isEqualTo(user.getTenantId());
                })
                .verifyComplete();
    }

    @Test
    @WithMockAppsmithUser
    public void checkNewUsersDefaultWorkspace() {
        User newUser = new User();
        newUser.setEmail("new-user-with-default-org@email.com");
        newUser.setPassword("new-user-with-default-org-password");

        Mono<User> userMono = userService.create(newUser).cache();
        Mono<Workspace> defaultWorkspaceMono = userMono
                .flatMap(user -> workspaceRepository
                        .findById(user.getWorkspaceIds().stream().findFirst().get()));

        StepVerifier.create(Mono.zip(userMono, defaultWorkspaceMono))
                .assertNext(tuple -> {
                        Workspace defaultWorkspace = tuple.getT2();
                    User user = tuple.getT1();

                    assertThat(user.getId()).isNotNull();
                    assertThat(user.getEmail()).isEqualTo("new-user-with-default-org@email.com");
                    assertThat(user.getName()).isNullOrEmpty();
                    assertThat(defaultWorkspace.getIsAutoGeneratedWorkspace()).isTrue();
                    assertThat(defaultWorkspace.getName()).isEqualTo("new-user-with-default-org's apps");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void nullCreateWorkspace() {
        Mono<Workspace> workspaceResponse = workspaceService.create(null);
        StepVerifier.create(workspaceResponse)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.WORKSPACE)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void nullName() {
        workspace.setName(null);
        Mono<Workspace> workspaceResponse = workspaceService.create(workspace);
        StepVerifier.create(workspaceResponse)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.NAME)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void validCreateWorkspaceTest() {
        Policy manageWorkspaceAppPolicy = Policy.builder().permission(WORKSPACE_MANAGE_APPLICATIONS.getValue())
                .users(Set.of("api_user"))
                .build();

        Policy manageWorkspacePolicy = Policy.builder().permission(MANAGE_WORKSPACES.getValue())
                .users(Set.of("api_user"))
                .build();

        Mono<Workspace> workspaceResponse = workspaceService.create(workspace)
                .switchIfEmpty(Mono.error(new Exception("create is returning empty!!")));

        Mono<User> userMono = userRepository.findByEmail("api_user");

        StepVerifier.create(Mono.zip(workspaceResponse, userMono))
                .assertNext(tuple -> {
                    Workspace workspace1 = tuple.getT1();
                    User user = tuple.getT2();
                    assertThat(workspace1.getName()).isEqualTo("Test Name");
                    assertThat(workspace1.getPolicies()).isNotEmpty();
                    assertThat(workspace1.getPolicies()).containsAll(Set.of(manageWorkspaceAppPolicy, manageWorkspacePolicy));
                    assertThat(workspace1.getSlug()).isEqualTo(TextUtils.makeSlug(workspace.getName()));
                    assertThat(workspace1.getEmail()).isEqualTo("api_user");
                    assertThat(workspace1.getIsAutoGeneratedWorkspace()).isNull();
                    assertThat(workspace1.getTenantId()).isEqualTo(user.getTenantId());
                })
                .verifyComplete();
    }

    /* Tests for Get Workspace Flow */

    @Test
    @WithUserDetails(value = "api_user")
    public void getWorkspaceInvalidId() {
        Mono<Workspace> workspaceMono = workspaceService.getById("random-id");
        StepVerifier.create(workspaceMono)
                // This would not return any workspace and would complete.
                .verifyComplete();
    }

    @Test
    @WithMockUser(username = "api_user")
    public void getWorkspaceNullId() {
        Mono<Workspace> workspaceMono = workspaceService.getById(null);
        StepVerifier.create(workspaceMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.ID)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void validGetWorkspaceByName() {
        Workspace workspace = new Workspace();
        workspace.setName("Test For Get Name");
        workspace.setDomain("example.com");
        workspace.setWebsite("https://example.com");
        workspace.setSlug("test-for-get-name");
        Mono<Workspace> createWorkspace = workspaceService.create(workspace);
        Mono<Workspace> getWorkspace = createWorkspace.flatMap(t -> workspaceService.getById(t.getId()));
        StepVerifier.create(getWorkspace)
                .assertNext(t -> {
                    assertThat(t).isNotNull();
                    assertThat(t.getName()).isEqualTo("Test For Get Name");
                })
                .verifyComplete();
    }

    /* Tests for Update Workspace Flow */
    @Test
    @WithUserDetails(value = "api_user")
    public void validUpdateWorkspace() {
        Policy manageWorkspaceAppPolicy = Policy.builder().permission(WORKSPACE_MANAGE_APPLICATIONS.getValue())
                .users(Set.of("api_user"))
                .build();

        Policy manageWorkspacePolicy = Policy.builder().permission(MANAGE_WORKSPACES.getValue())
                .users(Set.of("api_user"))
                .build();

                Workspace workspace = new Workspace();
                workspace.setName("Test Update Name");
                workspace.setDomain("example.com");
                workspace.setWebsite("https://example.com");
                workspace.setSlug("test-update-name");

        Mono<Workspace> createWorkspace = workspaceService.create(workspace);
        Mono<Workspace> updateWorkspace = createWorkspace
                .flatMap(t -> {
                    Workspace newWorkspace = new Workspace();
                    newWorkspace.setDomain("abc.com");
                    return workspaceService.update(t.getId(), newWorkspace);
                });

        StepVerifier.create(updateWorkspace)
                .assertNext(t -> {
                    assertThat(t).isNotNull();
                    assertThat(t.getName()).isEqualTo(workspace.getName());
                    assertThat(t.getId()).isEqualTo(workspace.getId());
                    assertThat(t.getDomain()).isEqualTo("abc.com");
                    assertThat(t.getPolicies()).contains(manageWorkspaceAppPolicy, manageWorkspacePolicy);
                })
                .verifyComplete();
    }

    /**
     * This test tests for updating the workspace with an empty name.
     * The workspace name should not be empty.
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void inValidupdateWorkspaceEmptyName() {
        Policy manageWorkspaceAppPolicy = Policy.builder().permission(WORKSPACE_MANAGE_APPLICATIONS.getValue())
                .users(Set.of("api_user"))
                .build();

        Policy manageWorkspacePolicy = Policy.builder().permission(MANAGE_WORKSPACES.getValue())
                .users(Set.of("api_user"))
                .build();

        Workspace workspace = new Workspace();
        workspace.setName("Test Update Name");
        workspace.setDomain("example.com");
        workspace.setWebsite("https://example.com");
        workspace.setSlug("test-update-name");
        Mono<Workspace> createWorkspace = workspaceService.create(workspace);
        Mono<Workspace> updateWorkspace = createWorkspace
                .flatMap(t -> {
                    Workspace newWorkspace = new Workspace();
                    newWorkspace.setName("");
                    return workspaceService.update(t.getId(), newWorkspace);
                });

        StepVerifier.create(updateWorkspace)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.NAME)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createDuplicateNameWorkspace() {
        Workspace firstWorkspace = new Workspace();
        firstWorkspace.setName("Really good org");
        firstWorkspace.setDomain("example.com");
        firstWorkspace.setWebsite("https://example.com");

        Workspace secondWorkspace = new Workspace();
        secondWorkspace.setName(firstWorkspace.getName());
        secondWorkspace.setDomain(firstWorkspace.getDomain());
        secondWorkspace.setWebsite(firstWorkspace.getWebsite());

        Mono<Workspace> firstWorkspaceCreation = workspaceService.create(firstWorkspace).cache();
        Mono<Workspace> secondWorkspaceCreation = firstWorkspaceCreation.then(workspaceService.create(secondWorkspace));

        StepVerifier.create(Mono.zip(firstWorkspaceCreation, secondWorkspaceCreation))
                .assertNext(WorkspacesTuple -> {
                    assertThat(WorkspacesTuple.getT1().getName()).isEqualTo("Really good org");
                    assertThat(WorkspacesTuple.getT1().getSlug()).isEqualTo("really-good-org");

                    assertThat(WorkspacesTuple.getT2().getName()).isEqualTo("Really good org");
                    assertThat(WorkspacesTuple.getT2().getSlug()).isEqualTo("really-good-org");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getAllUserRolesForWorkspaceDomainAsAdministrator() {
        Mono<Map<String, String>> userRolesForWorkspace = workspaceService.create(workspace)
                .flatMap(createdWorkspace -> workspaceService.getUserRolesForWorkspace(createdWorkspace.getId()));

        StepVerifier.create(userRolesForWorkspace)
                .assertNext(roles -> {
                    assertThat(roles).isNotEmpty();
                    assertThat(roles).containsKeys("Administrator", "App Viewer", "Developer");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getAllMembersForWorkspace() {
        Workspace testWorkspace = new Workspace();
        testWorkspace.setName("Get All Members For Workspace Test");
        testWorkspace.setDomain("test.com");
        testWorkspace.setWebsite("https://test.com");

        Mono<Workspace> createWorkspaceMono = workspaceService.create(testWorkspace);
        Mono<List<UserRole>> usersMono = createWorkspaceMono
                .flatMap(workspace -> workspaceService.getWorkspaceMembers(workspace.getId()));

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
     * This test tests for an existing user being added to an workspace as admin.
     * The workspace object should have permissions to manage the workspace for the invited user.
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void addExistingUserToWorkspaceAsAdmin() {
        Mono<Workspace> seedWorkspace = workspaceRepository.findByName("Spring Test Workspace", AclPermission.READ_WORKSPACES)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND)));

        Mono<List<User>> usersAddedToWorkspaceMono = seedWorkspace
                .flatMap(workspace1 -> {
                    // Add user to workspace
                    InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
                    ArrayList<String> users = new ArrayList<>();
                    users.add("usertest@usertest.com");
                    inviteUsersDTO.setUsernames(users);
                    inviteUsersDTO.setWorkspaceId(workspace1.getId());
                    inviteUsersDTO.setRoleName(AppsmithRole.ORGANIZATION_ADMIN.getName());

                    return userService.inviteUsers(inviteUsersDTO, "http://localhost:8080");
                })
                .cache();

        Mono<Workspace> workspaceAfterUpdateMono = usersAddedToWorkspaceMono
                .then(seedWorkspace);

        StepVerifier
                .create(Mono.zip(usersAddedToWorkspaceMono, workspaceAfterUpdateMono))
                .assertNext(tuple -> {
                    User user = tuple.getT1().get(0);
                    Workspace workspace = tuple.getT2();

                    assertThat(workspace).isNotNull();
                    assertThat(workspace.getName()).isEqualTo("Spring Test Workspace");
                    assertThat(workspace.getUserRoles().get(1).getUsername()).isEqualTo("usertest@usertest.com");

                    Policy manageWorkspaceAppPolicy = Policy.builder().permission(WORKSPACE_MANAGE_APPLICATIONS.getValue())
                            .users(Set.of("api_user", "usertest@usertest.com"))
                            .build();

                    Policy manageWorkspacePolicy = Policy.builder().permission(MANAGE_WORKSPACES.getValue())
                            .users(Set.of("api_user", "usertest@usertest.com"))
                            .build();

                    Policy readWorkspacePolicy = Policy.builder().permission(READ_WORKSPACES.getValue())
                            .users(Set.of("api_user", "usertest@usertest.com"))
                            .build();

                    assertThat(workspace.getPolicies()).isNotEmpty();
                    assertThat(workspace.getPolicies()).containsAll(Set.of(manageWorkspaceAppPolicy, manageWorkspacePolicy, readWorkspacePolicy));

                    Set<String> workspaceIds = user.getWorkspaceIds();
                    assertThat(workspaceIds).contains(workspace.getId());

                })
                .verifyComplete();
    }

    /**
     * This test tests for a new user being added to an workspace as admin.
     * The new user must be created at after invite flow and the new user must be disabled.
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void addNewUserToWorkspaceAsAdmin() {
        Mono<Workspace> seedWorkspace = workspaceRepository.findByName("Another Test Workspace", AclPermission.READ_WORKSPACES)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND)));

        Mono<List<User>> userAddedToWorkspaceMono = seedWorkspace
                .flatMap(workspace1 -> {
                    // Add user to workspace
                    InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
                    ArrayList<String> users = new ArrayList<>();
                    users.add("newEmailWhichShouldntExist@usertest.com");
                    inviteUsersDTO.setUsernames(users);
                    inviteUsersDTO.setWorkspaceId(workspace1.getId());
                    inviteUsersDTO.setRoleName(AppsmithRole.ORGANIZATION_ADMIN.getName());

                    return userService.inviteUsers(inviteUsersDTO, "http://localhost:8080");
                })
                .cache();

        Mono<Workspace> workspaceAfterUpdateMono = userAddedToWorkspaceMono
                .then(seedWorkspace);

        StepVerifier
                .create(Mono.zip(userAddedToWorkspaceMono, workspaceAfterUpdateMono))
                .assertNext(tuple -> {
                    User user = tuple.getT1().get(0);
                    Workspace workspace = tuple.getT2();
                    log.debug("org user roles : {}", workspace.getUserRoles());

                    assertThat(workspace).isNotNull();
                    assertThat(workspace.getName()).isEqualTo("Another Test Workspace");
                    assertThat(workspace.getUserRoles().stream()
                            .map(role -> role.getUsername())
                            .filter(username -> username.equals("newemailwhichshouldntexist@usertest.com"))
                            .collect(Collectors.toSet())
                    ).hasSize(1);

                    Policy manageWorkspaceAppPolicy = Policy.builder().permission(WORKSPACE_MANAGE_APPLICATIONS.getValue())
                            .users(Set.of("api_user", "newemailwhichshouldntexist@usertest.com"))
                            .build();

                    Policy manageWorkspacePolicy = Policy.builder().permission(MANAGE_WORKSPACES.getValue())
                            .users(Set.of("api_user", "newemailwhichshouldntexist@usertest.com"))
                            .build();

                    Policy readWorkspacePolicy = Policy.builder().permission(READ_WORKSPACES.getValue())
                            .users(Set.of("api_user", "newemailwhichshouldntexist@usertest.com"))
                            .build();

                    assertThat(workspace.getPolicies()).isNotEmpty();
                    assertThat(workspace.getPolicies()).containsAll(Set.of(manageWorkspaceAppPolicy, manageWorkspacePolicy, readWorkspacePolicy));

                    assertThat(user).isNotNull();
                    assertThat(user.getIsEnabled()).isFalse();
                    Set<String> workspaceIds = user.getWorkspaceIds();
                    assertThat(workspaceIds).contains(workspace.getId());

                })
                .verifyComplete();
    }

    /**
     * This test tests for a new user being added to an workspace as viewer.
     * The new user must be created at after invite flow and the new user must be disabled.
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void addNewUserToWorkspaceAsViewer() {
        Workspace workspace = new Workspace();
        workspace.setName("Add Viewer to Test Workspace");
        workspace.setDomain("example.com");
        workspace.setWebsite("https://example.com");

        Mono<Workspace> workspaceMono = workspaceService
                .create(workspace)
                .cache();

        Mono<List<User>> userAddedToWorkspaceMono = workspaceMono
                .flatMap(workspace1 -> {
                    // Add user to workspace
                    InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
                    ArrayList<String> users = new ArrayList<>();
                    users.add("newEmailWhichShouldntExistAsViewer@usertest.com");
                    inviteUsersDTO.setUsernames(users);
                    inviteUsersDTO.setWorkspaceId(workspace1.getId());
                    inviteUsersDTO.setRoleName(AppsmithRole.ORGANIZATION_VIEWER.getName());

                    return userService.inviteUsers(inviteUsersDTO, "http://localhost:8080");
                })
                .cache();

        Mono<Workspace> readWorkspaceMono = workspaceRepository.findByName("Add Viewer to Test Workspace");

        Mono<Workspace> workspaceAfterUpdateMono = userAddedToWorkspaceMono
                .then(readWorkspaceMono);

        StepVerifier
                .create(Mono.zip(userAddedToWorkspaceMono, workspaceAfterUpdateMono))
                .assertNext(tuple -> {
                    User user = tuple.getT1().get(0);
                    Workspace workspace1 = tuple.getT2();

                    assertThat(workspace1).isNotNull();
                    assertThat(workspace1.getName()).isEqualTo("Add Viewer to Test Workspace");
                    assertThat(workspace1.getUserRoles().stream()
                            .filter(role -> role.getUsername().equals("newemailwhichshouldntexistasviewer@usertest.com"))
                            .collect(Collectors.toSet())
                    ).hasSize(1);

                    Policy readWorkspaceAppsPolicy = Policy.builder().permission(WORKSPACE_READ_APPLICATIONS.getValue())
                            .users(Set.of("api_user", "newemailwhichshouldntexistasviewer@usertest.com"))
                            .build();

                    Policy readWorkspacePolicy = Policy.builder().permission(READ_WORKSPACES.getValue())
                            .users(Set.of("api_user", "newemailwhichshouldntexistasviewer@usertest.com"))
                            .build();

                    assertThat(workspace1.getPolicies()).isNotEmpty();
                    assertThat(workspace1.getPolicies()).containsAll(Set.of(readWorkspaceAppsPolicy, readWorkspacePolicy));

                    assertThat(user).isNotNull();
                    assertThat(user.getIsEnabled()).isFalse();
                    Set<String> workspaceIds = user.getWorkspaceIds();
                    assertThat(workspaceIds).contains(workspace1.getId());

                })
                .verifyComplete();
    }

    /**
     * This test checks for application and datasource permissions if a user is invited to the workspace as an Admin.
     * The existing applications in the workspace should now have the new user be included in both
     * manage:applications and read:applications policies.
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void addUserToWorkspaceAsAdminAndCheckApplicationAndDatasourcePermissions() {
        Workspace workspace = new Workspace();
        workspace.setName("Member Management Admin Test Workspace");
        workspace.setDomain("example.com");
        workspace.setWebsite("https://example.com");

        Mono<Workspace> workspaceMono = workspaceService
                .create(workspace)
                .cache();

        // Create an application for this workspace
        Mono<Application> applicationMono = workspaceMono
                .flatMap(workspace1 -> {
                    Application application = new Application();
                    application.setName("User Management Admin Test Application");
                    return applicationPageService.createApplication(application, workspace1.getId());
                });

        // Create datasource for this workspace
        Mono<Datasource> datasourceMono = workspaceMono
                .flatMap(workspace1 -> {
                    Datasource datasource = new Datasource();
                    datasource.setName("test datasource");
                    datasource.setWorkspaceId(workspace1.getId());
                    return datasourceService.create(datasource);
                });

        Mono<Workspace> userAddedToWorkspaceMono = workspaceMono
                .flatMap(workspace1 -> {
                    // Add user to workspace
                    UserRole userRole = new UserRole();
                    userRole.setRoleName(AppsmithRole.ORGANIZATION_ADMIN.getName());
                    userRole.setUsername("usertest@usertest.com");
                    return userWorkspaceService.addUserRoleToWorkspace(workspace1.getId(), userRole);
                })
                .map(workspace1 -> {
                    log.debug("Workspace policies after adding user is : {}", workspace1.getPolicies());
                    return workspace1;
                });

        Mono<Application> readApplicationByNameMono = applicationService.findByName("User Management Admin Test Application",
                AclPermission.READ_APPLICATIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "application by name")));

        Mono<Workspace> readWorkspaceByNameMono = workspaceRepository.findByName("Member Management Admin Test Workspace")
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "workspace by name")));

        Mono<Datasource> readDatasourceByNameMono = workspaceMono.flatMap(workspace1 ->
                datasourceRepository.findByNameAndWorkspaceId("test datasource", workspace1.getId(),READ_DATASOURCES)
                        .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "Datasource")))
        );

        Mono<Tuple3<Application, Workspace, Datasource>> testMono = workspaceMono
                // create application and datasource
                .then(Mono.zip(applicationMono, datasourceMono))
                // Now add the user
                .then(userAddedToWorkspaceMono)
                // Read application, workspace and datasource now to confirm the policies.
                .then(Mono.zip(readApplicationByNameMono, readWorkspaceByNameMono, readDatasourceByNameMono));

        StepVerifier
                .create(testMono)
                .assertNext(tuple -> {
                    Application application = tuple.getT1();
                    Workspace workspace1 = tuple.getT2();
                    Datasource datasource = tuple.getT3();
                    assertThat(workspace1).isNotNull();
                    assertThat(workspace1.getUserRoles().get(1).getUsername()).isEqualTo("usertest@usertest.com");

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
     * This test checks for application permissions if a user is invited to the workspace as a Viewer.
     * The existing applications in the workspace should now have the new user be included in both
     * manage:applications and read:applications policies.
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void addUserToWorkspaceAsViewerAndCheckApplicationPermissions() {
        Workspace workspace = new Workspace();
        workspace.setName("Member Management Viewer Test Workspace");
        workspace.setDomain("example.com");
        workspace.setWebsite("https://example.com");

        Mono<Workspace> workspaceMono = workspaceService
                .create(workspace)
                .cache();

        // Create an application for this workspace
        Mono<Application> applicationMono = workspaceMono
                .flatMap(workspace1 -> {
                    Application application = new Application();
                    application.setName("User Management Viewer Test Application");
                    return applicationPageService.createApplication(application, workspace1.getId());
                });

        Mono<Workspace> userAddedToWorkspaceMono = workspaceMono
                .flatMap(workspace1 -> {
                    // Add user to workspace
                    UserRole userRole = new UserRole();
                    userRole.setRoleName(AppsmithRole.ORGANIZATION_VIEWER.getName());
                    userRole.setUsername("usertest@usertest.com");
                    return userWorkspaceService.addUserRoleToWorkspace(workspace1.getId(), userRole);
                });

        Mono<Application> readApplicationByNameMono = applicationService.findByName("User Management Viewer Test Application",
                AclPermission.READ_APPLICATIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "application by name")));

        Mono<Workspace> readWorkspaceByNameMono = workspaceRepository.findByName("Member Management Viewer Test Workspace")
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "workspace by name")));

        Mono<Tuple2<Application, Workspace>> testMono = workspaceMono
                .then(applicationMono)
                .then(userAddedToWorkspaceMono)
                .then(Mono.zip(readApplicationByNameMono, readWorkspaceByNameMono));

        StepVerifier
                .create(testMono)
                .assertNext(tuple -> {
                    Application application = tuple.getT1();
                    Workspace workspace1 = tuple.getT2();
                    assertThat(workspace1).isNotNull();
                    assertThat(workspace1.getUserRoles().get(1).getUsername()).isEqualTo("usertest@usertest.com");

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
     * This test checks for application permissions after changing the role of a user in an workspace
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void changeUserRoleAndCheckApplicationPermissionChanges() {
        Workspace workspace = new Workspace();
        workspace.setName("Member Management Test Workspace");
        workspace.setDomain("example.com");
        workspace.setWebsite("https://example.com");

        Mono<Workspace> workspaceMono = workspaceService
                .create(workspace)
                .cache();

        // Create an application for this workspace
        Mono<Application> createApplicationMono = workspaceMono
                .flatMap(workspace1 -> {
                    Application application = new Application();
                    application.setName("User Management Test Application");
                    return applicationPageService.createApplication(application, workspace1.getId());
                });

        Mono<Workspace> userAddedToWorkspaceMono = workspaceMono
                .flatMap(workspace1 -> {
                    // Add user to workspace
                    UserRole userRole = new UserRole();
                    userRole.setRoleName(AppsmithRole.ORGANIZATION_ADMIN.getName());
                    userRole.setUsername("usertest@usertest.com");
                    return userWorkspaceService.addUserRoleToWorkspace(workspace1.getId(), userRole);
                });

        Mono<Application> readApplicationByNameMono = applicationService.findByName("User Management Test Application",
                AclPermission.READ_APPLICATIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "application by name")));

        Mono<UserRole> userRoleChangeMono = workspaceMono
                .flatMap(workspace1 -> {
                    UserRole userRole = new UserRole();
                    userRole.setUsername("usertest@usertest.com");
                    userRole.setRoleName("App Viewer");
                    return userWorkspaceService.updateRoleForMember(workspace1.getId(), userRole, "http://localhost:8080");
                });

        Mono<Application> applicationAfterRoleChange = workspaceMono
                .then(createApplicationMono)
                .then(userAddedToWorkspaceMono)
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
    public void deleteUserRoleFromWorkspaceTest() {
        Workspace workspace = new Workspace();
        workspace.setName("Member Management Delete Test Workspace");
        workspace.setDomain("example.com");
        workspace.setWebsite("https://example.com");

        Mono<Workspace> workspaceMono = workspaceService
                .create(workspace)
                .cache();

        // Create an application for this workspace
        Mono<Application> createApplicationMono = workspaceMono
                .flatMap(workspace1 -> {
                    Application application = new Application();
                    application.setName("User Management Delete Test Application");
                    return applicationPageService.createApplication(application, workspace1.getId());
                });

        Mono<Workspace> userAddedToWorkspaceMono = workspaceMono
                .flatMap(workspace1 -> {
                    // Add user to workspace
                    UserRole userRole = new UserRole();
                    userRole.setRoleName(AppsmithRole.ORGANIZATION_ADMIN.getName());
                    userRole.setUsername("usertest@usertest.com");
                    return userWorkspaceService.addUserRoleToWorkspace(workspace1.getId(), userRole);
                });

        Mono<Application> readApplicationByNameMono = applicationService.findByName("User Management Delete Test Application",
                AclPermission.READ_APPLICATIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "application by name")));

        Mono<Workspace> readWorkspaceByNameMono = workspaceRepository.findByName("Member Management Delete Test Workspace")
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "workspace by name")));

        Mono<UserRole> userRoleChangeMono = workspaceMono
                .flatMap(workspace1 -> {
                    UserRole userRole = new UserRole();
                    userRole.setUsername("usertest@usertest.com");
                    // Setting the role name to null ensures that user is deleted from the workspace
                    userRole.setRoleName(null);
                    return userWorkspaceService.updateRoleForMember(workspace1.getId(), userRole, "http://localhost:8080");
                });

        Mono<Tuple2<Application, Workspace>> tupleMono = workspaceMono
                .then(createApplicationMono)
                .then(userAddedToWorkspaceMono)
                .then(userRoleChangeMono)
                .then(Mono.zip(readApplicationByNameMono, readWorkspaceByNameMono));


        StepVerifier
                .create(tupleMono)
                .assertNext(tuple -> {
                    Application application = tuple.getT1();
                    Workspace workspace1 = tuple.getT2();
                    assertThat(workspace1.getUserRoles().size()).isEqualTo(1);

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
    public void addNewUsersBulkToWorkspaceAsViewer() {
        Workspace workspace = new Workspace();
        workspace.setName("Add Bulk Viewers to Test Workspace");
        workspace.setDomain("example.com");
        workspace.setWebsite("https://example.com");

        Mono<Workspace> workspaceMono = workspaceService
                .create(workspace)
                .cache();

        Mono<List<User>> userAddedToWorkspaceMono = workspaceMono
                .flatMap(workspace1 -> {
                    // Add user to workspace
                    InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
                    ArrayList<String> users = new ArrayList<>();
                    users.add("newEmailWhichShouldntExistAsViewer1@usertest.com");
                    users.add("newEmailWhichShouldntExistAsViewer2@usertest.com");
                    users.add("newEmailWhichShouldntExistAsViewer3@usertest.com");
                    inviteUsersDTO.setUsernames(users);
                    inviteUsersDTO.setWorkspaceId(workspace1.getId());
                    inviteUsersDTO.setRoleName(AppsmithRole.ORGANIZATION_VIEWER.getName());

                    return userService.inviteUsers(inviteUsersDTO, "http://localhost:8080");
                })
                .cache();

        Mono<Workspace> readWorkspaceMono = workspaceRepository.findByName("Add Bulk Viewers to Test Workspace");

        Mono<Workspace> workspaceAfterUpdateMono = userAddedToWorkspaceMono
                .then(readWorkspaceMono);

        StepVerifier
                .create(Mono.zip(userAddedToWorkspaceMono, workspaceAfterUpdateMono))
                .assertNext(tuple -> {
                    User user = tuple.getT1().get(0);
                    Workspace workspace1 = tuple.getT2();

                    assertThat(workspace1).isNotNull();
                    assertThat(workspace1.getName()).isEqualTo("Add Bulk Viewers to Test Workspace");
                    assertThat(workspace1.getUserRoles().stream()
                            .map(userRole -> userRole.getUsername())
                            .filter(username -> !username.equals("api_user"))
                            .collect(Collectors.toSet())
                    ).containsAll(Set.of("newemailwhichshouldntexistasviewer1@usertest.com", "newemailwhichshouldntexistasviewer2@usertest.com",
                            "newemailwhichshouldntexistasviewer3@usertest.com"));

                    Policy readWorkspaceAppsPolicy = Policy.builder().permission(WORKSPACE_READ_APPLICATIONS.getValue())
                            .users(Set.of("api_user", "newemailwhichshouldntexistasviewer1@usertest.com",
                                    "newemailwhichshouldntexistasviewer2@usertest.com",
                                    "newemailwhichshouldntexistasviewer3@usertest.com"))
                            .build();

                    Policy readWorkspacePolicy = Policy.builder().permission(READ_WORKSPACES.getValue())
                            .users(Set.of("api_user", "newemailwhichshouldntexistasviewer1@usertest.com",
                                    "newemailwhichshouldntexistasviewer2@usertest.com",
                                    "newemailwhichshouldntexistasviewer3@usertest.com"))
                            .build();

                    assertThat(workspace1.getPolicies()).isNotEmpty();
                    assertThat(workspace1.getPolicies()).containsAll(Set.of(readWorkspaceAppsPolicy, readWorkspacePolicy));

                    assertThat(user).isNotNull();
                    assertThat(user.getIsEnabled()).isFalse();
                    Set<String> workspaceIds = user.getWorkspaceIds();
                    assertThat(workspaceIds).contains(workspace1.getId());

                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void inviteRolesGivenAdministrator() {
        Set<AppsmithRole> roles = roleGraph.generateHierarchicalRoles("Administrator");
        AppsmithRole administratorRole = AppsmithRole.generateAppsmithRoleFromName("Administrator");
        AppsmithRole developerRole = AppsmithRole.generateAppsmithRoleFromName("Developer");
        AppsmithRole viewerRole = AppsmithRole.generateAppsmithRoleFromName("App Viewer");

        StepVerifier.create(Mono.just(roles))
                .assertNext(appsmithRoles -> {
                    assertThat(appsmithRoles).isNotNull();
                    assertThat(appsmithRoles).containsAll(Set.of(administratorRole, developerRole, viewerRole));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void inviteRolesGivenDeveloper() {
        Set<AppsmithRole> roles = roleGraph.generateHierarchicalRoles("Developer");
        AppsmithRole developerRole = AppsmithRole.generateAppsmithRoleFromName("Developer");
        AppsmithRole viewerRole = AppsmithRole.generateAppsmithRoleFromName("App Viewer");

        StepVerifier.create(Mono.just(roles))
                .assertNext(appsmithRoles -> {
                    assertThat(appsmithRoles).isNotNull();
                    assertThat(appsmithRoles).containsAll(Set.of(developerRole, viewerRole));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void inviteRolesGivenViewer() {
        Set<AppsmithRole> roles = roleGraph.generateHierarchicalRoles("App Viewer");
        AppsmithRole viewerRole = AppsmithRole.generateAppsmithRoleFromName("App Viewer");

        StepVerifier.create(Mono.just(roles))
                .assertNext(appsmithRoles -> {
                    assertThat(appsmithRoles).isNotNull();
                    assertThat(appsmithRoles).hasSize(1);
                    assertThat(appsmithRoles).containsAll(Set.of(viewerRole));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void uploadWorkspaceLogo_nullFilePart() throws IOException {
        Mono<Workspace> createWorkspace = workspaceService.create(workspace).cache();
        final Mono<Workspace> resultMono = createWorkspace
                .flatMap(workspace -> workspaceService.uploadLogo(workspace.getId(), null));

        StepVerifier.create(resultMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.VALIDATION_FAILURE.getMessage("Please upload a valid image.")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void uploadWorkspaceLogo_largeFilePart() throws IOException {
        FilePart filepart = Mockito.mock(FilePart.class, Mockito.RETURNS_DEEP_STUBS);
        Flux<DataBuffer> dataBufferFlux = DataBufferUtils
                .read(new ClassPathResource("test_assets/WorkspaceServiceTest/my_workspace_logo_large.png"), new DefaultDataBufferFactory(), 4096);
        assertThat(dataBufferFlux.count().block()).isGreaterThan((int) Math.ceil(Constraint.WORKSPACE_LOGO_SIZE_KB/4.0));

        Mockito.when(filepart.content()).thenReturn(dataBufferFlux);
        Mockito.when(filepart.headers().getContentType()).thenReturn(MediaType.IMAGE_PNG);

        // The pre-requisite of creating an workspace has been blocked for code readability
        // The duration sets an upper limit for this test to run
        String workspaceId = workspaceService.create(workspace).blockOptional(Duration.ofSeconds(3)).map(Workspace::getId).orElse(null);
        assertThat(workspaceId).isNotNull();

        final Mono<Workspace> resultMono = workspaceService.uploadLogo(workspaceId, filepart);

        StepVerifier.create(resultMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.PAYLOAD_TOO_LARGE.getMessage(Constraint.WORKSPACE_LOGO_SIZE_KB)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testDeleteLogo_invalidWorkspace() {
        Mono<Workspace> deleteLogo = workspaceService.deleteLogo("");
        StepVerifier.create(deleteLogo)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.NO_RESOURCE_FOUND.getMessage(FieldName.WORKSPACE, "")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testUpdateAndDeleteLogo_validLogo() throws IOException {
        FilePart filepart = Mockito.mock(FilePart.class, Mockito.RETURNS_DEEP_STUBS);
        Flux<DataBuffer> dataBufferFlux = DataBufferUtils
                .read(new ClassPathResource("test_assets/WorkspaceServiceTest/my_workspace_logo.png"), new DefaultDataBufferFactory(), 4096).cache();
        assertThat(dataBufferFlux.count().block()).isLessThanOrEqualTo((int) Math.ceil(Constraint.WORKSPACE_LOGO_SIZE_KB/4.0));

        Mockito.when(filepart.content()).thenReturn(dataBufferFlux);
        Mockito.when(filepart.headers().getContentType()).thenReturn(MediaType.IMAGE_PNG);

        Mono<Workspace> createWorkspace = workspaceService.create(workspace).cache();

        final Mono<Tuple2<Workspace, Asset>> resultMono = createWorkspace
                .flatMap(workspace -> workspaceService.uploadLogo(workspace.getId(), filepart)
                        .flatMap(workspaceWithLogo -> Mono.zip(
                                Mono.just(workspaceWithLogo),
                                assetRepository.findById(workspaceWithLogo.getLogoAssetId()))
                        ));

        StepVerifier.create(resultMono)
                .assertNext(tuple -> {
                    final Workspace workspaceWithLogo = tuple.getT1();
                    assertThat(workspaceWithLogo.getLogoUrl()).isNotNull();
                    assertThat(workspaceWithLogo.getLogoUrl()).contains(workspaceWithLogo.getLogoAssetId());

                    final Asset asset = tuple.getT2();
                    assertThat(asset).isNotNull();
                })
                .verifyComplete();

        Mono<Workspace> deleteLogo = createWorkspace.flatMap(workspace -> workspaceService.deleteLogo(workspace.getId()));
        StepVerifier.create(deleteLogo)
                .assertNext(x -> {
                    assertThat(x.getLogoAssetId()).isNull();
                    log.debug("Deleted logo for workspace: {}", x.getId());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void delete_WhenWorkspaceHasApp_ThrowsException() {
        Workspace workspace = new Workspace();
        workspace.setName("Test org to test delete org");

        Mono<Workspace> deleteWorkspaceMono = workspaceService.create(workspace)
                .flatMap(savedWorkspace -> {
                    Application application = new Application();
                    application.setWorkspaceId(savedWorkspace.getId());
                    application.setName("Test app to test delete org");
                    return applicationPageService.createApplication(application);
                }).flatMap(application ->
                        workspaceService.archiveById(application.getWorkspaceId())
                );

        StepVerifier
                .create(deleteWorkspaceMono)
                .expectErrorMessage(AppsmithError.UNSUPPORTED_OPERATION.getMessage())
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void delete_WithoutManagePermission_ThrowsException() {
        Workspace workspace = new Workspace();
        workspace.setName("Test org to test delete org");
        Policy readWorkspacePolicy = Policy.builder()
                .permission(READ_WORKSPACES.getValue())
                .users(Set.of("api_user", "test_user@example.com"))
                .build();
        Policy manageWorkspacePolicy = Policy.builder()
                .permission(MANAGE_WORKSPACES.getValue())
                .users(Set.of("test_user@example.com"))
                .build();

        // api user has read org permission but no manage org permission
        workspace.setPolicies(Set.of(readWorkspacePolicy, manageWorkspacePolicy));

        Mono<Workspace> deleteWorkspaceMono = workspaceRepository.save(workspace)
                .flatMap(savedWorkspace ->
                        workspaceService.archiveById(savedWorkspace.getId())
                );

        StepVerifier
                .create(deleteWorkspaceMono)
                .expectError(AppsmithException.class)
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void delete_WhenWorkspaceHasNoApp_WorkspaceIsDeleted() {
        Workspace workspace = new Workspace();
        workspace.setName("Test org to test delete org");

        Mono<Workspace> deleteWorkspaceMono = workspaceService.create(workspace)
                .flatMap(savedWorkspace ->
                    workspaceService.archiveById(savedWorkspace.getId())
                            .then(workspaceRepository.findById(savedWorkspace.getId()))
                );

        // using verifyComplete() only. If the Mono emits any data, it will fail the stepverifier
        // as it doesn't expect an onNext signal at this point.
        StepVerifier
                .create(deleteWorkspaceMono)
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void save_WhenNameIsPresent_SlugGenerated() {
        String uniqueString = UUID.randomUUID().toString();  // to make sure name is not conflicted with other tests
        Workspace workspace = new Workspace();
        workspace.setName("My Workspace " + uniqueString);

        String finalName = "Renamed Workspace " + uniqueString;

        Mono<Workspace> workspaceMono = workspaceService.create(workspace)
                .flatMap(savedWorkspace -> {
                    savedWorkspace.setName(finalName);
                    return workspaceService.save(savedWorkspace);
                });

        StepVerifier.create(workspaceMono)
                .assertNext(savedWorkspace -> {
                    assertThat(savedWorkspace.getSlug()).isEqualTo(TextUtils.makeSlug(finalName));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void update_WhenNameIsNotPresent_SlugIsNotGenerated() {
        String uniqueString = UUID.randomUUID().toString();  // to make sure name is not conflicted with other tests
        String initialName = "My Workspace " + uniqueString;
        Workspace workspace = new Workspace();
        workspace.setName(initialName);

        Mono<Workspace> workspaceMono = workspaceService.create(workspace)
                .flatMap(savedWorkspace -> {
                    Workspace workspaceDto = new Workspace();
                    workspaceDto.setWebsite("https://appsmith.com");
                    return workspaceService.update(savedWorkspace.getId(), workspaceDto);
                });

        StepVerifier.create(workspaceMono)
                .assertNext(savedWorkspace -> {
                    // slug should be unchanged
                    assertThat(savedWorkspace.getSlug()).isEqualTo(TextUtils.makeSlug(initialName));
                })
                .verifyComplete();
    }
}
