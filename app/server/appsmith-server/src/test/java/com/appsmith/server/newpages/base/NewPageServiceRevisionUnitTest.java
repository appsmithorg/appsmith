package com.appsmith.server.newpages.base;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.PagePermission;
import io.micrometer.observation.ObservationRegistry;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * {@link NewPageServiceCEImpl#saveUnpublishedPageIfUnchanged}: the conditional write and what happens when it matches
 * no page. The repository is mocked so the page can change between the pre-check and the write.
 */
@ExtendWith(MockitoExtension.class)
class NewPageServiceRevisionUnitTest {

    private static final AclPermission EDIT = AclPermission.MANAGE_PAGES;
    private static final Instant EXPECTED = Instant.ofEpochMilli(1_000);

    @Mock
    Validator validator;

    @Mock
    NewPageRepository repository;

    @Mock
    AnalyticsService analyticsService;

    @Mock
    ApplicationService applicationService;

    @Mock
    UserDataService userDataService;

    @Mock
    ApplicationPermission applicationPermission;

    @Mock
    PagePermission pagePermission;

    private NewPageServiceCEImpl service;

    @BeforeEach
    void setup() {
        service = new NewPageServiceCEImpl(
                validator,
                repository,
                analyticsService,
                applicationService,
                userDataService,
                applicationPermission,
                pagePermission,
                ObservationRegistry.NOOP);
        when(pagePermission.getEditPermission()).thenReturn(EDIT);
    }

    private static NewPage storedPage(Instant updatedAt, String gitSyncId) {
        NewPage page = new NewPage();
        page.setId("page");
        page.setUpdatedAt(updatedAt);
        page.setGitSyncId(gitSyncId);
        return page;
    }

    private static PageDTO pageToWrite() {
        PageDTO page = new PageDTO();
        page.setId("page");
        page.setApplicationId("app");
        return page;
    }

    @Test
    void should_refuseWithStale_when_pageChangesBetweenPreCheckAndWrite() {
        // Given
        when(repository.findById("page", EDIT))
                .thenReturn(
                        Mono.just(storedPage(EXPECTED, "sync")), Mono.just(storedPage(EXPECTED.plusMillis(5), "sync")));
        when(repository.updateUnpublishedPageIfUnchanged(
                        eq("page"), eq(EXPECTED), any(Instant.class), any(PageDTO.class), isNull(), eq(EDIT)))
                .thenReturn(Mono.just(0));

        // When
        Mono<NewPage> result = service.saveUnpublishedPageIfUnchanged(pageToWrite(), EXPECTED);

        // Then
        StepVerifier.create(result)
                .expectErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(AppsmithException.class);
                    assertThat(((AppsmithException) error).getError()).isEqualTo(AppsmithError.STALE_LAYOUT_UPDATE);
                })
                .verify();
    }

    @Test
    void should_returnNotFound_when_pageIsGoneBetweenPreCheckAndWrite() {
        // Given
        when(repository.findById("page", EDIT)).thenReturn(Mono.just(storedPage(EXPECTED, "sync")), Mono.empty());
        when(repository.updateUnpublishedPageIfUnchanged(
                        eq("page"), eq(EXPECTED), any(Instant.class), any(PageDTO.class), isNull(), eq(EDIT)))
                .thenReturn(Mono.just(0));

        // When
        Mono<NewPage> result = service.saveUnpublishedPageIfUnchanged(pageToWrite(), EXPECTED);

        // Then
        StepVerifier.create(result)
                .expectErrorSatisfies(error -> assertThat(((AppsmithException) error).getError())
                        .isEqualTo(AppsmithError.ACL_NO_RESOURCE_FOUND))
                .verify();
    }

    @Test
    void should_returnWrittenPageWithNewRevision_when_writeMatches() {
        // Given
        when(repository.findById("page", EDIT)).thenReturn(Mono.just(storedPage(EXPECTED, null)));
        ArgumentCaptor<Instant> newUpdatedAt = ArgumentCaptor.forClass(Instant.class);
        ArgumentCaptor<String> gitSyncId = ArgumentCaptor.forClass(String.class);
        when(repository.updateUnpublishedPageIfUnchanged(
                        eq("page"),
                        eq(EXPECTED),
                        newUpdatedAt.capture(),
                        any(PageDTO.class),
                        gitSyncId.capture(),
                        eq(EDIT)))
                .thenReturn(Mono.just(1));

        // When
        NewPage written =
                service.saveUnpublishedPageIfUnchanged(pageToWrite(), EXPECTED).block();

        // Then
        assertThat(newUpdatedAt.getValue()).isAfter(EXPECTED);
        assertThat(written.getUpdatedAt()).isEqualTo(newUpdatedAt.getValue());
        assertThat(gitSyncId.getValue()).startsWith("app_");
        assertThat(written.getGitSyncId()).isEqualTo(gitSyncId.getValue());
        verify(repository).findById("page", EDIT);
    }
}
