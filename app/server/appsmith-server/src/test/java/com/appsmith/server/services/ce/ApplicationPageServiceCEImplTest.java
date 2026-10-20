package com.appsmith.server.services.ce;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.solutions.PagePermission;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ApplicationPageServiceCEImplTest {

    @Mock
    private NewPageService newPageService;

    @Mock
    private PagePermission pagePermission;

    @Mock
    private AnalyticsService analyticsService;

    @InjectMocks
    private ApplicationPageServiceCEImpl applicationPageService;

    @Test
    void should_notRecordPageView_when_pageLayoutIsLoaded() {
        // Given
        NewPage newPage = new NewPage();
        newPage.setId("page-1");
        PageDTO page = new PageDTO();
        page.setId("page-1");
        when(newPageService.getPageByViewMode(newPage, false)).thenReturn(Mono.just(page));
        lenient().when(analyticsService.sendObjectEvent(any(), any(), any())).thenReturn(Mono.just(newPage));

        // When
        Mono<PageDTO> result = applicationPageService.getPageDTOAfterMigratingDSL(newPage, false, false);

        // Then
        StepVerifier.create(result)
                .assertNext(loaded -> assertThat(loaded.getId()).isEqualTo("page-1"))
                .verifyComplete();
        verify(analyticsService, never()).sendObjectEvent(any(), any(), any());
    }

    @Test
    void should_recordPageView_when_pageIsOpened() {
        // Given
        NewPage newPage = new NewPage();
        newPage.setId("page-1");
        PageDTO page = new PageDTO();
        page.setId("page-1");
        when(newPageService.findById(eq("page-1"), any())).thenReturn(Mono.just(newPage));
        when(newPageService.getPageByViewMode(newPage, false)).thenReturn(Mono.just(page));
        when(analyticsService.sendObjectEvent(eq(AnalyticsEvents.VIEW), eq(newPage), any()))
                .thenReturn(Mono.just(newPage));

        // When
        Mono<PageDTO> result = applicationPageService.getPageAndMigrateDslByBranchedPageId("page-1", false, false);

        // Then
        StepVerifier.create(result)
                .assertNext(loaded -> assertThat(loaded.getId()).isEqualTo("page-1"))
                .verifyComplete();
        verify(analyticsService).sendObjectEvent(eq(AnalyticsEvents.VIEW), eq(newPage), any());
    }

    @Test
    void should_notRecordPageView_when_pageRetrievalFails() {
        // Given
        NewPage newPage = new NewPage();
        newPage.setId("page-1");
        when(newPageService.findById(eq("page-1"), any())).thenReturn(Mono.just(newPage));
        when(newPageService.getPageByViewMode(newPage, false))
                .thenReturn(Mono.error(new RuntimeException("page load failed")));

        // When
        Mono<PageDTO> result = applicationPageService.getPageAndMigrateDslByBranchedPageId("page-1", false, false);

        // Then
        StepVerifier.create(result).verifyErrorMessage("page load failed");
        verify(analyticsService, never()).sendObjectEvent(any(), any(), any());
    }
}
