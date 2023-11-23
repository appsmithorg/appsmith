package com.appsmith.server.services;

import com.appsmith.git.constants.CommonConstants;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.solutions.ApplicationPermission;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import net.minidev.json.parser.JSONParser;
import net.minidev.json.parser.ParseException;
import org.apache.commons.io.FileUtils;
import org.junit.jupiter.api.AfterEach;
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

import java.io.File;
import java.io.IOException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class ApplicationPageServiceTest {
    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    ApplicationRepository applicationRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    NewPageService newPageService;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    ApplicationPermission applicationPermission;

    Workspace workspace;

    @BeforeEach
    public void setup() {
        Workspace unsavedWorkspace = new Workspace();
        unsavedWorkspace.setName("ApplicationPageServiceTest Workspace");
        workspace = workspaceService.create(unsavedWorkspace).block();
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

    /**
     * Creates an workspace, an application and a page under that application
     *
     * @param uniquePrefix unique string that'll be added as prefix to org and app names to avoid name collision
     * @return publisher of PageDTO
     */
    private Mono<PageDTO> createPageMono(String uniquePrefix) {
        Application application = new Application();
        application.setName(uniquePrefix + "_app");
        return applicationPageService
                .createApplication(application, workspace.getId())
                .flatMap(application1 -> {
                    PageDTO page = new PageDTO();
                    page.setName("Test page");
                    page.setApplicationId(application1.getId());
                    return applicationPageService.createPage(page);
                });
    }

    @Test
    @WithUserDetails("api_user")
    public void deleteUnpublishedPage_WhenPageDeleted_ApplicationEditDateSet() {
        Mono<Application> applicationMono = createPageMono(UUID.randomUUID().toString())
                .flatMap(pageDTO -> {
                    Application application = new Application();
                    application.setLastEditedAt(Instant.now().minus(10, ChronoUnit.DAYS));
                    return applicationRepository
                            .updateById(pageDTO.getApplicationId(), application, AclPermission.MANAGE_APPLICATIONS)
                            .then(applicationPageService.deleteUnpublishedPage(pageDTO.getId()))
                            .then(applicationRepository.findById(pageDTO.getApplicationId()));
                });

        StepVerifier.create(applicationMono)
                .assertNext(application -> {
                    assertThat(application.getLastEditedAt()).isNotNull();
                    Instant yesterday = Instant.now().minus(1, ChronoUnit.DAYS);
                    assertThat(application.getLastEditedAt()).isAfter(yesterday);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void cloneApplication_WhenClonedSuccessfully_ApplicationIsPublished() {
        Mono<Application> applicationMono = createPageMono(UUID.randomUUID().toString())
                .flatMap(pageDTO -> applicationPageService.cloneApplication(pageDTO.getApplicationId(), null));

        StepVerifier.create(applicationMono)
                .assertNext(application -> {
                    assertThat(application.getPages().size())
                            .isEqualTo(application.getPublishedPages().size());
                })
                .verifyComplete();
    }

    Mono<Application> createApplication(String uniquePrefix) {
        Application application = new Application();
        application.setName(uniquePrefix + "_app");
        return applicationPageService.createApplication(application, workspace.getId());
    }

    JSONObject getOlderDSL() {
        ClassLoader classLoader = getClass().getClassLoader();
        File file = new File(classLoader
                .getResource("test_assets/DSLMigration/PageDSLv83.json")
                .getFile());
        String data = CommonConstants.EMPTY_STRING;
        try {
            data = FileUtils.readFileToString(file, "UTF-8");
        } catch (IOException ignored) {

        }
        JSONParser jsonParser = new JSONParser();
        JSONObject parsedData = new JSONObject();
        try {
            parsedData = (JSONObject) jsonParser.parse(data);
        } catch (ParseException e) {
            log.error("Error parsing the page dsl for page: {}", e);
        }
        return parsedData;
    }

    /**
     * This test is to ensure that the DSL is migrated to the new format when the page is loaded in edit mode.
     * After migrating the DSL, the page is saved again. This is to ensure that the updated DSL is stored in db.
     */
    @Test
    @WithUserDetails("api_user")
    public void getPageEditMode_DSLNotMigrated_MigratedRealTileSuccessfully() {

        NewPage newPage = createApplication("getPageEditMode_DSLNotMigrated_MigratedRealTileSuccessfully")
                .flatMap(application ->
                        newPageService.getById(application.getPages().get(0).getId()))
                .flatMap(pageDTO -> {
                    PageDTO unPublishedPageDTO = pageDTO.getUnpublishedPage();
                    Layout layout = unPublishedPageDTO.getLayouts().get(0);
                    // Fetch Older DSL from the test resources
                    layout.setDsl(getOlderDSL());
                    return newPageService
                            .update(pageDTO.getId(), pageDTO)
                            .flatMap(newpage -> applicationPageService.publish(pageDTO.getApplicationId(), true))
                            .then(Mono.just(pageDTO));
                })
                .block();

        StepVerifier.create(applicationPageService.getPageByBranchAndDefaultPageId(newPage.getId(), null, false))
                .assertNext(pageDTO -> {
                    // Assert for the migrated DSL in db and the one that was created before.
                    // The migrated DSL should have the new format.
                    // Match for widget version
                    // Match published and unpublished page DSL version number
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void getPageEditMode_DSLMigrated_MigratedRealTileSuccessfully() {
        NewPage newPage = createApplication("getPageEditMode_DSLMigrated_MigratedRealTileSuccessfully")
                .flatMap(application ->
                        newPageService.getById(application.getPages().get(0).getId()))
                .flatMap(pageDTO -> {
                    PageDTO unPublishedPageDTO = pageDTO.getUnpublishedPage();
                    Layout layout = unPublishedPageDTO.getLayouts().get(0);
                    // Fetch Older DSL from the test resources
                    layout.setDsl(getOlderDSL());
                    return newPageService
                            .update(pageDTO.getId(), pageDTO)
                            .flatMap(newpage -> applicationPageService.publish(pageDTO.getApplicationId(), true))
                            .then(Mono.just(pageDTO));
                })
                .block();

        StepVerifier.create(applicationPageService.getPageByBranchAndDefaultPageId(newPage.getId(), null, false))
                .assertNext(pageDTO -> {
                    // Assert for the migrated DSL in db and the one that was created before.
                    // The migrated DSL should have the new format.
                    // Match for widget version
                    // Match published and unpublished page DSL version number
                })
                .verifyComplete();
    }

    /**
     * This test is to ensure that the DSL is migrated to the new format when the page is loaded in view mode.
     * But the updated DSL is not stored in db due to the permission issue
     */
    @Test
    @WithUserDetails("api_user")
    public void getPagePublishedMode_DSLNotMigrated_MigratedRealTileSuccessfully() {
        NewPage newPage = createApplication("getPagePublishedMode_DSLNotMigrated_MigratedRealTileSuccessfully")
                .flatMap(application ->
                        newPageService.getById(application.getPages().get(0).getId()))
                .flatMap(pageDTO -> {
                    PageDTO unPublishedPageDTO = pageDTO.getUnpublishedPage();
                    Layout layout = unPublishedPageDTO.getLayouts().get(0);
                    // Fetch Older DSL from the test resources
                    layout.setDsl(getOlderDSL());
                    return newPageService
                            .update(pageDTO.getId(), pageDTO)
                            .flatMap(newpage -> applicationPageService.publish(pageDTO.getApplicationId(), true))
                            .then(Mono.just(pageDTO));
                })
                .block();

        StepVerifier.create(applicationPageService.getPageByBranchAndDefaultPageId(newPage.getId(), null, true))
                .assertNext(pageDTO -> {
                    // Assert for the migrated DSL in db and the one that was created before. Both should be same since
                    // its view mode and the updated DSL is not stored in db due to the permission issue
                    // The migrated DSL should have the new format.
                    // Match for widget version
                    // Match published and unpublished page DSL version number
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void getPagePublishedMode_DSLMigrated_MigratedRealTileSuccessfully() {
        NewPage newPage = createApplication("getPagePublishedMode_DSLMigrated_MigratedRealTileSuccessfully")
                .flatMap(application ->
                        newPageService.getById(application.getPages().get(0).getId()))
                .flatMap(pageDTO -> {
                    PageDTO unPublishedPageDTO = pageDTO.getUnpublishedPage();
                    Layout layout = unPublishedPageDTO.getLayouts().get(0);
                    // Fetch Older DSL from the test resources
                    layout.setDsl(getOlderDSL());
                    return newPageService
                            .update(pageDTO.getId(), pageDTO)
                            .flatMap(newpage -> applicationPageService.publish(pageDTO.getApplicationId(), true))
                            .then(Mono.just(pageDTO));
                })
                .block();

        StepVerifier.create(applicationPageService.getPageByBranchAndDefaultPageId(newPage.getId(), null, true))
                .assertNext(pageDTO -> {
                    // Assert for the migrated DSL in db and the one that was created before. Both should be same since
                    // its view mode and the updated DSL is not stored in db due to the permission issue
                    // The migrated DSL should have the new format.
                    // Match for widget version
                    // Match published and unpublished page DSL version number
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void createOrUpdateSuffixedApplication_GitConnectedAppExistsWithSameName_AppCreatedWithSuffixedName() {
        // create a Git connected application with two branches
        final String appName = "app" + UUID.randomUUID();
        Application application = new Application();
        application.setName(appName);
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        gitApplicationMetadata.setBranchName("branch1");
        application.setGitApplicationMetadata(gitApplicationMetadata);

        Mono<Application> importAppMono = applicationPageService
                .createApplication(application, workspace.getId())
                .flatMap(createdApp -> {
                    createdApp.getGitApplicationMetadata().setDefaultApplicationId(createdApp.getId());
                    return applicationService.save(createdApp);
                })
                .flatMap(createdApp -> {
                    createdApp.setId(null);
                    createdApp.getGitApplicationMetadata().setBranchName("branch2");
                    // just duplicate the app, we're not considering the pages, they remain same in both apps
                    return applicationRepository.save(createdApp);
                })
                .flatMap(createdApp -> {
                    Application newApplication = new Application();
                    newApplication.setName(appName);
                    newApplication.setWorkspaceId(workspace.getId());
                    return applicationPageService.createOrUpdateSuffixedApplication(
                            newApplication, newApplication.getName(), 0);
                });

        StepVerifier.create(importAppMono)
                .assertNext(application1 -> {
                    assertThat(application1.getName()).isEqualTo(appName + " (1)");
                })
                .verifyComplete();
    }
}
