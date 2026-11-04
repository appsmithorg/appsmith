package com.appsmith.server.aspect;

import com.appsmith.external.dtos.GitRefDTO;
import com.appsmith.external.git.constants.ce.RefType;
import com.appsmith.git.configurations.GitServiceConfig;
import com.appsmith.server.annotations.GitRoute;
import com.appsmith.server.artifacts.gitRoute.GitRouteArtifact;
import com.appsmith.server.authentication.tokens.McpTokenAuthentication;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.git.constants.GitRouteOperation;
import com.appsmith.server.git.utils.GitProfileUtils;
import io.micrometer.observation.ObservationRegistry;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.reflect.MethodSignature;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Proves the MCP checkout guard runs at the start of the in-memory Git flow: an MCP-token principal asking
 * checkout-ref for an {@code origin/}-prefixed ref or a tag is refused before the artifact lookup, the Redis lock, and
 * the repository download or clone. A local branch for the same principal, and an ordinary session asking for a remote
 * or tag ref, still enter the flow at the artifact lookup.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class GitRouteAspectMcpCheckoutGuardTest {

    private static final String ARTIFACT_ID = "branched-app-id";

    @Mock
    private ReactiveRedisTemplate<String, String> redis;

    @Mock
    private GitProfileUtils gitProfileUtils;

    @Mock
    private GitServiceConfig gitServiceConfig;

    @Mock
    private GitRouteArtifact gitRouteArtifact;

    @Mock
    private ProceedingJoinPoint joinPoint;

    @Mock
    private MethodSignature signature;

    @Mock
    private GitRoute gitRoute;

    private GitRouteAspect aspect;

    @BeforeEach
    void setUp() {
        // In-memory Git: the advice runs the full FSM (artifact, lock, download, clone) around the controller.
        when(gitServiceConfig.isGitInMemory()).thenReturn(true);

        // The checkout-ref route as GitApplicationControllerCE declares it.
        when(gitRoute.fieldName()).thenReturn("referencedApplicationId");
        when(gitRoute.artifactType()).thenReturn(ArtifactType.APPLICATION);
        when(gitRoute.operation()).thenReturn(GitRouteOperation.CHECKOUT_REF);
        when(gitRoute.authorName()).thenReturn("");
        when(gitRoute.authorEmail()).thenReturn("");
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getParameterNames()).thenReturn(new String[] {"referencedApplicationId", "gitRefDTO"});

        // Every case that enters the flow stops at the first state, the artifact lookup, with an ACL denial. That
        // proves the guard let it through without needing Redis, a repository, or SSH behind it.
        when(gitRouteArtifact.getArtifact(any(), anyString()))
                .thenReturn(Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, "application", ARTIFACT_ID)));

        aspect = new GitRouteAspect(
                redis, gitProfileUtils, gitServiceConfig, gitRouteArtifact, ObservationRegistry.create());
    }

    @ParameterizedTest(name = "refName={0}, refType={1}")
    @CsvSource({"origin/feature, branch", "v1.0.0, tag"})
    void should_rejectBeforeGitFlow_when_mcpPrincipalChecksOutRemoteOrTagRef(String refName, RefType refType)
            throws Throwable {
        // Given
        when(joinPoint.getArgs()).thenReturn(new Object[] {ARTIFACT_ID, gitRef(refName, refType)});

        // When
        Mono<?> result = routed().contextWrite(ReactiveSecurityContextHolder.withAuthentication(mcpPrincipal()));

        // Then
        StepVerifier.create(result)
                .expectErrorSatisfies(error -> assertThat(error)
                        .isInstanceOf(AppsmithException.class)
                        .extracting(e -> ((AppsmithException) e).getError())
                        .isEqualTo(AppsmithError.UNAUTHORIZED_ACCESS))
                .verify();

        // Nothing of the Git flow ran: no artifact lookup, no Redis lock or download, no controller body.
        verifyNoInteractions(gitRouteArtifact, redis, gitProfileUtils);
        verify(joinPoint, never()).proceed();
    }

    @Test
    void should_enterGitFlow_when_mcpPrincipalChecksOutLocalBranch() {
        // Given
        when(joinPoint.getArgs()).thenReturn(new Object[] {ARTIFACT_ID, gitRef("mcp/feature", RefType.branch)});

        // When
        Mono<?> result = routed().contextWrite(ReactiveSecurityContextHolder.withAuthentication(mcpPrincipal()));

        // Then
        expectAclDenialFromArtifactLookup(result);
    }

    @ParameterizedTest(name = "refName={0}, refType={1}")
    @CsvSource({"origin/feature, branch", "v1.0.0, tag"})
    void should_enterGitFlow_when_ordinarySessionChecksOutRemoteOrTagRef(String refName, RefType refType) {
        // Given
        when(joinPoint.getArgs()).thenReturn(new Object[] {ARTIFACT_ID, gitRef(refName, refType)});

        // When
        Mono<?> result = routed().contextWrite(ReactiveSecurityContextHolder.withAuthentication(ordinaryPrincipal()));

        // Then
        expectAclDenialFromArtifactLookup(result);
    }

    @ParameterizedTest(name = "refName={0}, refType={1}")
    @CsvSource({"origin/feature, branch", "v1.0.0, tag"})
    void should_enterGitFlow_when_mcpPrincipalCallsCreateRefWithRemoteOrTagRef(String refName, RefType refType) {
        // Given: create-ref is also allowlisted for MCP and also takes a GitRefDTO; the guard is checkout-only.
        when(gitRoute.operation()).thenReturn(GitRouteOperation.CREATE_REF);
        when(joinPoint.getArgs()).thenReturn(new Object[] {ARTIFACT_ID, gitRef(refName, refType)});

        // When
        Mono<?> result = routed().contextWrite(ReactiveSecurityContextHolder.withAuthentication(mcpPrincipal()));

        // Then
        expectAclDenialFromArtifactLookup(result);
    }

    @Test
    void should_enterGitFlow_when_mcpPrincipalCallsCheckoutRouteWithoutGitRefArgument() {
        // Given: a checkout route whose ref arrives in another DTO (EE change-version) has nothing for the guard to
        // read.
        when(joinPoint.getArgs()).thenReturn(new Object[] {ARTIFACT_ID, "not-a-git-ref-dto"});

        // When
        Mono<?> result = routed().contextWrite(ReactiveSecurityContextHolder.withAuthentication(mcpPrincipal()));

        // Then
        expectAclDenialFromArtifactLookup(result);
    }

    private Mono<?> routed() {
        return (Mono<?>) aspect.handleGitRoute(joinPoint, gitRoute);
    }

    private void expectAclDenialFromArtifactLookup(Mono<?> result) {
        StepVerifier.create(result)
                .expectErrorSatisfies(error -> assertThat(error)
                        .isInstanceOf(AppsmithException.class)
                        .extracting(e -> ((AppsmithException) e).getError())
                        .isEqualTo(AppsmithError.ACL_NO_RESOURCE_FOUND))
                .verify();

        verify(gitRouteArtifact).getArtifact(ArtifactType.APPLICATION, ARTIFACT_ID);
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
