package com.appsmith.server.configurations;

import com.appsmith.external.git.constants.ce.RefType;
import com.appsmith.git.configurations.GitServiceConfig;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.applications.git.GitApplicationHelperImpl;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.McpConfig;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.McpTokenResponseDTO;
import com.appsmith.server.enums.McpKeyStatus;
import com.appsmith.server.exceptions.AppsmithErrorCode;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.McpTokenService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.WorkspaceService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.web.reactive.context.ReactiveWebApplicationContext;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.UUID;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.mockAuthentication;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.springSecurity;

/**
 * Drives {@code POST /api/v1/git/applications/{id}/checkout-ref} through the full security chain with a real
 * {@code mcp_} bearer and the internal marker header, so the MCP authentication filter, {@code McpAllowlistWebFilter},
 * {@code GitRouteAspectCE} and {@code CentralGitServiceCEImpl.checkoutReference} all run as in production.
 *
 * <p>The application is real and owned by the token's user, so a 403 here cannot come from a missing resource. Each
 * case runs with in-memory Git (the aspect runs the guard before its FSM) and file-system Git (the aspect is skipped
 * and the service runs the guard). The guard's 403 carries {@code AE-ACL-4003}; the allowlist filter's 403 carries no
 * error code, so the body tells the two apart.
 */
@SpringBootTest(properties = "appsmith.mcp.internal-secret=" + McpCheckoutRefGuardHttpTest.MCP_INTERNAL_SECRET)
class McpCheckoutRefGuardHttpTest {

    static final String MCP_INTERNAL_SECRET = "mcp-checkout-ref-guard-test-secret";

    private static final String CHECKOUT_REF_URI = "/api/v1/git/applications/{id}/checkout-ref";

    private static final String TOKEN_NAME = "McpCheckoutRefGuardHttpTest";

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrganizationService organizationService;

    @Autowired
    private WorkspaceService workspaceService;

    @Autowired
    private ApplicationPageService applicationPageService;

    @Autowired
    private McpTokenService mcpTokenService;

    // Switches each case between in-memory and file-system Git.
    @MockitoSpyBean
    private GitServiceConfig gitServiceConfig;

    // Records whether the request reached an artifact lookup (the aspect's, the service's, or both).
    @MockitoSpyBean
    private GitApplicationHelperImpl gitApplicationHelper;

    private WebTestClient webTestClient;
    private User apiUser;
    private Authentication apiUserAuthentication;
    private boolean mcpConfigReplaced;
    private McpConfig originalMcpConfig;
    private McpTokenResponseDTO mcpToken;
    private String workspaceId;
    private String applicationId;

    @BeforeEach
    void setup(ReactiveWebApplicationContext context) {
        webTestClient = WebTestClient.bindToApplicationContext(context)
                .apply(springSecurity())
                .build();

        apiUser = userRepository.findByEmail("api_user").block();
        apiUserAuthentication =
                UsernamePasswordAuthenticationToken.authenticated(apiUser, null, apiUser.getAuthorities());

        // Token minting and token authentication both refuse unless the organization has MCP enabled.
        Organization organization =
                asApiUser(organizationService.getCurrentUserOrganization()).block();
        originalMcpConfig = organization.getOrganizationConfiguration().getMcpConfig();
        McpConfig enabledMcpConfig = new McpConfig();
        enabledMcpConfig.setEnabled(true);
        organization.getOrganizationConfiguration().setMcpConfig(enabledMcpConfig);
        organizationService.save(organization).block();
        mcpConfigReplaced = true;

        // A run that was killed before tearDown leaves its key active, and api_user may hold only a few active keys.
        asApiUser(mcpTokenService
                        .list(apiUser)
                        .filter(key -> TOKEN_NAME.equals(key.name()) && McpKeyStatus.ACTIVE.equals(key.status()))
                        .flatMap(key -> mcpTokenService.revoke(apiUser, key.id()))
                        .then())
                .block();

        Workspace workspace = new Workspace();
        workspace.setName("McpCheckoutRefGuardHttpTest-" + UUID.randomUUID());
        workspaceId = asApiUser(workspaceService.create(workspace)).block().getId();

        Application application = new Application();
        application.setName("McpCheckoutRefGuardHttpTest");
        applicationId = asApiUser(applicationPageService.createApplication(application, workspaceId))
                .block()
                .getId();

        mcpToken = asApiUser(mcpTokenService.create(apiUser, TOKEN_NAME)).block();
        assertThat(mcpToken.token()).startsWith("mcp_");

        clearInvocations(gitApplicationHelper);
    }

    @AfterEach
    void tearDown() {
        try {
            if (mcpToken != null) {
                asApiUser(mcpTokenService.revoke(apiUser, mcpToken.id())).block();
            }
            if (applicationId != null) {
                asApiUser(applicationPageService.deleteApplication(applicationId))
                        .block();
            }
            if (workspaceId != null) {
                asApiUser(workspaceService.archiveById(workspaceId)).block();
            }
        } finally {
            if (mcpConfigReplaced) {
                Organization organization = asApiUser(organizationService.getCurrentUserOrganization())
                        .block();
                organization.getOrganizationConfiguration().setMcpConfig(originalMcpConfig);
                organizationService.save(organization).block();
            }
        }
    }

