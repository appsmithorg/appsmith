package com.appsmith.server.helpers;

import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.helpers.ce.GitPrivateRepoHelperCEImpl;
import com.appsmith.server.services.ApplicationService;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

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
}
