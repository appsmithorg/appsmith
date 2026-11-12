package com.appsmith.server.services.ce;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.CommonGitFileUtils;
import com.appsmith.server.helpers.DSLMigrationUtils;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.solutions.PagePermission;
import net.minidev.json.JSONObject;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.context.Context;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

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

    @Mock
    private DSLMigrationUtils dslMigrationUtils;

    @Mock
    private CommonGitFileUtils commonGitFileUtils;

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

    @Test
    void should_notRecordPageView_when_dslMigrationFails() {
        // Given
        NewPage newPage = new NewPage();
        newPage.setId("page-1");
        Layout layout = new Layout();
        layout.setDsl(new JSONObject());
        PageDTO page = new PageDTO();
        page.setId("page-1");
        page.setLayouts(List.of(layout));
        when(newPageService.findById(eq("page-1"), any())).thenReturn(Mono.just(newPage));
        when(newPageService.getPageByViewMode(newPage, false)).thenReturn(Mono.just(page));
        when(dslMigrationUtils.getLatestDslVersion())
                .thenReturn(Mono.error(new RuntimeException("dsl version failed")));

        // When
        Mono<PageDTO> result = applicationPageService.getPageAndMigrateDslByBranchedPageId("page-1", false, true);

        // Then
        StepVerifier.create(result).verifyError(AppsmithException.class);
        verify(analyticsService, never()).sendObjectEvent(any(), any(), any());
    }

    @Test
    void should_skipLocalRepoDelete_when_applicationIsNotGitConnected() {
        // Given
        Application application = new Application();
        application.setId("app-1");

        // When / Then
        StepVerifier.create(applicationPageService.cleanupLocalGitRepository(application))
                .assertNext(deleted -> assertThat(deleted).isTrue())
                .verifyComplete();
        verify(commonGitFileUtils, never()).deleteLocalRepo(any(Path.class));
    }

    @Test
    void should_deleteLocalRepo_when_applicationIsGitConnected() {
        // Given
        Application application = new Application();
        application.setId("app-1");
        application.setWorkspaceId("workspace-1");
        GitArtifactMetadata gitData = new GitArtifactMetadata();
        gitData.setDefaultArtifactId("base-app-1");
        gitData.setRepoName("repo");
        application.setGitApplicationMetadata(gitData);
        Path expectedPath = Paths.get("workspace-1", "base-app-1", "repo");
        when(commonGitFileUtils.deleteLocalRepo(expectedPath)).thenReturn(Mono.just(Boolean.TRUE));

        // When / Then
        StepVerifier.create(applicationPageService.cleanupLocalGitRepository(application))
                .assertNext(deleted -> assertThat(deleted).isTrue())
                .verifyComplete();
        verify(commonGitFileUtils).deleteLocalRepo(expectedPath);
    }

    @Test
    void should_runLocalRepoDeleteOffCallingThread_when_cleanupIsScheduled() throws Exception {
        // Given — deleteLocalRepo runs synchronously when invoked; scheduling must not call it
        // on the delete-request thread (Mono.defer + subscribeOn).
        Application application = new Application();
        application.setId("app-1");
        application.setWorkspaceId("workspace-1");
        GitArtifactMetadata gitData = new GitArtifactMetadata();
        gitData.setDefaultArtifactId("base-app-1");
        gitData.setRepoName("repo");
        application.setGitApplicationMetadata(gitData);
        Path expectedPath = Paths.get("workspace-1", "base-app-1", "repo");

        String callingThread = Thread.currentThread().getName();
        AtomicReference<String> deleteThread = new AtomicReference<>();
        CountDownLatch deleteStarted = new CountDownLatch(1);
        when(commonGitFileUtils.deleteLocalRepo(expectedPath)).thenAnswer(invocation -> {
            deleteThread.set(Thread.currentThread().getName());
            deleteStarted.countDown();
            return Mono.just(Boolean.TRUE);
        });

        // When
        applicationPageService.scheduleLocalGitRepositoryCleanup(application, Context.empty());

        // Then
        assertThat(deleteStarted.await(5, TimeUnit.SECONDS)).isTrue();
        assertThat(deleteThread.get()).isNotEqualTo(callingThread);
        verify(commonGitFileUtils).deleteLocalRepo(expectedPath);
    }
}
