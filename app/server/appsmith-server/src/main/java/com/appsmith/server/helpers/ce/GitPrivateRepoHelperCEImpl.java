package com.appsmith.server.helpers.ce;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.helpers.GitCloudServicesUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.List;

@Component
@RequiredArgsConstructor
public class GitPrivateRepoHelperCEImpl implements GitPrivateRepoHelperCE {

    private final GitCloudServicesUtils gitCloudServicesUtils;

    private final ApplicationService applicationService;

    @Override
    public Mono<Boolean> isRepoLimitReached(String workspaceId, Boolean isClearCache) {
        return gitCloudServicesUtils
                .getPrivateRepoLimitForOrg(workspaceId, isClearCache)
                .flatMap(limit -> {
                    if (limit == -1) {
                        return Mono.just(Boolean.FALSE);
                    }
                    return applicationService
                            .getGitConnectedApplicationsCountWithPrivateRepoByWorkspaceId(workspaceId)
                            .map(privateRepoCount -> {
                                // isClearCache is false for the commit flow
                                // isClearCache is true for the connect & import flow
                                if (!isClearCache) {
                                    if (privateRepoCount <= limit) {
                                        return Boolean.FALSE;
                                    }
                                } else {
                                    if (privateRepoCount < limit) {
                                        return Boolean.FALSE;
                                    }
                                }
                                return Boolean.TRUE;
                            });
                });
    }

    @Override
    public Mono<Boolean> isBranchProtected(GitApplicationMetadata metaData, String branchName) {
        boolean result = false;
        if (metaData != null) {
            String defaultBranch = metaData.getDefaultBranchName();
            List<String> branchProtectionRules = metaData.getBranchProtectionRules();

            result = branchProtectionRules != null
                    && branchName.equals(defaultBranch)
                    && branchProtectionRules.contains(branchName);
        }
        return Mono.just(result);
    }
}
