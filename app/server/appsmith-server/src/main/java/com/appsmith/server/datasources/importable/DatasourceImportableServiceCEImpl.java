package com.appsmith.server.datasources.importable;

import com.appsmith.external.models.AuthenticationResponse;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.BasicAuth;
import com.appsmith.external.models.BearerTokenAuth;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.DecryptedSensitiveFields;
import com.appsmith.external.models.OAuth2;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.DBOpsType;
import com.appsmith.server.dtos.ImportingMetaDTO;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ImportArtifactPermissionProvider;
import com.appsmith.server.imports.importable.ImportableServiceCE;
import com.appsmith.server.imports.importable.artifactbased.ArtifactBasedImportableService;
import com.appsmith.server.services.SequenceService;
import com.appsmith.server.services.WorkspaceService;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;
import reactor.util.function.Tuples;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNestedNonNullProperties;

@Slf4j
public class DatasourceImportableServiceCEImpl implements ImportableServiceCE<Datasource> {

    private final DatasourceService datasourceService;
    private final WorkspaceService workspaceService;
    private final SequenceService sequenceService;

    public DatasourceImportableServiceCEImpl(
            DatasourceService datasourceService, WorkspaceService workspaceService, SequenceService sequenceService) {
        this.datasourceService = datasourceService;
        this.workspaceService = workspaceService;
        this.sequenceService = sequenceService;
    }

    @Override
    public Mono<Void> importEntities(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Mono<Workspace> workspaceMono,
            Mono<? extends Artifact> importContextMono,
            ArtifactExchangeJson artifactExchangeJson,
            boolean isContextAgnostic) {

        return importEntities(
                importingMetaDTO, mappedImportableResourcesDTO, workspaceMono, importContextMono, artifactExchangeJson);
    }

    @Override
    public ArtifactBasedImportableService<Datasource, ?> getArtifactBasedImportableService(
            ImportingMetaDTO importingMetaDTO) {
        // this resource is not artifact dependent
        return null;
    }

    // Requires pluginMap to be present in importable resources.
    // Updates datasourceNameToIdMap in importable resources.
    // Also directly updates required information in DB
    @Override
    public Mono<Void> importEntities(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Mono<Workspace> workspaceMono,
            Mono<? extends Artifact> importableArtifactMono,
            ArtifactExchangeJson artifactExchangeJson) {
        return workspaceMono.flatMap(workspace -> {
            final Flux<Datasource> existingDatasourceFlux = datasourceService
                    .getAllByWorkspaceIdWithStorages(workspace.getId(), null)
                    .cache();

            Mono<List<Datasource>> existingDatasourceMono =
                    getExistingDatasourceMono(importingMetaDTO.getArtifactId(), existingDatasourceFlux);
            Mono<Map<String, String>> datasourceMapMono = importDatasources(
                    artifactExchangeJson,
                    existingDatasourceMono,
                    existingDatasourceFlux,
                    workspace,
                    importingMetaDTO,
                    mappedImportableResourcesDTO);

            return datasourceMapMono
                    .doOnNext(datasourceMap -> mappedImportableResourcesDTO.setDatasourceNameToIdMap(datasourceMap))
                    .then();
        });
    }

    private Mono<List<Datasource>> getExistingDatasourceMono(String artifactId, Flux<Datasource> datasourceFlux) {
        Mono<List<Datasource>> existingDatasourceMono;
        // Check if the request is to hydrate the artifact to DB for particular branch
        // artifact id will be present for GIT sync
        if (!StringUtils.isEmpty(artifactId)) {
            // No need to hydrate the datasource as we expect user will configure the datasource
            existingDatasourceMono = datasourceFlux.collectList();
        } else {
            existingDatasourceMono = Mono.just(new ArrayList<>());
        }
        return existingDatasourceMono;
    }

