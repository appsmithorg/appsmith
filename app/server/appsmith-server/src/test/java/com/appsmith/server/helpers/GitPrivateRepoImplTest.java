package com.appsmith.server.helpers;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.FeatureFlagService;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;

import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;

@ExtendWith(SpringExtension.class)
@Slf4j
@SpringBootTest
public class GitPrivateRepoImplTest {

    @SpyBean
    CommonConfig commonConfig;

    @Autowired
    GitPrivateRepoHelper gitPrivateRepoHelper;

    @MockBean
    FeatureFlagService featureFlagService;

    @MockBean
    GitCloudServicesUtils gitCloudServicesUtils;

    @MockBean
    ApplicationService applicationService;

    @BeforeEach
    void setup() {
        Mockito.when(gitCloudServicesUtils.getPrivateRepoLimitForOrg(anyString(), anyBoolean()))
                .thenReturn(Mono.just(3));
    }

    // For self hosted Appsmith EE images
    @Test
    public void isRepoLimitReached_anyState_whenFeatureIsEnabled_alwaysFalse() {
        Mockito.when(featureFlagService.check(FeatureFlagEnum.license_git_unlimited_repo_enabled))
                .thenReturn(Mono.just(TRUE));
        Mockito.when(commonConfig.isCloudHosting()).thenReturn(false);
        StepVerifier.create(gitPrivateRepoHelper.isRepoLimitReached(null, null))
                .assertNext(isRepoLimit -> assertEquals(false, isRepoLimit))
                .verifyComplete();

        StepVerifier.create(gitPrivateRepoHelper.isRepoLimitReached("", true))
                .assertNext(isRepoLimit -> assertEquals(false, isRepoLimit))
                .verifyComplete();

        StepVerifier.create(gitPrivateRepoHelper.isRepoLimitReached("workspaceId", false))
                .assertNext(isRepoLimit -> assertEquals(false, isRepoLimit))
                .verifyComplete();
    }

    @Test
    public void isRepoLimitReached_anyState_whenFeatureIsDisabled_hasLimitOnRepoCount() {
        Mockito.when(featureFlagService.check(FeatureFlagEnum.license_git_unlimited_repo_enabled))
                .thenReturn(Mono.just(FALSE));
        Mockito.when(commonConfig.isCloudHosting()).thenReturn(false);

        Mockito.when(applicationService.getGitConnectedApplicationsCountWithPrivateRepoByWorkspaceId(anyString()))
                .thenReturn(Mono.just(1L));
        StepVerifier.create(gitPrivateRepoHelper.isRepoLimitReached("workspaceId", true))
                .assertNext(isRepoLimit -> assertEquals(false, isRepoLimit))
                .verifyComplete();

        Mockito.when(applicationService.getGitConnectedApplicationsCountWithPrivateRepoByWorkspaceId(anyString()))
                .thenReturn(Mono.just(4L));
        StepVerifier.create(gitPrivateRepoHelper.isRepoLimitReached("workspaceId", false))
                .assertNext(isRepoLimit -> assertEquals(true, isRepoLimit))
                .verifyComplete();
    }

    @Test
    public void isRepoLimitReached_AppsmithCloudRunningEEImage_whenFeatureIsEnabled_hasLimitOnRepoCount() {

        Mockito.when(commonConfig.isCloudHosting()).thenReturn(true);
        Mockito.when(featureFlagService.check(FeatureFlagEnum.license_git_unlimited_repo_enabled))
                .thenReturn(Mono.just(TRUE));

        Mockito.when(applicationService.getGitConnectedApplicationsCountWithPrivateRepoByWorkspaceId(anyString()))
                .thenReturn(Mono.just(1L));

        StepVerifier.create(gitPrivateRepoHelper.isRepoLimitReached("", false))
                .assertNext(isRepoLimit -> assertEquals(false, isRepoLimit))
                .verifyComplete();

        // Assertions after connecting 3 private repos
        Mockito.when(applicationService.getGitConnectedApplicationsCountWithPrivateRepoByWorkspaceId(anyString()))
                .thenReturn(Mono.just(3L));

        StepVerifier.create(gitPrivateRepoHelper.isRepoLimitReached("", true))
                .assertNext(isRepoLimit -> assertEquals(true, isRepoLimit))
                .verifyComplete();
    }

