package com.appsmith.server.imports.internal;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationDetail;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ApplicationImportDTO;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ImportArtifactPermissionProvider;
import com.appsmith.server.helpers.ImportExportUtils;
import com.appsmith.server.imports.importable.ImportableService;
import com.appsmith.server.imports.internal.artifactbased.ArtifactBasedImportService;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.WorkspaceService;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.reactive.TransactionalOperator;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ImportServicePositioningTest {
    @Mock
    ArtifactBasedImportService<Application, ApplicationImportDTO, ApplicationJson> applicationImportService;

    @Mock
    SessionUserService sessionUserService;

    @Mock
    WorkspaceService workspaceService;

    @Mock
    PermissionGroupRepository permissionGroupRepository;

    @Mock
    TransactionalOperator transactionalOperator;

    @Mock
    ImportableService<Datasource> datasourceImportableService;

    @Mock
    ImportArtifactPermissionProvider permissions;

    @InjectMocks
    ImportServiceCEImpl service;

    @ParameterizedTest
    @ValueSource(strings = {"FIXED", "AUTO"})
    void should_preservePositioningValidationError_when_restoringIncompatibleSnapshot(String type) {
        // Given
        Application target = new Application();
        ApplicationDetail targetDetail = new ApplicationDetail();
        targetDetail.setAppPositioning(new Application.AppPositioning("ANVIL"));
        target.setUnpublishedApplicationDetail(targetDetail);
        Application incoming = new Application();
        ApplicationDetail incomingDetail = new ApplicationDetail();
        incomingDetail.setAppPositioning(new Application.AppPositioning(type));
        incoming.setUnpublishedApplicationDetail(incomingDetail);
        ApplicationJson json = new ApplicationJson();
        json.setExportedApplication(incoming);
        when(permissionGroupRepository.getCurrentUserPermissionGroups()).thenReturn(Mono.just(Set.of("owner")));
        when(applicationImportService.getImportArtifactPermissionProviderForRestoringSnapshot(any()))
                .thenReturn(permissions);
        when(applicationImportService.getArtifactSpecificConstantsMap())
                .thenReturn(Map.of(FieldName.ARTIFACT_CONTEXT, "application"));
        when(applicationImportService.migrateArtifactExchangeJson("target", json))
                .thenReturn(Mono.just(json));
        when(applicationImportService.validateArtifactSpecificFields(json)).thenReturn("");
        when(workspaceService.findById(eq("workspace"), any())).thenReturn(Mono.just(new Workspace()));
        when(sessionUserService.getCurrentUser()).thenReturn(Mono.just(new User()));
        when(applicationImportService.getBranchedArtifactIdsByBranchedArtifactId("target"))
                .thenReturn(Flux.just("target"));
        when(applicationImportService.generateArtifactSpecificImportableEntities(eq(json), any(), any()))
                .thenReturn(Mono.empty());
        when(applicationImportService.updateAndSaveArtifactInContext(eq(incoming), any(), any(), any()))
                .thenAnswer(inv -> Mono.fromCallable(() -> {
                    ImportExportUtils.setPropertiesToExistingApplication(incoming, target);
                    return target;
                }));
        when(transactionalOperator.transactional(any(Mono.class))).thenAnswer(inv -> inv.getArgument(0));

        // When
        var result = service.restoreSnapshot("workspace", "target", json);

        // Then
        StepVerifier.create(result)
                .expectErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(AppsmithException.class);
                    assertThat(((AppsmithException) error).getError()).isEqualTo(AppsmithError.INVALID_PARAMETER);
                    assertThat(error.getMessage()).contains("replacement import must use responsive positioning");
                })
                .verify();
        assertThat(target.getUnpublishedApplicationDetail()).isSameAs(targetDetail);
    }
}
