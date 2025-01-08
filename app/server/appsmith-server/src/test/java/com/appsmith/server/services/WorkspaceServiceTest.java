package com.appsmith.server.services;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorageDTO;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.configurations.WithMockAppsmithUser;
import com.appsmith.server.constants.Constraint;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Asset;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.InviteUsersDTO;
import com.appsmith.server.dtos.MemberInfoDTO;
import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.extensions.AfterAllCleanUpExtension;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.helpers.TextUtils;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.repositories.cakes.AssetRepositoryCake;
import com.appsmith.server.repositories.cakes.DatasourceRepositoryCake;
import com.appsmith.server.repositories.cakes.PermissionGroupRepositoryCake;
import com.appsmith.server.repositories.cakes.UserRepositoryCake;
import com.appsmith.server.repositories.cakes.WorkspaceRepositoryCake;
import com.appsmith.server.solutions.EnvironmentPermission;
import com.appsmith.server.solutions.UserAndAccessManagementService;
import com.appsmith.server.transaction.CustomTransactionalOperator;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.RandomStringUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.function.Tuple2;
import reactor.util.function.Tuple5;
import reactor.util.function.Tuple6;

import java.io.IOException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.ASSIGN_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.EXECUTE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.MANAGE_WORKSPACES;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.READ_PERMISSION_GROUP_MEMBERS;
import static com.appsmith.server.acl.AclPermission.READ_WORKSPACES;
import static com.appsmith.server.acl.AclPermission.UNASSIGN_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_MANAGE_APPLICATIONS;
import static com.appsmith.server.constants.FieldName.ADMINISTRATOR;
import static com.appsmith.server.constants.FieldName.DEVELOPER;
import static com.appsmith.server.constants.FieldName.VIEWER;
import static com.appsmith.server.helpers.TextUtils.generateDefaultRoleNameForResource;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;

@ExtendWith({AfterAllCleanUpExtension.class})
@SpringBootTest
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_CLASS)
@Slf4j
public class WorkspaceServiceTest {

    private static final String origin = "http://appsmith-local.test";

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    UserWorkspaceService userWorkspaceService;

    @Autowired
    WorkspaceRepositoryCake workspaceRepository;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    UserService userService;

    @Autowired
    DatasourceService datasourceService;

    @Autowired
    DatasourceRepositoryCake datasourceRepository;

    @Autowired
    UserRepositoryCake userRepository;

    Workspace workspace;

    @Autowired
    private AssetRepositoryCake assetRepository;

    @Autowired
    private PermissionGroupRepositoryCake permissionGroupRepository;

    @Autowired
    private UserAndAccessManagementService userAndAccessManagementService;

    @Autowired
    private PluginService pluginService;

    @MockBean
    private PluginExecutorHelper pluginExecutorHelper;

    @Autowired
    EnvironmentPermission environmentPermission;

    @Autowired
    private CustomTransactionalOperator transactionalOperator;

    @BeforeEach
    @WithUserDetails(value = "api_user")
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

        Workspace workspace = userMono.flatMap(user -> workspaceService.createDefault(new Workspace(), user))
                .switchIfEmpty(Mono.error(new Exception("createDefault is returning empty!!")))
                .block();

        Mono<Set<PermissionGroup>> defaultPermissionGroupMono = Mono.just(workspace)
                .flatMap(workspace1 -> {
                    Set<String> defaultPermissionGroups = workspace1.getDefaultPermissionGroups();
                    return permissionGroupRepository
                            .findAllById(defaultPermissionGroups)
                            .collect(Collectors.toSet());
                });

        Mono<Set<PermissionGroup>> userPermissionGroupsSetMono = userMono.flatMapMany(
                        user -> permissionGroupRepository.findByAssignedToUserIdsIn(user.getId()))
                .collect(Collectors.toSet());

