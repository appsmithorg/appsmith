package com.appsmith.server.artifacts.base;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.server.artifacts.base.artifactbased.ArtifactBasedService;
import com.appsmith.server.artifacts.permissions.ArtifactPermission;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.GitDeployKeyGenerator;
import com.appsmith.server.services.AnalyticsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

import java.util.Map;

@Slf4j
@Service
public class ArtifactServiceCEImpl implements ArtifactServiceCE {

    protected final ArtifactBasedService<Application> applicationService;
    private final AnalyticsService analyticsService;

    public ArtifactServiceCEImpl(
            ArtifactBasedService<Application> applicationService, AnalyticsService analyticsService) {
        this.applicationService = applicationService;
        this.analyticsService = analyticsService;
    }

    @Override
    public ArtifactBasedService<? extends Artifact> getArtifactBasedService(ArtifactType artifactType) {
        return applicationService;
    }

    @Override
    public Mono<GitAuth> createOrUpdateSshKeyPair(
            ArtifactType artifactType, String branchedArtifactId, String keyType) {
        GitAuth gitAuth = GitDeployKeyGenerator.generateSSHKey(keyType);
        ArtifactBasedService<? extends Artifact> artifactBasedService = getArtifactBasedService(artifactType);
        ArtifactPermission artifactPermission = artifactBasedService.getPermissionService();
        final String artifactTypeName = artifactType.name().toLowerCase();
        return artifactBasedService
                .findById(branchedArtifactId, artifactPermission.getEditPermission())
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, artifactTypeName, branchedArtifactId)))
                .flatMap(artifact -> {
                    GitArtifactMetadata gitData = artifact.getGitArtifactMetadata();
                    // Check if the current artifact is the root artifact

                    if (gitData != null
                            && StringUtils.hasLength(gitData.getDefaultArtifactId())
                            && branchedArtifactId.equals(gitData.getDefaultArtifactId())) {
                        // This is the root application with update SSH key request
                        gitAuth.setRegeneratedKey(true);
                        gitData.setGitAuth(gitAuth);
                        return artifactBasedService.save(artifact);
                    } else if (gitData == null) {
                        // This is a root application with generate SSH key request
                        GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
                        gitArtifactMetadata.setDefaultApplicationId(branchedArtifactId);
                        gitArtifactMetadata.setGitAuth(gitAuth);
                        artifact.setGitArtifactMetadata(gitArtifactMetadata);
                        return artifactBasedService.save(artifact);
                    }
                    // Children application with update SSH key request for root application
                    // Fetch root application and then make updates. We are storing the git metadata only in root
                    // application
                    if (!StringUtils.hasLength(gitData.getDefaultArtifactId())) {
                        return Mono.error(new AppsmithException(
                                AppsmithError.INVALID_GIT_CONFIGURATION,
                                "Unable to find root " + artifactTypeName + ", please connect your " + artifactTypeName
                                        + " to remote repo to resolve this issue."));
                    }
                    gitAuth.setRegeneratedKey(true);

                    return artifactBasedService
                            .findById(gitData.getDefaultArtifactId(), artifactPermission.getEditPermission())
                            .flatMap(baseApplication -> {
                                GitArtifactMetadata gitArtifactMetadata = baseApplication.getGitArtifactMetadata();
                                gitArtifactMetadata.setDefaultApplicationId(baseApplication.getId());
                                gitArtifactMetadata.setGitAuth(gitAuth);
                                baseApplication.setGitArtifactMetadata(gitArtifactMetadata);
                                return artifactBasedService.save(baseApplication);
                            });
                })
                .flatMap(artifact -> {
                    // Send generate SSH key analytics event
                    assert artifact.getId() != null;
                    final Map<String, Object> eventData = Map.of(
                            FieldName.APP_MODE, ApplicationMode.EDIT.toString(), FieldName.APPLICATION, artifact);
                    final Map<String, Object> data = Map.of(
                            FieldName.APPLICATION_ID,
                            artifact.getId(),
                            "workspaceId",
                            artifact.getWorkspaceId(),
                            "isRegeneratedKey",
                            gitAuth.isRegeneratedKey(),
                            FieldName.EVENT_DATA,
                            eventData);
                    return analyticsService
                            .sendObjectEvent(AnalyticsEvents.GENERATE_SSH_KEY, artifact, data)
                            .onErrorResume(e -> {
                                log.warn("Error sending ssh key generation data point", e);
                                return Mono.just(artifact);
                            });
                })
                .thenReturn(gitAuth);
    }
}
