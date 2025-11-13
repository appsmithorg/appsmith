package com.appsmith.server.artifacts.base;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.server.artifacts.base.artifactbased.ArtifactBasedService;
import com.appsmith.server.artifacts.permissions.ArtifactPermission;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.constants.Assets;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.GitDeployKeys;
import com.appsmith.server.dtos.GitAuthDTO;
import com.appsmith.server.dtos.GitDeployKeyDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.GitDeployKeyGenerator;
import com.appsmith.server.repositories.GitDeployKeysRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.SessionUserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class ArtifactServiceCEImpl implements ArtifactServiceCE {

    protected final ArtifactBasedService<Application> applicationService;
    private final AnalyticsService analyticsService;
    private final GitDeployKeysRepository gitDeployKeysRepository;
    private final SessionUserService sessionUserService;

    public ArtifactServiceCEImpl(
            ArtifactBasedService<Application> applicationService,
            AnalyticsService analyticsService,
            GitDeployKeysRepository gitDeployKeysRepository,
            SessionUserService sessionUserService) {
        this.applicationService = applicationService;
        this.analyticsService = analyticsService;
        this.gitDeployKeysRepository = gitDeployKeysRepository;
        this.sessionUserService = sessionUserService;
    }

    @Override
    public ArtifactBasedService<? extends Artifact> getArtifactBasedService(ArtifactType artifactType) {
        return applicationService;
    }

    @Override
    public Mono<GitAuth> createOrUpdateSshKeyPair(
            ArtifactType artifactType, String branchedArtifactId, String keyType) {
        GitAuth gitAuth = GitDeployKeyGenerator.generateSSHKey(keyType);
        return saveSshKeyToArtifact(artifactType, branchedArtifactId, gitAuth).map(artifact -> {
            GitArtifactMetadata gitArtifactMetadata = artifact.getGitArtifactMetadata();
            if (gitArtifactMetadata == null || gitArtifactMetadata.getGitAuth() == null) {
                throw new AppsmithException(
                        AppsmithError.INVALID_GIT_CONFIGURATION, "Failed to save SSH key to artifact");
            }
            return gitArtifactMetadata.getGitAuth();
        });
    }

    /**
     * Save an existing SSH key pair (generated via /import/keys) to an artifact.
     * This method fetches the SSH key from the database (GitDeployKeysRepository) using the current user's email
     * and saves it to the artifact. This ensures the private key never travels through the client.
     *
     * @param artifactType Type of artifact (APPLICATION or PACKAGE)
     * @param branchedArtifactId The artifact ID (can be base or branched artifact)
     * @return The saved artifact with updated GitAuth
     */
    @Override
    public Mono<? extends Artifact> saveSshKeyPair(ArtifactType artifactType, String branchedArtifactId) {
        Mono<GitAuth> gitAuthMono = sessionUserService
                .getCurrentUser()
                .flatMap(user -> gitDeployKeysRepository.findByEmail(user.getEmail()))
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.INVALID_GIT_CONFIGURATION,
                        "No SSH key found. Please generate an SSH key using /import/keys endpoint first.")))
                .map(GitDeployKeys::getGitAuth)
                .flatMap(gitAuth -> {
                    if (gitAuth == null
                            || !StringUtils.hasText(gitAuth.getPublicKey())
                            || !StringUtils.hasText(gitAuth.getPrivateKey())) {
                        return Mono.error(new AppsmithException(
                                AppsmithError.INVALID_GIT_CONFIGURATION,
                                "SSH key is invalid. Please generate a new SSH key using /import/keys endpoint."));
                    }
                    return Mono.just(gitAuth);
                });
        return gitAuthMono.flatMap(gitAuth -> saveSshKeyToArtifact(artifactType, branchedArtifactId, gitAuth));
    }

    private Mono<? extends Artifact> saveSshKeyToArtifact(
            ArtifactType artifactType, String branchedArtifactId, GitAuth gitAuth) {
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
                        // This is the root artifact with update SSH key request
                        gitAuth.setRegeneratedKey(true);
                        gitData.setGitAuth(gitAuth);
                        return artifactBasedService.save(artifact);
                    } else if (gitData == null) {
                        // This is a root artifact with generate SSH key request
                        GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
                        gitArtifactMetadata.setDefaultApplicationId(branchedArtifactId);
                        gitArtifactMetadata.setGitAuth(gitAuth);
                        artifact.setGitArtifactMetadata(gitArtifactMetadata);
                        return artifactBasedService.save(artifact);
                    }
                    // Children artifact with update SSH key request for root artifact
                    // Fetch root artifact and then make updates. We are storing the git metadata only in root
                    // artifact
                    if (!StringUtils.hasLength(gitData.getDefaultArtifactId())) {
                        return Mono.error(new AppsmithException(
                                AppsmithError.INVALID_GIT_CONFIGURATION,
                                "Unable to find root " + artifactTypeName + ", please connect your " + artifactTypeName
                                        + " to remote repo to resolve this issue."));
                    }
                    gitAuth.setRegeneratedKey(true);
                    return artifactBasedService
                            .findById(gitData.getDefaultArtifactId(), artifactPermission.getEditPermission())
                            .flatMap(baseArtifact -> {
                                GitArtifactMetadata gitArtifactMetadata = baseArtifact.getGitArtifactMetadata();
                                gitArtifactMetadata.setDefaultApplicationId(baseArtifact.getId());
                                gitArtifactMetadata.setGitAuth(gitAuth);
                                baseArtifact.setGitArtifactMetadata(gitArtifactMetadata);
                                return artifactBasedService.save(baseArtifact);
                            });
                })
                .flatMap(artifact -> {
                    // Send generate SSH key analytics event
                    assert artifact.getId() != null;
                    final Map<String, Object> eventData =
                            Map.of(FieldName.APP_MODE, ApplicationMode.EDIT.toString(), FieldName.ARTIFACT, artifact);
                    final Map<String, Object> data = Map.of(
                            FieldName.ARTIFACT_ID,
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
                });
    }

    /**
     * Method to get the SSH public key
     *
     * @param branchedArtifactId artifact for which the SSH key is requested
     * @return public SSH key
     */
    @Override
    public Mono<GitAuthDTO> getSshKey(ArtifactType artifactType, String branchedArtifactId) {
        ArtifactBasedService<?> artifactBasedService = getArtifactBasedService(artifactType);
        ArtifactPermission artifactPermission = artifactBasedService.getPermissionService();
        return artifactBasedService
                .findById(branchedArtifactId, artifactPermission.getEditPermission())
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.ARTIFACT_ID, branchedArtifactId)))
                .flatMap(artifact -> {
                    GitArtifactMetadata gitData = artifact.getGitArtifactMetadata();
                    List<GitDeployKeyDTO> gitDeployKeyDTOList = GitDeployKeyGenerator.getSupportedProtocols();
                    if (gitData == null) {
                        return Mono.error(new AppsmithException(
                                AppsmithError.INVALID_GIT_CONFIGURATION,
                                "Can't find valid SSH key. Please configure the artifact with git"));
                    }
                    // Check if the artifact is base artifact
                    if (branchedArtifactId.equals(gitData.getDefaultArtifactId())) {
                        gitData.getGitAuth().setDocUrl(Assets.GIT_DEPLOY_KEY_DOC_URL);
                        GitAuthDTO gitAuthDTO = new GitAuthDTO();
                        gitAuthDTO.setPublicKey(gitData.getGitAuth().getPublicKey());
                        gitAuthDTO.setPrivateKey(gitData.getGitAuth().getPrivateKey());
                        gitAuthDTO.setDocUrl(gitData.getGitAuth().getDocUrl());
                        gitAuthDTO.setGitSupportedSSHKeyType(gitDeployKeyDTOList);
                        return Mono.just(gitAuthDTO);
                    }

                    if (gitData.getDefaultArtifactId() == null) {
                        throw new AppsmithException(
                                AppsmithError.INVALID_GIT_CONFIGURATION,
                                "Can't find root artifact. Please configure the artifact with git");
                    }

                    return artifactBasedService
                            .findById(gitData.getDefaultArtifactId(), artifactPermission.getEditPermission())
                            .map(baseArtifact -> {
                                GitAuthDTO gitAuthDTO = new GitAuthDTO();
                                GitAuth gitAuth =
                                        baseArtifact.getGitArtifactMetadata().getGitAuth();
                                gitAuth.setDocUrl(Assets.GIT_DEPLOY_KEY_DOC_URL);
                                gitAuthDTO.setPublicKey(gitAuth.getPublicKey());
                                gitAuthDTO.setPrivateKey(gitAuth.getPrivateKey());
                                gitAuthDTO.setDocUrl(gitAuth.getDocUrl());
                                gitAuthDTO.setGitSupportedSSHKeyType(gitDeployKeyDTOList);
                                return gitAuthDTO;
                            });
                });
    }
}
