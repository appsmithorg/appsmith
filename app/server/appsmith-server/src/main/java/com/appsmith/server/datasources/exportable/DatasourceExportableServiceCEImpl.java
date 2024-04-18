package com.appsmith.server.datasources.exportable;

import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.BasicAuth;
import com.appsmith.external.models.BearerTokenAuth;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.DecryptedSensitiveFields;
import com.appsmith.external.models.OAuth2;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.SerialiseArtifactObjective;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.datasourcestorages.base.DatasourceStorageService;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.ExportingMetaDTO;
import com.appsmith.server.dtos.MappedExportableResourcesDTO;
import com.appsmith.server.exports.exportable.ExportableServiceCE;
import com.appsmith.server.exports.exportable.artifactbased.ArtifactBasedExportableService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.DatasourcePermission;
import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static java.lang.Boolean.TRUE;

@RequiredArgsConstructor
public class DatasourceExportableServiceCEImpl implements ExportableServiceCE<Datasource> {

    private final DatasourceService datasourceService;
    private final DatasourcePermission datasourcePermission;
    private final WorkspaceService workspaceService;
    private final DatasourceStorageService datasourceStorageService;

    @Override
    public ArtifactBasedExportableService<Datasource, ?> getArtifactBasedExportableService(
            ExportingMetaDTO exportingMetaDTO) {
        // This resource is not artifact dependent
        return null;
    }

    // Updates datasourceId to name map in exportable resources. Also directly updates required datasources information
    // in application json
    @Override
    public Mono<Void> getExportableEntities(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedExportableResourcesDTO,
            Mono<? extends Artifact> exportableArtifactMono,
            ArtifactExchangeJson artifactExchangeJson) {

        Mono<String> defaultEnvironmentIdMono = exportableArtifactMono
                .map(Artifact::getWorkspaceId)
                .flatMap(workspaceId -> workspaceService.getDefaultEnvironmentId(workspaceId, null));

        AclPermission exportPermission = datasourcePermission.getExportPermission(
                exportingMetaDTO.getIsGitSync(), exportingMetaDTO.getExportWithConfiguration());

        Flux<Datasource> datasourceFlux = exportableArtifactMono.flatMapMany(exportableArtifact -> {
            return datasourceService.getAllByWorkspaceIdWithStorages(
                    exportableArtifact.getWorkspaceId(), exportPermission);
        });

        return datasourceFlux
                .collectList()
                .zipWith(defaultEnvironmentIdMono)
                .map(tuple2 -> {
                    List<Datasource> datasourceList = tuple2.getT1();
                    String environmentId = tuple2.getT2();
                    mapNameToIdForExportableEntities(exportingMetaDTO, mappedExportableResourcesDTO, datasourceList);

                    List<DatasourceStorage> storageList = datasourceList.stream()
                            .map(datasource -> {
                                DatasourceStorage storage = datasourceStorageService.getDatasourceStorageFromDatasource(
                                        datasource, environmentId);

                                if (storage == null) {
                                    // This means we were unable to find a storage for default environment
                                    // We still need the user to be able to configure this datasource in a
                                    // new workspace,
                                    // So we will create a fallback storage using transient fields from the
                                    // datasource
                                    storage = new DatasourceStorage();
                                    storage.prepareTransientFields(datasource);
                                }
                                return storage;
                            })
                            .collect(Collectors.toList());
                    artifactExchangeJson.setDatasourceList(storageList);

                    return datasourceList;
                })
                .then();
    }

    @Override
    public Mono<Void> getExportableEntities(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedExportableResourcesDTO,
            Mono<? extends Artifact> exportableArtifactMono,
            ArtifactExchangeJson artifactExchangeJson,
            Boolean isContextAgnostic) {
        return exportableArtifactMono.flatMap(exportableArtifact -> {
            return getExportableEntities(
                    exportingMetaDTO, mappedExportableResourcesDTO, exportableArtifactMono, artifactExchangeJson);
        });
    }

    private void removeSensitiveFields(DatasourceStorage datasourceStorage) {
        if (datasourceStorage.getDatasourceConfiguration() != null) {
            datasourceStorage.getDatasourceConfiguration().setAuthentication(null);
            datasourceStorage.getDatasourceConfiguration().setSshProxy(null);
            datasourceStorage.getDatasourceConfiguration().setSshProxyEnabled(null);
            datasourceStorage.getDatasourceConfiguration().setProperties(null);
        }
    }

