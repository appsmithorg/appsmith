package com.appsmith.server.git.central;

import com.appsmith.external.dtos.GitRefDTO;
import com.appsmith.external.git.constants.ce.RefType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.authentication.tokens.McpTokenAuthentication;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.Artifact;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.transaction.reactive.TransactionalOperator;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Proves the MCP guard on {@code checkoutReference}: an MCP-token principal is refused on an {@code origin/}-prefixed
 * ref name or a tag ref before any artifact lookup, while a local branch for the same principal, an ordinary session,
 * and a chain with no security context all reach the lookup.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CentralGitServiceCheckoutReferenceMcpGuardTest {

    private static final String ARTIFACT_ID = "branched-app-id";
    private static final AclPermission EDIT_PERMISSION = AclPermission.MANAGE_APPLICATIONS;

    @Mock
    private GitRedisUtils gitRedisUtils;

    @Mock
    private GitProfileUtils gitProfileUtils;

    @Mock
    private GitAnalyticsUtils gitAnalyticsUtils;

    @Mock
    private UserDataService userDataService;

    @Mock
    private SessionUserService sessionUserService;

    @Mock
    private GitArtifactHelperResolver gitArtifactHelperResolver;

    @Mock
    private GitHandlingServiceResolver gitHandlingServiceResolver;

    @Mock
    private GitPrivateRepoHelper gitPrivateRepoHelper;

    @Mock
    private GitDeployKeysRepository gitDeployKeysRepository;

    @Mock
    private DatasourceService datasourceService;

    @Mock
    private DatasourcePermission datasourcePermission;

    @Mock
    private WorkspaceService workspaceService;

    @Mock
    private PluginService pluginService;

    @Mock
    private ImportService importService;

    @Mock
    private ExportService exportService;

    @Mock
    private GitAutoCommitHelper gitAutoCommitHelper;

    @Mock
    private GitDiscardChangesAsyncEventManager gitDiscardChangesAsyncEventManager;

    @Mock
    private TransactionalOperator transactionalOperator;

    @Mock
    private ObservationRegistry observationRegistry;

    @SuppressWarnings("rawtypes")
    @Mock
    private GitArtifactHelper gitArtifactHelper;

    private CentralGitServiceCEImpl service;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        // Every pass-through case stops at the first artifact lookup with a standard ACL denial, which proves the
        // guard let the request reach the lookup without needing a git repository behind it.
        when(gitArtifactHelperResolver.getArtifactHelper(any())).thenReturn(gitArtifactHelper);
        when(gitArtifactHelper.getArtifactEditPermission()).thenReturn(EDIT_PERMISSION);
        when(gitArtifactHelper.getArtifactById(anyString(), any()))
                .thenReturn(Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, "application", ARTIFACT_ID)));

        service = new CentralGitServiceCEImpl(
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

    @ParameterizedTest(name = "refName={0}, refType={1}")
    @CsvSource({"origin/feature, branch", "v1.0.0, tag"})
    void should_rejectWithUnauthorizedAccess_when_mcpPrincipalChecksOutRemoteOrTagRef(String refName, RefType refType) {
        // Given
        GitRefDTO gitRefDTO = gitRef(refName, refType);

        // When
        Mono<? extends Artifact> result = service.checkoutReference(
                        ARTIFACT_ID, ArtifactType.APPLICATION, gitRefDTO, true, GitType.FILE_SYSTEM)
                .contextWrite(ReactiveSecurityContextHolder.withAuthentication(mcpPrincipal()));

        // Then
        StepVerifier.create(result)
                .expectErrorSatisfies(error -> assertThat(error)
                        .isInstanceOf(AppsmithException.class)
                        .extracting(e -> ((AppsmithException) e).getError())
                        .isEqualTo(AppsmithError.UNAUTHORIZED_ACCESS))
                .verify();

        // The refusal must come before any artifact lookup, so it reveals nothing about whether the id exists.
        verify(gitArtifactHelper, never()).getArtifactById(anyString(), any());
    }

    @Test
    void should_reachArtifactLookup_when_mcpPrincipalChecksOutLocalBranch() {
        // Given
        GitRefDTO gitRefDTO = gitRef("mcp/feature", RefType.branch);

        // When
        Mono<? extends Artifact> result = service.checkoutReference(
                        ARTIFACT_ID, ArtifactType.APPLICATION, gitRefDTO, true, GitType.FILE_SYSTEM)
                .contextWrite(ReactiveSecurityContextHolder.withAuthentication(mcpPrincipal()));

        // Then
        expectAclDenialFromArtifactLookup(result);
    }

    @ParameterizedTest(name = "refName={0}, refType={1}")
    @CsvSource({"origin/feature, branch", "v1.0.0, tag"})
    void should_reachArtifactLookup_when_ordinarySessionChecksOutRemoteOrTagRef(String refName, RefType refType) {
        // Given
        GitRefDTO gitRefDTO = gitRef(refName, refType);

        // When
        Mono<? extends Artifact> result = service.checkoutReference(
                        ARTIFACT_ID, ArtifactType.APPLICATION, gitRefDTO, true, GitType.FILE_SYSTEM)
                .contextWrite(ReactiveSecurityContextHolder.withAuthentication(ordinaryPrincipal()));

        // Then
        expectAclDenialFromArtifactLookup(result);
    }

    @Test
    void should_reachArtifactLookup_when_noSecurityContextChecksOutRemoteRef() {
        // Given: an internal caller with no security context (no contextWrite) is not an MCP principal.
        GitRefDTO gitRefDTO = gitRef("origin/feature", RefType.branch);

        // When
        Mono<? extends Artifact> result =
                service.checkoutReference(ARTIFACT_ID, ArtifactType.APPLICATION, gitRefDTO, true, GitType.FILE_SYSTEM);

        // Then
        expectAclDenialFromArtifactLookup(result);
    }

    @SuppressWarnings("unchecked")
    private void expectAclDenialFromArtifactLookup(Mono<? extends Artifact> result) {
        StepVerifier.create(result)
                .expectErrorSatisfies(error -> assertThat(error)
                        .isInstanceOf(AppsmithException.class)
                        .extracting(e -> ((AppsmithException) e).getError())
                        .isEqualTo(AppsmithError.ACL_NO_RESOURCE_FOUND))
                .verify();

        verify(gitArtifactHelper).getArtifactById(ARTIFACT_ID, EDIT_PERMISSION);
    }

    private static GitRefDTO gitRef(String refName, RefType refType) {
        GitRefDTO gitRefDTO = new GitRefDTO();
        gitRefDTO.setRefName(refName);
        gitRefDTO.setRefType(refType);
        return gitRefDTO;
    }

    private static Authentication mcpPrincipal() {
        return new UsernamePasswordAuthenticationToken(
                "mcp-user", null, List.of(new SimpleGrantedAuthority(McpTokenAuthentication.MCP_AUTHORITY)));
    }

    private static Authentication ordinaryPrincipal() {
        return new UsernamePasswordAuthenticationToken(
                "session-user", null, List.of(new SimpleGrantedAuthority("USER")));
    }
}