        StepVerifier.create(Mono.zip(
                        Mono.just(workspace), userMono, defaultPermissionGroupMono, userPermissionGroupsSetMono))
                .assertNext(tuple -> {
                    Workspace workspace1 = tuple.getT1();
                    User user = tuple.getT2();
                    Set<PermissionGroup> permissionGroups = tuple.getT3();
                    Set<PermissionGroup> userPermissionGroups = tuple.getT4();
                    assertThat(workspace1.getName()).isEqualTo("api_user's apps");
                    assertThat(workspace1.getSlug()).isNotNull();
                    assertThat(workspace1.getEmail()).isEqualTo("api_user");
                    assertThat(workspace1.getIsAutoGeneratedWorkspace()).isTrue();
                    assertThat(workspace1.getTenantId()).isEqualTo(user.getTenantId());
                    assertThat(workspace1.getDefaultPermissionGroups()).hasSize(3);

                    PermissionGroup adminPermissionGroup = permissionGroups.stream()
                            .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                            .findFirst()
                            .get();

                    Set<String> userPermissionGroupIds = userPermissionGroups.stream()
                            .map(PermissionGroup::getId)
                            .collect(Collectors.toSet());

                    assertThat(userPermissionGroupIds).contains(adminPermissionGroup.getId());
                })
                .verifyComplete();
    }

    @Test
    @WithMockAppsmithUser
    public void checkNewUsersDefaultWorkspace() {
        User newUser = new User();
        newUser.setEmail("new-user-with-default-org@email.com");
        newUser.setPassword("new-user-with-default-org-password");

        User user = userService.create(newUser).block();

        String workspaceName = user.computeFirstName() + "'s apps";
        Workspace defaultWorkspace =
                workspaceRepository.findByName(workspaceName).block();

        PermissionGroup permissionGroup = permissionGroupRepository
                .findByDefaultDomainIdAndDefaultDomainType(defaultWorkspace.getId(), Workspace.class.getSimpleName())
                .filter(pg -> pg.getName().startsWith(ADMINISTRATOR))
                .blockFirst();

        Set<String> workspaceAssignedToUsers = permissionGroup.getAssignedToUserIds();

        assertThat(user.getId()).isNotNull();
        assertThat(user.getEmail()).isEqualTo("new-user-with-default-org@email.com");
        assertThat(user.getName()).isNullOrEmpty();
        assertThat(defaultWorkspace.getIsAutoGeneratedWorkspace()).isTrue();
        assertThat(defaultWorkspace.getName()).isEqualTo("new-user-with-default-org's apps");

        // Assert that this user has access to the default workspace
        assertThat(workspaceAssignedToUsers).contains(user.getId());
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void nullCreateWorkspace() {
        Mono<Workspace> workspaceResponse = workspaceService.create(null);
        StepVerifier.create(workspaceResponse)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.WORKSPACE)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void nullName() {
        workspace.setName(null);
        Mono<Workspace> workspaceResponse = workspaceService.create(workspace);
        StepVerifier.create(workspaceResponse)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.NAME)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void validCreateWorkspaceTest() {

        Mono<Workspace> workspaceResponse = workspaceService
                .create(workspace)
                .switchIfEmpty(Mono.error(new Exception("create is returning empty!!")))
                .cache();

        Mono<List<PermissionGroup>> defaultPermissionGroupsMono = workspaceResponse
                .flatMapMany(savedWorkspace -> {
                    Set<String> defaultPermissionGroups = savedWorkspace.getDefaultPermissionGroups();
                    return permissionGroupRepository.findAllById(defaultPermissionGroups);
                })
                .collectList();

        Mono<User> userMono = userRepository.findByEmail("api_user");

        StepVerifier.create(Mono.zip(workspaceResponse, userMono, defaultPermissionGroupsMono))
                .assertNext(tuple -> {
                    Workspace workspace1 = tuple.getT1();
                    User user = tuple.getT2();
                    List<PermissionGroup> permissionGroups = tuple.getT3();
                    assertThat(workspace1.getName()).isEqualTo("Test Name");

                    PermissionGroup adminPermissionGroup = permissionGroups.stream()
                            .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                            .findFirst()
                            .get();

                    PermissionGroup developerPermissionGroup = permissionGroups.stream()
                            .filter(permissionGroup -> permissionGroup.getName().startsWith(DEVELOPER))
                            .findFirst()
                            .get();

                    PermissionGroup viewerPermissionGroup = permissionGroups.stream()
                            .filter(permissionGroup -> permissionGroup.getName().startsWith(VIEWER))
                            .findFirst()
                            .get();

                    Policy manageWorkspaceAppPolicy = Policy.builder()
                            .permission(WORKSPACE_MANAGE_APPLICATIONS.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();

                    Policy manageWorkspacePolicy = Policy.builder()
                            .permission(MANAGE_WORKSPACES.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId()))
                            .build();

                    Policy workspaceCreateApplicationPolicy = Policy.builder()
                            .permission(AclPermission.WORKSPACE_CREATE_APPLICATION.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();

                    Policy workspaceCreateDataSourcePolicy = Policy.builder()
                            .permission(AclPermission.WORKSPACE_CREATE_DATASOURCE.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();

                    Policy deleteWorkspacePolicy = Policy.builder()
                            .permission(AclPermission.DELETE_WORKSPACES.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId()))
                            .build();

                    Policy workspaceDeleteApplicationaPolicy = Policy.builder()
                            .permission(AclPermission.WORKSPACE_DELETE_APPLICATIONS.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();

                    Policy workspaceDeleteDatasourcesPolicy = Policy.builder()
                            .permission(AclPermission.WORKSPACE_DELETE_DATASOURCES.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();

                    assertThat(workspace1.getPolicies()).isNotEmpty();
                    assertThat(workspace1.getPolicies())
                            .containsAll(Set.of(
                                    manageWorkspaceAppPolicy,
                                    manageWorkspacePolicy,
                                    workspaceCreateApplicationPolicy,
                                    workspaceCreateDataSourcePolicy,
                                    deleteWorkspacePolicy,
                                    workspaceDeleteApplicationaPolicy,
                                    workspaceDeleteDatasourcesPolicy));
                    assertThat(workspace1.getSlug()).isEqualTo(TextUtils.makeSlug(workspace.getName()));
                    assertThat(workspace1.getEmail()).isEqualTo("api_user");
                    assertThat(workspace1.getIsAutoGeneratedWorkspace()).isNull();
                    assertThat(workspace1.getTenantId()).isEqualTo(user.getTenantId());

                    // Assert admin permission group policies
                    adminPermissionGroup.getPolicies().stream()
                            .filter(policy -> policy.getPermission().equals(ASSIGN_PERMISSION_GROUPS.getValue()))
                            .findFirst()
                            .ifPresent(policy ->
                                    assertThat(policy.getPermissionGroups()).contains(adminPermissionGroup.getId()));

                    adminPermissionGroup.getPolicies().stream()
                            .filter(policy -> policy.getPermission().equals(READ_PERMISSION_GROUP_MEMBERS.getValue()))
                            .findFirst()
                            .ifPresent(policy -> assertThat(policy.getPermissionGroups())
                                    .containsAll(Set.of(
                                            adminPermissionGroup.getId(),
                                            developerPermissionGroup.getId(),
                                            viewerPermissionGroup.getId())));

                    adminPermissionGroup.getPolicies().stream()
                            .filter(policy -> policy.getPermission().equals(UNASSIGN_PERMISSION_GROUPS.getValue()))
                            .findFirst()
                            .ifPresent(policy ->
                                    assertThat(policy.getPermissionGroups()).contains(adminPermissionGroup.getId()));

                    // Assert developer permission group policies
                    developerPermissionGroup.getPolicies().stream()
                            .filter(policy -> policy.getPermission().equals(ASSIGN_PERMISSION_GROUPS.getValue()))
                            .findFirst()
                            .ifPresent(policy -> assertThat(policy.getPermissionGroups())
                                    .containsAll(
                                            Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId())));

                    developerPermissionGroup.getPolicies().stream()
                            .filter(policy -> policy.getPermission().equals(READ_PERMISSION_GROUP_MEMBERS.getValue()))
                            .findFirst()
                            .ifPresent(policy -> assertThat(policy.getPermissionGroups())
                                    .containsAll(Set.of(
                                            adminPermissionGroup.getId(),
                                            developerPermissionGroup.getId(),
                                            viewerPermissionGroup.getId())));

                    developerPermissionGroup.getPolicies().stream()
                            .filter(policy -> policy.getPermission().equals(UNASSIGN_PERMISSION_GROUPS.getValue()))
                            .findFirst()
                            .ifPresent(policy -> assertThat(policy.getPermissionGroups())
                                    .containsAll(Set.of(adminPermissionGroup.getId())));

                    // Assert viewer permission group policies
                    viewerPermissionGroup.getPolicies().stream()
                            .filter(policy -> policy.getPermission().equals(ASSIGN_PERMISSION_GROUPS.getValue()))
                            .findFirst()
                            .ifPresent(policy -> assertThat(policy.getPermissionGroups())
                                    .containsAll(Set.of(
                                            adminPermissionGroup.getId(),
                                            developerPermissionGroup.getId(),
                                            viewerPermissionGroup.getId())));
                    viewerPermissionGroup.getPolicies().stream()
                            .filter(policy -> policy.getPermission().equals(READ_PERMISSION_GROUP_MEMBERS.getValue()))
                            .findFirst()
                            .ifPresent(policy -> assertThat(policy.getPermissionGroups())
                                    .containsAll(Set.of(
                                            adminPermissionGroup.getId(),
                                            developerPermissionGroup.getId(),
                                            viewerPermissionGroup.getId())));
                    viewerPermissionGroup.getPolicies().stream()
                            .filter(policy -> policy.getPermission().equals(UNASSIGN_PERMISSION_GROUPS.getValue()))
                            .findFirst()
                            .ifPresent(policy -> assertThat(policy.getPermissionGroups())
                                    .containsAll(Set.of(adminPermissionGroup.getId())));
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
    @WithUserDetails(value = "api_user")
    public void validGetWorkspaceByName() {
        Workspace workspace = new Workspace();
        workspace.setName("Test For Get Name");
        workspace.setDomain("example.com");
        workspace.setWebsite("https://example.com");
        workspace.setSlug("test-for-get-name");
        Mono<Workspace> createWorkspace = workspaceService.create(workspace);
        Mono<Workspace> getWorkspace =
                createWorkspace.flatMap(t -> workspaceService.findById(t.getId(), READ_WORKSPACES));
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

        Workspace workspace = new Workspace();
        workspace.setName("Test Update Name");
        workspace.setDomain("example.com");
        workspace.setWebsite("https://example.com");
        workspace.setSlug("test-update-name");

        Mono<Workspace> createWorkspace = workspaceService.create(workspace).cache();
        Mono<Workspace> updateWorkspace = createWorkspace.flatMap(t -> {
            Workspace newWorkspace = new Workspace();
            newWorkspace.setDomain("abc.com");
            return workspaceService.update(t.getId(), newWorkspace);
        });

        Mono<List<PermissionGroup>> defaultPermissionGroupsMono = createWorkspace
                .flatMapMany(savedWorkspace -> {
                    Set<String> defaultPermissionGroups = savedWorkspace.getDefaultPermissionGroups();
                    return permissionGroupRepository.findAllById(defaultPermissionGroups);
                })
                .collectList();

        StepVerifier.create(Mono.zip(updateWorkspace, defaultPermissionGroupsMono))
                .assertNext(tuple -> {
                    Workspace t = tuple.getT1();
                    assertThat(t).isNotNull();
                    assertThat(t.getName()).isEqualTo(workspace.getName());
                    assertThat(t.getId()).isEqualTo(workspace.getId());
                    assertThat(t.getDomain()).isEqualTo("abc.com");

                    List<PermissionGroup> permissionGroups = tuple.getT2();
                    PermissionGroup adminPermissionGroup = permissionGroups.stream()
                            .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                            .findFirst()
                            .get();

                    PermissionGroup developerPermissionGroup = permissionGroups.stream()
                            .filter(permissionGroup -> permissionGroup.getName().startsWith(DEVELOPER))
                            .findFirst()
                            .get();

                    PermissionGroup viewerPermissionGroup = permissionGroups.stream()
                            .filter(permissionGroup -> permissionGroup.getName().startsWith(VIEWER))
                            .findFirst()
                            .get();

                    Policy manageWorkspaceAppPolicy = Policy.builder()
                            .permission(WORKSPACE_MANAGE_APPLICATIONS.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();

                    Policy manageWorkspacePolicy = Policy.builder()
                            .permission(MANAGE_WORKSPACES.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId()))
                            .build();

                    assertThat(t.getPolicies()).contains(manageWorkspaceAppPolicy, manageWorkspacePolicy);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    void validUpdateCorrectWorkspace() {
        Workspace workspace = new Workspace();
        workspace.setName("Test Update Name 2");
        workspace.setDomain("example2.com");
        workspace.setWebsite("https://example.com");
        workspace.setSlug("test-update-name-2");

        Workspace otherWorkspace = new Workspace();
        otherWorkspace.setName("Test Update Name 3");
        otherWorkspace.setDomain("example3.com");
        otherWorkspace.setWebsite("https://example.com");
        otherWorkspace.setSlug("test-update-name-3");

        final Mono<Workspace> createWorkspace = workspaceService.create(workspace);

        final Mono<Workspace> createOtherWorkspace = workspaceService.create(otherWorkspace);

        final Mono<Tuple2<Workspace, Workspace>> updateWorkspace = Mono.zip(createWorkspace, createOtherWorkspace)
                .flatMap(t -> {
                    final Workspace changes = new Workspace();
                    changes.setId(t.getT2().getId());
                    changes.setDomain("abc.com");
                    return workspaceService
                            .update(t.getT1().getId(), changes)
                            .zipWhen(updatedWorkspace -> workspaceRepository
                                    .findById(t.getT2().getId(), READ_WORKSPACES)
                                    .switchIfEmpty(Mono.error(new AppsmithException(
                                            AppsmithError.NO_RESOURCE_FOUND,
                                            FieldName.WORKSPACE,
                                            t.getT2().getId()))));
                });

        StepVerifier.create(updateWorkspace)
                .assertNext(tuple -> {
                    final Workspace t = tuple.getT1();
                    final Workspace other = tuple.getT2();

                    assertThat(t.getName()).isEqualTo("Test Update Name 2");
                    assertThat(t.getDomain()).isEqualTo("abc.com");

                    assertThat(other.getName()).isEqualTo("Test Update Name 3");
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
        Workspace workspace = new Workspace();
        workspace.setName("Test Update Name");
        workspace.setDomain("example.com");
        workspace.setWebsite("https://example.com");
        workspace.setSlug("test-update-name");
        Mono<Workspace> createWorkspace = workspaceService.create(workspace);
        Mono<Workspace> updateWorkspace = createWorkspace.flatMap(t -> {
            Workspace newWorkspace = new Workspace();
            newWorkspace.setName("");
            return workspaceService.update(t.getId(), newWorkspace);
        });

        StepVerifier.create(updateWorkspace)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.NAME)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void validUpdateWorkspaceValidEmail() {
        String[] validEmails = {"valid@email.com", "valid@email.co.in", "valid@email-assoc.co.in"};
        for (String validEmail : validEmails) {
            Workspace workspace = new Workspace();
            workspace.setName("Test Update Name");
            workspace.setDomain("example.com");
            workspace.setWebsite("https://example.com");
            workspace.setSlug("test-update-name");
            Mono<Workspace> updateWorkspace = workspaceService.create(workspace).flatMap(t -> {
                Workspace newWorkspace = new Workspace();
                newWorkspace.setEmail(validEmail);
                return workspaceService.update(t.getId(), newWorkspace);
            });
            StepVerifier.create(updateWorkspace)
                    .assertNext(t -> {
                        assertThat(t).isNotNull();
                        assertThat(t.getEmail()).isEqualTo(validEmail);
                    })
                    .verifyComplete();
        }
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void validUpdateWorkspaceInvalidEmail() {
        String[] invalidEmails = {"invalid@.com", "@invalid.com"};
        for (String invalidEmail : invalidEmails) {
            Workspace workspace = new Workspace();
            workspace.setName("Test Update Name");
            workspace.setDomain("example.com");
            workspace.setWebsite("https://example.com");
            workspace.setSlug("test-update-name");
            Mono<Workspace> updateWorkspace = workspaceService.create(workspace).flatMap(t -> {
                Workspace newWorkspace = new Workspace();
                newWorkspace.setEmail(invalidEmail);
                return workspaceService.update(t.getId(), newWorkspace);
            });
            StepVerifier.create(updateWorkspace)
                    .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                            && throwable
                                    .getMessage()
                                    .equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.EMAIL)))
                    .verify();
        }
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void validUpdateWorkspaceValidWebsite() {
        String[] validWebsites = {
            "https://www.valid.website.com",
            "http://www.valid.website.com",
            "https://valid.website.com",
            "http://valid.website.com",
            "www.valid.website.com",
            "valid.website.com",
            "valid-website.com",
            "valid.12345.com",
            "12345.com",
            "https://www.valid.website.com/",
            "http://www.valid.website.com/",
            "https://valid.website.complete/",
            "http://valid.website.com/",
            "www.valid.website.com/",
            "valid.website.com/",
            "valid-website.com/",
            "valid.12345.com/",
            "12345.com/"
        };
        for (String validWebsite : validWebsites) {
            Workspace workspace = new Workspace();
            workspace.setName("Test Update Name");
            workspace.setDomain("example.com");
            workspace.setWebsite("https://example.com");
            workspace.setSlug("test-update-name");
            Mono<Workspace> updateWorkspace = workspaceService.create(workspace).flatMap(t -> {
                Workspace newWorkspace = new Workspace();
                newWorkspace.setWebsite(validWebsite);
                return workspaceService.update(t.getId(), newWorkspace);
            });
            StepVerifier.create(updateWorkspace)
                    .assertNext(t -> {
                        assertThat(t).isNotNull();
                        assertThat(t.getWebsite()).isEqualTo(validWebsite);
                    })
                    .verifyComplete();
        }
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void validUpdateWorkspaceInvalidWebsite() {
        String[] invalidWebsites = {
            "htp://www.invalid.website.com", "htp://invalid.website.com", "htp://www", "www", "www."
        };
        for (String invalidWebsite : invalidWebsites) {
            Workspace workspace = new Workspace();
            workspace.setName("Test Update Name");
            workspace.setDomain("example.com");
            workspace.setWebsite("https://example.com");
            workspace.setSlug("test-update-name");
            Mono<Workspace> updateWorkspace = workspaceService.create(workspace).flatMap(t -> {
                Workspace newWorkspace = new Workspace();
                newWorkspace.setWebsite(invalidWebsite);
                return workspaceService.update(t.getId(), newWorkspace);
            });
            StepVerifier.create(updateWorkspace)
                    .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                            && throwable
                                    .getMessage()
                                    .equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.WEBSITE)))
                    .verify();
        }
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

        Mono<Workspace> firstWorkspaceCreation =
                workspaceService.create(firstWorkspace).cache();
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
        Mono<List<PermissionGroupInfoDTO>> userRolesForWorkspace = workspaceService
                .create(workspace)
                .flatMap(
                        createdWorkspace -> workspaceService.getPermissionGroupsForWorkspace(createdWorkspace.getId()));

        StepVerifier.create(userRolesForWorkspace)
                .assertNext(userGroupInfos -> {
                    assertThat(userGroupInfos).isNotEmpty();
                    assertThat(userGroupInfos)
                            .anyMatch(userGroupInfo -> userGroupInfo.getName().startsWith(FieldName.ADMINISTRATOR));
                    assertThat(userGroupInfos)
                            .anyMatch(userGroupInfo -> userGroupInfo.getName().startsWith(FieldName.VIEWER));
                    assertThat(userGroupInfos)
                            .anyMatch(userGroupInfo -> userGroupInfo.getName().startsWith(FieldName.DEVELOPER));
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

        Workspace createdWorkspace = workspaceService.create(testWorkspace).block();

        List<PermissionGroup> permissionGroups = permissionGroupRepository
                .findAllById(createdWorkspace.getDefaultPermissionGroups())
                .collectList()
                .block();

        String adminPermissionGroupId = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                .findFirst()
                .get()
                .getId();

        String developerPermissionGroupId = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(DEVELOPER))
                .findFirst()
                .get()
                .getId();

        String viewerPermissionGroupId = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(VIEWER))
                .findFirst()
                .get()
                .getId();

        // Invite another admin
        InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
        ArrayList<String> invitedUsers = new ArrayList<>();
        invitedUsers.add("b@usertest.com");
        inviteUsersDTO.setUsernames(invitedUsers);
        inviteUsersDTO.setPermissionGroupId(adminPermissionGroupId);
        userAndAccessManagementService.inviteUsers(inviteUsersDTO, origin).block();

        // Invite developers
        invitedUsers = new ArrayList<>();
        invitedUsers.add("a@usertest.com");
        invitedUsers.add("d@usertest.com");
        inviteUsersDTO.setUsernames(invitedUsers);
        inviteUsersDTO.setPermissionGroupId(developerPermissionGroupId);
        userAndAccessManagementService.inviteUsers(inviteUsersDTO, origin).block();

        // Invite viewers
        invitedUsers = new ArrayList<>();
        invitedUsers.add("a1@usertest.com");
        invitedUsers.add("d1@usertest.com");
        inviteUsersDTO.setUsernames(invitedUsers);
        inviteUsersDTO.setPermissionGroupId(viewerPermissionGroupId);
        userAndAccessManagementService.inviteUsers(inviteUsersDTO, origin).block();

        Mono<List<MemberInfoDTO>> usersMono = userWorkspaceService.getWorkspaceMembers(createdWorkspace.getId());

        StepVerifier.create(usersMono)
                .assertNext(users -> {
                    assertThat(users).isNotNull();
                    assertThat(users).hasSize(6);
                    // Assert that the members are sorted by the permission group and then email
                    MemberInfoDTO userAndGroupDTO = users.get(0);
                    assertThat(userAndGroupDTO.getUsername()).isEqualTo("api_user");
                    assertEquals(userAndGroupDTO.getRoles().size(), 1);
                    assertThat(userAndGroupDTO.getRoles().get(0).getName()).startsWith(ADMINISTRATOR);
                    userAndGroupDTO = users.get(1);
                    assertEquals(userAndGroupDTO.getRoles().size(), 1);
                    assertThat(userAndGroupDTO.getUsername()).isEqualTo("b@usertest.com");
                    assertThat(userAndGroupDTO.getRoles().get(0).getName()).startsWith(ADMINISTRATOR);
                    userAndGroupDTO = users.get(2);
                    assertEquals(userAndGroupDTO.getRoles().size(), 1);
                    assertThat(userAndGroupDTO.getUsername()).isEqualTo("a@usertest.com");
                    assertThat(userAndGroupDTO.getRoles().get(0).getName()).startsWith(DEVELOPER);
                    userAndGroupDTO = users.get(3);
                    assertEquals(userAndGroupDTO.getRoles().size(), 1);
                    assertThat(userAndGroupDTO.getUsername()).isEqualTo("d@usertest.com");
                    assertThat(userAndGroupDTO.getRoles().get(0).getName()).startsWith(DEVELOPER);
                    userAndGroupDTO = users.get(4);
                    assertEquals(userAndGroupDTO.getRoles().size(), 1);
                    assertThat(userAndGroupDTO.getUsername()).isEqualTo("a1@usertest.com");
                    assertThat(userAndGroupDTO.getRoles().get(0).getName()).startsWith(VIEWER);
                    userAndGroupDTO = users.get(5);
                    assertEquals(userAndGroupDTO.getRoles().size(), 1);
                    assertThat(userAndGroupDTO.getUsername()).isEqualTo("d1@usertest.com");
                    assertThat(userAndGroupDTO.getRoles().get(0).getName()).startsWith(VIEWER);
                })
                .verifyComplete();
    }

    /**
     * This test tests for a new user being added to a workspace as an admin.
     * The new user must be created at after invite flow and the new user must be disabled.
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void addNewUserToWorkspaceAsAdmin() {
        Workspace toCreate = new Workspace();
        toCreate.setName("addNewUserToWorkspaceAsAdmin Workspace");
        toCreate.setDomain("example.com");
        toCreate.setWebsite("https://example.com");

        Workspace workspace = workspaceService.create(toCreate).block();

        List<PermissionGroup> permissionGroups = permissionGroupRepository
                .findAllById(workspace.getDefaultPermissionGroups())
                .collectList()
                .block();

        String adminPermissionGroupId = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                .findFirst()
                .get()
                .getId();

        InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
        ArrayList<String> users = new ArrayList<>();
        users.add("newEmailWhichShouldntExist@usertest.com");
        inviteUsersDTO.setUsernames(users);
        inviteUsersDTO.setPermissionGroupId(adminPermissionGroupId);

        List<User> createdUsers = userAndAccessManagementService
                .inviteUsers(inviteUsersDTO, origin)
                .block();

        List<PermissionGroup> permissionGroupsAfterInvite = permissionGroupRepository
                .findAllById(workspace.getDefaultPermissionGroups())
                .collectList()
                .block();

        // Do the assertions now
        assertThat(workspace).isNotNull();
        assertThat(workspace.getName()).isEqualTo("addNewUserToWorkspaceAsAdmin Workspace");

        PermissionGroup adminPermissionGroup = permissionGroupsAfterInvite.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                .findFirst()
                .get();

        PermissionGroup developerPermissionGroup = permissionGroupsAfterInvite.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(DEVELOPER))
                .findFirst()
                .get();

        PermissionGroup viewerPermissionGroup = permissionGroupsAfterInvite.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(VIEWER))
                .findFirst()
                .get();

        User api_user = userService.findByEmail("api_user").block();
        User newUser = createdUsers.get(0);

        // assert that both the new user and api_user have admin roles
        assertThat(adminPermissionGroup.getAssignedToUserIds()).containsAll(Set.of(newUser.getId(), api_user.getId()));

        Policy manageWorkspaceAppPolicy = Policy.builder()
                .permission(WORKSPACE_MANAGE_APPLICATIONS.getValue())
                .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                .build();

        Policy manageWorkspacePolicy = Policy.builder()
                .permission(MANAGE_WORKSPACES.getValue())
                .permissionGroups(Set.of(adminPermissionGroup.getId()))
                .build();

        Policy readWorkspacePolicy = Policy.builder()
                .permission(READ_WORKSPACES.getValue())
                .permissionGroups(Set.of(
                        adminPermissionGroup.getId(), developerPermissionGroup.getId(), viewerPermissionGroup.getId()))
                .build();

        assertThat(workspace.getPolicies()).isNotEmpty();
        assertThat(workspace.getPolicies())
                .containsAll(Set.of(manageWorkspaceAppPolicy, manageWorkspacePolicy, readWorkspacePolicy));

        assertThat(newUser).isNotNull();
        assertThat(newUser.getIsEnabled()).isFalse();
    }

    /**
     * This test tests for a new user being added to an workspace as viewer.
     * The new user must be created at after invite flow and the new user must be disabled.
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void addNewUserToWorkspaceAsViewer() {
        Workspace toCreate = new Workspace();
        toCreate.setName("Add Viewer to Test Workspace");
        toCreate.setDomain("example.com");
        toCreate.setWebsite("https://example.com");

        Workspace workspace = workspaceService.create(toCreate).block();

        List<PermissionGroup> permissionGroups = permissionGroupRepository
                .findAllById(workspace.getDefaultPermissionGroups())
                .collectList()
                .block();

        String viewerPermissionGroupId = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(VIEWER))
                .findFirst()
                .get()
                .getId();

        InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
        ArrayList<String> users = new ArrayList<>();
        users.add("newEmailWhichShouldntExist@usertest.com");
        inviteUsersDTO.setUsernames(users);
        inviteUsersDTO.setPermissionGroupId(viewerPermissionGroupId);

        List<User> createdUsers = userAndAccessManagementService
                .inviteUsers(inviteUsersDTO, origin)
                .block();

        List<PermissionGroup> permissionGroupsAfterInvite = permissionGroupRepository
                .findAllById(workspace.getDefaultPermissionGroups())
                .collectList()
                .block();

        // Do the assertions now
        assertThat(workspace).isNotNull();
        assertThat(workspace.getName()).isEqualTo("Add Viewer to Test Workspace");

        PermissionGroup adminPermissionGroup = permissionGroupsAfterInvite.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                .findFirst()
                .get();

        PermissionGroup developerPermissionGroup = permissionGroupsAfterInvite.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(DEVELOPER))
                .findFirst()
                .get();

        PermissionGroup viewerPermissionGroup = permissionGroupsAfterInvite.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(VIEWER))
                .findFirst()
                .get();

        User api_user = userService.findByEmail("api_user").block();
        User newUser = createdUsers.get(0);

        // assert that new user has viewer role
        assertThat(viewerPermissionGroup.getAssignedToUserIds()).containsAll(Set.of(newUser.getId()));
        // assert that api_user has admin role
        assertThat(adminPermissionGroup.getAssignedToUserIds()).containsAll(Set.of(api_user.getId()));

        Policy manageWorkspaceAppPolicy = Policy.builder()
                .permission(WORKSPACE_MANAGE_APPLICATIONS.getValue())
                .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                .build();

        Policy manageWorkspacePolicy = Policy.builder()
                .permission(MANAGE_WORKSPACES.getValue())
                .permissionGroups(Set.of(adminPermissionGroup.getId()))
                .build();

        Policy readWorkspacePolicy = Policy.builder()
                .permission(READ_WORKSPACES.getValue())
                .permissionGroups(Set.of(
                        adminPermissionGroup.getId(), developerPermissionGroup.getId(), viewerPermissionGroup.getId()))
                .build();

        assertThat(workspace.getPolicies()).isNotEmpty();
        assertThat(workspace.getPolicies())
                .containsAll(Set.of(manageWorkspaceAppPolicy, manageWorkspacePolicy, readWorkspacePolicy));

        assertThat(newUser).isNotNull();
        assertThat(newUser.getIsEnabled()).isFalse();
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

        Workspace workspace1 = workspaceService.create(workspace).block();

        Flux<PermissionGroup> permissionGroupFlux =
                permissionGroupRepository.findAllById(workspace1.getDefaultPermissionGroups());
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));
        Mono<PermissionGroup> adminPermissionGroupMono = permissionGroupFlux
                .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                .single();

        // Create an application for this workspace

        Application application = new Application();
        application.setName("User Management Admin Test Application");
        Mono<Application> applicationMono = applicationPageService
                .createApplication(application, workspace1.getId())
                .cache();
        final String applicationId = applicationMono.block().getId();
        assertThat(applicationId).isNotNull();

        // Create datasource for this workspace
        Mono<Datasource> datasourceMono = workspaceService
                .getDefaultEnvironmentId(workspace1.getId(), environmentPermission.getExecutePermission())
                .zipWith(pluginService.findByPackageName("postgres-plugin"))
                .flatMap(tuple2 -> {
                    String defaultEnvironmentId = tuple2.getT1();
                    Plugin plugin = tuple2.getT2();
                    Datasource datasource = new Datasource();
                    datasource.setName("test datasource");
                    datasource.setWorkspaceId(workspace1.getId());
                    datasource.setPluginId(plugin.getId());
                    HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
                    storages.put(defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, null));
                    datasource.setDatasourceStorages(storages);
                    return datasourceService.create(datasource);
                })
                .cache();
        assertThat(datasourceMono.block()).isNotNull();

        Mono<Workspace> userAddedToWorkspaceMono = adminPermissionGroupMono
                .flatMap(adminPermissionGroup -> {
                    // Add user to workspace
                    InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
                    ArrayList<String> users = new ArrayList<>();
                    users.add("usertest@usertest.com");
                    inviteUsersDTO.setUsernames(users);
                    inviteUsersDTO.setPermissionGroupId(adminPermissionGroup.getId());

                    return userAndAccessManagementService.inviteUsers(inviteUsersDTO, origin);
                })
                .flatMap(tuple -> workspaceService.findById(workspace1.getId(), READ_WORKSPACES));

        Mono<Application> readApplicationByNameMono = applicationService
                .getById(applicationId)
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "application by name")));

        Mono<Workspace> readWorkspaceByNameMono = workspaceRepository
                .findByName("Member Management Admin Test Workspace")
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "workspace by name")));

        Mono<Datasource> readDatasourceByNameMono = datasourceRepository
                .findByNameAndWorkspaceId("test datasource", workspace1.getId(), READ_DATASOURCES)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "Datasource")));

        Mono<User> userTestMono = userService.findByEmail("usertest@usertest.com");
        Mono<User> api_userMono = userService.findByEmail("api_user");

        Mono<Tuple6<Application, Workspace, Datasource, List<PermissionGroup>, User, User>> testMono = Mono.zip(
                        applicationMono, datasourceMono)
                // Now add the user
                .then(userAddedToWorkspaceMono)
                // Read application, workspace and datasource now to confirm the policies.
                .then(Mono.zip(
                        readApplicationByNameMono,
                        readWorkspaceByNameMono,
                        readDatasourceByNameMono,
                        permissionGroupFlux.collectList(),
                        userTestMono,
                        api_userMono));

        StepVerifier.create(testMono)
                .assertNext(tuple -> {
                    Application app = tuple.getT1();
                    Workspace workspace2 = tuple.getT2();
                    Datasource datasource = tuple.getT3();
                    List<PermissionGroup> permissionGroups = tuple.getT4();
                    User userTest = tuple.getT5();
                    User api_user = tuple.getT6();

                    PermissionGroup adminPermissionGroup = permissionGroups.stream()
                            .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                            .findFirst()
                            .get();

                    PermissionGroup developerPermissionGroup = permissionGroups.stream()
                            .filter(permissionGroup -> permissionGroup.getName().startsWith(DEVELOPER))
                            .findFirst()
                            .get();

                    PermissionGroup viewerPermissionGroup = permissionGroups.stream()
                            .filter(permissionGroup -> permissionGroup.getName().startsWith(VIEWER))
                            .findFirst()
                            .get();

                    // assert that both the user test and api_user have admin roles
                    assertThat(adminPermissionGroup.getAssignedToUserIds())
                            .containsAll(Set.of(userTest.getId(), api_user.getId()));

                    assertThat(workspace2).isNotNull();

                    // Now assert that the application and datasource have correct permissions in the policies

                    Policy manageAppPolicy = Policy.builder()
                            .permission(MANAGE_APPLICATIONS.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();
                    Policy readAppPolicy = Policy.builder()
                            .permission(READ_APPLICATIONS.getValue())
                            .permissionGroups(Set.of(
                                    adminPermissionGroup.getId(),
                                    developerPermissionGroup.getId(),
                                    viewerPermissionGroup.getId()))
                            .build();

                    assertThat(app.getPolicies()).isNotEmpty();
                    assertThat(app.getPolicies()).containsAll(Set.of(manageAppPolicy, readAppPolicy));

                    // Check for datasource permissions after the user addition
                    Policy manageDatasourcePolicy = Policy.builder()
                            .permission(MANAGE_DATASOURCES.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();
                    Policy readDatasourcePolicy = Policy.builder()
                            .permission(READ_DATASOURCES.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();
                    Policy executeDatasourcePolicy = Policy.builder()
                            .permission(EXECUTE_DATASOURCES.getValue())
                            .permissionGroups(Set.of(
                                    adminPermissionGroup.getId(),
                                    developerPermissionGroup.getId(),
                                    viewerPermissionGroup.getId()))
                            .build();

                    assertThat(datasource.getPolicies()).isNotEmpty();
                    assertThat(datasource.getPolicies())
                            .containsAll(Set.of(manageDatasourcePolicy, readDatasourcePolicy, executeDatasourcePolicy));
                })
                .verifyComplete(); // */
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

        Mono<Workspace> workspaceMono = workspaceService.create(workspace).cache();

        Flux<PermissionGroup> permissionGroupFlux = workspaceMono.flatMapMany(
                workspace1 -> permissionGroupRepository.findAllById(workspace1.getDefaultPermissionGroups()));

        Mono<PermissionGroup> viewerPermissionGroupMono = permissionGroupFlux
                .filter(permissionGroup -> permissionGroup.getName().startsWith(VIEWER))
                .single();

        // Create an application for this workspace
        Mono<Application> applicationMono = workspaceMono
                .flatMap(workspace1 -> {
                    Application application = new Application();
                    application.setName("User Management Viewer Test Application");
                    return applicationPageService.createApplication(application, workspace1.getId());
                })
                .cache();
        final String applicationId = applicationMono.block().getId();

        Mono<Workspace> userAddedToWorkspaceMono = Mono.zip(workspaceMono, viewerPermissionGroupMono)
                .flatMap(tuple -> {
                    Workspace workspace1 = tuple.getT1();
                    PermissionGroup viewerPermissionGroup = tuple.getT2();
                    // Add user to workspace
                    InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
                    ArrayList<String> users = new ArrayList<>();
                    users.add("usertest@usertest.com");
                    inviteUsersDTO.setUsernames(users);
                    inviteUsersDTO.setPermissionGroupId(viewerPermissionGroup.getId());

                    return userAndAccessManagementService
                            .inviteUsers(inviteUsersDTO, origin)
                            .zipWith(workspaceMono);
                })
                .flatMap(tuple -> {
                    Workspace t2 = tuple.getT2();
                    return workspaceService.findById(t2.getId(), READ_WORKSPACES);
                });

        Mono<Application> readApplicationByNameMono = applicationService
                .getById(applicationId)
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "application by name")));

        Mono<Workspace> readWorkspaceByNameMono = workspaceRepository
                .findByName("Member Management Viewer Test Workspace")
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "workspace by name")));

        Mono<User> userTestMono = userService.findByEmail("usertest@usertest.com");
        Mono<User> api_userMono = userService.findByEmail("api_user");

        Mono<Tuple5<Application, Workspace, List<PermissionGroup>, User, User>> testMono = workspaceMono
                .then(applicationMono)
                .then(userAddedToWorkspaceMono)
                .then(Mono.zip(
                        readApplicationByNameMono,
                        readWorkspaceByNameMono,
                        permissionGroupFlux.collectList(),
                        userTestMono,
                        api_userMono));

        StepVerifier.create(testMono)
                .assertNext(tuple -> {
                    Application application = tuple.getT1();
                    Workspace workspace1 = tuple.getT2();
                    List<PermissionGroup> permissionGroups = tuple.getT3();
                    User userTest = tuple.getT4();
                    User api_user = tuple.getT5();

                    assertThat(workspace1).isNotNull();

                    PermissionGroup adminPermissionGroup = permissionGroups.stream()
                            .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                            .findFirst()
                            .get();

                    PermissionGroup developerPermissionGroup = permissionGroups.stream()
                            .filter(permissionGroup -> permissionGroup.getName().startsWith(DEVELOPER))
                            .findFirst()
                            .get();

                    PermissionGroup viewerPermissionGroup = permissionGroups.stream()
                            .filter(permissionGroup -> permissionGroup.getName().startsWith(VIEWER))
                            .findFirst()
                            .get();

                    // assert that api_user has admin role and usertest has viewer role
                    assertThat(adminPermissionGroup.getAssignedToUserIds()).contains(api_user.getId());
                    assertThat(viewerPermissionGroup.getAssignedToUserIds()).contains(userTest.getId());

                    Policy manageAppPolicy = Policy.builder()
                            .permission(MANAGE_APPLICATIONS.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();
                    Policy readAppPolicy = Policy.builder()
                            .permission(READ_APPLICATIONS.getValue())
                            .permissionGroups(Set.of(
                                    adminPermissionGroup.getId(),
                                    developerPermissionGroup.getId(),
                                    viewerPermissionGroup.getId()))
                            .build();

                    assertThat(application.getPolicies()).isNotEmpty();
                    assertThat(application.getPolicies()).containsAll(Set.of(manageAppPolicy, readAppPolicy));
                })
                .verifyComplete();
    }

    /**
     * This test tests for a multiple new users being added to a workspace as viewers.
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void addNewUsersBulkToWorkspaceAsViewer() {
        Workspace workspace = new Workspace();
        workspace.setName("Add Bulk Viewers to Test Workspace");
        workspace.setDomain("example.com");
        workspace.setWebsite("https://example.com");

        Mono<Workspace> workspaceMono = workspaceService.create(workspace).cache();

        Mono<PermissionGroup> viewerGroupMono = workspaceMono
                .flatMapMany(
                        workspace1 -> permissionGroupRepository.findAllById(workspace1.getDefaultPermissionGroups()))
                .filter(userGroup -> userGroup.getName().startsWith(FieldName.VIEWER))
                .single();

        Mono<List<User>> userAddedToWorkspaceMono = viewerGroupMono
                .flatMap(permissionGroup -> {
                    // Add user to workspace
                    InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
                    ArrayList<String> users = new ArrayList<>();
                    users.add("newEmailWhichShouldntExistAsViewer1@usertest.com");
                    users.add("newEmailWhichShouldntExistAsViewer2@usertest.com");
                    users.add("newEmailWhichShouldntExistAsViewer3@usertest.com");
                    inviteUsersDTO.setUsernames(users);
                    inviteUsersDTO.setPermissionGroupId(permissionGroup.getId());

                    return userAndAccessManagementService.inviteUsers(inviteUsersDTO, origin);
                })
                .cache();

        Mono<Workspace> readWorkspaceMono = workspaceRepository.findByName("Add Bulk Viewers to Test Workspace");

        Mono<Workspace> workspaceAfterUpdateMono = userAddedToWorkspaceMono.then(readWorkspaceMono);

        Mono<PermissionGroup> viewerGroupMonoAfterInvite = userAddedToWorkspaceMono
                .then(workspaceMono)
                .flatMapMany(
                        workspace1 -> permissionGroupRepository.findAllById(workspace1.getDefaultPermissionGroups()))
                .filter(userGroup -> userGroup.getName().startsWith(FieldName.VIEWER))
                .single();

        StepVerifier.create(Mono.zip(userAddedToWorkspaceMono, workspaceAfterUpdateMono, viewerGroupMonoAfterInvite))
                .assertNext(tuple -> {
                    List<User> users = tuple.getT1();
                    Workspace workspace1 = tuple.getT2();
                    PermissionGroup viewerPermissionGroup = tuple.getT3();

                    assertThat(workspace1).isNotNull();
                    assertThat(workspace1.getName()).isEqualTo("Add Bulk Viewers to Test Workspace");

                    // assert that the created users are assigned the viewer role
                    assertThat(viewerPermissionGroup.getAssignedToUserIds())
                            .containsAll(users.stream().map(User::getId).collect(Collectors.toList()));

                    for (User user : users) {
                        assertThat(user.getId()).isNotNull();
                        assertThat(user.getIsEnabled()).isFalse();
                    }
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void addUserToWorkspaceIfUserAlreadyMember_throwsError() {
        Workspace workspace = new Workspace();
        workspace.setName("addUserToWorkspaceIfUserAlreadyMember_throwsError");
        workspace.setDomain("example.com");
        workspace.setWebsite("https://example.com");

        Mono<Workspace> workspaceMono = workspaceService.create(workspace).cache();

        Flux<PermissionGroup> permissionGroupFlux = workspaceMono.flatMapMany(
                workspace1 -> permissionGroupRepository.findAllById(workspace1.getDefaultPermissionGroups()));

        Mono<PermissionGroup> adminPermissionGroupMono = permissionGroupFlux
                .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                .single();

        Mono<PermissionGroup> developerPermissionGroupMono = permissionGroupFlux
                .filter(permissionGroup -> permissionGroup.getName().startsWith(DEVELOPER))
                .single();

        InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
        ArrayList<String> users = new ArrayList<>();
        users.add("usertest@usertest.com");
        inviteUsersDTO.setUsernames(users);

        Mono<List<User>> userAddedToWorkspaceTwiceMono = adminPermissionGroupMono
                .flatMap(adminPermissionGroup -> {

                    // Add user to workspace first as admin
                    inviteUsersDTO.setPermissionGroupId(adminPermissionGroup.getId());

                    return userAndAccessManagementService.inviteUsers(inviteUsersDTO, origin);
                })
                .then(developerPermissionGroupMono)
                .flatMap(developerPermissionGroup -> {

                    // Now try to add the user to the workspace as developer
                    inviteUsersDTO.setPermissionGroupId(developerPermissionGroup.getId());

                    return userAndAccessManagementService.inviteUsers(inviteUsersDTO, origin);
                });

        StepVerifier.create(userAddedToWorkspaceTwiceMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .equals(AppsmithError.USER_ALREADY_EXISTS_IN_WORKSPACE.getMessage(
                                        "usertest@usertest.com",
                                        "Administrator - addUserToWorkspaceIfUserAlreadyMember_throwsError")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void uploadWorkspaceLogo_nullFilePart() throws IOException {
        Mono<Workspace> createWorkspace = workspaceService.create(workspace).cache();
        final Mono<Workspace> resultMono =
                createWorkspace.flatMap(workspace -> workspaceService.uploadLogo(workspace.getId(), null));

        StepVerifier.create(resultMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .equals(AppsmithError.VALIDATION_FAILURE.getMessage("Please upload a valid image.")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void uploadWorkspaceLogo_largeFilePart() throws IOException {
        FilePart filepart = Mockito.mock(FilePart.class, Mockito.RETURNS_DEEP_STUBS);
        Flux<DataBuffer> dataBufferFlux = DataBufferUtils.read(
                new ClassPathResource("test_assets/WorkspaceServiceTest/my_workspace_logo_large.png"),
                new DefaultDataBufferFactory(),
                4096);
        assertThat(dataBufferFlux.count().block())
                .isGreaterThan((int) Math.ceil(Constraint.WORKSPACE_LOGO_SIZE_KB / 4.0));

        Mockito.when(filepart.content()).thenReturn(dataBufferFlux);
        Mockito.when(filepart.headers().getContentType()).thenReturn(MediaType.IMAGE_PNG);

        // The pre-requisite of creating an workspace has been blocked for code readability
        // The duration sets an upper limit for this test to run
        String workspaceId = workspaceService
                .create(workspace)
                .blockOptional(Duration.ofSeconds(3))
                .map(Workspace::getId)
                .orElse(null);
        assertThat(workspaceId).isNotNull();

        final Mono<Workspace> resultMono = workspaceService.uploadLogo(workspaceId, filepart);

        StepVerifier.create(resultMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .equals(AppsmithError.PAYLOAD_TOO_LARGE.getMessage(Constraint.WORKSPACE_LOGO_SIZE_KB)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testDeleteLogo_invalidWorkspace() {
        Mono<Workspace> deleteLogo = workspaceService.deleteLogo("");
        StepVerifier.create(deleteLogo)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .equals(AppsmithError.NO_RESOURCE_FOUND.getMessage(FieldName.WORKSPACE, "")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testUpdateAndDeleteLogo_validLogo() throws IOException {
        FilePart filepart = Mockito.mock(FilePart.class, Mockito.RETURNS_DEEP_STUBS);
        Flux<DataBuffer> dataBufferFlux = DataBufferUtils.read(
                        new ClassPathResource("test_assets/WorkspaceServiceTest/my_workspace_logo.png"),
                        new DefaultDataBufferFactory(),
                        4096)
                .cache();
        assertThat(dataBufferFlux.count().block())
                .isLessThanOrEqualTo((int) Math.ceil(Constraint.WORKSPACE_LOGO_SIZE_KB / 4.0));

        Mockito.when(filepart.content()).thenReturn(dataBufferFlux);
        Mockito.when(filepart.headers().getContentType()).thenReturn(MediaType.IMAGE_PNG);

        Mono<Workspace> createWorkspace = workspaceService.create(workspace).cache();

        final Mono<Tuple2<Workspace, Asset>> resultMono = createWorkspace.flatMap(workspace -> workspaceService
                .uploadLogo(workspace.getId(), filepart)
                .flatMap(workspaceWithLogo -> Mono.zip(
                        Mono.just(workspaceWithLogo), assetRepository.findById(workspaceWithLogo.getLogoAssetId()))));

        StepVerifier.create(resultMono)
                .assertNext(tuple -> {
                    final Workspace workspaceWithLogo = tuple.getT1();
                    assertThat(workspaceWithLogo.getLogoUrl()).isNotNull();
                    assertThat(workspaceWithLogo.getLogoUrl()).contains(workspaceWithLogo.getLogoAssetId());

                    final Asset asset = tuple.getT2();
                    assertThat(asset).isNotNull();
                })
                .verifyComplete();

        Mono<Workspace> deleteLogo =
                createWorkspace.flatMap(workspace -> workspaceService.deleteLogo(workspace.getId()));
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

        Mono<Workspace> deleteWorkspaceMono = workspaceService
                .create(workspace)
                .flatMap(savedWorkspace -> {
                    Application application = new Application();
                    application.setWorkspaceId(savedWorkspace.getId());
                    application.setName("Test app to test delete org");
                    return applicationPageService.createApplication(application);
                })
                .flatMap(application -> workspaceService.archiveById(application.getWorkspaceId()));

        StepVerifier.create(deleteWorkspaceMono)
                .expectErrorMessage(AppsmithError.UNSUPPORTED_OPERATION.getMessage())
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void delete_WithoutManagePermission_ThrowsException() {
        Workspace workspace = new Workspace();
        workspace.setName("Test org to test delete org");
        Policy readWorkspacePolicy =
                Policy.builder().permission(READ_WORKSPACES.getValue()).build();
        Policy manageWorkspacePolicy =
                Policy.builder().permission(MANAGE_WORKSPACES.getValue()).build();

        // api user has read org permission but no manage org permission
        workspace.setPolicies(new HashSet<>(Set.of(readWorkspacePolicy, manageWorkspacePolicy)));

        Mono<Workspace> deleteWorkspaceMono = workspaceRepository
                .save(workspace)
                .flatMap(savedWorkspace -> workspaceService.archiveById(savedWorkspace.getId()));

        StepVerifier.create(deleteWorkspaceMono)
                .expectError(AppsmithException.class)
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void delete_WhenWorkspaceHasNoApp_WorkspaceIsDeleted() {
        Workspace workspace = new Workspace();
        workspace.setName("Test org to test delete org");

        Workspace savedWorkspace = workspaceService.create(workspace).block();

        Mono<Workspace> deleteWorkspaceMono = workspaceService
                .archiveById(savedWorkspace.getId())
                .then(workspaceRepository.findById(savedWorkspace.getId()));

        // using verifyComplete() only. If the Mono emits any data, it will fail the stepverifier
        // as it doesn't expect an onNext signal at this point.
        StepVerifier.create(deleteWorkspaceMono).verifyComplete();

        // verify that all the default permision groups are also deleted
        Mono<List<PermissionGroup>> defaultPermissionGroupsMono = permissionGroupRepository
                .findAllById(savedWorkspace.getDefaultPermissionGroups())
                .collectList();

        StepVerifier.create(defaultPermissionGroupsMono)
                .assertNext(permissionGroups -> {
                    assertThat(permissionGroups).isEmpty();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void save_WhenNameIsPresent_SlugGenerated() {
        String uniqueString = UUID.randomUUID().toString(); // to make sure name is not conflicted with other tests
        Workspace workspace = new Workspace();
        workspace.setName("My Workspace " + uniqueString);

        String finalName = "Renamed Workspace " + uniqueString;

        Mono<Workspace> workspaceMono = workspaceService.create(workspace).flatMap(savedWorkspace -> {
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
        String uniqueString = UUID.randomUUID().toString(); // to make sure name is not conflicted with other tests
        String initialName = "My Workspace " + uniqueString;
        Workspace workspace = new Workspace();
        workspace.setName(initialName);

        Mono<Workspace> workspaceMono = workspaceService.create(workspace).flatMap(savedWorkspace -> {
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

    @Test
    @WithUserDetails(value = "api_user")
    public void update_NewName_GroupNamesUpdated() {
        String uniqueString = UUID.randomUUID().toString(); // to make sure name is not conflicted with other tests
        String initialName = "My Workspace " + uniqueString;
        String newName = "New Name " + uniqueString;
        Workspace workspace = new Workspace();
        workspace.setName(initialName);

        Mono<Workspace> workspaceNameUpdateMono = workspaceService
                .create(workspace)
                .flatMap(savedWorkspace -> {
                    Workspace workspaceDto = new Workspace();
                    workspaceDto.setName(newName);
                    return workspaceService.update(savedWorkspace.getId(), workspaceDto);
                })
                .cache();

        Mono<List<PermissionGroup>> permissionGroupsMono =
                workspaceNameUpdateMono.flatMap(savedWorkspace -> permissionGroupRepository
                        .findAllById(savedWorkspace.getDefaultPermissionGroups())
                        .collectList());

        StepVerifier.create(Mono.zip(workspaceNameUpdateMono, permissionGroupsMono))
                .assertNext(tuple -> {
                    Workspace savedWorkspace = tuple.getT1();
                    List<PermissionGroup> permissionGroups = tuple.getT2();
                    assertThat(savedWorkspace.getSlug()).isEqualTo(TextUtils.makeSlug(newName));

                    for (PermissionGroup permissionGroup : permissionGroups) {
                        String name = permissionGroup.getName();
                        if (name.startsWith(ADMINISTRATOR)) {
                            assertThat(name).isEqualTo(generateDefaultRoleNameForResource(ADMINISTRATOR, newName));
                        } else if (name.startsWith(DEVELOPER)) {
                            assertThat(name).isEqualTo(generateDefaultRoleNameForResource(DEVELOPER, newName));
                        } else if (name.startsWith(VIEWER)) {
                            assertThat(name).isEqualTo(generateDefaultRoleNameForResource(VIEWER, newName));
                        }
                    }
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    void testInviteDuplicateUsers_shouldReturnUniqueUsers() {
        String testName = "test";
        List<String> duplicateUsernames = List.of(testName + "user@test.com", testName + "user@test.com");
        Workspace createdWorkspace = workspaceService.create(workspace).block();
        assertThat(createdWorkspace).isNotNull();
        assertThat(createdWorkspace.getDefaultPermissionGroups()).isNotEmpty();
        List<PermissionGroup> defaultWorkspaceRoles = permissionGroupRepository
                .findAllById(createdWorkspace.getDefaultPermissionGroups())
                .collectList()
                .block();
        assertThat(defaultWorkspaceRoles)
                .hasSize(createdWorkspace.getDefaultPermissionGroups().size());

        InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
        inviteUsersDTO.setUsernames(duplicateUsernames);
        inviteUsersDTO.setPermissionGroupId(defaultWorkspaceRoles.get(0).getId());

        // Invited users list contains duplicate users.
        List<User> userList = userAndAccessManagementService
                .inviteUsers(inviteUsersDTO, "test")
                .block();
        assertThat(userList).hasSize(1);
        User invitedUser = userList.get(0);
        assertThat(invitedUser.getUsername()).isEqualTo(testName + "user@test.com");
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void inviteInvalidEmailTooLongLocalPart() {
        Workspace toCreate = new Workspace();
        toCreate.setName("inviteInvalidEmail");
        toCreate.setDomain("example.com");
        toCreate.setWebsite("https://example.com");

        Workspace workspace = workspaceService.create(toCreate).block();

        // Do the assertions now
        assertThat(workspace).isNotNull();
        assertThat(workspace.getName()).isEqualTo("inviteInvalidEmail");

        List<PermissionGroup> permissionGroups = permissionGroupRepository
                .findAllById(workspace.getDefaultPermissionGroups())
                .collectList()
                .block();

        String viewerPermissionGroupId = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(VIEWER))
                .findFirst()
                .get()
                .getId();

        InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
        inviteUsersDTO.setUsernames(List.of(RandomStringUtils.randomAlphanumeric(65) + "@example.com"));
        inviteUsersDTO.setPermissionGroupId(viewerPermissionGroupId);

        Mono<List<User>> createdUsers = userAndAccessManagementService.inviteUsers(inviteUsersDTO, origin);

        StepVerifier.create(createdUsers).verifyErrorMessage("Please enter a valid parameter usernames.");
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void inviteInvalidEmailTooLongDomainPart() {
        Workspace toCreate = new Workspace();
        toCreate.setName("inviteInvalidEmail");
        toCreate.setDomain("example.com");
        toCreate.setWebsite("https://example.com");

        Workspace workspace = workspaceService.create(toCreate).block();

        // Do the assertions now
        assertThat(workspace).isNotNull();
        assertThat(workspace.getName()).isEqualTo("inviteInvalidEmail");

        List<PermissionGroup> permissionGroups = permissionGroupRepository
                .findAllById(workspace.getDefaultPermissionGroups())
                .collectList()
                .block();

        String viewerPermissionGroupId = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(VIEWER))
                .findFirst()
                .get()
                .getId();

        InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
        inviteUsersDTO.setUsernames(List.of("abcd@" + RandomStringUtils.randomAlphanumeric(255) + ".com"));
        inviteUsersDTO.setPermissionGroupId(viewerPermissionGroupId);

        Mono<List<User>> createdUsers = userAndAccessManagementService.inviteUsers(inviteUsersDTO, origin);

        StepVerifier.create(createdUsers).verifyErrorMessage("Please enter a valid parameter usernames.");
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void transactionTest() {
        Mono<String> res = Flux.range(1, 5)
                .flatMap(i -> workspaceService.getAll())
                .flatMap(workspace1 -> workspaceService.getById(workspace1.getId()))
                .flatMap(workspace1 -> {
                    workspace1.setName("New Name" + workspace1.getId());
                    return workspaceService.update(workspace1.getId(), workspace1);
                })
                .then(Mono.just("Execution Completed!"))
                .as(transactionalOperator::transactional);

        StepVerifier.create(res)
                .assertNext(r -> assertThat(r).isEqualTo("Execution Completed!"))
                .verifyComplete();
    }
}
