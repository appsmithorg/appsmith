package com.appsmith.server.services;

import com.appsmith.git.constants.CommonConstants;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.DSLMigrationUtils;
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
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.File;
import java.io.IOException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;

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

    @MockBean
    DSLMigrationUtils dslMigrationUtils;

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
                .flatMap(pageDTO -> applicationPageService.cloneApplication(pageDTO.getApplicationId()));

        StepVerifier.create(applicationMono)
                .assertNext(application -> {
                    assertThat(application.getPages())
                            .hasSize(application.getPublishedPages().size());
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
     * This test is to ensure that the DSL migration is not going to happen when RTS responds
     * current DSL version as the latest DSL version.
     */
    @Test
    @WithUserDetails("api_user")
    public void getPageAndMigrateDslByBranchAndDefaultPageId_WhenDslIsLatest_MigrationNotTriggered() {
        String uuid = UUID.randomUUID().toString();

        NewPage newPage = createApplication("App_" + uuid)
                .flatMap(application -> newPageService.getByIdWithoutPermissionCheck(
                        application.getPages().get(0).getId()))
                .block();

        // mock the dsMigrationUtils to return the current DSL version as the latest DSL version
        PageDTO unPublishedPageDTO = newPage.getUnpublishedPage();
        Layout layout = unPublishedPageDTO.getLayouts().get(0);
        int currentDslVersion = layout.getDsl().getAsNumber("version").intValue();
        Mockito.when(dslMigrationUtils.getLatestDslVersion()).thenReturn(Mono.just(currentDslVersion));

        StepVerifier.create(applicationPageService.getPageAndMigrateDslByBranchAndBasePageId(
                        newPage.getId(), null, false, true))
                .assertNext(pageDTO -> {
                    Layout layout2 = pageDTO.getLayouts().get(0);
                    assertThat(layout2.getDsl().getAsNumber("version").intValue())
                            .isEqualTo(currentDslVersion);
                })
                .verifyComplete();
    }

    /**
     * This test is to ensure that the DSL migration is triggered when RTS responds
     * older DSL version as the latest DSL version in edit mode.
     * In view mode, the DSL should be in view mode.
     */
    @Test
    @WithUserDetails("api_user")
    public void getPageAndMigrateDslByBranchAndDefaultPageId_WhenEditModeDslIsNotLatest_EditModeDslMigrated() {
        String uuid = UUID.randomUUID().toString();
        NewPage newPage = createApplication("App_" + uuid)
                .flatMap(application -> newPageService.getByIdWithoutPermissionCheck(
                        application.getPages().get(0).getId()))
                .block();

        // mock the dsMigrationUtils to return the (current DSL version-1) as the latest DSL version
        PageDTO unPublishedPageDTO = newPage.getUnpublishedPage();
        Layout layout = unPublishedPageDTO.getLayouts().get(0);
        JSONObject unpublishedDsl = layout.getDsl();
        int currentDslVersion = unpublishedDsl.getAsNumber("version").intValue();
        int olderDslVersion = currentDslVersion - 1;
        unpublishedDsl.put("version", olderDslVersion);

        // update the page to set older version dsl in edit mode
        newPageService.save(newPage).block();

        Mockito.when(dslMigrationUtils.getLatestDslVersion()).thenReturn(Mono.just(olderDslVersion + 1));

        // create a dsl after migration
        JSONObject dslAfterMigration = new JSONObject();
        dslAfterMigration.put("version", olderDslVersion + 1);
        dslAfterMigration.put("testKey", "testValue");

        Mockito.when(dslMigrationUtils.migratePageDsl(any(JSONObject.class))).thenReturn(Mono.just(dslAfterMigration));

        Mono<NewPage> newPageMono = applicationPageService
                .getPageAndMigrateDslByBranchAndBasePageId(newPage.getId(), null, false, true)
                .then(newPageService.getByIdWithoutPermissionCheck(newPage.getId()));

        StepVerifier.create(newPageMono)
                .assertNext(newpage -> {
                    // the edit mode dsl should be same as the dslAfterMigration
                    JSONObject unpublishedDslAfterMigration =
                            newpage.getUnpublishedPage().getLayouts().get(0).getDsl();
                    assertThat(unpublishedDslAfterMigration
                                    .getAsNumber("version")
                                    .intValue())
                            .isEqualTo(currentDslVersion);
                    assertThat(unpublishedDslAfterMigration.getAsString("testKey"))
                            .isEqualTo("testValue");

                    JSONObject publishedDslAfterMigration =
                            newpage.getPublishedPage().getLayouts().get(0).getDsl();
                    assertThat(publishedDslAfterMigration.getAsNumber("version").intValue())
                            .isEqualTo(currentDslVersion);
                    // testKey should not be found in the published dsl
                    assertThat(publishedDslAfterMigration.getAsString("testKey"))
                            .isNull();
                })
                .verifyComplete();
    }

    /**
     * This test is to ensure that the DSL migration is triggered when DSL does not have version
     */
    @Test
    @WithUserDetails("api_user")
    public void getPageAndMigrateDslByBranchAndDefaultPageId_WhenDSLHasNotVersion_DslMigratedToLatest() {
        String uuid = UUID.randomUUID().toString();
        NewPage newPage = createApplication("App_" + uuid)
                .flatMap(application -> newPageService.getByIdWithoutPermissionCheck(
                        application.getPages().get(0).getId()))
                .flatMap(page -> {
                    Layout layout = page.getUnpublishedPage().getLayouts().get(0);
                    JSONObject unpublishedDsl = layout.getDsl();
                    unpublishedDsl.remove("version"); // removing version from DSL
                    return newPageService.save(page);
                })
                .block();

        // update the page to set older version dsl in edit mode
        newPageService.save(newPage).block();

        int latestDslVersion = 999;

        // mock the dsMigrationUtils to return the latestDslVersion
        Mockito.when(dslMigrationUtils.getLatestDslVersion()).thenReturn(Mono.just(latestDslVersion));

        // the dsl that'll be returned by RTS after migration
        JSONObject dslAfterMigration = new JSONObject();
        dslAfterMigration.put("version", latestDslVersion);
        dslAfterMigration.put("testKey", "testValue");

        Mockito.when(dslMigrationUtils.migratePageDsl(any(JSONObject.class))).thenReturn(Mono.just(dslAfterMigration));

        Mono<NewPage> newPageMono = applicationPageService
                .getPageAndMigrateDslByBranchAndBasePageId(newPage.getId(), null, false, true)
                .then(newPageService.getByIdWithoutPermissionCheck(newPage.getId()));

        StepVerifier.create(newPageMono)
                .assertNext(newpage -> {
                    // the edit mode dsl should be same as the dslAfterMigration
                    JSONObject unpublishedDslAfterMigration =
                            newpage.getUnpublishedPage().getLayouts().get(0).getDsl();
                    assertThat(unpublishedDslAfterMigration
                                    .getAsNumber("version")
                                    .intValue())
                            .isEqualTo(latestDslVersion);
                    assertThat(unpublishedDslAfterMigration.getAsString("testKey"))
                            .isEqualTo("testValue");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void getPageAndMigrateDslByBranchAndDefaultPageId_WhenViewModeDslIsNotLatest_ViewModeDslMigrated() {
        String uuid = UUID.randomUUID().toString();
        NewPage newPage = createApplication("App_" + uuid)
                .flatMap(application -> newPageService.getByIdWithoutPermissionCheck(
                        application.getPages().get(0).getId()))
                .block();

        // mock the dsMigrationUtils to return the (current DSL version-1) as the latest DSL version
        PageDTO publishedPageDTO = newPage.getPublishedPage();
        Layout layout = publishedPageDTO.getLayouts().get(0);
        JSONObject publishedDsl = layout.getDsl();
        int currentDslVersion = publishedDsl.getAsNumber("version").intValue();
        int olderDslVersion = currentDslVersion - 1;
        publishedDsl.put("version", olderDslVersion);

        // update the page to set older version dsl in view mode
        newPageService.save(newPage).block();

        Mockito.when(dslMigrationUtils.getLatestDslVersion()).thenReturn(Mono.just(olderDslVersion + 1));

        // create a dsl after migration
        JSONObject dslAfterMigration = new JSONObject();
        dslAfterMigration.put("version", olderDslVersion + 1);
        dslAfterMigration.put("testKey", "testValue");

        Mockito.when(dslMigrationUtils.migratePageDsl(any(JSONObject.class))).thenReturn(Mono.just(dslAfterMigration));

        Mono<NewPage> newPageMono = applicationPageService
                .getPageAndMigrateDslByBranchAndBasePageId(newPage.getId(), null, true, true)
                .then(newPageService.getByIdWithoutPermissionCheck(newPage.getId()));

        StepVerifier.create(newPageMono)
                .assertNext(newpage -> {
                    // testKey should not be found in the unpublished dsl
                    JSONObject unpublishedDslAfterMigration =
                            newpage.getUnpublishedPage().getLayouts().get(0).getDsl();
                    assertThat(unpublishedDslAfterMigration
                                    .getAsNumber("version")
                                    .intValue())
                            .isEqualTo(currentDslVersion);
                    assertThat(unpublishedDslAfterMigration.getAsString("testKey"))
                            .isNull();

                    // the view mode dsl should be same as the dslAfterMigration
                    JSONObject publishedDslAfterMigration =
                            newpage.getPublishedPage().getLayouts().get(0).getDsl();
                    assertThat(publishedDslAfterMigration.getAsNumber("version").intValue())
                            .isEqualTo(currentDslVersion);
                    assertThat(publishedDslAfterMigration.getAsString("testKey"))
                            .isEqualTo("testValue");
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
        GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
        gitArtifactMetadata.setRefName("branch1");
        application.setGitApplicationMetadata(gitArtifactMetadata);

        Mono<Application> importAppMono = applicationPageService
                .createApplication(application, workspace.getId())
                .flatMap(createdApp -> {
                    createdApp.getGitApplicationMetadata().setDefaultApplicationId(createdApp.getId());
                    return applicationService.save(createdApp);
                })
                .flatMap(createdApp -> {
                    createdApp.setId(null);
                    createdApp.getGitApplicationMetadata().setRefName("branch2");
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

    @Test
    @WithUserDetails("api_user")
    public void createApplicationWithId_throwsException() {
        final String appName = "app" + UUID.randomUUID();
        Application application = new Application();
        application.setName(appName);
        String id = "anyIdHere";
        application.setId(id);

        Mono<Application> createApplicationMono =
                applicationPageService.createApplication(application, workspace.getId());

        StepVerifier.create(createApplicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.ID, id)))
                .verify();
    }

    @Test
    @WithUserDetails("api_user")
    public void verifyGetPagesBasedOnApplicationMode_ReturnsRigthNumberOfPages_BasedOnApplicationMode() {
        final String appName = "app" + UUID.randomUUID();
        Application application = new Application();
        application.setName(appName);

        Application createdApplication = applicationPageService
                .createApplication(application, workspace.getId())
                .block();

        String applicationId = createdApplication.getId();

        PageDTO pageDTO = new PageDTO();
        pageDTO.setApplicationId(applicationId);
        final String pageName = "app" + UUID.randomUUID();
        pageDTO.setName(pageName);
        applicationPageService.createPage(pageDTO).block();

        applicationPageService.publish(applicationId, true).block();

        PageDTO pageDTO1 = new PageDTO();
        pageDTO1.setApplicationId(applicationId);
        final String unpublishedPageName = "app" + UUID.randomUUID();
        pageDTO1.setName(unpublishedPageName);
        applicationPageService.createPage(pageDTO1).block();

        Application updatedApplication =
                applicationService.findById(createdApplication.getId()).block();

        Mono<List<NewPage>> unpublishedPagesMono =
                applicationPageService.getPagesBasedOnApplicationMode(updatedApplication, ApplicationMode.EDIT);

        Mono<List<NewPage>> publishedPagesMono =
                applicationPageService.getPagesBasedOnApplicationMode(updatedApplication, ApplicationMode.PUBLISHED);

        StepVerifier.create(publishedPagesMono)
                .assertNext(pages -> {
                    assertThat(pages.size()).isEqualTo(2);
                    Set<String> pageNames = pages.stream()
                            .map(page -> page.getPublishedPage().getName())
                            .collect(Collectors.toSet());
                    assertThat(pageNames).contains(pageName);
                    assertThat(pageNames).doesNotContain(unpublishedPageName);
                })
                .verifyComplete();

        StepVerifier.create(unpublishedPagesMono)
                .assertNext(pages -> {
                    assertThat(pages.size()).isEqualTo(3);
                    Set<String> pageNames = pages.stream()
                            .map(page -> page.getUnpublishedPage().getName())
                            .collect(Collectors.toSet());
                    assertThat(pageNames).contains(pageName);
                    assertThat(pageNames).contains(unpublishedPageName);
                })
                .verifyComplete();
    }
}
