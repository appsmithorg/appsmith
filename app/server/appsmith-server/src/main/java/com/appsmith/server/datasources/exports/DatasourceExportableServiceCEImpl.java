package com.appsmith.server.datasources.exports;

import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.BasicAuth;
import com.appsmith.external.models.BearerTokenAuth;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.DecryptedSensitiveFields;
import com.appsmith.external.models.OAuth2;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.SerialiseApplicationObjective;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.datasourcestorages.base.DatasourceStorageService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ExportingMetaDTO;
import com.appsmith.server.dtos.MappedExportableResourcesDTO;
import com.appsmith.server.exports.exportable.ExportableServiceCE;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.DatasourcePermission;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static java.lang.Boolean.TRUE;

public class DatasourceExportableServiceCEImpl implements ExportableServiceCE<Datasource> {

    private final DatasourceService datasourceService;
    private final DatasourcePermission datasourcePermission;
    private final WorkspaceService workspaceService;
    private final DatasourceStorageService datasourceStorageService;

    public DatasourceExportableServiceCEImpl(
            DatasourceService datasourceService,
            DatasourcePermission datasourcePermission,
            WorkspaceService workspaceService,
            DatasourceStorageService datasourceStorageService) {
        this.datasourceService = datasourceService;
        this.datasourcePermission = datasourcePermission;
        this.workspaceService = workspaceService;
        this.datasourceStorageService = datasourceStorageService;
    }

    // Updates datasourceId to name map in exportable resources. Also directly updates required datasources information
    // in application json
    @Override
    public Mono<Void> getExportableEntities(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedExportableResourcesDTO,
            Mono<Application> applicationMono,
            ApplicationJson applicationJson) {

        Mono<String> defaultEnvironmentIdMono = applicationMono
                .map(Application::getWorkspaceId)
                .flatMap(workspaceId -> workspaceService.getDefaultEnvironmentId(workspaceId, null));

        Optional<AclPermission> optionalPermission = Optional.ofNullable(datasourcePermission.getExportPermission(
                exportingMetaDTO.getIsGitSync(), exportingMetaDTO.getExportWithConfiguration()));

        Flux<Datasource> datasourceFlux = applicationMono.flatMapMany(application -> {
            return datasourceService.getAllByWorkspaceIdWithStorages(application.getWorkspaceId(), optionalPermission);
        });

        return datasourceFlux
                .collectList()
                .zipWith(defaultEnvironmentIdMono)
                .map(tuple2 -> {
                    List<Datasource> datasourceList = tuple2.getT1();
                    String environmentId = tuple2.getT2();
                    mapNameToIdForExportableEntities(mappedExportableResourcesDTO, datasourceList);

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
                    applicationJson.setDatasourceList(storageList);

                    return datasourceList;
                })
                .then();
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
            MappedExportableResourcesDTO mappedExportableResourcesDTO, List<Datasource> datasourceList) {
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
            ApplicationJson applicationJson,
            SerialiseApplicationObjective serialiseFor) {
        // Save decrypted fields for datasources for internally used sample apps and templates
        // only when serialising for file sharing
        if (TRUE.equals(exportingMetaDTO.getExportWithConfiguration())
                && SerialiseApplicationObjective.SHARE.equals(serialiseFor)) {
            // Save decrypted fields for datasources
            Map<String, DecryptedSensitiveFields> decryptedFields = new HashMap<>();
            applicationJson.getDatasourceList().forEach(datasourceStorage -> {
                decryptedFields.put(datasourceStorage.getName(), getDecryptedFields(datasourceStorage));
                datasourceStorage.sanitiseToExportResource(mappedExportableResourcesDTO.getPluginMap());
            });
            applicationJson.setDecryptedFields(decryptedFields);
        } else {
            applicationJson.getDatasourceList().forEach(datasourceStorage -> {
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
