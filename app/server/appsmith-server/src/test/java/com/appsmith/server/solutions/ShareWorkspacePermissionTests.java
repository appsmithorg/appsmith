package com.appsmith.server.solutions;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.InviteUsersDTO;
import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.PluginService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.UserWorkspaceService;
import com.appsmith.server.services.WorkspaceService;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.MAKE_PUBLIC_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_WORKSPACES;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_INVITE_USERS;
import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class ShareWorkspacePermissionTests {
    @Autowired
    UserService userService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    UserSignup userSignup;

    @Autowired
    PluginService pluginService;

    @Autowired
    DatasourceService datasourceService;

    @Autowired
    NewActionService newActionService;

    @Autowired
    ApplicationRepository applicationRepository;

    @Autowired
    NewPageService newPageService;

    @Autowired
    LayoutActionService layoutActionService;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    @Autowired
    PermissionGroupService permissionGroupService;

    @Autowired
    UserWorkspaceService userWorkspaceService;

    @Autowired
    PermissionGroupRepository permissionGroupRepository;

    @Autowired
    UserAndAccessManagementService userAndAccessManagementService;

    Application savedApplication;

    Workspace savedWorkspace;

    String workspaceId;

    @BeforeEach
    @WithUserDetails(value = "api_user")
    public void setup() {
        User apiUser = userService.findByEmail("api_user").block();

        Workspace workspace = new Workspace();
        workspace.setName("Share Test Workspace");
        savedWorkspace = workspaceService.create(workspace).block();
        workspaceId = savedWorkspace.getId();

        Application application = new Application();
        application.setName("Share Test Application");
        application.setWorkspaceId(workspaceId);
        savedApplication = applicationPageService.createApplication(application, workspaceId).block();

        InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
        ArrayList<String> emails = new ArrayList<>();

        PermissionGroup adminPermissionGroup = permissionGroupService.getByDefaultWorkspace(savedWorkspace, AclPermission.READ_PERMISSION_GROUP_MEMBERS)
                .collectList().block()
                .stream()
                .filter(permissionGroupElem -> permissionGroupElem.getName().startsWith(FieldName.ADMINISTRATOR))
                .findFirst().get();

        PermissionGroup developerPermissionGroup = permissionGroupService.getByDefaultWorkspace(savedWorkspace, AclPermission.READ_PERMISSION_GROUP_MEMBERS)
                .collectList().block()
                .stream()
                .filter(permissionGroupElem -> permissionGroupElem.getName().startsWith(FieldName.DEVELOPER))
                .findFirst().get();

        // Invite Admin
        emails.add("admin@solutiontest.com");
        inviteUsersDTO.setUsernames(emails);
        inviteUsersDTO.setPermissionGroupId(adminPermissionGroup.getId());
        userAndAccessManagementService.inviteUsers(inviteUsersDTO, "http://localhost:8080").block();

        emails.clear();

        // Invite Developer
        emails.add("developer@solutiontest.com");
        inviteUsersDTO.setUsernames(emails);
        inviteUsersDTO.setPermissionGroupId(developerPermissionGroup.getId());
        userAndAccessManagementService.inviteUsers(inviteUsersDTO, "http://localhost:8080").block();

        User userAdmin = userService.findByEmail("admin@solutiontest.com").block();
        User userDeveloper = userService.findByEmail("developer@solutiontest.com").block();

        // Set the correct ownerships and permissions
        adminPermissionGroup.setAssignedToUserIds(Set.of(apiUser.getId(), userAdmin.getId()));
        permissionGroupRepository.save(adminPermissionGroup).block();
        developerPermissionGroup.setAssignedToUserIds(Set.of(userDeveloper.getId()));
        permissionGroupRepository.save(developerPermissionGroup).block();
    }

    @Test
    @WithUserDetails(value = "admin@solutiontest.com")
    public void testAdminPermissionsForInviteAndMakePublic() {
        PermissionGroup adminPermissionGroup = permissionGroupService.getByDefaultWorkspace(savedWorkspace, AclPermission.READ_PERMISSION_GROUP_MEMBERS)
                .collectList().block()
                .stream()
                .filter(permissionGroupElem -> permissionGroupElem.getName().startsWith(FieldName.ADMINISTRATOR))
                .findFirst().get();

        PermissionGroup developerPermissionGroup = permissionGroupService.getByDefaultWorkspace(savedWorkspace, AclPermission.READ_PERMISSION_GROUP_MEMBERS)
                .collectList().block()
                .stream()
                .filter(permissionGroupElem -> permissionGroupElem.getName().startsWith(FieldName.DEVELOPER))
                .findFirst().get();

        PermissionGroup viewerPermissionGroup = permissionGroupService.getByDefaultWorkspace(savedWorkspace, AclPermission.READ_PERMISSION_GROUP_MEMBERS)
                .collectList().block()
                .stream()
                .filter(permissionGroupElem -> permissionGroupElem.getName().startsWith(FieldName.VIEWER))
                .findFirst().get();

        Policy inviteUserPolicy = Policy.builder().permission(WORKSPACE_INVITE_USERS.getValue())
                .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId(), viewerPermissionGroup.getId()))
                .build();

        Policy makePublicApp = Policy.builder().permission(MAKE_PUBLIC_APPLICATIONS.getValue())
                .permissionGroups(Set.of(adminPermissionGroup.getId()))
                .build();

        Mono<Application> applicationMono = applicationService.findById(savedApplication.getId());
        Mono<Workspace> workspaceMono = workspaceService.findById(workspaceId, READ_WORKSPACES);

        StepVerifier.create(Mono.zip(applicationMono, workspaceMono))
                .assertNext(tuple -> {
                    Application application = tuple.getT1();
                    Workspace workspace = tuple.getT2();

                    assertThat(application.getPolicies()).contains(makePublicApp);
                    assertThat(workspace.getPolicies()).contains(inviteUserPolicy);
                })
                .verifyComplete();

    }

    @Test
    @WithUserDetails(value = "admin@solutiontest.com")
    public void testAdminInviteRoles() {

        Mono<List<PermissionGroupInfoDTO>> userRolesForWorkspace = workspaceService.getPermissionGroupsForWorkspace(workspaceId);

        StepVerifier.create(userRolesForWorkspace)
                .assertNext(userGroupInfos -> {
                    assertThat(userGroupInfos).isNotEmpty();
                    assertThat(userGroupInfos).anyMatch(userGroupInfo -> userGroupInfo.getName().startsWith(FieldName.ADMINISTRATOR));
                    assertThat(userGroupInfos).anyMatch(userGroupInfo -> userGroupInfo.getName().startsWith(FieldName.VIEWER));
                    assertThat(userGroupInfos).anyMatch(userGroupInfo -> userGroupInfo.getName().startsWith(FieldName.DEVELOPER));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "developer@solutiontest.com")
    public void testDevPermissionsForInvite() {
        PermissionGroup adminPermissionGroup = permissionGroupService.getByDefaultWorkspace(savedWorkspace, AclPermission.READ_PERMISSION_GROUP_MEMBERS)
                .collectList().block()
                .stream()
                .filter(permissionGroupElem -> permissionGroupElem.getName().startsWith(FieldName.ADMINISTRATOR))
                .findFirst().get();

        PermissionGroup developerPermissionGroup = permissionGroupService.getByDefaultWorkspace(savedWorkspace, AclPermission.READ_PERMISSION_GROUP_MEMBERS)
                .collectList().block()
                .stream()
                .filter(permissionGroupElem -> permissionGroupElem.getName().startsWith(FieldName.DEVELOPER))
                .findFirst().get();

        PermissionGroup viewerPermissionGroup = permissionGroupService.getByDefaultWorkspace(savedWorkspace, AclPermission.READ_PERMISSION_GROUP_MEMBERS)
                .collectList().block()
                .stream()
                .filter(permissionGroupElem -> permissionGroupElem.getName().startsWith(FieldName.VIEWER))
                .findFirst().get();

        Policy inviteUserPolicy = Policy.builder().permission(WORKSPACE_INVITE_USERS.getValue())
                .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId(), viewerPermissionGroup.getId()))
                .build();

        Mono<Workspace> workspaceMono = workspaceService.findById(workspaceId, READ_WORKSPACES);

        StepVerifier.create(workspaceMono)
                .assertNext(workspace -> {
                    assertThat(workspace.getPolicies()).contains(inviteUserPolicy);
                })
                .verifyComplete();

    }

    @Test
    @WithUserDetails(value = "developer@solutiontest.com")
    public void testDeveloperInviteRoles() {

        /*
        Adding this test in cypress instead.
         */
    }
}
