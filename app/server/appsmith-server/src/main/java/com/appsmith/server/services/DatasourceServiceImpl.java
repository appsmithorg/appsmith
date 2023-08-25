package com.appsmith.server.services;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.DatasourceStorageDTO;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.services.ce.DatasourceServiceCEImpl;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.EnvironmentPermission;
import com.appsmith.server.solutions.WorkspacePermission;
import io.micrometer.observation.ObservationRegistry;
import jakarta.validation.constraints.NotNull;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.observability.micrometer.Micrometer;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;

@Slf4j
@Service
public class DatasourceServiceImpl extends DatasourceServiceCEImpl implements DatasourceService {

    private final WorkspaceService workspaceService;
    private final ObservationRegistry observationRegistry;
    private final EnvironmentPermission environmentPermission;

    public DatasourceServiceImpl(
            DatasourceRepository repository,
            WorkspaceService workspaceService,
            AnalyticsService analyticsService,
            SessionUserService sessionUserService,
            PluginService pluginService,
            PluginExecutorHelper pluginExecutorHelper,
            PolicyGenerator policyGenerator,
            SequenceService sequenceService,
            NewActionRepository newActionRepository,
            DatasourceContextService datasourceContextService,
            DatasourcePermission datasourcePermission,
            WorkspacePermission workspacePermission,
            DatasourceStorageService datasourceStorageService,
            EnvironmentPermission environmentPermission,
            ObservationRegistry observationRegistry) {

        super(
                repository,
                workspaceService,
                analyticsService,
                sessionUserService,
                pluginService,
                pluginExecutorHelper,
                policyGenerator,
                sequenceService,
                newActionRepository,
                datasourceContextService,
                datasourcePermission,
                workspacePermission,
                datasourceStorageService,
                environmentPermission);

        this.workspaceService = workspaceService;
        this.observationRegistry = observationRegistry;
        this.environmentPermission = environmentPermission;
    }

    @Override
    public Mono<String> getTrueEnvironmentId(
            String workspaceId,
            String environmentId,
            String pluginId,
            AclPermission aclPermission,
            boolean isEmbedded) {
        // These two constants should Ideally be moved to constants, but that needs to be added from CE,
        // this is here until we add these in CE repo
        String observationTag = "isDefaultCall";
        String observationName = "get.environmentId.true";

        if (!StringUtils.hasText(workspaceId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID));
        }

        if (Boolean.TRUE.equals(isEmbedded)) {
            // We don't care about any of the other params in this case,
            // since environments do not apply to an embedded datasource
            return workspaceService.verifyEnvironmentIdByWorkspaceId(workspaceId, environmentId, null);
        }

        return Mono.just(!StringUtils.hasText(environmentId))
                .zipWith(pluginService.isOosPluginForME(pluginId))
                .flatMap(tuple2 -> {
                    if (tuple2.getT1()) {
                        // If there is no environment provided, always opt for the default,
                        // provided that this user has the requisite permissions
                        return workspaceService
                                .getDefaultEnvironmentId(workspaceId, AclPermission.EXECUTE_ENVIRONMENTS)
                                .tag(observationTag, Boolean.TRUE.toString())
                                .name(observationName)
                                .tap(Micrometer.observation(observationRegistry));
                    } else if (tuple2.getT2()) {
                        // If this is an OOS plugin, check if the user has access to the current environment
                        // If they do, opt to use the default environment irrespective of access
                        return workspaceService
                                .verifyEnvironmentIdByWorkspaceId(workspaceId, environmentId, aclPermission)
                                .then(workspaceService.getDefaultEnvironmentId(workspaceId, null));
                    }
                    // In case the environment id is provided and this is not an OOS plugin,
                    // Opt to check for access for this particular environment itself
                    return workspaceService
                            .verifyEnvironmentIdByWorkspaceId(workspaceId, environmentId, aclPermission)
                            .tag(observationTag, Boolean.FALSE.toString())
                            .name(observationName)
                            .tap(Micrometer.observation(observationRegistry));
                });
    }

    @Override
    protected Flux<DatasourceStorage> organiseDatasourceStorages(@NotNull Datasource savedDatasource) {
        Map<String, DatasourceStorageDTO> storages = savedDatasource.getDatasourceStorages();
        int datasourceStorageDTOsAllowed = 2;
        String storageMessage = "Error: Exceeded maximum allowed datasourceStorage count. Please provide a maximum of "
                + datasourceStorageDTOsAllowed + " datasourceStorage items.";

        if (storages.size() > datasourceStorageDTOsAllowed) {
            if (savedDatasource.getMessages() == null) {
                savedDatasource.setMessages(new HashSet<>());
            }
            // Since the datasource has been created we can't error out, we won't be creating any datasourceStorages,
            // but sending back with the hint message.

            log.debug(
                    "Error: Exceeded maximum allowed datasourceStorage count for datasource {} with datasourceId {}",
                    savedDatasource.getName(),
                    savedDatasource.getId());
            savedDatasource.getMessages().add(storageMessage);
            return Flux.empty();
        }

        Map<String, DatasourceStorage> storagesToBeSaved = new HashMap<>();

        return Flux.fromIterable(storages.values())
                .flatMap(datasourceStorageDTO -> this.getTrueEnvironmentId(
                                savedDatasource.getWorkspaceId(),
                                datasourceStorageDTO.getEnvironmentId(),
                                savedDatasource.getPluginId(),
                                null)
                        .map(trueEnvironmentId -> {
                            datasourceStorageDTO.setEnvironmentId(trueEnvironmentId);
                            DatasourceStorage datasourceStorage =
                                    datasourceStorageService.createDatasourceStorageFromDatasourceStorageDTO(
                                            datasourceStorageDTO);
                            datasourceStorage.prepareTransientFields(savedDatasource);
                            storagesToBeSaved.put(trueEnvironmentId, datasourceStorage);
                            return datasourceStorage;
                        }))
                .thenMany(Flux.fromIterable(storagesToBeSaved.values()));
    }
}
