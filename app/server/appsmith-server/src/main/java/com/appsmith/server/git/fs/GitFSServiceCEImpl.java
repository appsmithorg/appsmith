package com.appsmith.server.git.fs;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.git.constants.GitSpan;
import com.appsmith.external.git.handler.FSGitHandler;
import com.appsmith.git.dto.CommitDTO;
import com.appsmith.server.configurations.EmailConfig;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.GitDeployKeys;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.GitConnectDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.exports.internal.ExportService;
import com.appsmith.server.git.GitRedisUtils;
import com.appsmith.server.git.autocommit.helpers.GitAutoCommitHelper;
import com.appsmith.server.git.central.GitHandlingServiceCE;
import com.appsmith.server.git.dtos.ArtifactJsonTransformationDTO;
import com.appsmith.server.git.resolver.GitArtifactHelperResolver;
import com.appsmith.server.git.utils.GitAnalyticsUtils;
import com.appsmith.server.git.utils.GitProfileUtils;
import com.appsmith.server.helpers.CommonGitFileUtils;
import com.appsmith.server.helpers.GitPrivateRepoHelper;
import com.appsmith.server.helpers.GitUtils;
import com.appsmith.server.imports.internal.ImportService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.repositories.GitDeployKeysRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.GitArtifactHelper;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.DatasourcePermission;
import io.micrometer.observation.ObservationRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.errors.InvalidRemoteException;
import org.eclipse.jgit.api.errors.TransportException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.reactive.TransactionalOperator;
import org.springframework.util.StringUtils;
import reactor.core.observability.micrometer.Micrometer;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.nio.file.Path;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.TimeoutException;

@Slf4j
@Service
@RequiredArgsConstructor
public class GitFSServiceCEImpl implements GitHandlingServiceCE {

    private final GitDeployKeysRepository gitDeployKeysRepository;
    private final GitPrivateRepoHelper gitPrivateRepoHelper;
    private final CommonGitFileUtils commonGitFileUtils;
    private final GitRedisUtils gitRedisUtils;
    protected final SessionUserService sessionUserService;
    private final UserDataService userDataService;
    protected final UserService userService;
    private final EmailConfig emailConfig;
    private final TransactionalOperator transactionalOperator;

    protected final AnalyticsService analyticsService;
    private final ObservationRegistry observationRegistry;

    private final WorkspaceService workspaceService;
    private final DatasourceService datasourceService;
    private final DatasourcePermission datasourcePermission;
    private final PluginService pluginService;

    private final ExportService exportService;
    private final ImportService importService;

    private final FSGitHandler fsGitHandler;
    private final GitAutoCommitHelper gitAutoCommitHelper;

    private final GitProfileUtils gitProfileUtils;
    private final GitAnalyticsUtils gitAnalyticsUtils;

    protected final GitArtifactHelperResolver gitArtifactHelperResolver;

    private static final String ORIGIN = "origin/";
    private static final String REMOTE_NAME_REPLACEMENT = "";

    private Mono<Boolean> addFileLock(String baseArtifactId, String commandName, boolean isLockRequired) {
        if (!Boolean.TRUE.equals(isLockRequired)) {
            return Mono.just(Boolean.TRUE);
        }

        return Mono.defer(() -> addFileLock(baseArtifactId, commandName));
    }

    private Mono<Boolean> addFileLock(String baseArtifactId, String commandName) {
        return gitRedisUtils.addFileLock(baseArtifactId, commandName);
    }

    private Mono<Boolean> releaseFileLock(String baseArtifactId, boolean isLockRequired) {
        if (!Boolean.TRUE.equals(isLockRequired)) {
            return Mono.just(Boolean.TRUE);
        }

        return releaseFileLock(baseArtifactId);
    }

    private Mono<Boolean> releaseFileLock(String baseArtifactId) {
        return gitRedisUtils
                .releaseFileLock(baseArtifactId)
                .name(GitSpan.RELEASE_FILE_LOCK)
                .tap(Micrometer.observation(observationRegistry));
    }

