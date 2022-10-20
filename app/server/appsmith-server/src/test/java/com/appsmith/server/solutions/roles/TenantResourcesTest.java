package com.appsmith.server.solutions.roles;

import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.UserGroupDTO;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.TenantService;
import com.appsmith.server.services.UserGroupService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.roles.constants.RoleTab;
import com.appsmith.server.solutions.roles.dtos.BaseView;
import com.appsmith.server.solutions.roles.dtos.EntityView;
import com.appsmith.server.solutions.roles.dtos.RoleTabDTO;
import com.appsmith.server.solutions.roles.dtos.RoleViewDTO;
import com.appsmith.server.solutions.roles.dtos.UpdateRoleConfigDTO;
import com.appsmith.server.solutions.roles.dtos.UpdateRoleEntityDTO;
import lombok.extern.slf4j.Slf4j;
import org.assertj.core.api.Assertions;
import org.assertj.core.api.AssertionsForClassTypes;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static com.appsmith.server.constants.FieldName.AUDIT_LOGS;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ExtendWith(SpringExtension.class)
@DirtiesContext
@Slf4j
public class TenantResourcesTest {

    @Autowired
    UserRepository userRepository;

    @Autowired
    UserUtils userUtils;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    TenantResources tenantResources;

    @Autowired
    WorkspaceResources workspaceResources;

    @Autowired
    UserGroupService userGroupService;

    @Autowired
    PermissionGroupService permissionGroupService;

    @Autowired
    TenantService tenantService;

    @Autowired
    RoleConfigurationSolution roleConfigurationSolution;

    User api_user = null;

    String superAdminPermissionGroupId = null;

