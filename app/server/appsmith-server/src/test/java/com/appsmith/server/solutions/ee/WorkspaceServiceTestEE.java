package com.appsmith.server.solutions.ee;

import com.appsmith.external.models.Environment;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.RoleGraph;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.helpers.TextUtils;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.repositories.AssetRepository;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.EnvironmentService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.UserWorkspaceService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.EnvironmentPermission;
import com.appsmith.server.solutions.UserAndAccessManagementService;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.ASSIGN_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.EXECUTE_ENVIRONMENTS;
import static com.appsmith.server.acl.AclPermission.MANAGE_WORKSPACES;
import static com.appsmith.server.acl.AclPermission.READ_PERMISSION_GROUP_MEMBERS;
import static com.appsmith.server.acl.AclPermission.UNASSIGN_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_MANAGE_APPLICATIONS;
import static com.appsmith.server.constants.FieldName.ADMINISTRATOR;
import static com.appsmith.server.constants.FieldName.DEVELOPER;
import static com.appsmith.server.constants.FieldName.VIEWER;
import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@DirtiesContext
@Slf4j
public class WorkspaceServiceTestEE {

    private static final String origin = "http://appsmith-local.test";

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
    MongoTemplate mongoTemplate;

    Workspace workspace;

    @Autowired
    private AssetRepository assetRepository;

    @Autowired
    private PermissionGroupRepository permissionGroupRepository;

    @Autowired
    private UserAndAccessManagementService userAndAccessManagementService;

    @Autowired
    private PluginService pluginService;

    @MockBean
    private PluginExecutorHelper pluginExecutorHelper;

    @Autowired
    EnvironmentService environmentService;

    @Autowired
    EnvironmentPermission environmentPermission;

    @Autowired
    UserUtils userUtils;

    private PermissionGroup instanceAdminRole;

    @BeforeEach
    public void setup() {
        Workspace workspace1 = new Workspace();
        workspace1.setName("WorkspaceServiceTestEE");
        workspace1.setDomain("example.com");
        workspace1.setWebsite("https://example.com");
        workspace = workspaceService.create(workspace1).block();
        instanceAdminRole = userUtils.getSuperAdminPermissionGroup().block();
    }

    @AfterEach
    public void cleanup() {
        Workspace deleteWorkspace =
                workspaceService.archiveById(workspace.getId()).block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    void verifyEnvironmentIdByWorkspaceIdMethodProvidesEnvironmentId() {
        List<String> environmentIdList = environmentService
                .findByWorkspaceId(workspace.getId())
                .map(Environment::getId)
                .collectList()
                .block();

        assertThat(environmentIdList.size()).isEqualTo(2);
        String environmentIdOne = environmentIdList.get(0);

        Mono<String> verifiedEnvironmentIdMono = workspaceService.verifyEnvironmentIdByWorkspaceId(
                workspace.getId(), environmentIdOne, AclPermission.EXECUTE_ENVIRONMENTS);

        StepVerifier.create(verifiedEnvironmentIdMono).assertNext(environmentId -> {
            assertThat(environmentId).isEqualTo(environmentIdOne);
        });

        String environmentIdTwo = environmentIdList.get(1);
        Mono<String> verifiedEnvironmentIdTwoMono = workspaceService.verifyEnvironmentIdByWorkspaceId(
                workspace.getId(), environmentIdTwo, AclPermission.EXECUTE_ENVIRONMENTS);

        StepVerifier.create(verifiedEnvironmentIdTwoMono).assertNext(environmentId -> {
            assertThat(environmentId).isEqualTo(environmentIdTwo);
        });
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void validCreateWorkspaceTest() {
        Mono<List<PermissionGroup>> defaultPermissionGroupsMono = permissionGroupRepository
                .findAllById(workspace.getDefaultPermissionGroups())
                .collectList();

        Mono<User> userMono = userRepository.findByEmail("api_user");

        Mono<List<Environment>> environmentListMono =
                environmentService.findByWorkspaceId(workspace.getId()).collectList();

        StepVerifier.create(Mono.zip(userMono, defaultPermissionGroupsMono, environmentListMono))
                .assertNext(tuple -> {
                    User user = tuple.getT1();
                    List<PermissionGroup> permissionGroups = tuple.getT2();
                    List<Environment> environmentList = tuple.getT3();
                    assertThat(workspace.getName()).isEqualTo("WorkspaceServiceTestEE");

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
                    assertThat(workspace.getPolicies()).isNotEmpty();
                    assertThat(workspace.getPolicies())
                            .containsAll(Set.of(
                                    manageWorkspaceAppPolicy,
                                    manageWorkspacePolicy,
                                    workspaceCreateApplicationPolicy,
                                    workspaceCreateDataSourcePolicy,
                                    deleteWorkspacePolicy,
                                    workspaceDeleteApplicationaPolicy,
                                    workspaceDeleteDatasourcesPolicy));
                    assertThat(workspace.getSlug()).isEqualTo(TextUtils.makeSlug(workspace.getName()));
                    assertThat(workspace.getEmail()).isEqualTo("api_user");
                    assertThat(workspace.getIsAutoGeneratedWorkspace()).isNull();
                    assertThat(workspace.getTenantId()).isEqualTo(user.getTenantId());
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
                                    .containsExactlyInAnyOrder(
                                            adminPermissionGroup.getId(), instanceAdminRole.getId()));
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
                                    .containsExactlyInAnyOrder(
                                            adminPermissionGroup.getId(), instanceAdminRole.getId()));

                    assertThat(environmentList).hasSize(2);
                    environmentList.forEach(environment -> {
                        Optional<Policy> policyOptional = environment.getPolicies().stream()
                                .filter(policy ->
                                        EXECUTE_ENVIRONMENTS.getValue().equals(policy.getPermission()))
                                .findFirst();

                        assertThat(policyOptional).isNotEmpty();
                        Policy policy = policyOptional.get();

                        assertThat(policy.getPermissionGroups()).contains(adminPermissionGroup.getId());
                        assertThat(policy.getPermissionGroups()).contains(developerPermissionGroup.getId());
                        if (Boolean.TRUE.equals(environment.getIsDefault())) {
                            assertThat(policy.getPermissionGroups()).contains(viewerPermissionGroup.getId());
                        } else {
                            assertThat(policy.getPermissionGroups()).doesNotContain(viewerPermissionGroup.getId());
                        }
                    });
                })
                .verifyComplete();
    }
}