    private Mono<Map<String, String>> importDatasources(
            ArtifactExchangeJson importedDoc,
            Mono<List<Datasource>> existingDatasourceMono,
            Flux<Datasource> existingDatasourcesFlux,
            Workspace workspace,
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO) {
        return Mono.zip(existingDatasourceMono, workspaceService.getDefaultEnvironmentId(workspace.getId(), null))
                .flatMapMany(objects -> {
                    List<Datasource> existingDatasources = objects.getT1();
                    String environmentId = objects.getT2();
                    Map<String, String> pluginMap = mappedImportableResourcesDTO.getPluginMap();
                    List<DatasourceStorage> importedDatasourceList = importedDoc.getDatasourceList();
                    if (CollectionUtils.isEmpty(importedDatasourceList)) {
                        return Flux.empty();
                    }
                    Map<String, Datasource> savedDatasourcesGitIdToDatasourceMap = new HashMap<>();
                    Map<String, Datasource> savedDatasourcesNameDatasourceMap = new HashMap<>();

                    existingDatasources.stream()
                            .filter(datasource -> datasource.getGitSyncId() != null)
                            .forEach(datasource -> {
                                savedDatasourcesGitIdToDatasourceMap.put(datasource.getGitSyncId(), datasource);
                                savedDatasourcesNameDatasourceMap.put(datasource.getName(), datasource);
                            });

                    // Check if the destination org have all the required plugins installed
                    for (DatasourceStorage datasource : importedDatasourceList) {
                        if (StringUtils.isEmpty(pluginMap.get(datasource.getPluginId()))) {
                            log.error(
                                    "Unable to find the plugin: {}, available plugins are: {}",
                                    datasource.getPluginId(),
                                    pluginMap.keySet());
                            return Flux.error(new AppsmithException(
                                    AppsmithError.UNKNOWN_PLUGIN_REFERENCE, datasource.getPluginId()));
                        }
                    }

                    return Flux.fromIterable(importedDatasourceList)
                            // Check for duplicate datasources to avoid duplicates in target workspace
                            .flatMap(datasourceStorage -> {
                                final String importedDatasourceName = datasourceStorage.getName();
                                // try to find whether there is an existing datasource with same gitSyncId
                                Datasource existingDatasource = null;
                                if (datasourceStorage.getGitSyncId() != null
                                        && savedDatasourcesGitIdToDatasourceMap.containsKey(
                                                datasourceStorage.getGitSyncId())) {
                                    Datasource dsWithSameGitSyncId = savedDatasourcesGitIdToDatasourceMap.get(
                                            datasourceStorage.getGitSyncId()); // found a match
                                    // we'll be renaming the matchingDatasource with targetDatasourceName
                                    String targetDatasourceName = datasourceStorage.getName();

                                    // check whether there are any other datasource with the same targetDatasourceName
                                    if (savedDatasourcesNameDatasourceMap.containsKey(targetDatasourceName)) {
                                        // found with same name, check if it's matchingDatasource or not
                                        Datasource dsWithSameName =
                                                savedDatasourcesNameDatasourceMap.get(targetDatasourceName);
                                        if (dsWithSameName.getId().equals(dsWithSameGitSyncId.getId())) {
                                            // same DS, we can rename safely
                                            existingDatasource = dsWithSameGitSyncId;
                                        } // otherwise existingDatasource will be null
                                    } else { // no DS found with the targetDatasourceName, we can rename safely
                                        existingDatasource = dsWithSameGitSyncId;
                                    }
                                }
                                // Check if the datasource has gitSyncId and if it's already in DB
                                if (existingDatasource != null) {
                                    // Since the resource is already present in DB, just update resource
                                    if (!importingMetaDTO
                                            .getPermissionProvider()
                                            .hasEditPermission(existingDatasource)) {
                                        log.error(
                                                "Trying to update datasource {} without edit permission",
                                                existingDatasource.getName());
                                        return Mono.error(new AppsmithException(
                                                AppsmithError.ACL_NO_RESOURCE_FOUND,
                                                FieldName.DATASOURCE,
                                                existingDatasource.getId()));
                                    }
                                    datasourceStorage.setId(null);
                                    // Don't update datasource config as the saved datasource is already configured by
                                    // user for this instance
                                    datasourceStorage.setDatasourceConfiguration(null);
                                    datasourceStorage.setPluginId(null);
                                    datasourceStorage.setEnvironmentId(environmentId);
                                    Datasource newDatasource =
                                            datasourceService.createDatasourceFromDatasourceStorage(datasourceStorage);
                                    newDatasource.setPolicies(null);

                                    copyNestedNonNullProperties(newDatasource, existingDatasource);
                                    // Don't update the datasource configuration for already available datasources
                                    existingDatasource.setDatasourceConfiguration(null);
                                    return datasourceService
                                            .save(existingDatasource, true)
                                            .map(createdDatasource -> {
                                                // Add dry run queries for the datasource
                                                addDryOpsForEntity(
                                                        DBOpsType.SAVE,
                                                        mappedImportableResourcesDTO.getDatasourceDryRunQueries(),
                                                        createdDatasource);
                                                return Tuples.of(
                                                        createdDatasource.getName(), createdDatasource.getId());
                                            });
                                } else {
                                    // This is explicitly copied over from the map we created before
                                    datasourceStorage.setPluginId(pluginMap.get(datasourceStorage.getPluginId()));
                                    datasourceStorage.setWorkspaceId(workspace.getId());
                                    datasourceStorage.setEnvironmentId(environmentId);

                                    // Check if any decrypted fields are present for datasource
                                    if (importedDoc.getDecryptedFields() != null
                                            && importedDoc.getDecryptedFields().get(datasourceStorage.getName())
                                                    != null) {

                                        DecryptedSensitiveFields decryptedFields =
                                                importedDoc.getDecryptedFields().get(datasourceStorage.getName());

                                        updateAuthenticationDTO(datasourceStorage, decryptedFields);
                                    }
                                    return createUniqueDatasourceIfNotPresent(
                                                    existingDatasourcesFlux,
                                                    datasourceStorage,
                                                    workspace,
                                                    environmentId,
                                                    importingMetaDTO.getPermissionProvider(),
                                                    mappedImportableResourcesDTO)
                                            .map(createdDatasource -> {
                                                // Add dry run queries for the datasource
                                                addDryOpsForEntity(
                                                        DBOpsType.SAVE,
                                                        mappedImportableResourcesDTO.getDatasourceDryRunQueries(),
                                                        createdDatasource);
                                                return Tuples.of(importedDatasourceName, createdDatasource.getId());
                                            });
                                }
                            });
                })
                .collectMap(Tuple2::getT1, Tuple2::getT2)
                .onErrorResume(error -> {
                    log.error("Error importing datasources", error);
                    return Mono.error(error);
                })
                .elapsed()
                .map(tuple -> {
                    log.debug("Time taken to import datasources: {} ms", tuple.getT1());
                    return tuple.getT2();
                });
    }

