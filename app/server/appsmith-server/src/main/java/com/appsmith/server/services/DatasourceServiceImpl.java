package com.appsmith.server.services;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.DatasourceStorageDTO;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.services.ce.DatasourceServiceCEImpl;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.WorkspacePermission;
import io.micrometer.observation.ObservationRegistry;
import jakarta.validation.Validator;
import jakarta.validation.constraints.NotNull;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.observability.micrometer.Micrometer;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;

@Slf4j
@Service
public class DatasourceServiceImpl extends DatasourceServiceCEImpl implements DatasourceService {

    private final VariableReplacementService variableReplacementService;

    private final WorkspaceService workspaceService;

    private final ObservationRegistry observationRegistry;


    public DatasourceServiceImpl(Scheduler scheduler,
                                 Validator validator,
                                 MongoConverter mongoConverter,
                                 ReactiveMongoTemplate reactiveMongoTemplate,
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
                                 VariableReplacementService variableReplacementService,
                                 DatasourcePermission datasourcePermission,
                                 WorkspacePermission workspacePermission,
                                 DatasourceStorageService datasourceStorageService,
                                 ObservationRegistry observationRegistry) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, workspaceService,
                analyticsService, sessionUserService, pluginService, pluginExecutorHelper, policyGenerator,
                sequenceService, newActionRepository, datasourceContextService, datasourcePermission,
                workspacePermission, datasourceStorageService);

        this.variableReplacementService = variableReplacementService;
        this.workspaceService = workspaceService;
        this.observationRegistry = observationRegistry;
    }

    @Override
    public Mono<String> getTrueEnvironmentId(String workspaceId, String environmentId) {
        // These two constants should Ideally be moved to constants, but that needs to be added from CE,
        // this is here until we add these in CE repo
        String observationTag = "isDefaultCall";
        String observationName = "get.environmentId.true";

        if (!StringUtils.hasText(workspaceId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID));
        }

        if (!StringUtils.hasText(environmentId)) {
            return workspaceService.getDefaultEnvironmentId(workspaceId)
                    .tag(observationTag, Boolean.TRUE.toString())
                    .name(observationName)
                    .tap(Micrometer.observation(observationRegistry));
        }

        return workspaceService.verifyEnvironmentIdByWorkspaceId(workspaceId, environmentId)
                .tag(observationTag, Boolean.FALSE.toString())
                .name(observationName)
                .tap(Micrometer.observation(observationRegistry));
    }

    @Override
    protected Flux<DatasourceStorage> organiseDatasourceStorages(@NotNull Datasource savedDatasource) {
        Map<String, DatasourceStorageDTO> storages = savedDatasource.getDatasourceStorages();
        int datasourceStorageDTOsAllowed = 2;
        String storageMessage = "Error: Exceeded maximum allowed datasourceStorage count. Please provide a maximum of " +
                datasourceStorageDTOsAllowed + " datasourceStorage items.";

        if (storages.size() > datasourceStorageDTOsAllowed) {
            if (savedDatasource.getMessages() == null) {
                savedDatasource.setMessages(new HashSet<>());
            }
            // Since the datasource has been created we can't error out, we won't be creating any datasourceStorages,
            // but sending back with the hint message.

            log.debug("Error: Exceeded maximum allowed datasourceStorage count for datasource {} with datasourceId {}",
                    savedDatasource.getName(), savedDatasource.getId());
            savedDatasource.getMessages().add(storageMessage);
            return Flux.empty();
        }

        Map<String, DatasourceStorage> storagesToBeSaved = new HashMap<>();

        return Flux.fromIterable(storages.values())
                .flatMap(datasourceStorageDTO ->
                        this.getTrueEnvironmentId(savedDatasource.getWorkspaceId(), datasourceStorageDTO.getEnvironmentId())
                                .map(trueEnvironmentId -> {
                                    datasourceStorageDTO.setEnvironmentId(trueEnvironmentId);
                                    DatasourceStorage datasourceStorage = new DatasourceStorage(datasourceStorageDTO);
                                    datasourceStorage.prepareTransientFields(savedDatasource);
                                    storagesToBeSaved.put(trueEnvironmentId, datasourceStorage);
                                    return datasourceStorage;
                                })
                )
                .thenMany(Flux.fromIterable(storagesToBeSaved.values()));
    }
}
