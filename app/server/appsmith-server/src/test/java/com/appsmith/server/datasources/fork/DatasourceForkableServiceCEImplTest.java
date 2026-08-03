package com.appsmith.server.datasources.fork;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.datasourcestorages.base.DatasourceStorageService;
import com.appsmith.server.fork.forkable.ForkableService;
import com.appsmith.server.solutions.DatasourcePermission;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Flux;
import reactor.test.StepVerifier;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

/**
 * Regression coverage for GHSA-p37g-mfwx-3r9f: forking must not reuse a target-workspace
 * datasource the current user cannot read.
 */
@ExtendWith(MockitoExtension.class)
class DatasourceForkableServiceCEImplTest {

    @Mock
    DatasourceService datasourceService;

    @Mock
    DatasourceStorageService datasourceStorageService;

    @Mock
    ForkableService<com.appsmith.external.models.DatasourceStorage> datasourceStorageForkableService;

    @Mock
    DatasourcePermission datasourcePermission;

    DatasourceForkableServiceCEImpl forkableService;

    @BeforeEach
    void setUp() {
        lenient().when(datasourcePermission.getReadPermission()).thenReturn(AclPermission.READ_DATASOURCES);
        forkableService = new DatasourceForkableServiceCEImpl(
                datasourceService, datasourceStorageService, datasourceStorageForkableService, datasourcePermission);
    }

    @Test
    @DisplayName("GHSA-p37g-mfwx-3r9f: getExistingEntitiesInTarget must enumerate target-workspace "
            + "datasources with READ_DATASOURCES, never with a null (unpermissioned) AclPermission")
    void should_enforceReadPermission_when_getExistingEntitiesInTarget_isCalled() {
        // Given
        String targetWorkspaceId = "workspace-target";
        Datasource ds = new Datasource();
        ds.setId("hidden-ds");
        ds.setName("SecretDS");

        // Only the correctly-permissioned call returns data. The vulnerable permission=null
        // call is separately stubbed to empty so a bug shows up as a clean verify() failure
        // rather than an NPE from an unstubbed mock.
        lenient()
                .when(datasourceService.getAllByWorkspaceIdWithStorages(
                        eq(targetWorkspaceId), eq(AclPermission.READ_DATASOURCES)))
                .thenReturn(Flux.just(ds));
        lenient()
                .when(datasourceService.getAllByWorkspaceIdWithStorages(eq(targetWorkspaceId), isNull()))
                .thenReturn(Flux.empty());

        // When
        Flux<Datasource> result = forkableService.getExistingEntitiesInTarget(targetWorkspaceId);

        // Then: fork matching must be scoped to what the current actor can read.
        StepVerifier.create(result).expectNextCount(1).verifyComplete();
        verify(datasourceService, never()).getAllByWorkspaceIdWithStorages(eq(targetWorkspaceId), isNull());
        verify(datasourceService)
                .getAllByWorkspaceIdWithStorages(eq(targetWorkspaceId), eq(AclPermission.READ_DATASOURCES));
    }
}