    @Override
    public Set<String> validateGitConnectDTO(GitConnectDTO gitConnectDTO) {
        Set<String> errors = new HashSet<>();

        if (!StringUtils.hasText(gitConnectDTO.getRemoteUrl())) {
            errors.add("remoteUrl");
        }

        try {
            GitUtils.convertSshUrlToBrowserSupportedUrl(gitConnectDTO.getRemoteUrl());
        } catch (AppsmithException error) {
            errors.add("browserSupportedRemoteUrl");
        }

        return errors;
    }

    @Override
    public String getRepoName(GitConnectDTO gitConnectDTO) {
        return GitUtils.getRepoName(gitConnectDTO.getRemoteUrl());
    }

    @Override
    public Mono<Boolean> isRepoPrivate(GitConnectDTO gitConnectDTO) {
        return GitUtils.isRepoPrivate(GitUtils.convertSshUrlToBrowserSupportedUrl(gitConnectDTO.getRemoteUrl()));
    }

    @Override
    public Mono<GitAuth> getGitAuthForUser() {
        return sessionUserService
                .getCurrentUser()
                .flatMap(user -> gitDeployKeysRepository.findByEmail(user.getEmail()))
                .map(GitDeployKeys::getGitAuth)
                .switchIfEmpty(
                        Mono.error(
                                new AppsmithException(
                                        AppsmithError.INVALID_GIT_CONFIGURATION,
                                        "Unable to find git configuration for logged-in user. Please contact Appsmith team for support")));
    }

    @Override
    public Boolean isGitAuthInvalid(GitAuth gitAuth) {
        return !StringUtils.hasText(gitAuth.getPrivateKey()) || !StringUtils.hasText(gitAuth.getPublicKey());
    }

