package com.appsmith.server.helpers;

import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.helpers.ce.GitPrivateRepoHelperCEImpl;
import com.appsmith.server.services.ApplicationService;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.List;

import static com.appsmith.server.featureflags.FeatureFlagEnum.license_git_branch_protection_enabled;
import static com.appsmith.server.featureflags.FeatureFlagEnum.license_git_unlimited_repo_enabled;

@Component
public class GitPrivateRepoHelperImpl extends GitPrivateRepoHelperCEImpl implements GitPrivateRepoHelper {

    private final CommonConfig commonConfig;

    public GitPrivateRepoHelperImpl(
            GitCloudServicesUtils gitCloudServicesUtils,
            ApplicationService applicationService,
            CommonConfig commonConfig) {
        super(gitCloudServicesUtils, applicationService);
        this.commonConfig = commonConfig;
    }

    // Override the repo limit check for EE. Unlimited repos for the EE image
    @Override
    @FeatureFlagged(featureFlagName = license_git_unlimited_repo_enabled)
    public Mono<Boolean> isRepoLimitReached(String workspaceId, Boolean isClearCache) {
        if (commonConfig.isCloudHosting()) {
            return super.isRepoLimitReached(workspaceId, isClearCache);
        }
        return Mono.just(Boolean.FALSE);
    }

    @Override
    @FeatureFlagged(featureFlagName = license_git_branch_protection_enabled)
    public Mono<Boolean> isBranchProtected(GitApplicationMetadata metaData, String branchName) {
        boolean result = false;
        if (metaData != null) {
            List<String> branchProtectionRules = metaData.getBranchProtectionRules();
            result = branchProtectionRules != null && branchProtectionRules.contains(branchName);
        }
        return Mono.just(result);
    }
}
