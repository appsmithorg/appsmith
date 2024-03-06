package com.appsmith.server.solutions.roles.ce_compatible;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorageDTO;
import com.appsmith.external.models.Environment;
import com.appsmith.external.models.Policy;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.EnvironmentService;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.roles.RoleConfigurationSolution;
import com.appsmith.server.solutions.roles.TenantResources;
import com.appsmith.server.solutions.roles.WorkspaceResources;
import com.appsmith.server.solutions.roles.constants.RoleTab;
import com.appsmith.server.solutions.roles.dtos.RoleViewDTO;
import com.appsmith.server.solutions.roles.dtos.UpdateRoleConfigDTO;
import com.appsmith.server.solutions.roles.dtos.UpdateRoleEntityDTO;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.HashMap;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static com.appsmith.server.acl.AclPermission.EXECUTE_ENVIRONMENTS;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;

@SpringBootTest
@ExtendWith(SpringExtension.class)
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
public class EnvironmentResourceCECompatibleTest {

    @Autowired
    UserRepository userRepository;

    @Autowired
    UserUtils userUtils;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    EnvironmentService environmentService;

    @Autowired
    TenantResources tenantResources;

    @Autowired
    WorkspaceResources workspaceResources;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    DatasourceService datasourceService;

    @Autowired
    RoleConfigurationSolution roleConfigurationSolution;

    @Autowired
    PluginRepository pluginRepository;

    @Autowired
    PermissionGroupService permissionGroupService;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    @SpyBean
    FeatureFlagService featureFlagService;

    User api_user = null;

    Workspace createdWorkspace;

    @BeforeEach
    public void setup() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(new MockPluginExecutor()));
        // This stub has been added for feature flag placed for multiple environments
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_gac_enabled)))
                .thenReturn(Mono.just(TRUE));
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.release_datasource_environments_enabled)))
                .thenReturn(Mono.just(FALSE));
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_audit_logs_enabled)))
                .thenReturn(Mono.just(FALSE));

        if (api_user == null) {
            api_user = userRepository.findByEmail("api_user").block();
        }

        // Make api_user instance administrator before starting the test
        userUtils.makeSuperUser(List.of(api_user)).block();

        // Create a workspace, application, page, datasource and action for this test file.
        Workspace workspace = new Workspace();
        String name = UUID.randomUUID().toString();
        workspace.setName(name);
        createdWorkspace = workspaceService.create(workspace).block();
    }

    @AfterEach
    public void cleanup() {
        Workspace deleteCreatedWorkspace =
                workspaceService.archiveById(createdWorkspace.getId()).block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void
            testSaveRoleConfigurationChangesForDatasourceResourcesTab_givenExecuteOnDatasource_assertExecuteOnEnvironments() {

        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(new MockPluginExecutor()));
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_custom_environments_enabled)))
                .thenReturn(Mono.just(FALSE));

        Environment environment =
                workspaceService.getDefaultEnvironment(createdWorkspace.getId()).blockFirst();

        Datasource datasource = new Datasource();
        datasource.setName("Default Database");
        datasource.setWorkspaceId(createdWorkspace.getId());
        Plugin installed_plugin =
                pluginRepository.findByPackageName("restapi-plugin").block();
        datasource.setPluginId(installed_plugin.getId());
        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(
                environment.getId(),
                new DatasourceStorageDTO(null, environment.getId(), new DatasourceConfiguration()));
        datasource.setDatasourceStorages(storages);
        Datasource savedDs = datasourceService.create(datasource).block();

        PermissionGroup permissionGroup = new PermissionGroup();
        permissionGroup.setName("New role for editing : givenExecuteOnDatasource_assertExecuteOnEnvironments");
        PermissionGroup createdPermissionGroup =
                permissionGroupService.create(permissionGroup).block();

        UpdateRoleConfigDTO updateRoleConfigDTO = new UpdateRoleConfigDTO();

        // Add entity changes
        // Datasource : Give execute permissions to the datasource
        UpdateRoleEntityDTO datasourceEntity = new UpdateRoleEntityDTO(
                Datasource.class.getSimpleName(), savedDs.getId(), List.of(1, 0, 0, 0, 0), savedDs.getName());
        updateRoleConfigDTO.setEntitiesChanged(Set.of(datasourceEntity));
        updateRoleConfigDTO.setTabName(RoleTab.DATASOURCES_ENVIRONMENTS.getName());

        roleConfigurationSolution
                .updateRoles(createdPermissionGroup.getId(), updateRoleConfigDTO)
                .block();

        // Fetch the environment post the role change with execute permissions
        Mono<List<Environment>> environmentsMono =
                environmentService.findByWorkspaceId(createdWorkspace.getId()).collectList();

        StepVerifier.create(environmentsMono)
                .assertNext(environmentList -> {

                    // Assert that environment execute has been given execute permission for this permission group
                    assertThat(environmentList).isNotEmpty();
                    assertThat(environmentList).hasSize(2);
                    environmentList.stream().forEach(env -> {
                        Optional<Policy> policyOptional = env.getPolicies().stream()
                                .filter(policy -> policy.getPermission().equals(EXECUTE_ENVIRONMENTS.getValue()))
                                .findFirst();

                        assertThat(policyOptional.isPresent()).isTrue();
                        Policy policy = policyOptional.get();
                        assertThat(policy.getPermissionGroups()).contains(createdPermissionGroup.getId());
                    });
                })
                .verifyComplete();

        // Now test for removal of the same datasource permission
        // Remove entity changes
        // Datasource : Remove execute permissions to the datasource
        UpdateRoleEntityDTO datasourceEntity2 = new UpdateRoleEntityDTO(
                Datasource.class.getSimpleName(), savedDs.getId(), List.of(0, 0, 0, 0, 0), savedDs.getName());
        updateRoleConfigDTO.setEntitiesChanged(Set.of(datasourceEntity2));
        updateRoleConfigDTO.setTabName(RoleTab.DATASOURCES_ENVIRONMENTS.getName());

        Mono<RoleViewDTO> roleViewDTOMono =
                roleConfigurationSolution.updateRoles(createdPermissionGroup.getId(), updateRoleConfigDTO);

        // Fetch the environment post the role change with execute permissions
        Mono<List<Environment>> environmentsMono2 = roleViewDTOMono.then(
                environmentService.findByWorkspaceId(createdWorkspace.getId()).collectList());

        StepVerifier.create(environmentsMono2)
                .assertNext(environmentList -> {

                    // Assert that environment execute has been retained for this permission group
                    assertThat(environmentList).isNotEmpty();
                    assertThat(environmentList).hasSize(2);
                    environmentList.stream().forEach(env -> {
                        Optional<Policy> policyOptional = env.getPolicies().stream()
                                .filter(policy -> policy.getPermission().equals(EXECUTE_ENVIRONMENTS.getValue()))
                                .findFirst();

                        assertThat(policyOptional.isPresent()).isTrue();
                        Policy policy = policyOptional.get();
                        assertThat(policy.getPermissionGroups()).contains(createdPermissionGroup.getId());
                    });
                })
                .verifyComplete();

        // Cleanup
        PermissionGroup deleteCreatedPermissionGroup = permissionGroupService
                .archiveById(createdPermissionGroup.getId())
                .block();
    }
}
