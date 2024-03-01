package com.appsmith.server.applications.git;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ce.GitArtifactHelperCE;
import com.appsmith.server.solutions.ApplicationPermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.nio.file.Path;
import java.nio.file.Paths;

@Slf4j
@Service
@RequiredArgsConstructor
public class GitApplicationHelperCEImpl implements GitArtifactHelperCE<Application> {

    private final ApplicationService applicationService;
    private final ApplicationPageService applicationPageService;

    private final ApplicationPermission applicationPermission;

    @Override
    public Mono<Application> getArtifactById(String applicationId, AclPermission aclPermission) {
        return applicationService
                .findById(applicationId, aclPermission)
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.APPLICATION, applicationId)));
    }

    @Override
    public Mono<Application> getArtifactByDefaultIdAndBranchName(
            String defaultArtifactId, String branchName, AclPermission aclPermission) {
        return applicationService.findByBranchNameAndDefaultApplicationId(branchName, defaultArtifactId, aclPermission);
    }

    @Override
    public AclPermission getArtifactEditPermission() {
        return applicationPermission.getEditPermission();
    }

    @Override
    public Path getRepoSuffixPath(String workspaceId, String artifactId, String repoName) {
        return Paths.get(workspaceId, artifactId, repoName);
    }
}
