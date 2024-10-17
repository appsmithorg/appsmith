package com.appsmith.server.git.autocommit.helpers;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.AutoCommitConfig;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.GitProfile;
import com.appsmith.server.dtos.AutoCommitResponseDTO;
import com.appsmith.server.events.AutoCommitEvent;
import com.appsmith.server.extensions.AfterAllCleanUpExtension;
import com.appsmith.server.git.autocommit.AutoCommitEventHandler;
import com.appsmith.server.git.common.CommonGitService;
import com.appsmith.server.helpers.GitPrivateRepoHelper;
import com.appsmith.server.helpers.RedisUtils;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.solutions.ApplicationPermission;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.lib.BranchTrackingStatus;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static com.appsmith.server.dtos.AutoCommitResponseDTO.AutoCommitResponse.IDLE;
import static com.appsmith.server.dtos.AutoCommitResponseDTO.AutoCommitResponse.IN_PROGRESS;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;

@ExtendWith({AfterAllCleanUpExtension.class})
@SpringBootTest
@Slf4j
public class GitAutoCommitHelperImplTest {

    @MockBean
    AutoCommitEventHandler autoCommitEventHandler;

    @MockBean
    ApplicationService applicationService;

    @MockBean
    CommonGitService commonGitService;

    @MockBean
    UserDataService userDataService;

    @SpyBean
    RedisUtils redisUtils;

    @MockBean
    GitPrivateRepoHelper gitPrivateRepoHelper;

    @Autowired
    ApplicationPermission applicationPermission;

    @Autowired
    GitAutoCommitHelper gitAutoCommitHelper;

    @MockBean
    BranchTrackingStatus branchTrackingStatus;

    private static final String defaultApplicationId = "default-app-id", branchName = "develop";

    @AfterEach
    public void afterTest() {
        redisUtils.finishAutoCommit(defaultApplicationId).block();
    }

    @Test
    public void autoCommitApplication_WhenBranchIsProtected_AutoCommitNotTriggered() {
        Application application = new Application();
        application.setId(defaultApplicationId);
        application.setGitApplicationMetadata(new GitArtifactMetadata());

        Mockito.when(applicationService.findById(defaultApplicationId, applicationPermission.getEditPermission()))
                .thenReturn(Mono.just(application));
        Mockito.when(gitPrivateRepoHelper.isBranchProtected(any(GitArtifactMetadata.class), eq(branchName)))
                .thenReturn(Mono.just(Boolean.TRUE));
        Mockito.when(applicationService.findByBranchNameAndBaseApplicationId(
                        anyString(), anyString(), any(AclPermission.class)))
                .thenReturn(Mono.just(application));

        StepVerifier.create(gitAutoCommitHelper.autoCommitClientMigration(defaultApplicationId, branchName))
                .assertNext(aBoolean -> {
                    assertThat(aBoolean).isFalse();
                })
                .verifyComplete();
    }

    @Test
    public void autoCommitApplication_WhenAutoCommitDisabled_AutoCommitNotTriggered() {
        Application application = new Application();
        application.setId(defaultApplicationId);
        GitArtifactMetadata metadata = new GitArtifactMetadata();
        metadata.setAutoCommitConfig(new AutoCommitConfig());
        metadata.getAutoCommitConfig().setEnabled(Boolean.FALSE);
        application.setGitApplicationMetadata(metadata);

        Mockito.when(applicationService.findById(defaultApplicationId, applicationPermission.getEditPermission()))
                .thenReturn(Mono.just(application));
        Mockito.when(applicationService.findByBranchNameAndBaseApplicationId(
                        anyString(), anyString(), any(AclPermission.class)))
                .thenReturn(Mono.just(application));
        Mockito.when(gitPrivateRepoHelper.isBranchProtected(any(GitArtifactMetadata.class), eq(branchName)))
                .thenReturn(Mono.just(Boolean.FALSE));

        StepVerifier.create(gitAutoCommitHelper.autoCommitClientMigration(defaultApplicationId, branchName))
                .assertNext(aBoolean -> {
                    assertThat(aBoolean).isFalse();
                })
                .verifyComplete();
    }

    @Test
    public void autoCommitApplication_WhenAnotherCommitIsRunning_AutoCommitNotTriggered() {
        Application application = new Application();
        application.setId(defaultApplicationId);
        application.setGitApplicationMetadata(new GitArtifactMetadata());

        Mockito.when(applicationService.findById(defaultApplicationId, applicationPermission.getEditPermission()))
                .thenReturn(Mono.just(application));
        Mockito.when(gitPrivateRepoHelper.isBranchProtected(any(GitArtifactMetadata.class), eq(branchName)))
                .thenReturn(Mono.just(Boolean.FALSE));
        Mockito.when(applicationService.findByBranchNameAndBaseApplicationId(
                        anyString(), anyString(), any(AclPermission.class)))
                .thenReturn(Mono.just(application));

        Mono<Boolean> autoCommitMono = redisUtils
                .startAutoCommit(defaultApplicationId, branchName)
                .then(gitAutoCommitHelper.autoCommitClientMigration(defaultApplicationId, branchName));

        StepVerifier.create(autoCommitMono)
                .assertNext(aBoolean -> {
                    assertThat(aBoolean).isFalse();
                })
                .verifyComplete();
    }

