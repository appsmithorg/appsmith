package com.appsmith.server.services;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.Param;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.PluginType;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.NewActionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.ArrayUtils;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Set;
import java.util.concurrent.atomic.AtomicReference;

import static com.appsmith.server.acl.AclPermission.EXECUTE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.EXECUTE_DATASOURCES;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;

@Service
@Slf4j
@RequiredArgsConstructor
public class ActionExecutionServiceImpl implements ActionExecutionService {

    private final NewActionRepository repository;
    private final DatasourceService datasourceService;
    private final PluginService pluginService;
    private final DatasourceContextService datasourceContextService;
    private final PluginExecutorHelper pluginExecutorHelper;
    private final AuthenticationValidator authenticationValidator;

    @Override
    public Mono<ActionExecutionResult> executeAction(ExecuteActionDTO executeActionDTO) {

        validateRequest(executeActionDTO);

        // TODO why is this required?
        AtomicReference<String> actionName = new AtomicReference<>();
        // Initialize the name to be empty value
        actionName.set("");

        // Fetch the action from the DB and check if it can be executed
        String actionId = executeActionDTO.getActionId();
        Mono<NewAction> actionMono = getExecutableAction(actionId);

        // Then find the configuration depending on view mode
        Mono<ActionDTO> actionDTOMono = getActionDTO(executeActionDTO, actionMono);

        // Instantiate the implementation class based on the query type
        Mono<Datasource> datasourceMono = getExecutableDatasource(actionDTOMono, actionId);

        Mono<Plugin> pluginMono = datasourceMono
                .flatMap(datasource -> pluginService.findById(datasource.getPluginId()))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.PLUGIN)));

        Mono<PluginExecutor> pluginExecutorMono = pluginExecutorHelper.getPluginExecutor(pluginMono);



        return null;
    }

    // Validate input parameters which are required for mustache replacements
    private void validateRequest(ExecuteActionDTO executeActionDTO) {
        List<Param> params = executeActionDTO.getParams();
        if (!CollectionUtils.isEmpty(params)) {
            for (Param param : params) {
                // TODO why is this required?
                // In case the parameter values turn out to be null, set it to empty string instead to allow the
                // the execution to go through no matter what.
                if (!StringUtils.isEmpty(param.getKey()) && param.getValue() == null) {
                    param.setValue("");
                }
            }
        }
    }

    private Mono<NewAction> getExecutableAction(String actionId) {
        return repository.findById(actionId, EXECUTE_ACTIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ACTION, actionId)))
                .cache();
    }

    private Mono<ActionDTO> getActionDTO(ExecuteActionDTO executeActionDTO, Mono<NewAction> actionMono) {
        return actionMono
                .flatMap(dbAction -> {
                    ActionDTO action;
                    if (TRUE.equals(executeActionDTO.getViewMode())) {
                        action = dbAction.getPublishedAction();
                        // If the action has not been published, return error
                        if (action == null) {
                            return Mono.error(new AppsmithException(
                                    AppsmithError.NO_RESOURCE_FOUND,
                                    FieldName.ACTION,
                                    dbAction.getId()));
                        }
                    } else {
                        action = dbAction.getUnpublishedAction();
                    }

                    // Now check for erroneous situations which would deter the execution of the action :

                    // Error out with in case of an invalid action
                    if (FALSE.equals(action.getIsValid())) {
                        return Mono.error(new AppsmithException(
                                AppsmithError.INVALID_ACTION,
                                action.getName(),
                                ArrayUtils.toString(action.getInvalids().toArray())
                        ));
                    }

                    // Error out in case of JS Plugin (this is currently client side execution only)
                    if (dbAction.getPluginType() == PluginType.JS) {
                        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
                    }
                    return Mono.just(action);
                })
                .cache();
    }

    private Mono<Datasource> getExecutableDatasource(Mono<ActionDTO> actionDTOMono, String actionId) {
        return actionDTOMono
                .flatMap(action -> {
                    // Global datasource requires us to fetch the datasource from DB.
                    if (action.getDatasource() != null && action.getDatasource().getId() != null) {
                        return datasourceService.findById(action.getDatasource().getId(), EXECUTE_DATASOURCES)
                                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND,
                                        FieldName.DATASOURCE,
                                        action.getDatasource().getId())));
                    }

                    // This is a nested datasource. Return as is.
                    return Mono.justOrEmpty(action.getDatasource());
                })
                .flatMap(datasource -> {
                    // For embedded datasources, validate the datasource for each execution
                    if (datasource.getId() == null) {
                        return datasourceService.validateDatasource(datasource);
                    }

                    // The external datasources have already been validated. No need to validate again.
                    return Mono.just(datasource);
                })
                .flatMap(datasource -> {
                    Set<String> invalids = datasource.getInvalids();
                    if (!CollectionUtils.isEmpty(invalids)) {
                        log.error("Unable to execute actionId: {} because it's datasource is not valid. Cause: {}",
                                actionId, ArrayUtils.toString(invalids));
                        return Mono.error(new AppsmithException(AppsmithError.INVALID_DATASOURCE,
                                datasource.getName(),
                                ArrayUtils.toString(invalids)));
                    }

                    return Mono.just(datasource);
                })
                .cache();
    }

}
