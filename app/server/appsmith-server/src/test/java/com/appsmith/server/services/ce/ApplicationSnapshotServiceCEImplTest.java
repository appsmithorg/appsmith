package com.appsmith.server.services.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationSnapshot;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.exports.internal.ExportService;
import com.appsmith.server.git.GitRehydrateAudit;
import com.appsmith.server.imports.internal.ImportService;
import com.appsmith.server.repositories.ApplicationSnapshotRepository;
import com.appsmith.server.solutions.ApplicationPermission;
import com.google.gson.Gson;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ApplicationSnapshotServiceCEImplTest {

    @Mock
    private ApplicationSnapshotRepository applicationSnapshotRepository;

    @Mock
    private ApplicationService applicationService;

    @Mock
    private ImportService importService;

    @Mock
    private ExportService exportService;

    @Mock
    private ApplicationPermission applicationPermission;

    @Mock
    private Gson gson;

    @InjectMocks
    private ApplicationSnapshotServiceCEImpl applicationSnapshotService;

    @Test
    void should_notSuppressGitRehydrateAudit_when_userRestoresSnapshot() {
        // Given
        String applicationId = "app-1";
        String workspaceId = "workspace-1";
        Application application = new Application();
        application.setId(applicationId);
        application.setWorkspaceId(workspaceId);
        application.setName("Snapshot app");

        ApplicationJson applicationJson = new ApplicationJson();
        applicationJson.setExportedApplication(application);
        String json = "{}";
        ApplicationSnapshot snapshotChunk = new ApplicationSnapshot();
        snapshotChunk.setApplicationId(applicationId);
        snapshotChunk.setChunkOrder(1);
        snapshotChunk.setData(json.getBytes(StandardCharsets.UTF_8));

        when(applicationPermission.getEditPermission()).thenReturn(AclPermission.MANAGE_APPLICATIONS);
        when(applicationService.findById(applicationId, AclPermission.MANAGE_APPLICATIONS))
                .thenReturn(Mono.just(application));
        when(applicationSnapshotRepository.findByApplicationId(applicationId)).thenReturn(Flux.just(snapshotChunk));
        when(gson.fromJson(any(String.class), eq(ApplicationJson.class))).thenReturn(applicationJson);
        when(importService.restoreSnapshot(eq(workspaceId), eq(applicationId), eq(applicationJson)))
                .thenAnswer(invocation -> Mono.deferContextual(ctx -> {
                    assertThat(Boolean.TRUE.equals(ctx.getOrDefault(GitRehydrateAudit.CONTEXT_KEY, Boolean.FALSE)))
                            .as("user snapshot restore must not set Git rehydrate audit suppression")
                            .isFalse();
                    return Mono.just(application);
                }));
        when(applicationSnapshotRepository.deleteAllByApplicationId(applicationId))
                .thenReturn(Mono.empty());

        // When
        Mono<Application> result = applicationSnapshotService.restoreSnapshot(applicationId);

        // Then
        StepVerifier.create(result)
                .assertNext(restored -> assertThat(restored.getId()).isEqualTo(applicationId))
                .verifyComplete();
    }
}
