package com.appsmith.server.controllers;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ApplicationAccessDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ApplicationPermission;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.web.reactive.context.ReactiveWebApplicationContext;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextImpl;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Mono;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.mockAuthentication;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.springSecurity;

/**
 * Runs the page read endpoints through the real security chain and the real services: the editor-mode read requires
 * the page edit permission, the view-mode read keeps the read permission.
 *
 * <p>The tests carry no test-level security context on purpose. A request from {@link #anonymousClient} therefore
 * reaches the application's own anonymous handling. Fixture setup runs under an explicit editor context instead.
 */
@SpringBootTest
@DirtiesContext
class PageEditorModeReadControllerTest {

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    ApplicationPermission applicationPermission;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    NewPageService newPageService;

    @Autowired
    UserRepository userRepository;

    /** Requests with no principal: the application's own security chain treats them as the anonymous user. */
    WebTestClient anonymousClient;

    /** Requests that carry a mocked authentication. */
    WebTestClient authenticatedClient;

    SecurityContext editorContext;

    Workspace workspace;

    @BeforeEach
    void setup(ReactiveWebApplicationContext context) {
        anonymousClient = WebTestClient.bindToApplicationContext(context).build();
        authenticatedClient = WebTestClient.bindToApplicationContext(context)
                .apply(springSecurity())
                .build();

        User editor = userRepository.findByEmail("api_user").block();
        assertThat(editor).isNotNull();
        editorContext =
                new SecurityContextImpl(new UsernamePasswordAuthenticationToken(editor, null, editor.getAuthorities()));

        Workspace unsavedWorkspace = new Workspace();
        unsavedWorkspace.setName("PageEditorModeReadControllerTest Workspace");
        workspace = asEditor(workspaceService.create(unsavedWorkspace));
    }

    @AfterEach
    void cleanup() {
        asEditor(applicationPermission
                .getDeletePermission()
                .flatMapMany(permission -> applicationService.findByWorkspaceId(workspace.getId(), permission))
                .flatMap(remainingApplication -> applicationPageService.deleteApplication(remainingApplication.getId()))
                .collectList()
                .then(workspaceService.archiveById(workspace.getId())));
    }

    /** Runs the publisher with the editor as the current user and returns its value. */
    <T> T asEditor(Mono<T> mono) {
        return mono.contextWrite(ReactiveSecurityContextHolder.withSecurityContext(Mono.just(editorContext)))
                .block();
    }

    record PublicPageWithDraft(String pageId, String publishedName, String draftName) {}

    /** A public application whose only page has a published copy and a draft copy with different names. */
    PublicPageWithDraft createPublicPageWithDraftChanges(String uniquePrefix) {
        Application application = new Application();
        application.setName(uniquePrefix + "_app");
        Application createdApplication =
                asEditor(applicationPageService.createApplication(application, workspace.getId()));
        assertThat(createdApplication).isNotNull();
        String pageId = createdApplication.getPages().get(0).getId();
        asEditor(applicationPageService.publish(createdApplication.getId(), true));
        NewPage publishedPage =
                newPageService.getByIdWithoutPermissionCheck(pageId).block();
        assertThat(publishedPage).isNotNull();
        String publishedName = publishedPage.getPublishedPage().getName();

        String draftName = uniquePrefix + "_draft";
        PageDTO rename = new PageDTO();
        rename.setName(draftName);
        asEditor(newPageService.updatePage(pageId, rename));
        assertThat(draftName).isNotEqualTo(publishedName);

        ApplicationAccessDTO access = new ApplicationAccessDTO();
        access.setPublicAccess(true);
        Application publicApplication =
                asEditor(applicationService.changeViewAccessForSingleBranchByBranchedApplicationId(
                        createdApplication.getId(), access));
        assertThat(publicApplication).isNotNull();
        assertThat(publicApplication.getIsPublic()).isTrue();
        return new PublicPageWithDraft(pageId, publishedName, draftName);
    }

    @Test
    @DisplayName("GHSA-j564-5cm6-xjgj")
    void should_return404_when_anonymousUserRequestsEditorModePageOfPublicApplication() {
        // Given
        PublicPageWithDraft fixture = createPublicPageWithDraftChanges("httpAnonEditor_" + UUID.randomUUID());

        // When / Then
        anonymousClient
                .get()
                .uri("/api/v1/pages/{pageId}", fixture.pageId())
                .exchange()
                .expectStatus()
                .isNotFound()
                .expectBody()
                .jsonPath("$.responseMeta.error.message")
                .isEqualTo(AppsmithError.ACL_NO_RESOURCE_FOUND.getMessage(FieldName.PAGE, fixture.pageId()))
                .jsonPath("$.data")
                .doesNotExist();
    }

    @Test
    @DisplayName("GHSA-j564-5cm6-xjgj")
    void should_returnPublishedPage_when_anonymousUserRequestsViewModePageOfPublicApplication() {
        // Given
        PublicPageWithDraft fixture = createPublicPageWithDraftChanges("httpAnonView_" + UUID.randomUUID());

        // When / Then
        anonymousClient
                .get()
                .uri("/api/v1/pages/{pageId}/view", fixture.pageId())
                .exchange()
                .expectStatus()
                .isOk()
                .expectBody()
                .jsonPath("$.data.name")
                .isEqualTo(fixture.publishedName());
    }

    @Test
    @DisplayName("GHSA-j564-5cm6-xjgj")
    void should_returnDraftPage_when_editorRequestsEditorModePage() {
        // Given
        PublicPageWithDraft fixture = createPublicPageWithDraftChanges("httpEditor_" + UUID.randomUUID());

        // When / Then
        authenticatedClient
                .mutateWith(mockAuthentication(editorContext.getAuthentication()))
                .get()
                .uri("/api/v1/pages/{pageId}", fixture.pageId())
                .exchange()
                .expectStatus()
                .isOk()
                .expectBody()
                .jsonPath("$.data.name")
                .isEqualTo(fixture.draftName());
    }
}
