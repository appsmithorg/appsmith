package com.appsmith.server.onload.executables;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.onload.internal.OnLoadExecutablesUtilCE;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.CALLS_REAL_METHODS;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

/**
 * The revision-aware layout save is a default method. Creator types that do not override it, such as modules, must
 * save as before without a revision and refuse a revision they cannot check.
 */
class ExecutableOnLoadServiceRevisionDefaultTest {

    @SuppressWarnings("unchecked")
    private final ExecutableOnLoadServiceCE<NewPage> service =
            mock(ExecutableOnLoadServiceCE.class, CALLS_REAL_METHODS);

    private final OnLoadExecutablesUtilCE util = mock(OnLoadExecutablesUtilCE.class, CALLS_REAL_METHODS);

    @Test
    void should_saveWithoutCheck_when_serviceGetsNoRevision() {
        // Given
        Layout layout = new Layout();
        doReturn(Mono.just(layout)).when(service).findAndUpdateLayout("creator", "layout", layout);

        // When
        Mono<Layout> result = service.findAndUpdateLayout("creator", "layout", layout, null);

        // Then
        StepVerifier.create(result).expectNext(layout).verifyComplete();
    }

    @Test
    void should_refuseRevision_when_serviceDoesNotSupportIt() {
        // Given
        Layout layout = new Layout();

        // When
        Mono<Layout> result = service.findAndUpdateLayout("creator", "layout", layout, Instant.ofEpochMilli(1));

        // Then
        StepVerifier.create(result)
                .expectErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(AppsmithException.class);
                    assertThat(((AppsmithException) error).getError()).isEqualTo(AppsmithError.INVALID_PARAMETER);
                    assertThat(error.getMessage()).contains("expectedRevision");
                })
                .verify();
        verify(service, never()).findAndUpdateLayout("creator", "layout", layout);
    }

    @Test
    void should_saveWithoutCheck_when_utilGetsNoRevision() {
        // Given
        Layout layout = new Layout();
        doReturn(Mono.just(layout))
                .when(util)
                .findAndUpdateLayout("creator", CreatorContextType.MODULE, "layout", layout);

        // When
        Mono<Layout> result = util.findAndUpdateLayout("creator", CreatorContextType.MODULE, "layout", layout, null);

        // Then
        StepVerifier.create(result).expectNext(layout).verifyComplete();
    }

    @Test
    void should_refuseRevision_when_utilDoesNotSupportIt() {
        // Given
        Layout layout = new Layout();

        // When
        Mono<Layout> result = util.findAndUpdateLayout(
                "creator", CreatorContextType.MODULE, "layout", layout, Instant.ofEpochMilli(1));

        // Then
        StepVerifier.create(result)
                .expectErrorSatisfies(error ->
                        assertThat(((AppsmithException) error).getError()).isEqualTo(AppsmithError.INVALID_PARAMETER))
                .verify();
    }
}
