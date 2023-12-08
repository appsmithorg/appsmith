package com.appsmith.server.services.ce;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ImportingMetaDTO;
import com.appsmith.server.dtos.InviteUsersDTO;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import com.appsmith.server.dtos.UpdatePermissionGroupDTO;
import com.appsmith.server.imports.importable.ImportableService;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.ThemeRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.UserWorkspaceService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.UserAndAccessManagementService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.constants.FieldName.ADMINISTRATOR;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ExtendWith(SpringExtension.class)
public class ThemeImportableServiceCETest {

    @Autowired
    ApplicationRepository applicationRepository;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    UserService userService;

    Workspace workspace;

    @Autowired
    private ImportableService<Theme> themeImportableService;

    @Autowired
    private PermissionGroupRepository permissionGroupRepository;

    @Autowired
    private UserWorkspaceService userWorkspaceService;

    @Autowired
    private ThemeRepository themeRepository;

    @Autowired
    private UserAndAccessManagementService userAndAccessManagementService;

    @Autowired
    ApplicationPermission applicationPermission;

    @Autowired
    UserRepository userRepository;

    @Autowired
    PermissionGroupService permissionGroupService;

    @BeforeEach
    public void setup() {
        Workspace workspace = new Workspace();
        workspace.setName("Theme Service Test workspace");
        workspace.setUserRoles(new ArrayList<>());
        this.workspace = workspaceService.create(workspace).block();
    }

    @AfterEach
    public void cleanup() {
        List<Application> deletedApplications = applicationService
                .findByWorkspaceId(workspace.getId(), applicationPermission.getDeletePermission())
                .flatMap(remainingApplication -> applicationPageService.deleteApplication(remainingApplication.getId()))
                .collectList()
                .block();
        Workspace deletedWorkspace =
                workspaceService.archiveById(workspace.getId()).block();
    }

    private Application createApplication() {
        Application application = new Application();
        application.setName("ThemeTest_" + UUID.randomUUID());
        application.setWorkspaceId(this.workspace.getId());
        applicationPageService
                .createApplication(application, this.workspace.getId())
                .block();
        return application;
    }

    public void replaceApiUserWithAnotherUserInWorkspace() {

        String origin = "http://random-origin.test";
        PermissionGroup adminPermissionGroup = permissionGroupRepository
                .findAllById(workspace.getDefaultPermissionGroups())
                .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                .collectList()
                .block()
                .get(0);

        // invite usertest to the workspace
        InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
        inviteUsersDTO.setUsernames(List.of("usertest@usertest.com"));
        inviteUsersDTO.setPermissionGroupId(adminPermissionGroup.getId());
        userAndAccessManagementService.inviteUsers(inviteUsersDTO, origin).block();

        // Remove api_user from the workspace
        UpdatePermissionGroupDTO updatePermissionGroupDTO = new UpdatePermissionGroupDTO();
        updatePermissionGroupDTO.setNewPermissionGroupId(null);
        updatePermissionGroupDTO.setUsername("api_user");
        userWorkspaceService
                .updatePermissionGroupForMember(workspace.getId(), updatePermissionGroupDTO, origin)
                .block();
    }

    public void addApiUserToTheWorkspaceAsAdmin() {
        String origin = "http://random-origin.test";
        PermissionGroup adminPermissionGroup = permissionGroupRepository
                .findAllById(workspace.getDefaultPermissionGroups())
                .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                .collectList()
                .block()
                .get(0);

        // add api_user back to the workspace
        User apiUser = userRepository.findByEmail("api_user").block();
        adminPermissionGroup.getAssignedToUserIds().add(apiUser.getId());
        permissionGroupRepository
                .save(adminPermissionGroup)
                .flatMap(
                        savedRole -> permissionGroupService.cleanPermissionGroupCacheForUsers(List.of(apiUser.getId())))
                .block();
    }

    @WithUserDetails("api_user")
    @Test
    public void importThemesToApplication_WhenBothImportedThemesAreCustom_NewThemesCreated() {
        Application application = createApplication();

        // create a application json with a custom theme set as both edit mode and published mode
        ApplicationJson applicationJson = new ApplicationJson();
        Theme customTheme = new Theme();
        customTheme.setName("Custom theme name");
        customTheme.setDisplayName("Custom theme display name");
        applicationJson.setEditModeTheme(customTheme);
        applicationJson.setPublishedTheme(customTheme);

        Mono<Application> applicationMono = Mono.just(application)
                .flatMap(savedApplication -> themeImportableService
                        .importEntities(
                                new ImportingMetaDTO(),
                                new MappedImportableResourcesDTO(),
                                null,
                                Mono.just(application),
                                applicationJson,
                                false)
                        .thenReturn(savedApplication.getId()))
                .flatMap(applicationId -> applicationRepository.findById(applicationId, MANAGE_APPLICATIONS));

        StepVerifier.create(applicationMono)
                .assertNext(app -> {
                    assertThat(app.getEditModeThemeId().equals(app.getPublishedModeThemeId()))
                            .isFalse();
                })
                .verifyComplete();
    }

    @WithUserDetails("api_user")
    @Test
    public void importThemesToApplication_ApplicationThemeNotFound_DefaultThemeImported() {
        Theme defaultTheme =
                themeRepository.getSystemThemeByName(Theme.DEFAULT_THEME_NAME).block();

        // create the theme information present in the application JSON
        Theme themeInJson = new Theme();
        themeInJson.setSystemTheme(true);
        themeInJson.setName(defaultTheme.getName());

        // create a application json with the above theme set in both modes
        ApplicationJson applicationJson = new ApplicationJson();
        applicationJson.setEditModeTheme(themeInJson);
        applicationJson.setPublishedTheme(themeInJson);

        Mono<Application> applicationMono = Mono.just(createApplication())
                .map(application -> {
                    // setting invalid ids to themes to check the case
                    application.setEditModeThemeId(UUID.randomUUID().toString());
                    application.setPublishedModeThemeId(UUID.randomUUID().toString());
                    return application;
                })
                .flatMap(applicationRepository::save)
                .flatMap(savedApplication -> {
                    assert savedApplication.getId() != null;
                    return themeImportableService
                            .importEntities(
                                    new ImportingMetaDTO(),
                                    new MappedImportableResourcesDTO(),
                                    null,
                                    Mono.just(savedApplication),
                                    applicationJson,
                                    false)
                            .thenReturn(savedApplication.getId());
                })
                .flatMap(applicationId -> applicationRepository.findById(applicationId, MANAGE_APPLICATIONS));

        StepVerifier.create(applicationMono)
                .assertNext(app -> {
                    // both edit mode and published mode should have default theme set
                    assertThat(app.getEditModeThemeId()).isEqualTo(app.getPublishedModeThemeId());
                    assertThat(app.getEditModeThemeId()).isEqualTo(defaultTheme.getId());
                })
                .verifyComplete();
    }
}
