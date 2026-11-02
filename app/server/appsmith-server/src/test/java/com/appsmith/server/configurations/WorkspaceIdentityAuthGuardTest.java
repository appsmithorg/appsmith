package com.appsmith.server.configurations;

import com.appsmith.external.models.Policy;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.services.WorkspaceService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.web.reactive.context.ReactiveWebApplicationContext;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextImpl;
import org.springframework.test.web.reactive.server.EntityExchangeResult;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.csrf;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.mockAuthentication;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.springSecurity;

@SpringBootTest
class WorkspaceIdentityAuthGuardTest {

    private static final String FIRST_USER_EMAIL = "api_user";
    private static final String SECOND_USER_EMAIL = "usertest@usertest.com";

    @Autowired
    private ReactiveWebApplicationContext context;

    @Autowired
    private WorkspaceService workspaceService;

    @Autowired
    private WorkspaceRepository workspaceRepository;

    @Autowired
    private UserRepository userRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Map<String, User> workspacesToArchive = new LinkedHashMap<>();
    private WebTestClient webTestClient;
    private User firstUser;
    private User secondUser;

    @BeforeEach
    void setUp() {
        webTestClient = WebTestClient.bindToApplicationContext(context)
                .apply(springSecurity())
                .build();
        firstUser = userRepository.findByEmail(FIRST_USER_EMAIL).block();
        secondUser = userRepository.findByEmail(SECOND_USER_EMAIL).block();
    }

    @AfterEach
    void tearDown() {
        // Archive through the service as the owner so the generated permission groups go with the workspace.
        workspacesToArchive.forEach(
                (id, owner) -> runAs(workspaceService.archiveById(id), owner).block());
        workspacesToArchive.clear();
    }

    @Test
    @DisplayName("GHSA-jwwq-f2p9-47w4")
    void should_createNewWorkspaceAndPreserveExisting_when_createRequestCarriesExistingId() throws Exception {
        // Given
        Workspace existing = createWorkspaceAs(firstUser, unique("first-user-workspace"));
        String existingId = existing.getId();
        String existingName = existing.getName();
        Map<String, Policy> existingPolicyMap = new HashMap<>(existing.getPolicyMap());
        Set<String> existingDefaultGroups = new HashSet<>(existing.getDefaultPermissionGroups());

        String requestedName = unique("second-user-workspace");
        Workspace request = new Workspace();
        request.setId(existingId);
        request.setName(requestedName);

        // When
        EntityExchangeResult<String> result = authenticatedClient(secondUser)
                .post()
                .uri("/api/v1/workspaces")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectBody(String.class)
                .returnResult();

        // Then
        // The existing workspace is checked first: it must be untouched whatever the response was.
        Workspace existingAfterRequest =
                workspaceRepository.findById(existingId).block();
        assertThat(existingAfterRequest).isNotNull();
        assertThat(existingAfterRequest.getName()).isEqualTo(existingName);
        assertThat(existingAfterRequest.getPolicyMap()).isEqualTo(existingPolicyMap);
        assertThat(existingAfterRequest.getDefaultPermissionGroups()).isEqualTo(existingDefaultGroups);

        String responseBody = result.getResponseBody();
        assertThat(result.getStatus())
                .describedAs("response body: %s", responseBody)
                .isEqualTo(HttpStatus.CREATED);
        JsonNode data = objectMapper.readTree(responseBody).path("data");
        String createdId = data.path("id").asText();
        if (!createdId.isBlank()) {
            workspacesToArchive.put(createdId, secondUser);
        }
        assertThat(createdId).isNotBlank();
        assertThat(createdId).isNotEqualTo(existingId);

        Workspace created = workspaceRepository.findById(createdId).block();
        assertThat(created).isNotNull();
        assertThat(created.getName()).isEqualTo(requestedName);
    }

    @Test
    void should_createWorkspaceWithGeneratedIdentity_when_createRequestOmitsId() throws Exception {
        // Given
        String requestedName = unique("second-user-workspace");
        Workspace request = new Workspace();
        request.setName(requestedName);

        // When
        String responseBody = authenticatedClient(secondUser)
                .post()
                .uri("/api/v1/workspaces")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus()
                .isCreated()
                .expectBody(String.class)
                .returnResult()
                .getResponseBody();

        // Then
        JsonNode data = objectMapper.readTree(responseBody).path("data");
        String createdId = data.path("id").asText();
        if (!createdId.isBlank()) {
            workspacesToArchive.put(createdId, secondUser);
        }
        assertThat(createdId).isNotBlank();

        Workspace created = workspaceRepository.findById(createdId).block();
        assertThat(created).isNotNull();
        assertThat(created.getName()).isEqualTo(requestedName);
        assertThat(created.getPolicyMap()).isNotEmpty();
        assertThat(created.getDefaultPermissionGroups()).isNotEmpty();
    }

    @Test
    void should_generateServerOwnedFields_when_createRequestSetsThem() throws Exception {
        // Given
        String requestedName = unique("second-user-workspace");
        String sentinelPermission = unique("sentinel-permission");
        String sentinelGroupId = unique("sentinel-group");
        Workspace request = new Workspace();
        request.setName(requestedName);
        request.setPolicies(Set.of(Policy.builder()
                .permission(sentinelPermission)
                .permissionGroups(Set.of(sentinelGroupId))
                .build()));
        request.setDefaultPermissionGroups(Set.of(sentinelGroupId));

        // When
        String responseBody = authenticatedClient(secondUser)
                .post()
                .uri("/api/v1/workspaces")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus()
                .isCreated()
                .expectBody(String.class)
                .returnResult()
                .getResponseBody();

        // Then
        JsonNode data = objectMapper.readTree(responseBody).path("data");
        String createdId = data.path("id").asText();
        if (!createdId.isBlank()) {
            workspacesToArchive.put(createdId, secondUser);
        }
        assertThat(createdId).isNotBlank();

        Workspace created = workspaceRepository.findById(createdId).block();
        assertThat(created).isNotNull();
        assertThat(created.getPolicyMap()).isNotEmpty();
        assertThat(created.getPolicyMap()).doesNotContainKey(sentinelPermission);
        created.getPolicyMap().values().forEach(policy -> assertThat(policy.getPermissionGroups())
                .doesNotContain(sentinelGroupId));
        assertThat(created.getDefaultPermissionGroups()).isNotEmpty();
        assertThat(created.getDefaultPermissionGroups()).doesNotContain(sentinelGroupId);
    }

    private Workspace createWorkspaceAs(User owner, String name) {
        Workspace workspace = new Workspace();
        workspace.setName(name);
        Workspace created = runAs(workspaceService.create(workspace, owner, Boolean.FALSE), owner)
                .block();
        workspacesToArchive.put(created.getId(), owner);
        return workspaceRepository.findById(created.getId()).block();
    }

    private WebTestClient authenticatedClient(User user) {
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(user, "password", user.getAuthorities());
        return webTestClient.mutateWith(mockAuthentication(authentication)).mutateWith(csrf());
    }

    private <T> Mono<T> runAs(Mono<T> publisher, User user) {
        return publisher.contextWrite(context -> {
            SecurityContext securityContext = new SecurityContextImpl(
                    new UsernamePasswordAuthenticationToken(user, "password", user.getAuthorities()));
            return context.put(SecurityContext.class, Mono.just(securityContext));
        });
    }

    private String unique(String prefix) {
        return prefix + "-" + UUID.randomUUID();
    }
}
