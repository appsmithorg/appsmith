package com.appsmith.server.layouts;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ObservationHelperImpl;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.onload.internal.OnLoadExecutablesUtil;
import com.appsmith.server.refactors.resolver.ContextLayoutRefactorResolver;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.solutions.PagePermission;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.micrometer.observation.ObservationRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Token checks in {@link UpdateLayoutServiceCEImpl#updateLayoutWithRevision} that run before any side effect.
 */
@ExtendWith(MockitoExtension.class)
class UpdateLayoutServiceRevisionUnitTest {

    @Mock
    OnLoadExecutablesUtil onLoadExecutablesUtil;

    @Mock
    SessionUserService sessionUserService;

    @Mock
    NewPageService newPageService;

    @Mock
    AnalyticsService analyticsService;

    @Mock
    PagePermission pagePermission;

    @Mock
    ObservationHelperImpl observationHelper;

    @Mock
    ContextLayoutRefactorResolver contextLayoutRefactorResolver;

    private UpdateLayoutServiceCEImpl service;

    @BeforeEach
    void setup() {
        service = new UpdateLayoutServiceCEImpl(
                onLoadExecutablesUtil,
                sessionUserService,
                newPageService,
                analyticsService,
                pagePermission,
                new ObjectMapper(),
                ObservationRegistry.NOOP,
                observationHelper,
                contextLayoutRefactorResolver);
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "abc", "-1", "+1", "1.5", " 1", "1 ", "1e3", "99999999999999999999"})
    void should_refuseUpdate_when_expectedRevisionIsNotEpochMillis(String expectedRevision) {
        // Given
        Layout layout = new Layout();

        // When
        Mono<LayoutDTO> result = service.updateLayoutWithRevision("page", "app", "layout", layout, expectedRevision);

        // Then
        StepVerifier.create(result)
                .expectErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(AppsmithException.class);
                    assertThat(((AppsmithException) error).getError()).isEqualTo(AppsmithError.INVALID_PARAMETER);
                    assertThat(error.getMessage()).contains("expectedRevision");
                })
                .verify();
        verifyNoInteractions(newPageService, onLoadExecutablesUtil);
    }

    @Test
    void should_refuseBeforeSideEffects_when_pageChangedSinceRevision() {
        // Given
        AclPermission editPermission = AclPermission.MANAGE_PAGES;
        when(pagePermission.getEditPermission()).thenReturn(editPermission);
        NewPage stored = new NewPage();
        stored.setUpdatedAt(Instant.ofEpochMilli(2000));
        when(newPageService.findNewPageByIdAndLayoutsId("page", "layout", editPermission, false))
                .thenReturn(Mono.just(stored));

        // When
        Mono<LayoutDTO> result = service.updateLayoutWithRevision("page", "app", "layout", new Layout(), "1000");

        // Then
        StepVerifier.create(result)
                .expectErrorSatisfies(error -> {
                    assertThat(((AppsmithException) error).getError()).isEqualTo(AppsmithError.STALE_LAYOUT_UPDATE);
                    assertThat(((AppsmithException) error).getHttpStatus()).isEqualTo(409);
                    assertThat(((AppsmithException) error).getAppErrorCode()).isEqualTo("AE-APP-4096");
                })
                .verify();
        verifyNoInteractions(onLoadExecutablesUtil, contextLayoutRefactorResolver);
    }

    @Test
    void should_returnNotFound_when_pageIsMissingOrNotEditable() {
        // Given
        AclPermission editPermission = AclPermission.MANAGE_PAGES;
        when(pagePermission.getEditPermission()).thenReturn(editPermission);
        when(newPageService.findNewPageByIdAndLayoutsId("page", "layout", editPermission, false))
                .thenReturn(Mono.empty());

        // When
        Mono<LayoutDTO> result = service.updateLayoutWithRevision("page", "app", "layout", new Layout(), "1000");

        // Then
        StepVerifier.create(result)
                .expectErrorSatisfies(error -> assertThat(((AppsmithException) error).getError())
                        .isEqualTo(AppsmithError.ACL_NO_RESOURCE_FOUND))
                .verify();
        verifyNoInteractions(onLoadExecutablesUtil, contextLayoutRefactorResolver);
    }
}
