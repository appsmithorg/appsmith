package com.appsmith.server.git.central;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.dtos.AutoCommitResponseDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.exports.internal.ExportService;
import com.appsmith.server.git.GitRedisUtils;
import com.appsmith.server.git.autocommit.helpers.GitAutoCommitHelper;
import com.appsmith.server.git.central.helpers.GitDiscardChangesAsyncEventManager;
import com.appsmith.server.git.resolver.GitArtifactHelperResolver;
import com.appsmith.server.git.resolver.GitHandlingServiceResolver;
import com.appsmith.server.git.utils.GitAnalyticsUtils;
import com.appsmith.server.git.utils.GitProfileUtils;
import com.appsmith.server.helpers.GitPrivateRepoHelper;
import com.appsmith.server.imports.internal.ImportService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.repositories.GitDeployKeysRepository;
import com.appsmith.server.services.GitArtifactHelper;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.DatasourcePermission;
import io.micrometer.observation.ObservationRegistry;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.transaction.reactive.TransactionalOperator;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Authorization tests for the Git auto-commit progress read path (APP-15748).
 *
 * <p>The {@code getAutoCommitProgress} service method must resolve the target artifact under an
 * ACL read permission BEFORE reading auto-commit progress state, so that an unauthorized (or
 * non-existent) artifact id receives the standard denial instead of leaking the active branch
 * name and progress value keyed only by id.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CentralGitServiceAutoCommitProgressAuthTest {

    private final GitRedisUtils gitRedisUtils = mock(GitRedisUtils.class);
    private final GitProfileUtils gitProfileUtils = mock(GitProfileUtils.class);
    private final GitAnalyticsUtils gitAnalyticsUtils = mock(GitAnalyticsUtils.class);
    private final UserDataService userDataService = mock(UserDataService.class);
    private final SessionUserService sessionUserService = mock(SessionUserService.class);
    private final GitHandlingServiceResolver gitHandlingServiceResolver = mock(GitHandlingServiceResolver.class);
    private final GitPrivateRepoHelper gitPrivateRepoHelper = mock(GitPrivateRepoHelper.class);
    private final GitDeployKeysRepository gitDeployKeysRepository = mock(GitDeployKeysRepository.class);
    private final DatasourceService datasourceService = mock(DatasourceService.class);
    private final DatasourcePermission datasourcePermission = mock(DatasourcePermission.class);
    private final WorkspaceService workspaceService = mock(WorkspaceService.class);
    private final PluginService pluginService = mock(PluginService.class);
    private final ImportService importService = mock(ImportService.class);
    private final ExportService exportService = mock(ExportService.class);
    private final GitDiscardChangesAsyncEventManager gitDiscardChangesAsyncEventManager =
            mock(GitDiscardChangesAsyncEventManager.class);
    private final TransactionalOperator transactionalOperator = mock(TransactionalOperator.class);
    private final ObservationRegistry observationRegistry = mock(ObservationRegistry.class);

    private final GitArtifactHelperResolver gitArtifactHelperResolver = mock(GitArtifactHelperResolver.class);
    private final GitAutoCommitHelper gitAutoCommitHelper = mock(GitAutoCommitHelper.class);

    @SuppressWarnings("rawtypes")
    private final GitArtifactHelper gitArtifactHelper = mock(GitArtifactHelper.class);

    private static final String TARGET_ARTIFACT_ID = "victim-app-id";
    private static final String BRANCH = "feature/x";
    private static final AclPermission READ_PERMISSION = AclPermission.READ_APPLICATIONS;

    private CentralGitServiceCEImpl newService() {
        return new CentralGitServiceCEImpl(
                gitRedisUtils,
                gitProfileUtils,
                gitAnalyticsUtils,
                userDataService,
                sessionUserService,
                gitArtifactHelperResolver,
                gitHandlingServiceResolver,
                gitPrivateRepoHelper,
                gitDeployKeysRepository,
                datasourceService,
                datasourcePermission,
                workspaceService,
                pluginService,
                importService,
                exportService,
                gitAutoCommitHelper,
                gitDiscardChangesAsyncEventManager,
                transactionalOperator,
                observationRegistry);
    }

    @SuppressWarnings("unchecked")
    @Test
    void getAutoCommitProgress_whenCallerLacksReadPermissionOnArtifact_deniesWithoutReadingProgress() {
        when(gitArtifactHelperResolver.getArtifactHelper(any())).thenReturn(gitArtifactHelper);
        when(gitArtifactHelper.getArtifactReadPermission()).thenReturn(READ_PERMISSION);
        // ACL-denied / non-existent artifact -> service layer errors before Redis is touched
        when(gitArtifactHelper.getArtifactById(eq(TARGET_ARTIFACT_ID), eq(READ_PERMISSION)))
                .thenReturn(Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, "application", TARGET_ARTIFACT_ID)));

        CentralGitServiceCEImpl service = newService();

        StepVerifier.create(service.getAutoCommitProgress(TARGET_ARTIFACT_ID, ArtifactType.APPLICATION, BRANCH))
                .expectError(AppsmithException.class)
                .verify();

        // The progress read must NEVER run for an unauthorized caller.
        verify(gitAutoCommitHelper, never()).getAutoCommitProgress(anyString(), anyString());
    }

    @SuppressWarnings("unchecked")
    @Test
    void getAutoCommitProgress_whenCallerAuthorized_returnsProgress() {
        AutoCommitResponseDTO expected =
                new AutoCommitResponseDTO(AutoCommitResponseDTO.AutoCommitResponse.IN_PROGRESS);
        expected.setBranchName(BRANCH);
        expected.setProgress(42);

        when(gitArtifactHelperResolver.getArtifactHelper(any())).thenReturn(gitArtifactHelper);
        when(gitArtifactHelper.getArtifactReadPermission()).thenReturn(READ_PERMISSION);
        when(gitArtifactHelper.getArtifactById(eq(TARGET_ARTIFACT_ID), eq(READ_PERMISSION)))
                .thenReturn(Mono.just(new Application()));
        when(gitAutoCommitHelper.getAutoCommitProgress(eq(TARGET_ARTIFACT_ID), eq(BRANCH)))
                .thenReturn(Mono.just(expected));

        CentralGitServiceCEImpl service = newService();

        StepVerifier.create(service.getAutoCommitProgress(TARGET_ARTIFACT_ID, ArtifactType.APPLICATION, BRANCH))
                .expectNext(expected)
                .verifyComplete();

        verify(gitAutoCommitHelper).getAutoCommitProgress(eq(TARGET_ARTIFACT_ID), eq(BRANCH));
    }
}
