package com.appsmith.server.jslibs.base;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ApplicationAccessDTO;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.WorkspaceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.web.reactive.context.ReactiveWebApplicationContext;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextImpl;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Mono;

import java.util.Set;

import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.springSecurity;

/**
 * Verifies the HTTP contract of the published custom JS library route, {@code GET
 * /api/v1/libraries/{id}/view}. The route is reachable without a session so that public applications
 * can load their libraries. For an application the caller cannot read, the route answers 404 for every
 * {@code contextType} value, the same as a missing application.
 *
 * <p>Modelled on {@code AuthGuardTest}. Fixtures are created under an explicit security context so the
 * test methods themselves stay unauthenticated.
 */
@SpringBootTest
class CustomJSLibControllerAuthorizationTest {

    private static final String LIBRARY_NAME = "authzLib";

    @Autowired
    CustomJSLibService customJSLibService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    UserRepository userRepository;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    private WebTestClient webTestClient;

    @BeforeEach
    void setup(ReactiveWebApplicationContext context) {
        webTestClient = WebTestClient.bindToApplicationContext(context)
                .apply(springSecurity())
                .build();
    }

    private <I> Mono<I> runAs(Mono<I> input, User user) {
        return input.contextWrite(ctx -> {
            SecurityContext securityContext = new SecurityContextImpl(
                    new UsernamePasswordAuthenticationToken(user, "password", user.getAuthorities()));
            return ctx.put(SecurityContext.class, Mono.just(securityContext));
        });
    }

    private Application createPublishedAppWithJsLib(User owner) {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        Workspace toCreate = new Workspace();
        toCreate.setName("CustomJSLibControllerAuthz Workspace");
        Workspace workspace = runAs(workspaceService.create(toCreate), owner).block();

        Application application = new Application();
        application.setName("CustomJSLibControllerAuthz App");
        Application createdApp = runAs(applicationPageService.createApplication(application, workspace.getId()), owner)
                .block();

        CustomJSLib jsLib = new CustomJSLib(
                LIBRARY_NAME, Set.of("authzAccessor"), "https://example.com/authz.js", "docsUrl", "1.0.0", "defs");
        runAs(
                        customJSLibService.addJSLibsToContext(
                                createdApp.getId(), CreatorContextType.APPLICATION, Set.of(jsLib), false),
                        owner)
                .block();

        runAs(applicationPageService.publish(createdApp.getId(), true), owner).block();

        return createdApp;
    }

    private String viewUri(String applicationId) {
        return Url.CUSTOM_JS_LIB_URL + "/" + applicationId + "/view";
    }

    @ParameterizedTest
    @EnumSource(
            value = CreatorContextType.class,
            names = {"PAGE", "MODULE", "WORKFLOW", "PACKAGE"})
    @DisplayName("GHSA-5hrq-v7jj-7m79")
    void should_return404_when_anonymousReadsPrivateApplicationLibrariesWithContextType(
            CreatorContextType contextType) {
        // Given
        User owner = userRepository.findByEmail("api_user").block();
        Application privateApp = createPublishedAppWithJsLib(owner);

        // When / Then
        webTestClient
                .get()
                .uri(uriBuilder -> uriBuilder
                        .path(viewUri(privateApp.getId()))
                        .queryParam("contextType", contextType.name())
                        .build())
                .exchange()
                .expectStatus()
                .isNotFound();
    }

    @Test
    void should_return404_when_anonymousReadsPrivateApplicationLibraries() {
        // Given
        User owner = userRepository.findByEmail("api_user").block();
        Application privateApp = createPublishedAppWithJsLib(owner);

        // When / Then
        webTestClient
                .get()
                .uri(viewUri(privateApp.getId()))
                .exchange()
                .expectStatus()
                .isNotFound();
    }

    @Test
    void should_return200_when_anonymousReadsPublicApplicationLibraries() {
        // Given
        User owner = userRepository.findByEmail("api_user").block();
        Application publicApp = createPublishedAppWithJsLib(owner);
        ApplicationAccessDTO publicAccess = new ApplicationAccessDTO();
        publicAccess.setPublicAccess(true);
        runAs(
                        applicationService.changeViewAccessForAllBranchesByBranchedApplicationId(
                                publicApp.getId(), publicAccess),
                        owner)
                .block();

        // When / Then
        webTestClient
                .get()
                .uri(viewUri(publicApp.getId()))
                .exchange()
                .expectStatus()
                .isOk()
                .expectBody()
                .jsonPath("$.data[0].name")
                .isEqualTo(LIBRARY_NAME);
    }
}
