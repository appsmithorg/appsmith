package com.appsmith.server.datasources.importable;

import com.appsmith.external.models.AuthenticationResponse;
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
import com.appsmith.server.datasourcestorages.base.DatasourceStorageService;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.DBOpsType;
import com.appsmith.server.dtos.ImportingMetaDTO;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.imports.importable.ImportableServiceCE;
import com.appsmith.server.imports.importable.artifactbased.ArtifactBasedImportableService;
import com.appsmith.server.services.WorkspaceService;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNestedNonNullProperties;

@Slf4j
public class DatasourceImportableServiceCEImpl implements ImportableServiceCE<Datasource> {

    protected static final String UPDATE = "UPDATE";
    protected static final String CREATE = "CREATE";

    private final DatasourceService datasourceService;
    private final WorkspaceService workspaceService;
    private final DatasourceStorageService datasourceStorageService;

    public DatasourceImportableServiceCEImpl(
            DatasourceService datasourceService,
            WorkspaceService workspaceService,
            DatasourceStorageService datasourceStorageService) {
        this.datasourceService = datasourceService;
        this.datasourceStorageService = datasourceStorageService;
        this.workspaceService = workspaceService;
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
            // Collect all workspace datasources once
            Mono<List<Datasource>> workspaceDatasourcesMono = datasourceService
                    .getAllByWorkspaceIdWithStorages(workspace.getId(), null)
                    .collectList();

            return workspaceDatasourcesMono
                    .flatMap(workspaceDatasources -> importDatasources(
                            artifactExchangeJson,
                            workspaceDatasources,
                            workspace,
                            importingMetaDTO,
                            mappedImportableResourcesDTO))
                    .then();
        });
    }

    /**
     * Imports datasources from the artifact exchange JSON into the workspace.
     * This method:
     * 1. Categorizes and processes datasources in a single pass (updates get priority on names)
     * 2. Performs bulk save at the end for efficiency
     *
     * @param importedDoc                        the artifact exchange JSON containing datasources to import
     * @param dBDatasourcesFromCurrentWorkspace  all datasources currently in the workspace
     * @param workspace                          the target workspace
     * @param importingMetaDTO                   metadata about the import operation
     * @param mappedImportableResourcesDTO       shared resources and mappings for the import
     * @return Mono of list of saved datasources
     */
    private Mono<List<Datasource>> importDatasources(
            ArtifactExchangeJson importedDoc,
            List<Datasource> dBDatasourcesFromCurrentWorkspace,
            Workspace workspace,
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO) {

        // Track all reserved datasource names (existing workspace names + newly assigned names during import)
        // Used to avoid name collisions when creating new datasources
        Set<String> takenDatasourceNames = new HashSet<>();

        return workspaceService
                .getDefaultEnvironmentId(workspace.getId(), null)
                .flatMap(environmentId -> {
                    // pluginMap: Maps plugin package name (from JSON) -> plugin ID (in DB)
                    // Example: {"postgres-plugin" -> "abc123", "mysql-plugin" -> "def456"}
                    Map<String, String> pluginMap = mappedImportableResourcesDTO.getPluginMap();

                    // datasourcesFromJSON: List of datasource storages from the imported artifact JSON
                    List<DatasourceStorage> datasourcesFromJSON = importedDoc.getDatasourceList();

                    if (CollectionUtils.isEmpty(datasourcesFromJSON)) {
                        return Mono.empty();
                    }

                    // gitIdToDbDatasourceMap: Maps gitSyncId -> existing Datasource in workspace
                    // Used for UPDATE operations - finding datasources to update by their git identifier
                    // Only populated during git sync operations (when artifactId is present)
                    Map<String, Datasource> gitIdToDbDatasourceMap = new HashMap<>();

                    // nameToDbDatasourceMap: Maps datasource name -> existing Datasource in workspace
                    // Used to check if a name is already taken and to find datasources by name
                    Map<String, Datasource> nameToDbDatasourceMap = new HashMap<>();

                    // newNameToOriginalNameMap: Maps final assigned name -> original name from JSON
                    // Example: {"MyDS #1" -> "MyDS"} if "MyDS" was renamed due to conflict
                    // Critical for action references - actions in JSON use original names
                    Map<String, String> newNameToOriginalNameMap = new HashMap<>();

                    // Initialize taken names and name lookup map with ALL existing workspace datasource names
                    dBDatasourcesFromCurrentWorkspace.forEach(ds -> {
                        takenDatasourceNames.add(ds.getName());
                        nameToDbDatasourceMap.put(ds.getName(), ds);
                    });

                    // Only populate gitSyncId map if this is a git sync operation (artifactId present)
                    // For fresh imports, gitSyncId matching is not needed
                    if (!StringUtils.isEmpty(importingMetaDTO.getArtifactId())) {
                        dBDatasourcesFromCurrentWorkspace.stream()
                                .filter(ds -> ds.getGitSyncId() != null)
                                .forEach(ds -> gitIdToDbDatasourceMap.put(ds.getGitSyncId(), ds));
                    }

                    // datasourcesToUpdate: List of existing datasources that need to be updated
                    // These are matched by gitSyncId during git sync operations
                    List<Datasource> datasourcesToUpdate = new ArrayList<>();

                    // incomingStoragesForDsCreation: List of datasource storages that need new datasources created
                    // These either have no gitSyncId match or are from fresh imports
                    List<DatasourceStorage> incomingStoragesForDsCreation = new ArrayList<>();

                    // storagesMap: Groups datasource storages by operation type (SAVE/UPDATE) for bulk operations
                    // Key: DBOpsType.SAVE or DBOpsType.UPDATE, Value: List of storages for that operation
                    Map<DBOpsType, List<DatasourceStorage>> storagesMap = new HashMap<>();

                    // Check if all required plugins are installed
                    for (DatasourceStorage dsStorage : datasourcesFromJSON) {
                        if (StringUtils.isEmpty(pluginMap.get(dsStorage.getPluginId()))) {
                            log.error(
                                    "Unable to find the plugin: {}, available plugins are: {}",
                                    dsStorage.getPluginId(),
                                    pluginMap.keySet());
                            return Mono.error(new AppsmithException(
                                    AppsmithError.UNKNOWN_PLUGIN_REFERENCE, dsStorage.getPluginId()));
                        }

                        Datasource existingDatasource =
                                findExistingDatasource(dsStorage, gitIdToDbDatasourceMap, nameToDbDatasourceMap);

                        if (existingDatasource != null) {
                            // UPDATE: existing datasource matched by gitSyncId
                            if (!importingMetaDTO.getPermissionProvider().hasEditPermission(existingDatasource)) {
                                log.error(
                                        "Trying to update datasource {} without edit permission",
                                        existingDatasource.getName());
                                return Mono.error(new AppsmithException(
                                        AppsmithError.ACL_NO_RESOURCE_FOUND,
                                        FieldName.DATASOURCE,
                                        existingDatasource.getId()));
                            }

                            Datasource datasource = processUpdateDatasource(
                                    dsStorage,
                                    gitIdToDbDatasourceMap,
                                    nameToDbDatasourceMap,
                                    environmentId,
                                    takenDatasourceNames,
                                    newNameToOriginalNameMap);
                            datasourcesToUpdate.add(datasource);
                        } else {
                            incomingStoragesForDsCreation.add(dsStorage);
                        }
                    }

                    log.debug(
                            "Datasource import: {} to update, {} to create",
                            datasourcesToUpdate.size(),
                            incomingStoragesForDsCreation.size());

                    // Create datasources are handled here
                    return importingMetaDTO
                            .getPermissionProvider()
                            .canCreateDatasource(workspace)
                            .flatMapMany(canCreate -> {
                                if (CollectionUtils.isEmpty(incomingStoragesForDsCreation)) {
                                    return Flux.empty();
                                }

                                if (!canCreate) {
                                    log.error(
                                            "Unauthorized to create datasource in workspace: {}", workspace.getName());
                                    return Flux.error(new AppsmithException(
                                            AppsmithError.ACL_NO_ACCESS_ERROR, FieldName.DATASOURCE));
                                }

                                return Flux.fromIterable(incomingStoragesForDsCreation)
                                        .flatMap(dsStorage -> {
                                            // CREATE: new datasource (no gitSyncId match)
                                            String dsName = dsStorage.getName();
                                            String pluginId = pluginMap.get(dsStorage.getPluginId());
                                            Datasource datasource;

                                            if (dsName != null
                                                    && nameToDbDatasourceMap.containsKey(dsName)
                                                    && pluginId != null
                                                    && pluginId.equals(nameToDbDatasourceMap
                                                            .get(dsName)
                                                            .getPluginId())) {

                                                datasource = nameToDbDatasourceMap.get(dsName);
                                                newNameToOriginalNameMap.put(dsName, dsName);
                                                return Mono.just(datasource);

                                            } else {
                                                datasource = processCreateDatasource(
                                                        dsStorage,
                                                        workspace,
                                                        environmentId,
                                                        pluginMap,
                                                        importedDoc.getDecryptedFields(),
                                                        takenDatasourceNames,
                                                        newNameToOriginalNameMap);

                                                // This does not save datasource or dsStorage in db, just creates
                                                // objects
                                                // for bulk save later.
                                                return datasourceService.createWithoutPermissions(
                                                        datasource, storagesMap);
                                            }
                                        });
                            })
                            .collectList()
                            .flatMapMany(createdDatasources -> {
                                // idToDatasourceMap: Maps datasource ID -> Datasource object
                                // Used by other importable services to look up datasource by ID
                                Map<String, Datasource> idToDatasourceMap =
                                        mappedImportableResourcesDTO.getIdToDatasourceMap();

                                // datasourceNameToIdMap: Maps ORIGINAL datasource name (from JSON) -> datasource ID
                                // Critical: Uses original names because actions in JSON reference datasources by
                                // original name
                                // Example: If "MyDS" was renamed to "MyDS #1", this maps "MyDS" -> id of "MyDS #1"
                                Map<String, String> datasourceNameToIdMap =
                                        mappedImportableResourcesDTO.getDatasourceNameToIdMap();

                                // allDatasourcesToBeSaved: Combined list of UPDATE + CREATE datasources for bulk save
                                // Both updated existing datasources and newly created datasources are saved together
                                List<Datasource> allDatasourcesToBeSaved = new ArrayList<>();
                                allDatasourcesToBeSaved.addAll(datasourcesToUpdate);
                                allDatasourcesToBeSaved.addAll(createdDatasources);

                                return performBulkSave(allDatasourcesToBeSaved).map(datasource -> {
                                    idToDatasourceMap.put(datasource.getId(), datasource);
                                    // Use original JSON name (that actions reference) instead of
                                    // potentially renamed datasource name
                                    String originalName = newNameToOriginalNameMap.getOrDefault(
                                            datasource.getName(), datasource.getName());
                                    datasourceNameToIdMap.put(originalName, datasource.getId());
                                    return datasource;
                                });
                            })
                            .collectList()
                            .flatMap(allSavedDatasources -> {
                                // storagesToSaveToDB: List of datasource storages that need to be persisted
                                // These are storages for newly created datasources (not updates)
                                List<DatasourceStorage> storagesToSaveToDB = storagesMap.get(DBOpsType.SAVE);
                                return performBulkSaveStorages(storagesToSaveToDB)
                                        .collectList()
                                        .thenReturn(allSavedDatasources);
                            });
                })
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
     * Processes a datasource that needs to be updated (matched by gitSyncId).
     */
    private Datasource processUpdateDatasource(
            DatasourceStorage datasourceToBeImported,
            Map<String, Datasource> gitIdToDbDatasourceMap,
            Map<String, Datasource> nameToDbDatasourceMap,
            String environmentId,
            Set<String> takenDatasourceNames,
            Map<String, String> newNameToOriginalNameMap) {

        // Capture original name from JSON before any modifications
        String originalNameFromJson = datasourceToBeImported.getName();

        // Find the existing datasource by gitSyncId
        Datasource existingDatasource =
                findExistingDatasource(datasourceToBeImported, gitIdToDbDatasourceMap, nameToDbDatasourceMap);

        // Prepare update - don't overwrite user-configured datasource settings
        datasourceToBeImported.setId(null);
        datasourceToBeImported.setDatasourceConfiguration(null);
        datasourceToBeImported.setPluginId(null);
        datasourceToBeImported.setEnvironmentId(environmentId);

        Datasource newDatasource = datasourceService.createDatasourceFromDatasourceStorage(datasourceToBeImported);
        newDatasource.setPolicies(null);

        // Copy non-null properties from JSON to existing datasource
        copyNestedNonNullProperties(newDatasource, existingDatasource);
        existingDatasource.setDatasourceConfiguration(null);

        // Update the name if it changed (reserve the new name)
        String oldName = existingDatasource.getName();
        String targetName = datasourceToBeImported.getName();

        if (!oldName.equals(targetName)) {
            // Remove old name from taken, add new name
            takenDatasourceNames.remove(oldName);
            takenDatasourceNames.add(targetName);
            existingDatasource.setName(targetName);
        }

        // Prepare for bulk save
        existingDatasource.setUpdatedAt(Instant.now());

        // Track mapping: final name -> original JSON name (for action references)
        newNameToOriginalNameMap.put(existingDatasource.getName(), originalNameFromJson);

        return existingDatasource;
    }

    /**
     * Processes a datasource that needs to be created (no gitSyncId match).
     */
    private Datasource processCreateDatasource(
            DatasourceStorage dsStorage,
            Workspace workspace,
            String environmentId,
            Map<String, String> pluginMap,
            Map<String, DecryptedSensitiveFields> decryptedFieldsMap,
            Set<String> takenDatasourceNames,
            Map<String, String> newNameToOriginalNameMap) {

        // Capture original name from JSON before any modifications
        String originalNameFromJson = dsStorage.getName();

        // Set up the datasource storage
        dsStorage.setPluginId(pluginMap.get(dsStorage.getPluginId()));
        dsStorage.setWorkspaceId(workspace.getId());
        dsStorage.setEnvironmentId(environmentId);

        // Rehydrate decrypted fields if present
        if (decryptedFieldsMap != null && decryptedFieldsMap.get(dsStorage.getName()) != null) {
            DecryptedSensitiveFields decryptedFields = decryptedFieldsMap.get(dsStorage.getName());
            updateAuthenticationDTO(dsStorage, decryptedFields);
        }

        // Handle authentication response
        final DatasourceConfiguration dsConfig = dsStorage.getDatasourceConfiguration();
        AuthenticationResponse authResponse = new AuthenticationResponse();
        if (dsConfig != null && dsConfig.getAuthentication() != null) {
            copyNestedNonNullProperties(dsConfig.getAuthentication().getAuthenticationResponse(), authResponse);
            dsConfig.getAuthentication().setAuthenticationResponse(null);
            dsConfig.getAuthentication().setAuthenticationType(null);
        }

        // Generate unique name if needed (no DB call - use in-memory set)
        String targetName = dsStorage.getName();
        String finalName = generateUniqueName(targetName, takenDatasourceNames);
        dsStorage.setName(finalName);

        // Track mapping: final name -> original JSON name (for action references)
        newNameToOriginalNameMap.put(finalName, originalNameFromJson);

        // Mark name as taken
        takenDatasourceNames.add(finalName);

        // Restore auth response
        if (dsConfig != null && dsConfig.getAuthentication() != null) {
            dsConfig.getAuthentication().setAuthenticationResponse(authResponse);
        }

        // Set up datasource configuration
        dsStorage.setIsConfigured(dsConfig != null && dsConfig.getAuthentication() != null);

        // Create datasource object - ID will be assigned by createWithoutPermissions
        return datasourceService.createDatasourceFromDatasourceStorage(dsStorage);
    }

    /**
     * Generates a unique name by appending a suffix if the name is already taken.
     * Follows the same naming convention as SequenceService: " 2", " 3", etc.
     *
     * @param baseName    the desired name
     * @param takenNames  set of names already in use
     * @return a unique name (either baseName or baseName + suffix)
     */
    private String generateUniqueName(String baseName, Set<String> takenNames) {
        if (!takenNames.contains(baseName)) {
            return baseName;
        }

        // Generate suffix: " #1", " #2", etc. (matching SequenceService convention)
        int suffix = 1;
        String candidateName;
        do {
            candidateName = baseName + " #" + suffix;
            suffix++;
        } while (takenNames.contains(candidateName));

        return candidateName;
    }

    /**
     * Performs bulk save operation for datasources.
     */
    private Flux<Datasource> performBulkSave(List<Datasource> datasourcesToSave) {
        if (datasourcesToSave.isEmpty()) {
            return Flux.empty();
        }

        log.debug("Performing bulk save for {} datasources", datasourcesToSave.size());
        return datasourceService.saveAll(datasourcesToSave);
    }

    /**
     * Performs bulk save operation for datasources storages.
     */
    private Flux<DatasourceStorage> performBulkSaveStorages(List<DatasourceStorage> storagesToSave) {
        if (storagesToSave == null || storagesToSave.isEmpty()) {
            return Flux.empty();
        }

        log.debug("Performing bulk save for {} datasource storages", storagesToSave.size());
        return datasourceStorageService.saveAll(storagesToSave);
    }

    /**
     * Finds an existing datasource based on gitSyncId matching.
     *
     * @param datasourceStorage                   the imported datasource storage to match
     * @param savedDatasourcesGitIdToDatasourceMap map of gitSyncId to existing datasources
     * @param savedDatasourcesNameDatasourceMap    map of name to existing datasources
     * @return the existing datasource if found and can be safely renamed, null otherwise
     */
    private Datasource findExistingDatasource(
            DatasourceStorage datasourceStorage,
            Map<String, Datasource> savedDatasourcesGitIdToDatasourceMap,
            Map<String, Datasource> savedDatasourcesNameDatasourceMap) {

        if (datasourceStorage.getGitSyncId() == null
                || !savedDatasourcesGitIdToDatasourceMap.containsKey(datasourceStorage.getGitSyncId())) {
            return null;
        }

        Datasource dsWithSameGitSyncId = savedDatasourcesGitIdToDatasourceMap.get(datasourceStorage.getGitSyncId());
        String targetDatasourceName = datasourceStorage.getName();

        // Check whether there are any other datasource with the same targetDatasourceName
        if (!savedDatasourcesNameDatasourceMap.containsKey(targetDatasourceName)) {
            // No DS found with the targetDatasourceName, we can rename safely
            return dsWithSameGitSyncId;
        }

        // Found with same name, check if it's the same datasource or not
        Datasource dsWithSameName = savedDatasourcesNameDatasourceMap.get(targetDatasourceName);
        if (dsWithSameName.getId().equals(dsWithSameGitSyncId.getId())) {
            // Same DS, we can rename safely
            return dsWithSameGitSyncId;
        }

        // Different datasource has the target name, cannot safely rename
        return null;
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
            DBAuth dbAuth = decryptedFields.getDbAuth();
            if (dbAuth == null) {
                dbAuth = new DBAuth();
            }
            dbAuth.setPassword(decryptedFields.getPassword());
            datasourceStorage.getDatasourceConfiguration().setAuthentication(dbAuth);
        } else if (StringUtils.equals(authType, BasicAuth.class.getName())) {
            BasicAuth basicAuth = decryptedFields.getBasicAuth();
            if (basicAuth == null) {
                basicAuth = new BasicAuth();
            }
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
            BearerTokenAuth decryptedBearerTokenAuth = decryptedFields.getBearerTokenAuth();
            if (decryptedBearerTokenAuth != null) {
                auth.setBearerToken(decryptedBearerTokenAuth.getBearerToken());
            }
            datasourceStorage.getDatasourceConfiguration().setAuthentication(auth);
        }
    }

    @Override
    public Flux<Datasource> getEntitiesPresentInWorkspace(String workspaceId) {
        return datasourceService.getAllByWorkspaceIdWithStorages(workspaceId, null);
    }
}
