package com.appsmith.server.services;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.ApplicationSnapshot;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ApplicationPagesDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.projections.ApplicationSnapshotResponseDTO;
import com.appsmith.server.repositories.ApplicationSnapshotRepository;
import com.appsmith.server.solutions.ApplicationPermission;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.function.Tuple2;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
public class ApplicationSnapshotServiceTest {
    @Autowired
    private ApplicationPageService applicationPageService;

    @Autowired
    private NewPageService newPageService;

    @Autowired
    private ApplicationSnapshotService applicationSnapshotService;

    @Autowired
    private WorkspaceService workspaceService;

    @Autowired
    private ApplicationSnapshotRepository applicationSnapshotRepository;

    @Autowired
    private ApplicationService applicationService;

    @Autowired
    private ApplicationPermission applicationPermission;

    @Autowired
    SessionUserService sessionUserService;

    Workspace workspace;

    @BeforeEach
    public void setup() {
        User user = sessionUserService.getCurrentUser().block();
        if (null == user) {
            // Don't do any setup.
            return;
        }
        Workspace workspace1 = new Workspace();
        workspace1.setName("ApplicationSnapshotServiceTest");
        workspace = workspaceService.create(workspace1).block();
    }

    @AfterEach
    public void cleanup() {
        User user = sessionUserService.getCurrentUser().block();
        if (null == user) {
            // Since no setup is done, hence no cleanup should happen.
            return;
        }
        List<Application> deletedApplications = applicationPermission
                .getDeletePermission()
                .flatMapMany(permission -> applicationService.findByWorkspaceId(workspace.getId(), permission))
                .flatMap(remainingApplication -> applicationPageService.deleteApplication(remainingApplication.getId()))
                .collectList()
                .block();
        Workspace deletedWorkspace =
                workspaceService.archiveById(workspace.getId()).block();
    }

