package com.appsmith.server.services;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.ApplicationSnapshot;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ApplicationPagesDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.repositories.ApplicationSnapshotRepository;
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

    @Test
    @WithUserDetails("api_user")
    public void createApplicationSnapshot_WhenNoPreviousSnapshotExists_NewCreated() {
        // create a new workspace
        Workspace workspace = new Workspace();
        workspace.setName("Test workspace " + UUID.randomUUID());

        Mono<ApplicationSnapshot> snapshotMono = workspaceService.create(workspace)
                .flatMap(createdWorkspace -> {
                    Application testApplication = new Application();
                    testApplication.setName("Test app for snapshot");
                    testApplication.setWorkspaceId(createdWorkspace.getId());
                    return applicationPageService.createApplication(testApplication);
                })
                .flatMap(application -> {
                    assert application.getId() != null;
                    return applicationSnapshotService.createApplicationSnapshot(application.getId(), "")
                            .thenReturn(application.getId());
                })
                .flatMap(applicationId -> applicationSnapshotService.getWithoutDataByApplicationId(applicationId, null));

        StepVerifier.create(snapshotMono)
                .assertNext(snapshot -> {
                    assertThat(snapshot.getApplicationId()).isNotNull();
                    assertThat(snapshot.getData()).isNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void createApplicationSnapshot_WhenSnapshotExists_ExistingSnapshotUpdated() {
        // create a new workspace
        Workspace workspace = new Workspace();
        workspace.setName("Test workspace " + UUID.randomUUID());

        Mono<ApplicationSnapshot> snapshotMono = workspaceService.create(workspace)
                .flatMap(createdWorkspace -> {
                    Application testApplication = new Application();
                    testApplication.setName("Test app for snapshot");
                    testApplication.setWorkspaceId(createdWorkspace.getId());
                    return applicationPageService.createApplication(testApplication);
                })
                .flatMap(application -> {
                    assert application.getId() != null;
                    // create snapshot twice
                    return applicationSnapshotService.createApplicationSnapshot(application.getId(), "")
                            .then(applicationSnapshotService.createApplicationSnapshot(application.getId(), ""))
                            .thenReturn(application.getId());
                })
                .flatMap(applicationId -> applicationSnapshotService.getWithoutDataByApplicationId(applicationId, null));

        StepVerifier.create(snapshotMono)
                .assertNext(snapshot -> {
                    assertThat(snapshot.getApplicationId()).isNotNull();
                    assertThat(snapshot.getData()).isNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void createApplicationSnapshot_WhenGitBranchExists_SnapshotCreatedWithBranchedAppId() {
        String uniqueString = UUID.randomUUID().toString();
        String testDefaultAppId = "default-app-" + uniqueString;
        String testBranchName = "hello/world";
        // create a new workspace
        Workspace workspace = new Workspace();
        workspace.setName("Test workspace " + uniqueString);

        Mono<Tuple2<ApplicationSnapshot, Application>> tuple2Mono = workspaceService.create(workspace)
                .flatMap(createdWorkspace -> {
                    Application testApplication = new Application();
                    testApplication.setName("Test app for snapshot");
                    testApplication.setWorkspaceId(createdWorkspace.getId());

                    // this app will have default app id=testDefaultAppId and branch name=test branch name
                    GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
                    gitApplicationMetadata.setDefaultApplicationId(testDefaultAppId);
                    gitApplicationMetadata.setBranchName(testBranchName);
                    testApplication.setGitApplicationMetadata(gitApplicationMetadata);

                    return applicationPageService.createApplication(testApplication);
                })
                .flatMap(application -> applicationSnapshotService.createApplicationSnapshot(testDefaultAppId, testBranchName)
                        .then(applicationSnapshotService.getWithoutDataByApplicationId(testDefaultAppId, testBranchName))
                        .zipWith(Mono.just(application)));

        StepVerifier.create(tuple2Mono)
                .assertNext(objects -> {
                    ApplicationSnapshot applicationSnapshot = objects.getT1();
                    Application application = objects.getT2();
                    assertThat(applicationSnapshot.getData()).isNull();
                    assertThat(applicationSnapshot.getApplicationId()).isEqualTo(application.getId());
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
        Workspace workspace = new Workspace();
        workspace.setName("Test workspace " + uniqueString);

        Flux<ApplicationSnapshot> applicationSnapshotFlux = workspaceService.create(workspace)
                .flatMap(createdWorkspace -> {
                    Application testApplication = new Application();
                    testApplication.setName("Test app for snapshot");
                    testApplication.setWorkspaceId(createdWorkspace.getId());
                    return applicationPageService.createApplication(testApplication);
                })
                .flatMap(application -> {
                    ApplicationSnapshot applicationSnapshot = new ApplicationSnapshot();
                    applicationSnapshot.setApplicationId(application.getId());
                    applicationSnapshot.setChunkOrder(5);
                    applicationSnapshot.setData("Hello".getBytes(StandardCharsets.UTF_8));
                    return applicationSnapshotRepository.save(applicationSnapshot).thenReturn(application);
                })
                .flatMapMany(application ->
                        applicationSnapshotService.createApplicationSnapshot(application.getId(), null)
                                .thenMany(applicationSnapshotRepository.findByApplicationId(application.getId()))
                );

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

        // create a new workspace
        Workspace workspace = new Workspace();
        workspace.setName("Test workspace " + uniqueString);

        Mono<Application> applicationMono = workspaceService.create(workspace)
                .flatMap(createdWorkspace -> {
                    Application testApplication = new Application();
                    testApplication.setName("App before snapshot");
                    return applicationPageService.createApplication(testApplication, workspace.getId());
                }).cache();

        Mono<ApplicationPagesDTO> pagesBeforeSnapshot = applicationMono
                .flatMap(createdApp -> {
                    // add a page to the application
                    PageDTO pageDTO = new PageDTO();
                    pageDTO.setName("Home");
                    pageDTO.setApplicationId(createdApp.getId());
                    return applicationPageService.createPage(pageDTO)
                            .then(newPageService.findApplicationPages(createdApp.getId(), null, null, ApplicationMode.EDIT));
                });

        Mono<ApplicationPagesDTO> pagesAfterSnapshot = applicationMono.flatMap(application -> { // create a snapshot
            return applicationSnapshotService.createApplicationSnapshot(application.getId(), null)
                    .thenReturn(application);
        }).flatMap(application -> { // add a new page to the application
            PageDTO pageDTO = new PageDTO();
            pageDTO.setName("About");
            pageDTO.setApplicationId(application.getId());
            return applicationPageService.createPage(pageDTO)
                    .then(applicationSnapshotService.restoreSnapshot(application.getId(), null))
                .then(newPageService.findApplicationPages(application.getId(), null, null, ApplicationMode.EDIT));
    });

        // not using Mono.zip because we want pagesBeforeSnapshot to finish first
        Mono<Tuple2<ApplicationPagesDTO, ApplicationPagesDTO>> tuple2Mono = pagesBeforeSnapshot
                .flatMap(applicationPagesDTO -> pagesAfterSnapshot.zipWith(Mono.just(applicationPagesDTO)));

        StepVerifier.create(tuple2Mono)
            .assertNext(objects -> {
                ApplicationPagesDTO beforePages = objects.getT2();
                ApplicationPagesDTO afterPages = objects.getT1();
                assertThat(beforePages.getPages().size()).isEqualTo(afterPages.getPages().size());
            })
            .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void restoreSnapshot_WhenSuccessfullyRestored_SnapshotDeleted() {
        String uniqueString = UUID.randomUUID().toString();

        // create a new workspace
        Workspace workspace = new Workspace();
        workspace.setName("Test workspace " + uniqueString);

        Flux<ApplicationSnapshot> snapshotFlux = workspaceService.create(workspace)
                .flatMap(createdWorkspace -> {
                    Application testApplication = new Application();
                    testApplication.setName("App before snapshot");
                    return applicationPageService.createApplication(testApplication, workspace.getId());
                }).flatMap(application -> { // create a snapshot
                    return applicationSnapshotService.createApplicationSnapshot(application.getId(), null)
                            .thenReturn(application);
                })
                .flatMapMany(application ->
                        applicationSnapshotService.restoreSnapshot(application.getId(), null)
                                .thenMany(applicationSnapshotRepository.findByApplicationId(application.getId()))
                );

        StepVerifier.create(snapshotFlux)
                .verifyComplete();
    }

    @Test
    public void deleteSnapshot_WhenSnapshotExists_Deleted() {
        String testAppId = "app-" + UUID.randomUUID().toString();
        ApplicationSnapshot snapshot1 = new ApplicationSnapshot();
        snapshot1.setChunkOrder(1);
        snapshot1.setApplicationId(testAppId);

        ApplicationSnapshot snapshot2 = new ApplicationSnapshot();
        snapshot2.setApplicationId(testAppId);
        snapshot2.setChunkOrder(2);

        Flux<ApplicationSnapshot> snapshotFlux = applicationSnapshotRepository.saveAll(List.of(snapshot1, snapshot2))
                .then(applicationSnapshotService.deleteSnapshot(testAppId, null))
                .thenMany(applicationSnapshotRepository.findByApplicationId(testAppId));

        StepVerifier.create(snapshotFlux)
                .verifyComplete();
    }
}