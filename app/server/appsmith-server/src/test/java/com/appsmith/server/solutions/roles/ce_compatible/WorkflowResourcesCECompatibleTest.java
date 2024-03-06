package com.appsmith.server.solutions.roles.ce_compatible;

import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.roles.CommonAppsmithObjectData;
import com.appsmith.server.solutions.roles.RoleConfigurationSolution;
import com.appsmith.server.solutions.roles.WorkflowResources;
import com.appsmith.server.solutions.roles.WorkspaceResources;
import com.appsmith.server.solutions.roles.constants.RoleTab;
import com.appsmith.server.solutions.roles.dtos.RoleViewDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;

import java.util.List;

import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ExtendWith(SpringExtension.class)
class WorkflowResourcesCECompatibleTest {

    @Autowired
    private WorkflowResources workflowResources;

    @SpyBean
    private FeatureFlagService featureFlagService;

    @Autowired
    private WorkspaceService workspaceService;

    @Autowired
    private RoleConfigurationSolution roleConfigurationSolution;

    private Workspace createdWorkspace;

    @Autowired
    private UserUtils userUtils;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PermissionGroupService permissionGroupService;

    @Autowired
    private WorkspaceResources workspaceResources;

    @BeforeEach
    public void setup() {
        Mockito.when(featureFlagService.check(Mockito.eq(FeatureFlagEnum.license_gac_enabled)))
                .thenReturn(Mono.just(TRUE));
        Mockito.when(featureFlagService.check(Mockito.eq(FeatureFlagEnum.release_workflows_enabled)))
                .thenReturn(Mono.just(FALSE));

        // Make api_user instance administrator before starting the test
        User api_user = userRepository.findByEmail("api_user").block();
        userUtils.makeSuperUser(List.of(api_user)).block();

        Workspace workspace = new Workspace();
        workspace.setName("Workspace - WorkflowResourcesCECompatibleTest");
        createdWorkspace = workspaceService.create(workspace).block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    void testRoleViewDTO_doesNotContainWorkflowsTab() {
        PermissionGroup sampleRole = new PermissionGroup();
        sampleRole.setName("createWorkflowResourceTabView");
        RoleViewDTO createdSampleRoleViewDTO =
                permissionGroupService.createCustomPermissionGroup(sampleRole).block();
        assertThat(createdSampleRoleViewDTO.getTabs())
                .containsOnlyKeys(
                        RoleTab.APPLICATION_RESOURCES.getName(),
                        RoleTab.DATASOURCES_ENVIRONMENTS.getName(),
                        RoleTab.GROUPS_ROLES.getName(),
                        RoleTab.OTHERS.getName());
    }

    @Test
    @WithUserDetails(value = "api_user")
    void addWorkflowTabToRoleViewDTO() {
        PermissionGroup sampleRole = new PermissionGroup();
        sampleRole.setName("createWorkflowResourceTabView");
        RoleViewDTO createdSampleRoleViewDTO =
                permissionGroupService.createCustomPermissionGroup(sampleRole).block();
        CommonAppsmithObjectData dataFromRepositoryForAllTabs = workspaceResources.getDataFromRepositoryForAllTabs();
        RoleViewDTO roleViewDTOWithWorkflowDTO = roleConfigurationSolution
                .getAllTabViews(createdSampleRoleViewDTO.getId())
                .block();
        assertThat(roleViewDTOWithWorkflowDTO.getTabs())
                .containsOnlyKeys(
                        RoleTab.APPLICATION_RESOURCES.getName(),
                        RoleTab.DATASOURCES_ENVIRONMENTS.getName(),
                        RoleTab.GROUPS_ROLES.getName(),
                        RoleTab.OTHERS.getName());
    }
}
