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
import com.appsmith.server.repositories.ThemeRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ApplicationPermission;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.UUID;

import static com.appsmith.server.acl.AclPermission.READ_THEMES;

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

    Workspace workspace;

    @Autowired
    private ImportableService<Theme> themeImportableService;

    @Autowired
    private ThemeRepository themeRepository;

    @Autowired
    ApplicationPermission applicationPermission;

    @BeforeEach
    public void setup() {
        Workspace workspace = new Workspace();
        workspace.setName("Theme Service Test workspace");
        this.workspace = workspaceService.create(workspace).block();
    }

    @AfterEach
    public void cleanup() {
        List<Application> deletedApplications = applicationPermission
                .getDeletePermission()
                .flatMapMany(permission -> applicationService.findByWorkspaceId(workspace.getId(), permission))
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
    }
}