    @Test
    public void autoCommitApplication_WhenAllConditionsMatched_AutoCommitTriggered() {
        Application application = new Application();
        application.setWorkspaceId("sample-workspace-id");
        GitArtifactMetadata metaData = new GitArtifactMetadata();
        metaData.setRepoName("test-repo-name");

        GitAuth gitAuth = new GitAuth();
        gitAuth.setPrivateKey("private-key");
        gitAuth.setPublicKey("public-key");
        metaData.setGitAuth(gitAuth);
        application.setGitApplicationMetadata(metaData);

        Mockito.when(applicationService.findById(defaultApplicationId, applicationPermission.getEditPermission()))
                .thenReturn(Mono.just(application));
        Mockito.when(applicationService.findByBranchNameAndBaseApplicationId(
                        anyString(), anyString(), any(AclPermission.class)))
                .thenReturn(Mono.just(application));

        Mockito.when(commonGitService.fetchRemoteChanges(any(Application.class), any(Application.class), anyBoolean()))
                .thenReturn(Mono.just(branchTrackingStatus));

        Mockito.when(branchTrackingStatus.getBehindCount()).thenReturn(0);

        Mockito.when(gitPrivateRepoHelper.isBranchProtected(any(GitArtifactMetadata.class), eq(branchName)))
                .thenReturn(Mono.just(Boolean.FALSE));

        GitProfile gitProfile = new GitProfile();
        gitProfile.setAuthorEmail("user@example.com");
        gitProfile.setAuthorName("test user name");

        Mockito.when(userDataService.getGitProfileForCurrentUser(defaultApplicationId))
                .thenReturn(Mono.just(gitProfile));

        // we'll verify publish event is triggered with this same AutoCommitEvent
        AutoCommitEvent autoCommitEvent = new AutoCommitEvent();
        autoCommitEvent.setApplicationId(defaultApplicationId);
        autoCommitEvent.setBranchName(branchName);
        autoCommitEvent.setAuthorEmail(gitProfile.getAuthorEmail());
        autoCommitEvent.setAuthorName(gitProfile.getAuthorName());
        autoCommitEvent.setWorkspaceId(application.getWorkspaceId());
        autoCommitEvent.setRepoName(application.getGitApplicationMetadata().getRepoName());
        autoCommitEvent.setPrivateKey(gitAuth.getPrivateKey());
        autoCommitEvent.setPublicKey(gitAuth.getPublicKey());
        autoCommitEvent.setIsServerSideEvent(null);
        autoCommitEvent.setIsClientSideEvent(Boolean.TRUE);

        StepVerifier.create(gitAutoCommitHelper.autoCommitClientMigration(defaultApplicationId, branchName))
                .assertNext(aBoolean -> {
                    assertThat(aBoolean).isTrue();
                    Mockito.verify(autoCommitEventHandler).publish(autoCommitEvent);
                })
                .verifyComplete();
    }

    @Test
    public void getAutoCommitProgress_WhenAutoCommitRunning_ReturnsValidResponse() {
        Mono<AutoCommitResponseDTO> progressDTOMono = redisUtils
                .startAutoCommit(defaultApplicationId, branchName)
                .then(redisUtils.setAutoCommitProgress(defaultApplicationId, 20))
                .then(gitAutoCommitHelper.getAutoCommitProgress(defaultApplicationId, branchName));

        StepVerifier.create(progressDTOMono)
                .assertNext(dto -> {
                    assertThat(dto.getAutoCommitResponse()).isEqualTo(IN_PROGRESS);
                    assertThat(dto.getProgress()).isEqualTo(20);
                    assertThat(dto.getBranchName()).isEqualTo(branchName);
                })
                .verifyComplete();
    }

    @Test
    public void getAutoCommitProgress_WhenNoAutoCommitFinished_ReturnsValidResponse() {
        Mono<AutoCommitResponseDTO> progressDTOMono = redisUtils
                .startAutoCommit(defaultApplicationId, branchName)
                .then(redisUtils.setAutoCommitProgress(defaultApplicationId, 20))
                .then(redisUtils.finishAutoCommit(defaultApplicationId))
                .then(gitAutoCommitHelper.getAutoCommitProgress(defaultApplicationId, branchName));

        StepVerifier.create(progressDTOMono)
                .assertNext(dto -> {
                    assertThat(dto.getAutoCommitResponse()).isEqualTo(IDLE);
                    assertThat(dto.getProgress()).isZero();
                    assertThat(dto.getBranchName()).isNull();
                })
                .verifyComplete();
    }