    @Override
    public Mono<String> fetchRemoteRepository(
            GitConnectDTO gitConnectDTO, GitAuth gitAuth, Artifact artifact, String repoName) {

        GitArtifactHelper<?> gitArtifactHelper =
                gitArtifactHelperResolver.getArtifactHelper(artifact.getArtifactType());
        Path repoSuffix = gitArtifactHelper.getRepoSuffixPath(artifact.getWorkspaceId(), artifact.getId(), repoName);

        return fsGitHandler
                .cloneRemoteIntoArtifactRepo(
                        repoSuffix, gitConnectDTO.getRemoteUrl(), gitAuth.getPrivateKey(), gitAuth.getPublicKey())
                .onErrorResume(error -> {
                    log.error("Error while cloning the remote repo, {}", error.getMessage());
                    return gitAnalyticsUtils
                            .addAnalyticsForGitOperation(
                                    AnalyticsEvents.GIT_IMPORT,
                                    artifact,
                                    error.getClass().getName(),
                                    error.getMessage(),
                                    false)
                            .flatMap(user -> commonGitFileUtils
                                    .deleteLocalRepo(repoSuffix)
                                    .then(gitArtifactHelper.deleteArtifact(artifact.getId())))
                            .flatMap(artifact1 -> {
                                if (error instanceof TransportException) {
                                    return Mono.error(
                                            new AppsmithException(AppsmithError.INVALID_GIT_SSH_CONFIGURATION));
                                } else if (error instanceof InvalidRemoteException) {
                                    return Mono.error(
                                            new AppsmithException(AppsmithError.INVALID_PARAMETER, "remote url"));
                                } else if (error instanceof TimeoutException) {
                                    return Mono.error(new AppsmithException(AppsmithError.GIT_EXECUTION_TIMEOUT));
                                }
                                return Mono.error(
                                        new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "clone", error));
                            });
                });
    }

    @Override
    public void setRepositoryDetailsInGitArtifactMetadata(
            GitConnectDTO gitConnectDTO, GitArtifactMetadata gitArtifactMetadata) {
        gitArtifactMetadata.setRemoteUrl(gitConnectDTO.getRemoteUrl());
        gitArtifactMetadata.setBrowserSupportedRemoteUrl(
                GitUtils.convertSshUrlToBrowserSupportedUrl(gitConnectDTO.getRemoteUrl()));
    }

    @Override
    public Mono<? extends ArtifactExchangeJson> reconstructArtifactJsonFromGitRepository(
            ArtifactJsonTransformationDTO artifactJsonTransformationDTO) {
        return commonGitFileUtils.reconstructArtifactExchangeJsonFromGitRepoWithAnalytics(
                artifactJsonTransformationDTO.getWorkspaceId(),
                artifactJsonTransformationDTO.getArtifactId(),
                artifactJsonTransformationDTO.getRepoName(),
                artifactJsonTransformationDTO.getRefName(),
                artifactJsonTransformationDTO.getArtifactType());
    }

    @Override
    public Mono<Boolean> removeRepository(ArtifactJsonTransformationDTO artifactJsonTransformationDTO) {
        GitArtifactHelper<?> gitArtifactHelper =
                gitArtifactHelperResolver.getArtifactHelper(artifactJsonTransformationDTO.getArtifactType());
        Path repoSuffix = gitArtifactHelper.getRepoSuffixPath(
                artifactJsonTransformationDTO.getWorkspaceId(),
                artifactJsonTransformationDTO.getArtifactId(),
                artifactJsonTransformationDTO.getRepoName());
        return commonGitFileUtils.deleteLocalRepo(repoSuffix);
    }

    @Override
    public Mono<Boolean> validateEmptyRepository(ArtifactJsonTransformationDTO artifactJsonTransformationDTO) {
        GitArtifactHelper<?> gitArtifactHelper =
                gitArtifactHelperResolver.getArtifactHelper(artifactJsonTransformationDTO.getArtifactType());
        Path repoSuffix = gitArtifactHelper.getRepoSuffixPath(
                artifactJsonTransformationDTO.getWorkspaceId(),
                artifactJsonTransformationDTO.getArtifactId(),
                artifactJsonTransformationDTO.getRepoName());

        try {
            return commonGitFileUtils.checkIfDirectoryIsEmpty(repoSuffix);
        } catch (IOException ioException) {
            log.error("Error while validating empty repository, {}", ioException.getMessage());
            return Mono.error(new AppsmithException(AppsmithError.GIT_FILE_SYSTEM_ERROR, ioException.getMessage()));
        }
    }

    @Override
    public Mono<Boolean> initialiseReadMe(
            ArtifactJsonTransformationDTO jsonTransformationDTO,
            Artifact artifact,
            String readmeFileName,
            String originHeader) {
        GitArtifactHelper<?> gitArtifactHelper =
                gitArtifactHelperResolver.getArtifactHelper(jsonTransformationDTO.getArtifactType());
        Path readmePath = gitArtifactHelper.getRepoSuffixPath(
                jsonTransformationDTO.getWorkspaceId(),
                jsonTransformationDTO.getArtifactId(),
                jsonTransformationDTO.getRepoName());
        try {
            return gitArtifactHelper
                    .intialiseReadMe(artifact, readmePath, originHeader)
                    .map(path -> Boolean.TRUE);
        } catch (IOException ioException) {
            log.error("Error while creating readme file in the repository, {}", ioException.getMessage());
            return Mono.error(new AppsmithException(AppsmithError.GIT_FILE_SYSTEM_ERROR, ioException.getMessage()));
        }
    }

    @Override
    public Mono<String> createFirstCommit(ArtifactJsonTransformationDTO jsonTransformationDTO, CommitDTO commitDTO) {
        GitArtifactHelper<?> gitArtifactHelper =
                gitArtifactHelperResolver.getArtifactHelper(jsonTransformationDTO.getArtifactType());
        Path repoSuffix = gitArtifactHelper.getRepoSuffixPath(
                jsonTransformationDTO.getWorkspaceId(),
                jsonTransformationDTO.getArtifactId(),
                jsonTransformationDTO.getRepoName());

        return fsGitHandler.commitArtifact(
                repoSuffix,
                commitDTO.getMessage(),
                commitDTO.getAuthor().getName(),
                commitDTO.getAuthor().getEmail(),
                true,
                commitDTO.getIsAmendCommit());
    }
}