    @Override
    public Set<String> mapNameToIdForExportableEntities(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedExportableResourcesDTO,
            List<Datasource> datasourceList) {
        datasourceList.forEach(datasource -> {
            mappedExportableResourcesDTO.getDatasourceIdToNameMap().put(datasource.getId(), datasource.getName());
            mappedExportableResourcesDTO
                    .getDatasourceNameToUpdatedAtMap()
                    .put(datasource.getName(), datasource.getUpdatedAt());
        });
        return new HashSet<>();
    }

    @Override
    public void sanitizeEntities(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedExportableResourcesDTO,
            ArtifactExchangeJson artifactExchangeJson,
            SerialiseArtifactObjective serialiseFor,
            Boolean isContextAgnostic) {
        sanitizeEntities(exportingMetaDTO, mappedExportableResourcesDTO, artifactExchangeJson, serialiseFor);
    }

    @Override
    public void sanitizeEntities(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedExportableResourcesDTO,
            ArtifactExchangeJson artifactExchangeJson,
            SerialiseArtifactObjective serialiseFor) {
        // Save decrypted fields for datasources for internally used sample apps and templates
        // only when serialising for file sharing
        if (TRUE.equals(exportingMetaDTO.getExportWithConfiguration())
                && SerialiseArtifactObjective.SHARE.equals(serialiseFor)) {
            // Save decrypted fields for datasources
            Map<String, DecryptedSensitiveFields> decryptedFields = new HashMap<>();
            artifactExchangeJson.getDatasourceList().forEach(datasourceStorage -> {
                decryptedFields.put(datasourceStorage.getName(), getDecryptedFields(datasourceStorage));
                datasourceStorage.sanitiseToExportResource(mappedExportableResourcesDTO.getPluginMap());
            });
            artifactExchangeJson.setDecryptedFields(decryptedFields);
        } else {
            artifactExchangeJson.getDatasourceList().forEach(datasourceStorage -> {
                // For git sync, Set the entire datasourceConfiguration object to null as we don't want to
                // set it in the git repo
                if (Boolean.TRUE.equals(exportingMetaDTO.getIsGitSync())) {
                    datasourceStorage.setDatasourceConfiguration(null);
                }
                // Remove the sensitive fields from the datasourceConfiguration object as user will configure it once
                // imported to other instance
                else {
                    removeSensitiveFields(datasourceStorage);
                }
                datasourceStorage.sanitiseToExportResource(mappedExportableResourcesDTO.getPluginMap());
            });
        }
    }

    /**
     * This will be used to dehydrate sensitive fields from the datasourceStorage while exporting the application
     *
     * @param datasourceStorage entity from which sensitive fields need to be dehydrated
     * @return sensitive fields which then will be deserialized and exported in JSON file
     */
    private DecryptedSensitiveFields getDecryptedFields(DatasourceStorage datasourceStorage) {
        final AuthenticationDTO authentication = datasourceStorage.getDatasourceConfiguration() == null
                ? null
                : datasourceStorage.getDatasourceConfiguration().getAuthentication();

        if (authentication != null) {
            DecryptedSensitiveFields dsDecryptedFields = authentication.getAuthenticationResponse() == null
                    ? new DecryptedSensitiveFields()
                    : new DecryptedSensitiveFields(authentication.getAuthenticationResponse());

            if (authentication instanceof DBAuth) {
                DBAuth auth = (DBAuth) authentication;
                dsDecryptedFields.setPassword(auth.getPassword());
                dsDecryptedFields.setDbAuth(auth);
            } else if (authentication instanceof OAuth2) {
                OAuth2 auth = (OAuth2) authentication;
                dsDecryptedFields.setPassword(auth.getClientSecret());
                dsDecryptedFields.setOpenAuth2(auth);
            } else if (authentication instanceof BasicAuth) {
                BasicAuth auth = (BasicAuth) authentication;
                dsDecryptedFields.setPassword(auth.getPassword());
                dsDecryptedFields.setBasicAuth(auth);
            } else if (authentication instanceof BearerTokenAuth auth) {
                dsDecryptedFields.setBearerTokenAuth(auth);
            }
            dsDecryptedFields.setAuthType(authentication.getClass().getName());
            return dsDecryptedFields;
        }
        return null;
    }
}