    @Test
    public void isRepoLimitReached_AppsmithCloudRunningEEImage_whenFeatureIsDisabled_hasLimitOnRepoCount() {

        Mockito.when(commonConfig.isCloudHosting()).thenReturn(true);
        Mockito.when(featureFlagService.check(FeatureFlagEnum.license_git_unlimited_repo_enabled))
                .thenReturn(Mono.just(FALSE));

        // False because there are no git connected apps
        Mockito.when(applicationService.getGitConnectedApplicationsCountWithPrivateRepoByWorkspaceId(anyString()))
                .thenReturn(Mono.just(1L));

        StepVerifier.create(gitPrivateRepoHelper.isRepoLimitReached("", false))
                .assertNext(isRepoLimit -> assertEquals(false, isRepoLimit))
                .verifyComplete();

        // Connect 3 private repos
        Mockito.when(applicationService.getGitConnectedApplicationsCountWithPrivateRepoByWorkspaceId(anyString()))
                .thenReturn(Mono.just(3L));

        StepVerifier.create(gitPrivateRepoHelper.isRepoLimitReached("", true))
                .assertNext(isRepoLimit -> assertEquals(true, isRepoLimit))
                .verifyComplete();
    }

    /*
     * This test is to check if the isProtected method returns false when the cloud hosting flag is true - Appsmith cloud.
     */
    @Test
    public void isProtectedBranch_AppsmithCloud_success() {
        Mockito.when(commonConfig.isCloudHosting()).thenReturn(true);
        Mockito.when(featureFlagService.check(FeatureFlagEnum.license_git_branch_protection_enabled))
                .thenReturn(Mono.just(TRUE));

        StepVerifier.create(gitPrivateRepoHelper.isProtectedBranch("test", new GitApplicationMetadata()))
                .assertNext(isProtected -> assertEquals(false, isProtected))
                .verifyComplete();
    }

    @Test
    public void isProtectedBranch_selfHostedBranchProtected_success() {
        Mockito.when(commonConfig.isCloudHosting()).thenReturn(false);
        Mockito.when(featureFlagService.check(FeatureFlagEnum.license_git_branch_protection_enabled))
                .thenReturn(Mono.just(TRUE));
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        gitApplicationMetadata.setBranchProtectionRules(List.of("test"));

        StepVerifier.create(gitPrivateRepoHelper.isProtectedBranch("test", gitApplicationMetadata))
                .assertNext(isProtected -> assertEquals(true, isProtected))
                .verifyComplete();
    }

    @Test
    public void isProtectedBranch_selfHostedBranchNotProtected_success() {
        Mockito.when(commonConfig.isCloudHosting()).thenReturn(false);
        Mockito.when(featureFlagService.check(FeatureFlagEnum.license_git_branch_protection_enabled))
                .thenReturn(Mono.just(TRUE));
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        gitApplicationMetadata.setBranchProtectionRules(List.of("test"));

        StepVerifier.create(gitPrivateRepoHelper.isProtectedBranch("feature", gitApplicationMetadata))
                .assertNext(isProtected -> assertEquals(false, isProtected))
                .verifyComplete();
    }

    @Test
    public void isProtectedBranch_selfHostedBranchProtectedEmpty_success() {
        Mockito.when(commonConfig.isCloudHosting()).thenReturn(false);
        Mockito.when(featureFlagService.check(FeatureFlagEnum.license_git_branch_protection_enabled))
                .thenReturn(Mono.just(TRUE));
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        gitApplicationMetadata.setBranchProtectionRules(List.of());

        StepVerifier.create(gitPrivateRepoHelper.isProtectedBranch("test", gitApplicationMetadata))
                .assertNext(isProtected -> assertEquals(false, isProtected))
                .verifyComplete();
    }
}
