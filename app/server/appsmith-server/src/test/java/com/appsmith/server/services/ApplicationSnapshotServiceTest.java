package com.appsmith.server.services;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationSnapshot;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.Workspace;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.function.Tuple2;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
public class ApplicationSnapshotServiceTest {
    @Autowired
    private ApplicationPageService applicationPageService;

    @Autowired
    private ApplicationSnapshotService applicationSnapshotService;

    @Autowired
    private WorkspaceService workspaceService;

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
                .flatMap(applicationId -> applicationSnapshotService.getWithoutApplicationJsonByApplicationId(applicationId, null));

        StepVerifier.create(snapshotMono)
                .assertNext(snapshot -> {
                    assertThat(snapshot.getApplicationId()).isNotNull();
                    assertThat(snapshot.getApplicationJson()).isNull();
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
                .flatMap(applicationId -> applicationSnapshotService.getWithoutApplicationJsonByApplicationId(applicationId, null));

        StepVerifier.create(snapshotMono)
                .assertNext(snapshot -> {
                    assertThat(snapshot.getApplicationId()).isNotNull();
                    assertThat(snapshot.getApplicationJson()).isNull();
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
                        .then(applicationSnapshotService.getWithoutApplicationJsonByApplicationId(testDefaultAppId, testBranchName))
                        .zipWith(Mono.just(application)));

        StepVerifier.create(tuple2Mono)
                .assertNext(objects -> {
                    ApplicationSnapshot applicationSnapshot = objects.getT1();
                    Application application = objects.getT2();
                    assertThat(applicationSnapshot.getApplicationJson()).isNull();
                    assertThat(applicationSnapshot.getApplicationId()).isEqualTo(application.getId());
                })
                .verifyComplete();
    }
}