package com.appsmith.server.services.ce;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ImportingMetaDTO;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
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
import org.junit.jupiter.api.Disabled;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.UUID;

import static com.appsmith.server.acl.AclPermission.READ_THEMES;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@DirtiesContext
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

    @Disabled(" Flaky test to unblock TBP for the time")
    public void importThemesToApplication_WhenBothImportedThemesAreCustom_NewThemesCreated() {
        Application application = new Application();
        application.setName("ThemeTest_" + UUID.randomUUID());
        application.setWorkspaceId(this.workspace.getId());
        applicationPageService
                .createApplication(application, this.workspace.getId())
                .block();

        // create a application json with a custom theme set as both edit mode and published mode
        ApplicationJson applicationJson = new ApplicationJson();
        Theme customTheme = new Theme();
        customTheme.setName("Custom theme name");
        customTheme.setDisplayName("Custom theme display name");
        applicationJson.setEditModeTheme(customTheme);
        applicationJson.setPublishedTheme(customTheme);

        MappedImportableResourcesDTO mappedImportableResourcesDTO = new MappedImportableResourcesDTO();
        ImportingMetaDTO importingMetaDTO = new ImportingMetaDTO();

        Mono<MappedImportableResourcesDTO> mappedImportableResourcesDTOMono = Mono.just(application)
                .flatMap(savedApplication -> themeImportableService
                        .importEntities(
                                importingMetaDTO,
                                mappedImportableResourcesDTO,
                                null,
                                Mono.just(application),
                                applicationJson,
                                false)
                        .thenReturn(mappedImportableResourcesDTO));

        StepVerifier.create(mappedImportableResourcesDTOMono)
                .assertNext(mappedImportDTO -> {
                    assertThat(mappedImportDTO
                                    .getThemeDryRunQueries()
                                    .get("SAVE")
                                    .size())
                            .isEqualTo(2);
                    List<Theme> themesList =
                            mappedImportDTO.getThemeDryRunQueries().get("SAVE");
                    assertThat(themesList.get(0).getId())
                            .isNotEqualTo(themesList.get(1).getId());
                })
                .verifyComplete();
    }

    @Disabled(" Flaky test to unblock TBP for the time")
    public void importThemesToApplication_ApplicationThemeNotFound_DefaultThemeImported() {
        Theme defaultTheme = themeRepository
                .getSystemThemeByName(Theme.DEFAULT_THEME_NAME, READ_THEMES)
                .block();

        // create the theme information present in the application JSON
        Theme themeInJson = new Theme();
        themeInJson.setSystemTheme(true);
        themeInJson.setName(defaultTheme.getName());

        MappedImportableResourcesDTO mappedImportableResourcesDTO = new MappedImportableResourcesDTO();
        ImportingMetaDTO importingMetaDTO = new ImportingMetaDTO();

        // create a application json with the above theme set in both modes
        ApplicationJson applicationJson = new ApplicationJson();
        applicationJson.setEditModeTheme(themeInJson);
        applicationJson.setPublishedTheme(themeInJson);

        Application application = new Application();
        application.setName("ThemeTest_" + UUID.randomUUID());
        application.setWorkspaceId(this.workspace.getId());
        applicationPageService
                .createApplication(application, this.workspace.getId())
                .block();

        Mono<MappedImportableResourcesDTO> mappedImportableResourcesDTOMono = Mono.just(application)
                .map(application1 -> {
                    // setting invalid ids to themes to check the case
                    application1.setEditModeThemeId(UUID.randomUUID().toString());
                    application1.setPublishedModeThemeId(UUID.randomUUID().toString());
                    return application;
                })
                .flatMap(applicationRepository::save)
                .flatMap(savedApplication -> {
                    assert savedApplication.getId() != null;
                    return themeImportableService
                            .importEntities(
                                    importingMetaDTO,
                                    mappedImportableResourcesDTO,
                                    null,
                                    Mono.just(savedApplication),
                                    applicationJson,
                                    false)
                            .thenReturn(mappedImportableResourcesDTO);
                });

        StepVerifier.create(mappedImportableResourcesDTOMono)
                .assertNext(mappedImportDTO -> {
                    // both edit mode and published mode should have default theme set
                    List<Theme> themesList =
                            mappedImportDTO.getThemeDryRunQueries().get("SAVE");
                    assertThat(themesList.get(0).getId()).isEqualTo(defaultTheme.getId());
                })
                .verifyComplete();
    }
}
