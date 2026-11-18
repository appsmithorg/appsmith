package com.appsmith.server.configurations;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.WorkspaceService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.web.reactive.context.ReactiveWebApplicationContext;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextImpl;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.csrf;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.mockAuthentication;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.springSecurity;

@SpringBootTest
class PageDependencyMapAuthGuardTest {

    private static final String OWNER_EMAIL = "api_user";
    private static final String OTHER_USER_EMAIL = "usertest@usertest.com";
    private static final Map<String, List<String>> INITIAL_DEPENDENCY_MAP =
            Map.of("Text1.text", List.of("Input1.text"));
    private static final Map<String, List<String>> REQUESTED_DEPENDENCY_MAP =
            Map.of("Text2.text", List.of("Input2.text"));

    @Autowired
    private ReactiveWebApplicationContext context;

    @Autowired
    private ApplicationPageService applicationPageService;

    @Autowired
    private NewPageRepository newPageRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WorkspaceService workspaceService;

    private final List<Fixture> fixtures = new ArrayList<>();
    private WebTestClient webTestClient;
    private User owner;
    private User otherUser;

    @BeforeEach
    void setUp() {
        webTestClient = WebTestClient.bindToApplicationContext(context)
                .apply(springSecurity())
                .build();
        owner = userRepository.findByEmail(OWNER_EMAIL).block();
        otherUser = userRepository.findByEmail(OTHER_USER_EMAIL).block();
    }

    @AfterEach
    void tearDown() {
        fixtures.forEach(fixture -> {
            runAs(applicationPageService.deleteApplication(fixture.applicationId()), owner)
                    .block();
            runAs(workspaceService.archiveById(fixture.workspaceId()), owner).block();
        });
        fixtures.clear();
    }

    @ParameterizedTest(name = "rejects update without page edit permission [{index}]")
    @NullSource
    @ValueSource(strings = {"", " "})
    @DisplayName("GHSA-49c7-379h-j5wv")
    void should_rejectDependencyMapUpdate_when_callerLacksManagePermission(String branchName) {
        // Given
        Fixture fixture = createPageOwnedBy(owner);

        // When
        WebTestClient.ResponseSpec response = putDependencyMap(otherUser, fixture.pageId(), branchName);

        // Then
        response.expectStatus()
                .isNotFound()
                .expectBody()
                .jsonPath("$.responseMeta.error.code")
                .isEqualTo(AppsmithError.ACL_NO_RESOURCE_FOUND.getAppErrorCode())
                .jsonPath("$.responseMeta.error.message")
                .isEqualTo(AppsmithError.ACL_NO_RESOURCE_FOUND.getMessage(FieldName.PAGE, fixture.pageId()));
        assertThat(storedDependencyMap(fixture.pageId())).isEqualTo(INITIAL_DEPENDENCY_MAP);
    }

    @Test
    @DisplayName("GHSA-49c7-379h-j5wv")
    void should_notUpdateDependencyMapInRepository_when_callerLacksManagePermission() {
        // Given
        Fixture fixture = createPageOwnedBy(owner);

        // When
        Mono<Integer> updatedCount =
                runAs(newPageRepository.updateDependencyMap(fixture.pageId(), REQUESTED_DEPENDENCY_MAP), otherUser);

        // Then
        StepVerifier.create(updatedCount).expectNext(0).verifyComplete();
        assertThat(storedDependencyMap(fixture.pageId())).isEqualTo(INITIAL_DEPENDENCY_MAP);
    }

    @ParameterizedTest(name = "updates with page edit permission [{index}]")
    @NullSource
    @ValueSource(strings = {"", " "})
    @DisplayName("GHSA-49c7-379h-j5wv")
    void should_updateDependencyMap_when_callerHasManagePermission(String branchName) {
        // Given
        Fixture fixture = createPageOwnedBy(owner);

        // When
        WebTestClient.ResponseSpec response = putDependencyMap(owner, fixture.pageId(), branchName);

        // Then
        response.expectStatus().isOk();
        assertThat(storedDependencyMap(fixture.pageId())).isEqualTo(REQUESTED_DEPENDENCY_MAP);
    }

    private WebTestClient.ResponseSpec putDependencyMap(User caller, String pageId, String branchName) {
        WebTestClient.RequestBodySpec request = authenticatedClient(caller)
                .put()
                .uri("/api/v1/pages/{pageId}/dependencyMap", pageId)
                .contentType(MediaType.APPLICATION_JSON);
        if (branchName != null) {
            request = request.header(FieldName.BRANCH_NAME, branchName);
        }
        return request.bodyValue(REQUESTED_DEPENDENCY_MAP).exchange();
    }

    private Fixture createPageOwnedBy(User pageOwner) {
        Workspace workspace = new Workspace();
        workspace.setName(unique("workspace"));
        Workspace createdWorkspace =
                workspaceService.create(workspace, pageOwner, Boolean.FALSE).block();

        Application application = new Application();
        application.setName(unique("application"));
        Application createdApplication = runAs(
                        applicationPageService.createApplication(application, createdWorkspace.getId()), pageOwner)
                .block();
        String pageId = createdApplication.getPages().get(0).getId();

        NewPage page = newPageRepository.findById(pageId).block();
        page.getUnpublishedPage().setDependencyMap(INITIAL_DEPENDENCY_MAP);
        newPageRepository.save(page).block();

        Fixture fixture = new Fixture(createdWorkspace.getId(), createdApplication.getId(), pageId);
        fixtures.add(fixture);
        return fixture;
    }

    private Map<String, List<String>> storedDependencyMap(String pageId) {
        return newPageRepository.findById(pageId).block().getUnpublishedPage().getDependencyMap();
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

    private record Fixture(String workspaceId, String applicationId, String pageId) {}
}
