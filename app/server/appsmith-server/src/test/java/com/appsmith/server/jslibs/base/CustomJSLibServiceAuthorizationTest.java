package com.appsmith.server.jslibs.base;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.WorkspaceService;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextImpl;
import org.springframework.security.test.context.support.WithUserDetails;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifies that reading an application's custom JS library manifest is gated by an application-level
 * READ check, so a caller with no read access to the target application cannot enumerate its
 * libraries.
 *
 * <p>The read path funnels through {@link CustomJSLibService#getAllJSLibsInContext} for both the
 * published ({@code GET /libraries/{id}/view}) and unpublished ({@code GET /libraries/{id}}) routes.
 * Without an in-service authorization check this method reaches a projection read that carries no
 * ACL criterion, so it returns the manifest of any application by id regardless of the caller's
 * membership. This test creates a private application as one user and asserts that a second,
 * unrelated user is denied.
 */
@SpringBootTest
@Slf4j
class CustomJSLibServiceAuthorizationTest {

    @Autowired
    CustomJSLibService customJSLibService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    UserRepository userRepository;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    private <I> Mono<I> runAs(Mono<I> input, User user) {
        return input.contextWrite(ctx -> {
            SecurityContext securityContext = new SecurityContextImpl(
                    new UsernamePasswordAuthenticationToken(user, "password", user.getAuthorities()));
            return ctx.put(SecurityContext.class, Mono.just(securityContext));
        });
    }

    /**
     * The not-found answer for a context the caller cannot read. The resource named in the message is the
     * one of the service the edition resolves the context type to: the application in CE for every context
     * type, the application or the package in EE.
     */
    private static void assertNoResourceFound(Throwable throwable, String contextId) {
        assertThat(throwable).isInstanceOf(AppsmithException.class);
        AppsmithException exception = (AppsmithException) throwable;
        assertThat(exception.getError()).isEqualTo(AppsmithError.NO_RESOURCE_FOUND);
        assertThat(exception.getMessage())
                .isIn(
                        AppsmithError.NO_RESOURCE_FOUND.getMessage(FieldName.APPLICATION, contextId),
                        AppsmithError.NO_RESOURCE_FOUND.getMessage(FieldName.PACKAGE, contextId));
    }

    private Application createPrivateAppWithJsLib() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        Workspace toCreate = new Workspace();
        toCreate.setName("CustomJSLibAuthz Workspace");
        Workspace workspace = workspaceService.create(toCreate).block();

        Application application = new Application();
        application.setName("CustomJSLibAuthz Private App");
        Application createdApp = applicationPageService
                .createApplication(application, workspace.getId())
                .block();

        CustomJSLib jsLib = new CustomJSLib(
                "authzLib", Set.of("authzAccessor"), "https://example.com/authz.js", "docsUrl", "1.0.0", "defs");
        customJSLibService
                .addJSLibsToContext(createdApp.getId(), CreatorContextType.APPLICATION, Set.of(jsLib), false)
                .block();

        // Publish so the published-mode manifest is populated too.
        applicationPageService.publish(createdApp.getId(), true).block();

        return createdApp;
    }

    @Test
    @WithUserDetails(value = "api_user")
    void nonMemberCannotReadUnpublishedJsLibManifestOfPrivateApplication() {
        Application privateApp = createPrivateAppWithJsLib();
        User otherUser = userRepository.findByEmail("usertest@usertest.com").block();

        Mono<List<CustomJSLib>> readAsOtherUser = runAs(
                customJSLibService.getAllJSLibsInContext(privateApp.getId(), CreatorContextType.APPLICATION, false),
                otherUser);

        StepVerifier.create(readAsOtherUser)
                .expectErrorSatisfies(throwable -> {
                    org.assertj.core.api.Assertions.assertThat(throwable).isInstanceOf(AppsmithException.class);
                    org.assertj.core.api.Assertions.assertThat(((AppsmithException) throwable).getError())
                            .isEqualTo(AppsmithError.NO_RESOURCE_FOUND);
                })
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    void nonMemberCannotReadPublishedJsLibManifestOfPrivateApplication() {
        Application privateApp = createPrivateAppWithJsLib();
        User otherUser = userRepository.findByEmail("usertest@usertest.com").block();

        Mono<List<CustomJSLib>> readAsOtherUser = runAs(
                customJSLibService.getAllJSLibsInContext(privateApp.getId(), CreatorContextType.APPLICATION, true),
                otherUser);

        StepVerifier.create(readAsOtherUser)
                .expectErrorSatisfies(throwable -> {
                    org.assertj.core.api.Assertions.assertThat(throwable).isInstanceOf(AppsmithException.class);
                    org.assertj.core.api.Assertions.assertThat(((AppsmithException) throwable).getError())
                            .isEqualTo(AppsmithError.NO_RESOURCE_FOUND);
                })
                .verify();
    }

    @ParameterizedTest
    @EnumSource(
            value = CreatorContextType.class,
            names = {"PAGE", "MODULE", "WORKFLOW", "PACKAGE"})
    @DisplayName("GHSA-5hrq-v7jj-7m79")
    @WithUserDetails(value = "api_user")
    void should_returnNoResourceFound_when_callerCannotReadApplication_publishedLibraries(
            CreatorContextType contextType) {
        // Given
        Application privateApp = createPrivateAppWithJsLib();
        User otherUser = userRepository.findByEmail("usertest@usertest.com").block();

        // When
        Mono<List<CustomJSLib>> readAsOtherUser =
                runAs(customJSLibService.getAllJSLibsInContext(privateApp.getId(), contextType, true), otherUser);

        // Then
        StepVerifier.create(readAsOtherUser)
                .expectErrorSatisfies(throwable -> assertNoResourceFound(throwable, privateApp.getId()))
                .verify();
    }

    @ParameterizedTest
    @EnumSource(
            value = CreatorContextType.class,
            names = {"PAGE", "MODULE", "WORKFLOW", "PACKAGE"})
    @DisplayName("GHSA-5hrq-v7jj-7m79")
    @WithUserDetails(value = "api_user")
    void should_returnNoResourceFound_when_callerCannotReadApplication_unpublishedLibraries(
            CreatorContextType contextType) {
        // Given
        Application privateApp = createPrivateAppWithJsLib();
        User otherUser = userRepository.findByEmail("usertest@usertest.com").block();

        // When
        Mono<List<CustomJSLib>> readAsOtherUser =
                runAs(customJSLibService.getAllJSLibsInContext(privateApp.getId(), contextType, false), otherUser);

        // Then
        StepVerifier.create(readAsOtherUser)
                .expectErrorSatisfies(throwable -> assertNoResourceFound(throwable, privateApp.getId()))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    void should_returnLibraries_when_callerCanReadApplication_published() {
        // Given
        Application privateApp = createPrivateAppWithJsLib();

        // When
        Mono<List<CustomJSLib>> readAsOwner =
                customJSLibService.getAllJSLibsInContext(privateApp.getId(), CreatorContextType.APPLICATION, true);

        // Then
        StepVerifier.create(readAsOwner)
                .assertNext(jsLibs ->
                        assertThat(jsLibs).extracting(CustomJSLib::getName).contains("authzLib"))
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    void should_returnLibraries_when_callerCanReadApplication_unpublished() {
        // Given
        Application privateApp = createPrivateAppWithJsLib();

        // When
        Mono<List<CustomJSLib>> readAsOwner =
                customJSLibService.getAllJSLibsInContext(privateApp.getId(), CreatorContextType.APPLICATION, false);

        // Then
        StepVerifier.create(readAsOwner)
                .assertNext(jsLibs ->
                        assertThat(jsLibs).extracting(CustomJSLib::getName).contains("authzLib"))
                .verifyComplete();
    }
}
