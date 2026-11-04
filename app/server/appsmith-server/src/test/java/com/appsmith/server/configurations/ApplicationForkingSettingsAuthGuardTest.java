package com.appsmith.server.configurations;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.WorkspaceService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.web.reactive.context.ReactiveWebApplicationContext;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextImpl;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.csrf;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.mockAuthentication;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.springSecurity;

/**
 * The application setting that allows forking can be turned on only by a user who holds the
 * application export permission. Edit access alone must not be enough, because the client shows
 * the setting only to users who can export the application and the server has to enforce the
 * same rule.
 */
@SpringBootTest
class ApplicationForkingSettingsAuthGuardTest {

    private static final String OWNER_EMAIL = "api_user";
    private static final String EDITOR_EMAIL = "usertest@usertest.com";

    @Autowired
    private ReactiveWebApplicationContext context;

    @Autowired
    private ApplicationService applicationService;

    @Autowired
    private ApplicationPageService applicationPageService;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private PermissionGroupRepository permissionGroupRepository;

    @Autowired
    private PermissionGroupService permissionGroupService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WorkspaceService workspaceService;

    private final List<Fixture> fixtures = new ArrayList<>();
    private WebTestClient webTestClient;
    private User owner;
    private User editor;

    @BeforeEach
    void setUp() {
        webTestClient = WebTestClient.bindToApplicationContext(context)
                .apply(springSecurity())
                .build();
        owner = userRepository.findByEmail(OWNER_EMAIL).block();
        editor = userRepository.findByEmail(EDITOR_EMAIL).block();
    }

    @AfterEach
    void tearDown() {
        fixtures.forEach(fixture -> runAs(
                        applicationPageService
                                .deleteApplication(fixture.applicationId())
                                .then(workspaceService.archiveById(fixture.workspaceId())),
                        owner)
                .block());
        fixtures.clear();
    }

    @Test
    @DisplayName("GHSA-3m2r-w89j-rw4j")
    void should_returnForbiddenAndKeepForkingDisabled_when_editorEnablesForking() {
        // Given
        Fixture fixture = createFixture();
        String attemptedName = unique("renamed-by-editor");

        // When
        authenticatedClient(editor)
                .put()
                .uri("/api/v1/applications/{id}", fixture.applicationId())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("forkingEnabled", true, "name", attemptedName))
                .exchange()
                .expectStatus()
                .isForbidden();

        // Then
        Application stored =
                applicationRepository.findById(fixture.applicationId()).block();
        assertThat(stored.getForkingEnabled()).isNotEqualTo(Boolean.TRUE);
        assertThat(stored.getName()).isEqualTo(fixture.applicationName());
    }

    @Test
    void should_enableForking_when_userHasExportPermission() {
        // Given
        Fixture fixture = createFixture();

        // When
        authenticatedClient(owner)
                .put()
                .uri("/api/v1/applications/{id}", fixture.applicationId())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("forkingEnabled", true))
                .exchange()
                .expectStatus()
                .isOk();

        // Then
        Application stored =
                applicationRepository.findById(fixture.applicationId()).block();
        assertThat(stored.getForkingEnabled()).isTrue();
    }

    @Test
    void should_disableForking_when_editorLacksExportPermission() {
        // Given
        Fixture fixture = createFixture();
        enableForkingAsOwner(fixture);

        // When
        authenticatedClient(editor)
                .put()
                .uri("/api/v1/applications/{id}", fixture.applicationId())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("forkingEnabled", false))
                .exchange()
                .expectStatus()
                .isOk();

        // Then
        Application stored =
                applicationRepository.findById(fixture.applicationId()).block();
        assertThat(stored.getForkingEnabled()).isFalse();
    }

    @Test
    void should_updateOtherFields_when_editorSendsIdempotentForkingEnabled() {
        // Given
        Fixture fixture = createFixture();
        enableForkingAsOwner(fixture);
        String newName = unique("renamed-with-forking-kept");

        // When
        authenticatedClient(editor)
                .put()
                .uri("/api/v1/applications/{id}", fixture.applicationId())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("forkingEnabled", true, "name", newName))
                .exchange()
                .expectStatus()
                .isOk();

        // Then
        Application stored =
                applicationRepository.findById(fixture.applicationId()).block();
        assertThat(stored.getName()).isEqualTo(newName);
        assertThat(stored.getForkingEnabled()).isTrue();
    }

    @Test
    void should_updateApplicationName_when_editorDoesNotChangeForking() {
        // Given
        Fixture fixture = createFixture();
        String newName = unique("renamed-by-editor");

        // When
        authenticatedClient(editor)
                .put()
                .uri("/api/v1/applications/{id}", fixture.applicationId())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("name", newName))
                .exchange()
                .expectStatus()
                .isOk();

        // Then
        Application stored =
                applicationRepository.findById(fixture.applicationId()).block();
        assertThat(stored.getName()).isEqualTo(newName);
        assertThat(stored.getForkingEnabled()).isNotEqualTo(Boolean.TRUE);
    }

    /**
     * A workspace owned by the owner with one application, where the editor holds the workspace
     * Developer role: edit access to the application without the export permission.
     */
    private Fixture createFixture() {
        Workspace workspace = new Workspace();
        workspace.setName(unique("forking-setting-workspace"));
        Workspace createdWorkspace =
                workspaceService.create(workspace, owner, Boolean.FALSE).block();

        String applicationName = unique("forking-setting-application");
        Application application = new Application();
        application.setName(applicationName);
        Application createdApplication = runAs(
                        applicationPageService.createApplication(application, createdWorkspace.getId()), owner)
                .block();

        PermissionGroup developerGroup = permissionGroupRepository
                .findAllById(createdWorkspace.getDefaultPermissionGroups())
                .filter(group -> group.getName().startsWith(FieldName.DEVELOPER))
                .next()
                .block();
        runAs(permissionGroupService.bulkAssignToUsers(developerGroup, List.of(editor)), owner)
                .block();

        // Guard the fixture itself: the editor must be able to edit the application and must
        // not be able to export it, otherwise the tests below would not prove anything.
        Application asEditor = runAs(
                        applicationService.findById(createdApplication.getId(), AclPermission.MANAGE_APPLICATIONS),
                        editor)
                .block();
        assertThat(asEditor.getUserPermissions())
                .contains(AclPermission.MANAGE_APPLICATIONS.getValue())
                .doesNotContain(AclPermission.EXPORT_APPLICATIONS.getValue());

        Fixture fixture = new Fixture(createdWorkspace.getId(), createdApplication.getId(), applicationName);
        fixtures.add(fixture);
        return fixture;
    }

    private void enableForkingAsOwner(Fixture fixture) {
        authenticatedClient(owner)
                .put()
                .uri("/api/v1/applications/{id}", fixture.applicationId())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("forkingEnabled", true))
                .exchange()
                .expectStatus()
                .isOk();
        Application stored =
                applicationRepository.findById(fixture.applicationId()).block();
        assertThat(stored.getForkingEnabled()).isTrue();
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

    private record Fixture(String workspaceId, String applicationId, String applicationName) {}
}