    @Test
    @WithUserDetails("api_user")
    public void createApplicationSnapshot_WhenNoPreviousSnapshotExists_NewCreated() {
        Application testApplication = new Application();
        testApplication.setName("Test app for snapshot");
        testApplication.setWorkspaceId(workspace.getId());
        Mono<ApplicationSnapshotResponseDTO> snapshotMono = applicationPageService
                .createApplication(testApplication)
                .flatMap(application -> {
                    assert application.getId() != null;
                    return applicationSnapshotService
                            .createApplicationSnapshot(application.getId())
                            .thenReturn(application.getId());
                })
                .flatMap(applicationId ->
                        applicationSnapshotService.getWithoutDataByBranchedApplicationId(applicationId));

        StepVerifier.create(snapshotMono)
                .assertNext(snapshot -> {
                    assertThat(snapshot.updatedAt()).isNotNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void createApplicationSnapshot_WhenSnapshotExists_ExistingSnapshotUpdated() {
        Application testApplication = new Application();
        testApplication.setName("Test app for snapshot");
        testApplication.setWorkspaceId(workspace.getId());
        Mono<ApplicationSnapshotResponseDTO> snapshotMono = applicationPageService
                .createApplication(testApplication)
                .flatMap(application -> {
                    assert application.getId() != null;
                    // create snapshot twice
                    return applicationSnapshotService
                            .createApplicationSnapshot(application.getId())
                            .then(applicationSnapshotService.createApplicationSnapshot(application.getId()))
                            .thenReturn(application.getId());
                })
                .flatMap(applicationId ->
                        applicationSnapshotService.getWithoutDataByBranchedApplicationId(applicationId));

        StepVerifier.create(snapshotMono)
                .assertNext(snapshot -> {
                    assertThat(snapshot.updatedAt()).isNotNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void createApplicationSnapshot_WhenGitBranchExists_SnapshotCreatedWithBranchedAppId() {
        String uniqueString = UUID.randomUUID().toString();
        String testDefaultAppId = "default-app-" + uniqueString;
        String testBranchName = "hello/world";
        Application testApplication = new Application();
        testApplication.setName("Test app for snapshot");
        testApplication.setWorkspaceId(workspace.getId());

        // this app will have default app id=testDefaultAppId and branch name=test branch name
        GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
        gitArtifactMetadata.setDefaultApplicationId(testDefaultAppId);
        gitArtifactMetadata.setRefName(testBranchName);
        testApplication.setGitApplicationMetadata(gitArtifactMetadata);
        Mono<Tuple2<ApplicationSnapshotResponseDTO, Application>> tuple2Mono = applicationPageService
                .createApplication(testApplication)
                .flatMap(application -> applicationSnapshotService
                        .createApplicationSnapshot(application.getId())
                        .then(applicationSnapshotService.getWithoutDataByBranchedApplicationId(application.getId()))
                        .zipWith(Mono.just(application)));

        StepVerifier.create(tuple2Mono)
                .assertNext(objects -> {
                    ApplicationSnapshotResponseDTO applicationSnapshot = objects.getT1();
                    assertThat(applicationSnapshot.updatedAt()).isNotNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void createApplicationSnapshot_OlderSnapshotExists_OlderSnapshotsRemoved() {
        String uniqueString = UUID.randomUUID().toString();
        String testDefaultAppId = "default-app-" + uniqueString;
        String testBranchName = null;
        // create a new workspace

        Application testApplication = new Application();
        testApplication.setName("Test app for snapshot");
        testApplication.setWorkspaceId(workspace.getId());
        Flux<ApplicationSnapshot> applicationSnapshotFlux = applicationPageService
                .createApplication(testApplication)
                .flatMap(application -> {
                    ApplicationSnapshot applicationSnapshot = new ApplicationSnapshot();
                    applicationSnapshot.setApplicationId(application.getId());
                    applicationSnapshot.setChunkOrder(5);
                    applicationSnapshot.setData("Hello".getBytes(StandardCharsets.UTF_8));
                    return applicationSnapshotRepository
                            .save(applicationSnapshot)
                            .thenReturn(application);
                })
                .flatMapMany(application -> applicationSnapshotService
                        .createApplicationSnapshot(application.getId())
                        .thenMany(applicationSnapshotRepository.findByApplicationId(application.getId())));

        StepVerifier.create(applicationSnapshotFlux)
                .assertNext(applicationSnapshot -> {
                    assertThat(applicationSnapshot.getChunkOrder()).isEqualTo(1);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void restoreSnapshot_WhenNewPagesAddedAfterSnapshotTaken_NewPagesRemovedAfterSnapshotIsRestored() {
        String uniqueString = UUID.randomUUID().toString();
        String testDefaultAppId = "default-app-" + uniqueString;
        String testBranchName = "hello/world";

        Application testApplication = new Application();
        testApplication.setName("App before snapshot");
        Mono<Application> applicationMono = applicationPageService
                .createApplication(testApplication, workspace.getId())
                .cache();

        Mono<ApplicationPagesDTO> pagesBeforeSnapshot = applicationMono.flatMap(createdApp -> {
            // add a page to the application
            PageDTO pageDTO = new PageDTO();
            pageDTO.setName("Home");
            pageDTO.setApplicationId(createdApp.getId());
            return applicationPageService
                    .createPage(pageDTO)
                    .then(newPageService.findApplicationPages(createdApp.getId(), null, ApplicationMode.EDIT));
        });

        Mono<ApplicationPagesDTO> pagesAfterSnapshot = applicationMono
                .flatMap(
                        application -> { // create a snapshot
                            return applicationSnapshotService
                                    .createApplicationSnapshot(application.getId())
                                    .thenReturn(application);
                        })
                .flatMap(
                        application -> { // add a new page to the application
                            PageDTO pageDTO = new PageDTO();
                            pageDTO.setName("About");
                            pageDTO.setApplicationId(application.getId());
                            return applicationPageService
                                    .createPage(pageDTO)
                                    .then(applicationSnapshotService.restoreSnapshot(application.getId()))
                                    .then(newPageService.findApplicationPages(
                                            application.getId(), null, ApplicationMode.EDIT));
                        });

        // not using Mono.zip because we want pagesBeforeSnapshot to finish first
        Mono<Tuple2<ApplicationPagesDTO, ApplicationPagesDTO>> tuple2Mono = pagesBeforeSnapshot.flatMap(
                applicationPagesDTO -> pagesAfterSnapshot.zipWith(Mono.just(applicationPagesDTO)));

        StepVerifier.create(tuple2Mono)
                .assertNext(objects -> {
                    ApplicationPagesDTO beforePages = objects.getT2();
                    ApplicationPagesDTO afterPages = objects.getT1();
                    assertThat(beforePages.getPages())
                            .hasSize(afterPages.getPages().size());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void restoreSnapshot_WhenSuccessfullyRestored_SnapshotDeleted() {
        Application testApplication = new Application();
        testApplication.setName("App before snapshot");
        Flux<ApplicationSnapshot> snapshotFlux = applicationPageService
                .createApplication(testApplication, workspace.getId())
                .flatMap(
                        application -> { // create a snapshot
                            return applicationSnapshotService
                                    .createApplicationSnapshot(application.getId())
                                    .thenReturn(application);
                        })
                .flatMapMany(application -> applicationSnapshotService
                        .restoreSnapshot(application.getId())
                        .thenMany(applicationSnapshotRepository.findByApplicationId(application.getId())));

        StepVerifier.create(snapshotFlux).verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void deleteSnapshot_WhenSnapshotExists_Deleted() {
        Application testApplication = new Application();
        testApplication.setName("Test app for snapshot delete");
        testApplication.setWorkspaceId(workspace.getId());

        Flux<ApplicationSnapshot> snapshotFlux = applicationPageService
                .createApplication(testApplication)
                .flatMapMany(application -> applicationSnapshotService
                        .createApplicationSnapshot(application.getId())
                        .then(applicationSnapshotService.deleteSnapshot(application.getId()))
                        .thenMany(applicationSnapshotRepository.findByApplicationId(application.getId())));

        StepVerifier.create(snapshotFlux).verifyComplete();
    }

    @Test
    @WithUserDetails("usertest@usertest.com")
    public void deleteSnapshot_WhenUserHasNoAccess_ThrowsError() {
        // usertest@usertest.com has no access to applications owned by api_user.
        // applicationService.findById applies ACL filtering, so an inaccessible app
        // and a non-existent app both produce an empty Mono → NO_RESOURCE_FOUND.
        String inaccessibleAppId = "app-" + UUID.randomUUID();

        Mono<Boolean> deleteMono = applicationSnapshotService.deleteSnapshot(inaccessibleAppId);

        StepVerifier.create(deleteMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .equals(AppsmithError.NO_RESOURCE_FOUND.getMessage(
                                        FieldName.APPLICATION, inaccessibleAppId)))
                .verify();
    }

    @Test
    @WithUserDetails("usertest@usertest.com")
    public void getWithoutDataByBranchedApplicationId_WhenUserHasNoAccess_ThrowsError() {
        String inaccessibleAppId = "app-" + UUID.randomUUID();

        Mono<ApplicationSnapshotResponseDTO> snapshotMono =
                applicationSnapshotService.getWithoutDataByBranchedApplicationId(inaccessibleAppId);

        StepVerifier.create(snapshotMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .equals(AppsmithError.NO_RESOURCE_FOUND.getMessage(
                                        FieldName.APPLICATION, inaccessibleAppId)))
                .verify();
    }

    @WithUserDetails("api_user")
    @Test
    public void getWithoutDataByApplicationId_WhenSnapshotNotFound_ReturnsEmptySnapshot() {
        Application testApplication = new Application();
        testApplication.setName("Test app for snapshot");
        testApplication.setWorkspaceId(workspace.getId());
        Mono<ApplicationSnapshotResponseDTO> applicationSnapshotMono = applicationPageService
                .createApplication(testApplication)
                .flatMap(application1 -> {
                    return applicationSnapshotService.getWithoutDataByBranchedApplicationId(application1.getId());
                });

        StepVerifier.create(applicationSnapshotMono)
                .assertNext(applicationSnapshot -> {
                    assertThat(applicationSnapshot.updatedAt()).isNull();
                })
                .verifyComplete();
    }
}