    @Test
    public void getAutoCommitProgress_WhenNoAutoCommitRunning_ReturnsValidResponse() {
        Mono<AutoCommitResponseDTO> progressDTOMono =
                gitAutoCommitHelper.getAutoCommitProgress(defaultApplicationId, branchName);
        StepVerifier.create(progressDTOMono)
                .assertNext(dto -> {
                    assertThat(dto.getAutoCommitResponse()).isEqualTo(IDLE);
                    assertThat(dto.getProgress()).isZero();
                    assertThat(dto.getBranchName()).isNull();
                })
                .verifyComplete();
    }

    @Test
    public void autoCommitApplication_WhenRemoteAhead_AutoCommitNotTriggered() {

        Application application = new Application();
        application.setId(defaultApplicationId);
        GitArtifactMetadata metadata = new GitArtifactMetadata();
        metadata.setAutoCommitConfig(new AutoCommitConfig());
        metadata.getAutoCommitConfig().setEnabled(Boolean.TRUE);
        application.setGitApplicationMetadata(metadata);

        Mockito.when(applicationService.findById(defaultApplicationId, applicationPermission.getEditPermission()))
                .thenReturn(Mono.just(application));
        Mockito.when(applicationService.findByBranchNameAndBaseApplicationId(
                        anyString(), anyString(), any(AclPermission.class)))
                .thenReturn(Mono.just(application));
        Mockito.when(commonGitService.fetchRemoteChanges(any(Application.class), any(Application.class), anyBoolean()))
                .thenReturn(Mono.just(branchTrackingStatus));

        Mockito.when(branchTrackingStatus.getBehindCount()).thenReturn(1);
        Mockito.when(gitPrivateRepoHelper.isBranchProtected(any(GitArtifactMetadata.class), eq(branchName)))
                .thenReturn(Mono.just(Boolean.FALSE));

        StepVerifier.create(gitAutoCommitHelper.autoCommitClientMigration(defaultApplicationId, branchName))
                .assertNext(aBoolean -> {
                    assertThat(aBoolean).isFalse();
                })
                .verifyComplete();
    }

    @Test
    public void autoCommitApplication_WhenServerRequiresMigration_successIfEverythingIsRight() {
        Application application = new Application();
        application.setWorkspaceId("sample-workspace-id");
        GitArtifactMetadata metaData = new GitArtifactMetadata();
        metaData.setRepoName("test-repo-name");
        metaData.setDefaultApplicationId(defaultApplicationId);
        metaData.setBranchName(branchName);

        GitAuth gitAuth = new GitAuth();
        gitAuth.setPrivateKey("private-key");
        gitAuth.setPublicKey("public-key");
        metaData.setGitAuth(gitAuth);

        application.setGitApplicationMetadata(metaData);

        Mockito.when(applicationService.findById(anyString(), any(AclPermission.class)))
                .thenReturn(Mono.just(application));

        Mockito.when(applicationService.findByBranchNameAndBaseApplicationId(
                        anyString(), anyString(), any(AclPermission.class)))
                .thenReturn(Mono.just(application));

        Mockito.when(commonGitService.fetchRemoteChanges(any(Application.class), any(Application.class), anyBoolean()))
                .thenReturn(Mono.just(branchTrackingStatus));

        Mockito.when(branchTrackingStatus.getBehindCount()).thenReturn(0);

        Mockito.when(gitPrivateRepoHelper.isBranchProtected(any(GitArtifactMetadata.class), eq(branchName)))
                .thenReturn(Mono.just(Boolean.FALSE));

        GitProfile gitProfile = new GitProfile();
        gitProfile.setAuthorEmail("user@example.com");
        gitProfile.setAuthorName("test user name");

        Mockito.when(userDataService.getGitProfileForCurrentUser(defaultApplicationId))
                .thenReturn(Mono.just(gitProfile));

        StepVerifier.create(gitAutoCommitHelper.autoCommitServerMigration(defaultApplicationId, branchName))
                .assertNext(isAutoCommitPublished -> {
                    assertThat(isAutoCommitPublished).isTrue();
                })
                .verifyComplete();
    }

    @Test
    public void autoCommitApplication_WhenServerDoesNotRequireMigration_returnFalse() {
        Application application = new Application();
        application.setWorkspaceId("sample-workspace-id");
        GitArtifactMetadata metaData = new GitArtifactMetadata();
        metaData.setRepoName("test-repo-name");
        metaData.setDefaultApplicationId(defaultApplicationId);
        metaData.setBranchName(branchName);

        GitAuth gitAuth = new GitAuth();
        gitAuth.setPrivateKey("private-key");
        gitAuth.setPublicKey("public-key");
        metaData.setGitAuth(gitAuth);
        application.setGitApplicationMetadata(metaData);

        Mockito.when(applicationService.findById(anyString(), any(AclPermission.class)))
                .thenReturn(Mono.just(application));

        Mockito.when(applicationService.findByBranchNameAndBaseApplicationId(
                        anyString(), anyString(), any(AclPermission.class)))
                .thenReturn(Mono.just(application));

        StepVerifier.create(gitAutoCommitHelper.autoCommitServerMigration(defaultApplicationId, branchName))
                .assertNext(isAutoCommitPublished -> {
                    assertThat(isAutoCommitPublished).isFalse();
                })
                .verifyComplete();
    }
}