    /**
     * This will check if the datasource is already present in the workspace and create a new one if unable to find one
     *
     * @param existingDatasources already present datasource in the workspace
     * @param datasourceStorage   which will be checked against existing datasources
     * @param workspace           workspace where duplicate datasource should be checked
     * @return already present or brand new datasource depending upon the equality check
     */
    private Mono<Datasource> createUniqueDatasourceIfNotPresent(
            Flux<Datasource> existingDatasources,
            DatasourceStorage datasourceStorage,
            Workspace workspace,
            String environmentId,
            ImportArtifactPermissionProvider permissionProvider,
            MappedImportableResourcesDTO mappedImportableResourcesDTO) {
        /*
           1. If same datasource is present return
           2. If unable to find the datasource create a new datasource with unique name and return
        */
        final DatasourceConfiguration datasourceConfig = datasourceStorage.getDatasourceConfiguration();
        AuthenticationResponse authResponse = new AuthenticationResponse();
        if (datasourceConfig != null && datasourceConfig.getAuthentication() != null) {
            copyNestedNonNullProperties(datasourceConfig.getAuthentication().getAuthenticationResponse(), authResponse);
            datasourceConfig.getAuthentication().setAuthenticationResponse(null);
            datasourceConfig.getAuthentication().setAuthenticationType(null);
        }

        return existingDatasources
                // For git import exclude datasource configuration
                .filter(ds -> ds.getName().equals(datasourceStorage.getName())
                        && datasourceStorage.getPluginId().equals(ds.getPluginId()))
                .next() // Get the first matching datasource, we don't need more than one here.
                .switchIfEmpty(Mono.defer(
                        () -> permissionProvider.canCreateDatasource(workspace).flatMap(canCreateDatasource -> {
                            // check if user has permission to create datasource
                            if (!canCreateDatasource) {
                                log.error(
                                        "Unauthorized to create datasource: {} in workspace: {}",
                                        datasourceStorage.getName(),
                                        workspace.getName());
                                return Mono.error(new AppsmithException(
                                        AppsmithError.ACL_NO_RESOURCE_FOUND,
                                        FieldName.DATASOURCE,
                                        datasourceStorage.getName()));
                            }

                            if (datasourceConfig != null && datasourceConfig.getAuthentication() != null) {
                                datasourceConfig.getAuthentication().setAuthenticationResponse(authResponse);
                            }
                            // No matching existing datasource found, so create a new one.
                            datasourceStorage.setIsConfigured(
                                    datasourceConfig != null && datasourceConfig.getAuthentication() != null);
                            datasourceStorage.setEnvironmentId(environmentId);

                            return datasourceService
                                    .findByNameAndWorkspaceId(datasourceStorage.getName(), workspace.getId(), null)
                                    .flatMap(duplicateNameDatasource -> getUniqueSuffixForDuplicateNameEntity(
                                            duplicateNameDatasource, workspace.getId()))
                                    .map(dsName -> {
                                        datasourceStorage.setName(datasourceStorage.getName() + dsName);

                                        return datasourceService.createDatasourceFromDatasourceStorage(
                                                datasourceStorage);
                                    })
                                    .switchIfEmpty(Mono.just(
                                            datasourceService.createDatasourceFromDatasourceStorage(datasourceStorage)))
                                    // DRY RUN queries are not saved, so we need to create them separately at the import
                                    // service
                                    // solution
                                    .flatMap(datasource -> datasourceService.createWithoutPermissions(
                                            datasource,
                                            mappedImportableResourcesDTO.getDatasourceStorageDryRunQueries()));
                        })))
                .onErrorResume(throwable -> {
                    log.error("failed to import datasource", throwable);
                    return Mono.error(throwable);
                });
    }

