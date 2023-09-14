package com.appsmith.server.helpers.ce;

import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.helpers.GitCloudServicesUtils;
import com.appsmith.server.services.ApplicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
public class GitRepoHelperCEImpl implements GitRepoHelperCE {

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
    public Mono<Boolean> isProtectedBranch(String branchName, GitApplicationMetadata gitApplicationMetadata) {
        return Mono.just(Boolean.FALSE);
    }
}