    static Stream<Arguments> refusedRefsByGitMode() {
        return Stream.of(
                Arguments.of("origin/feature", RefType.branch, true),
                Arguments.of("origin/feature", RefType.branch, false),
                Arguments.of("v1.0", RefType.tag, true),
                Arguments.of("v1.0", RefType.tag, false));
    }

    @ParameterizedTest(name = "{1} {0}, in-memory Git={2}")
    @MethodSource("refusedRefsByGitMode")
    void should_return403BeforeArtifactLookup_when_mcpPrincipalChecksOutRemoteBranchOrTag(
            String refName, RefType refType, boolean gitInMemory) {
        // Given
        doReturn(gitInMemory).when(gitServiceConfig).isGitInMemory();

        // When
        WebTestClient.ResponseSpec response = checkoutRefAsMcpPrincipal(refName, refType);

        // Then
        response.expectStatus()
                .isForbidden()
                .expectBody()
                .jsonPath("$.responseMeta.error.code")
                .isEqualTo(AppsmithErrorCode.UNAUTHORIZED_ACCESS.getCode());
        verify(gitApplicationHelper, never()).getArtifactById(any(), any(AclPermission.class));
    }

    @ParameterizedTest(name = "in-memory Git={0}")
    @ValueSource(booleans = {true, false})
    void should_reachCheckoutService_when_mcpPrincipalChecksOutMcpBranch(boolean gitInMemory) {
        // Given
        doReturn(gitInMemory).when(gitServiceConfig).isGitInMemory();

        // When
        WebTestClient.ResponseSpec response = checkoutRefAsMcpPrincipal("mcp/feature", RefType.branch);

        // Then
        assertReachedCheckoutService(response);
    }

    @ParameterizedTest(name = "in-memory Git={0}")
    @ValueSource(booleans = {true, false})
    void should_reachCheckoutService_when_sessionUserChecksOutRemoteBranch(boolean gitInMemory) {
        // Given
        doReturn(gitInMemory).when(gitServiceConfig).isGitInMemory();

        // When
        WebTestClient.ResponseSpec response = checkoutRefAsSessionUser("origin/feature", RefType.branch);

        // Then
        assertReachedCheckoutService(response);
    }

    @Test
    void should_return401_when_mcpBearerHasWrongInternalMarker() {
        // Given
        String wrongMarker = MCP_INTERNAL_SECRET + "-wrong";

        // When
        WebTestClient.ResponseSpec response = webTestClient
                .post()
                .uri(CHECKOUT_REF_URI, applicationId)
                .headers(headers -> {
                    headers.setBearerAuth(mcpToken.token());
                    headers.set(FieldName.INTERNAL_MARKER, wrongMarker);
                })
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(checkoutRefBody("mcp/feature", RefType.branch))
                .exchange();

        // Then
        response.expectStatus().isUnauthorized();
        verify(gitApplicationHelper, never()).getArtifactById(any(), any(AclPermission.class));
    }

    private WebTestClient.ResponseSpec checkoutRefAsMcpPrincipal(String refName, RefType refType) {
        return webTestClient
                .post()
                .uri(CHECKOUT_REF_URI, applicationId)
                .headers(headers -> {
                    headers.setBearerAuth(mcpToken.token());
                    headers.set(FieldName.INTERNAL_MARKER, MCP_INTERNAL_SECRET);
                })
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(checkoutRefBody(refName, refType))
                .exchange();
    }

    private WebTestClient.ResponseSpec checkoutRefAsSessionUser(String refName, RefType refType) {
        return webTestClient
                .mutateWith(mockAuthentication(apiUserAuthentication))
                .post()
                .uri(CHECKOUT_REF_URI, applicationId)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(checkoutRefBody(refName, refType))
                .exchange();
    }

    /**
     * The application is not connected to Git, so a request that passes every guard reaches the service's artifact
     * lookup and fails there with the service's own {@code INVALID_GIT_CONFIGURATION}, never a 401 or 403. With
     * in-memory Git the aspect looks the artifact up first, so the lookup runs once or twice.
     */
    private void assertReachedCheckoutService(WebTestClient.ResponseSpec response) {
        response.expectStatus()
                .isBadRequest()
                .expectBody()
                .jsonPath("$.responseMeta.error.code")
                .isEqualTo(AppsmithErrorCode.INVALID_GIT_CONFIGURATION.getCode());
        verify(gitApplicationHelper, atLeastOnce()).getArtifactById(eq(applicationId), any(AclPermission.class));
    }

    private static Map<String, String> checkoutRefBody(String refName, RefType refType) {
        return Map.of("refName", refName, "refType", refType.name());
    }

    private <T> Mono<T> asApiUser(Mono<T> mono) {
        return mono.contextWrite(ReactiveSecurityContextHolder.withAuthentication(apiUserAuthentication));
    }
}
