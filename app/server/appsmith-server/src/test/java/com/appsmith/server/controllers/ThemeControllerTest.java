package com.appsmith.server.controllers;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ApplicationAccessDTO;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.themes.base.ThemeService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextImpl;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Mono;

import java.util.UUID;

import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.mockAuthentication;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.springSecurity;

/**
 * Drives the application theme-list route over HTTP, modelled on
 * {@link com.appsmith.server.configurations.AuthGuardTest}: the application theme list is editor data, so a
 * caller without edit permission on the application receives an empty list while a caller with edit
 * permission receives the named and system themes. See GHSA-x2jf-gfvj-wfg2.
 */
@SpringBootTest
class ThemeControllerTest {

    private static final String THEME_LIST_URL = "/api/v1/themes/applications/";

    @Autowired
    private ApplicationContext context;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WorkspaceService workspaceService;

    @Autowired
    private ApplicationPageService applicationPageService;

    @Autowired
    private ApplicationService applicationService;

    @Autowired
    private ApplicationPermission applicationPermission;

    @Autowired
    private ThemeService themeService;

    private Authentication editorAuthentication;
    private SecurityContext editorSecurityContext;
    private Workspace workspace;

    @BeforeEach
    void setup() {
        User editor = userRepository.findByEmail("api_user").block();
        editorAuthentication = new UsernamePasswordAuthenticationToken(editor, null, editor.getAuthorities());
        editorSecurityContext = new SecurityContextImpl(editorAuthentication);

        Workspace toCreate = new Workspace();
        toCreate.setName("ThemeControllerTest workspace " + UUID.randomUUID());
        workspace = asEditor(workspaceService.create(toCreate)).block();
    }

    @AfterEach
    void cleanup() {
        asEditor(applicationPermission
                        .getDeletePermission()
                        .flatMapMany(permission -> applicationService.findByWorkspaceId(workspace.getId(), permission))
                        .flatMap(application -> applicationPageService.deleteApplication(application.getId()))
                        .collectList()
                        .then(workspaceService.archiveById(workspace.getId())))
                .block();
    }

    @Test
    @DisplayName("Theme list is empty for a caller without edit permission (GHSA-x2jf-gfvj-wfg2)")
    void should_returnEmptyThemeList_when_callerLacksEditPermission() {
        // Given
        Application publicApplication = createPublicApplicationWithNamedTheme("Named theme " + UUID.randomUUID());
        WebTestClient clientWithoutEditPermission = WebTestClient.bindToApplicationContext(context)
                .apply(springSecurity())
                .build();

        // When
        WebTestClient.ResponseSpec response = clientWithoutEditPermission
                .get()
                .uri(THEME_LIST_URL + publicApplication.getId())
                .exchange();

        // Then
        response.expectStatus()
                .isOk()
                .expectBody()
                .jsonPath("$.data")
                .isArray()
                .jsonPath("$.data.length()")
                .isEqualTo(0);
    }

    @Test
    @DisplayName("Theme list holds the named and system themes for a caller with edit permission (GHSA-x2jf-gfvj-wfg2)")
    void should_returnNamedAndSystemThemes_when_callerHasEditPermission() {
        // Given
        String namedThemeDisplayName = "Named theme " + UUID.randomUUID();
        Application publicApplication = createPublicApplicationWithNamedTheme(namedThemeDisplayName);
        WebTestClient clientWithEditPermission = WebTestClient.bindToApplicationContext(context)
                .apply(springSecurity())
                .build()
                .mutateWith(mockAuthentication(editorAuthentication));

        // When
        WebTestClient.ResponseSpec response = clientWithEditPermission
                .get()
                .uri(THEME_LIST_URL + publicApplication.getId())
                .exchange();

        // Then
        response.expectStatus()
                .isOk()
                .expectBody()
                .jsonPath("$.data[?(@.displayName == '%s')]", namedThemeDisplayName)
                .exists()
                .jsonPath("$.data[?(@.isSystemTheme == true)]")
                .exists();
    }

    /**
     * Creates an application owned by {@code api_user} with one named theme, then makes it public, which
     * grants read access on it without edit permission.
     */
    private Application createPublicApplicationWithNamedTheme(String namedThemeDisplayName) {
        Application application = new Application();
        application.setName("ThemeControllerTest app " + UUID.randomUUID());
        application.setWorkspaceId(workspace.getId());

        Theme namedTheme = new Theme();
        namedTheme.setDisplayName(namedThemeDisplayName);

        ApplicationAccessDTO publicAccess = new ApplicationAccessDTO();
        publicAccess.setPublicAccess(true);

        return asEditor(applicationPageService
                        .createApplication(application, workspace.getId())
                        .flatMap(createdApplication -> themeService
                                .persistCurrentTheme(createdApplication.getId(), null, namedTheme)
                                .then(applicationService.changeViewAccessForSingleBranchByBranchedApplicationId(
                                        createdApplication.getId(), publicAccess))))
                .block();
    }

    private <T> Mono<T> asEditor(Mono<T> mono) {
        return mono.contextWrite(ReactiveSecurityContextHolder.withSecurityContext(Mono.just(editorSecurityContext)));
    }
}