    @BeforeEach
    public void setup() {
        if (api_user == null) {
            api_user = userRepository.findByEmail("api_user").block();
        }

        // Make api_user instance administrator before starting the test
        userUtils.makeSuperUser(List.of(api_user)).block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testCreateOthersTab() {
        if (superAdminPermissionGroupId == null) {
            superAdminPermissionGroupId = userUtils.getSuperAdminPermissionGroup().block().getId();
        }

        // create workspace to assert its permissions
        Workspace testWorkspace = new Workspace();
        String workspaceName = "roles TenantResourcesTest testCreateOthersTab workspace";
        testWorkspace.setName(workspaceName);
        Workspace savedWorkspace = workspaceService.create(testWorkspace).block();

        CommonAppsmithObjectData dataFromRepositoryForAllTabs = workspaceResources.getDataFromRepositoryForAllTabs();

        Mono<RoleTabDTO> othersTabMono = tenantResources.createOthersTab(superAdminPermissionGroupId, dataFromRepositoryForAllTabs);

        StepVerifier.create(othersTabMono)
                .assertNext(roleTabDTO -> {
                    assertThat(roleTabDTO).isNotNull();
                    assertThat(roleTabDTO.getPermissions()).isSameAs(RoleTab.OTHERS.getViewablePermissions());
                    EntityView topView = roleTabDTO.getData();
                    assertThat(topView).isNotNull();
                    assertThat(topView.getType()).isEqualTo(Tenant.class.getSimpleName());
                    // Other tab has only two headings today : Workspaces and Audit Logs
                    assertThat(topView.getEntities()).hasSize(2);

                    BaseView workspacesView = topView.getEntities().get(0);
                    assertThat(workspacesView.getName()).isEqualTo("Workspaces");
                    EntityView workpaces = (EntityView) Arrays.stream(workspacesView.getChildren().toArray()).findFirst().get();
                    assertThat(workpaces.getType()).isEqualTo(Workspace.class.getSimpleName());
                    BaseView testWorkspace1 = workpaces.getEntities().stream().filter(baseView -> baseView.getName().equals(workspaceName)).findFirst().get();
                    assertThat(testWorkspace1.getId()).isEqualTo(savedWorkspace.getId());
                    // assert that instance admin does not have the permission to edit/delete this workspace. Also, assert
                    // that create and view permissions are disabled for this type
                    List<Integer> assertedPermissions = List.of(-1,0,0,-1);
                    assertThat(testWorkspace1.getEnabled()).isEqualTo(assertedPermissions);
                    // assert that create workspace permission is given to super admin
                    assertThat(workspacesView.getEnabled().get(0)).isEqualTo(1);
                    BaseView auditLogView = topView.getEntities().get(1);
                    assertThat(auditLogView.getName()).isEqualTo(AUDIT_LOGS);
                    // assert that view audit log permission is given to super admin
                    assertThat(auditLogView.getEnabled().get(3)).isEqualTo(1);

                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void groupsRolesTabTest_SuperAdminPermissionGroupId() {
        if (superAdminPermissionGroupId == null) {
            superAdminPermissionGroupId = userUtils.getSuperAdminPermissionGroup().block().getId();
        }

        UserGroup userGroup = new UserGroup();
        userGroup.setName("groupsRolesTabTest_SuperAdminPermissionGroupId Group");
        UserGroupDTO createdGroup = userGroupService.createGroup(userGroup).block();

        PermissionGroup permissionGroup = new PermissionGroup();
        String roleName = UUID.randomUUID().toString();
        permissionGroup.setName(roleName);
        PermissionGroup createdRole = permissionGroupService.create(permissionGroup).block();

        Mono<RoleTabDTO> groupsAndRolesTabMono = tenantResources.createGroupsAndRolesTab(superAdminPermissionGroupId);

        StepVerifier.create(groupsAndRolesTabMono)
                .assertNext(groupsAndRolesTab -> {
                    assertThat(groupsAndRolesTab).isNotNull();
                    assertThat(groupsAndRolesTab.getPermissions()).isSameAs(RoleTab.GROUPS_ROLES.getViewablePermissions());

                    EntityView topView = groupsAndRolesTab.getData();
                    assertThat(topView.getType()).isEqualTo(Tenant.class.getSimpleName());
                    // assert that both the groups and roles are present as children
                    assertThat(topView.getEntities().size()).isEqualTo(2);

                    BaseView groupsTopView = topView.getEntities().stream().filter(entity -> entity.getName().equals("Groups")).findFirst().get();
                    BaseView rolesTopView = topView.getEntities().stream().filter(entity -> entity.getName().equals("Roles")).findFirst().get();

                    // Assert that the super admin has permissions to create, edit, delete, view, invite and remove users for all groups
                    // Also, associate role should be disabled since it doesn't apply to groups.
                    List<Integer> perms = List.of(1,1,1,1,1,1,-1);
                    assertThat(groupsTopView.getEnabled()).isEqualTo(perms);
                    assertThat(groupsTopView.getChildren().size()).isEqualTo(1);

                    // Assert that the created group is returned in the view
                    List<BaseView> groupEntities = (List<BaseView>) groupsTopView.getChildren().stream().findFirst().get().getEntities();
                    BaseView createdGroupView = groupEntities.stream()
                            .filter(groupEntity -> groupEntity.getId().equals(createdGroup.getId()))
                            .findFirst()
                            .get();
                    assertThat(createdGroupView.getName()).isEqualTo(createdGroup.getName());
                    assertThat(createdGroupView.getId()).isEqualTo(createdGroup.getId());
                    // Assert that create and assocaite roles are disabled. The rest of the permissions are enabled for the group
                    perms = List.of(-1,1,1,1,1,1,-1);
                    assertThat(createdGroupView.getEnabled()).isEqualTo(perms);
                    assertThat(createdGroupView.getChildren()).isNull();

                    // Assert that the super admin has permissions to create, edit, delete, view and associate for all roles
                    // Also, invite and remove users should be disabled since it doesn't apply to roles.
                    perms = List.of(1,1,1,1,-1,-1,1);
                    assertThat(rolesTopView.getEnabled()).isEqualTo(perms);
                    assertThat(rolesTopView.getChildren().size()).isEqualTo(1);

                    // Assert that the created role is returned in the view
                    List<BaseView> rolesEntities = (List<BaseView>) rolesTopView.getChildren().stream().findFirst().get().getEntities();
                    BaseView createdRoleView = rolesEntities.stream().filter(roleEntity -> roleEntity.getId().equals(createdRole.getId())).findFirst().get();
                    assertThat(createdRoleView.getName()).isEqualTo(createdRole.getName());
                    // Assert that create, invite and remove users permissions are disabled. The rest of the permissions are enabled for the role
                    perms = List.of(-1,1,1,1,-1,-1,1);
                    assertThat(createdRoleView.getEnabled()).isEqualTo(perms);
                    assertThat(createdRoleView.getChildren()).isNull();

                })
                .verifyComplete();

    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testSaveRoleConfigurationChangesForOthersTab() {

        Workspace workspace = new Workspace();
        workspace.setName("testSaveRoleConfigurationChanges workspace");
        Workspace createdWorkspace = workspaceService.create(workspace).block();

        PermissionGroup permissionGroup = new PermissionGroup();
        permissionGroup.setName("New role for editing");
        PermissionGroup createdPermissionGroup = permissionGroupService.create(permissionGroup).block();

        UpdateRoleConfigDTO updateRoleConfigDTO = new UpdateRoleConfigDTO();

        // Add entity changes
        // Give edit created workspace and read audit logs permission
        UpdateRoleEntityDTO workspaceEntity = new UpdateRoleEntityDTO(
                Workspace.class.getSimpleName(),
                createdWorkspace.getId(),
                List.of(-1, 1, 0, -1),
                createdWorkspace.getName()
        );
        UpdateRoleEntityDTO auditLogEntity = new UpdateRoleEntityDTO(
                Tenant.class.getSimpleName(),
                tenantService.getDefaultTenantId().block(),
                List.of(-1, -1, -1, 1),
                AUDIT_LOGS
        );

        updateRoleConfigDTO.setTabName(RoleTab.OTHERS.getName());
        updateRoleConfigDTO.setEntitiesChanged(Set.of(workspaceEntity, auditLogEntity));

        Mono<RoleViewDTO> roleConfigChangeMono = roleConfigurationSolution.updateRoles(createdPermissionGroup.getId(), updateRoleConfigDTO);

        StepVerifier.create(roleConfigChangeMono)
                .assertNext(roleViewDTO -> {
                    Assertions.assertThat(roleViewDTO).isNotNull();
                    BaseView workspaceView = roleViewDTO.getTabs().get(RoleTab.OTHERS.getName())
                            .getData()
                            .getEntities()
                            .stream()
                            .filter(baseView -> baseView.getName().equals("Workspaces"))
                            .findFirst().get();

                    // First assert that the parent permissions haven't changed (for ALL workspaces)
                    AssertionsForClassTypes.assertThat(workspaceView.getEnabled()).isEqualTo(List.of(0,-1, -1, -1));

                    BaseView createdWorkspaceView = workspaceView.getChildren().stream().findFirst().get()
                            .getEntities().stream()
                            .filter(baseView -> baseView.getId().equals(createdWorkspace.getId()))
                            .findFirst().get();
                    AssertionsForClassTypes.assertThat(createdWorkspaceView.getEnabled()).isEqualTo(List.of(-1, 1, 0, -1));

                    BaseView auditLogView = roleViewDTO.getTabs().get(RoleTab.OTHERS.getName())
                            .getData()
                            .getEntities()
                            .stream()
                            .filter(baseView -> baseView.getName().equals(AUDIT_LOGS))
                            .findFirst().get();

                    // Assert that Audit logs view is now set to true
                    AssertionsForClassTypes.assertThat(auditLogView.getEnabled()).isEqualTo(List.of(-1,-1, -1, 1));

                })
                .verifyComplete();
    }

}