    /**
     * Here we will be rehydrating the sensitive fields like password, secrets etc. in datasourceStorage while importing the artifact
     *
     * @param datasourceStorage for which sensitive fields should be rehydrated
     * @param decryptedFields   sensitive fields
     */
    private void updateAuthenticationDTO(
            DatasourceStorage datasourceStorage, DecryptedSensitiveFields decryptedFields) {

        final DatasourceConfiguration dsConfig = datasourceStorage.getDatasourceConfiguration();
        String authType = decryptedFields.getAuthType();
        if (dsConfig == null || authType == null) {
            return;
        }

        if (StringUtils.equals(authType, DBAuth.class.getName())) {
            final DBAuth dbAuth = decryptedFields.getDbAuth();
            dbAuth.setPassword(decryptedFields.getPassword());
            datasourceStorage.getDatasourceConfiguration().setAuthentication(dbAuth);
        } else if (StringUtils.equals(authType, BasicAuth.class.getName())) {
            final BasicAuth basicAuth = decryptedFields.getBasicAuth();
            basicAuth.setPassword(decryptedFields.getPassword());
            datasourceStorage.getDatasourceConfiguration().setAuthentication(basicAuth);
        } else if (StringUtils.equals(authType, OAuth2.class.getName())) {
            OAuth2 auth2 = decryptedFields.getOpenAuth2();
            AuthenticationResponse authResponse = new AuthenticationResponse();
            auth2.setClientSecret(decryptedFields.getPassword());
            authResponse.setToken(decryptedFields.getToken());
            authResponse.setRefreshToken(decryptedFields.getRefreshToken());
            authResponse.setTokenResponse(decryptedFields.getTokenResponse());
            authResponse.setExpiresAt(Instant.now());
            auth2.setAuthenticationResponse(authResponse);
            datasourceStorage.getDatasourceConfiguration().setAuthentication(auth2);
        } else if (StringUtils.equals(authType, BearerTokenAuth.class.getName())) {
            BearerTokenAuth auth = new BearerTokenAuth();
            auth.setBearerToken(decryptedFields.getBearerTokenAuth().getBearerToken());
            datasourceStorage.getDatasourceConfiguration().setAuthentication(auth);
        }
    }

    /**
     * This function will respond with unique suffixed number for the entity to avoid duplicate names
     *
     * @param sourceEntity for which the suffixed number is required to avoid duplication
     * @param workspaceId  workspace in which entity should be searched
     * @return next possible number in case of duplication
     */
    private Mono<String> getUniqueSuffixForDuplicateNameEntity(BaseDomain sourceEntity, String workspaceId) {
        if (sourceEntity != null) {
            return sequenceService
                    .getNextAsSuffix(sourceEntity.getClass(), " for workspace with _id : " + workspaceId)
                    .map(sequenceNumber -> {
                        // sequence number will be empty if no duplicate is found
                        return sequenceNumber.isEmpty() ? " #1" : " #" + sequenceNumber.trim();
                    });
        }
        return Mono.just("");
    }

    @Override
    public Flux<Datasource> getEntitiesPresentInWorkspace(String workspaceId) {
        return datasourceService.getAllByWorkspaceIdWithStorages(workspaceId, null);
    }

    private void addDryOpsForEntity(
            DBOpsType queryType, @NonNull Map<DBOpsType, List<Datasource>> dryRunOpsMap, Datasource createdDatasource) {
        List<Datasource> datasourceList = dryRunOpsMap.get(queryType);
        datasourceList = datasourceList == null ? new ArrayList<>() : datasourceList;
        datasourceList.add(createdDatasource);
        dryRunOpsMap.put(queryType, datasourceList);
    }
}
