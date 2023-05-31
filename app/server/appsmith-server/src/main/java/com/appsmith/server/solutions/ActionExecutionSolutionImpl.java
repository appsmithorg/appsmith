package com.appsmith.server.solutions;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.AppsmithDomain;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.AuthenticationValidator;
import com.appsmith.server.services.DatasourceContextService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.DatasourceStorageService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.services.PluginService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.VariableReplacementService;
import com.appsmith.server.solutions.ce.ActionExecutionSolutionCEImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.micrometer.observation.ObservationRegistry;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
public class ActionExecutionSolutionImpl extends ActionExecutionSolutionCEImpl implements ActionExecutionSolution {

    private final VariableReplacementService variableReplacementService;

    public ActionExecutionSolutionImpl(NewActionService newActionService,
                                       ActionPermission actionPermission,
                                       ObservationRegistry observationRegistry,
                                       ObjectMapper objectMapper,
                                       NewActionRepository repository,
                                       DatasourceService datasourceService,
                                       PluginService pluginService,
                                       DatasourceContextService datasourceContextService,
                                       PluginExecutorHelper pluginExecutorHelper,
                                       NewPageService newPageService,
                                       ApplicationService applicationService,
                                       SessionUserService sessionUserService,
                                       AuthenticationValidator authenticationValidator,
                                       DatasourcePermission datasourcePermission,
                                       AnalyticsService analyticsService,
                                       DatasourceStorageService datasourceStorageService,
                                       DatasourceStorageTransferSolution datasourceStorageTransferSolution,
                                       VariableReplacementService variableReplacementService) {
        super(newActionService, actionPermission, observationRegistry, objectMapper, repository, datasourceService,
                pluginService, datasourceContextService, pluginExecutorHelper, newPageService, applicationService,
                sessionUserService, authenticationValidator, datasourcePermission, analyticsService,
                datasourceStorageService, datasourceStorageTransferSolution);

        this.variableReplacementService = variableReplacementService;
    }

    @Override
    public Mono<ActionDTO> getValidActionForExecution(ExecuteActionDTO executeActionDTO) {
        return super.getValidActionForExecution(executeActionDTO)
                .flatMap(validAction -> {
                    Mono<AppsmithDomain> actionConfigurationMono = this.variableReplacementService
                            .replaceAll(validAction.getActionConfiguration());
                    return actionConfigurationMono.flatMap(
                            configuration -> {
                                validAction.setActionConfiguration((ActionConfiguration) configuration);
                                return Mono.just(validAction);
                            });
                });
    }

    @Override
    public Boolean isSendExecuteAnalyticsEvent() {
        // This is to send analytics event from NewActionService as part of event logging irrespective of telemetry
        // disabled status.
        // AnalyticsService would still prevent sending event to Analytics provider if telemetry is disabled
        return true;
    }
}
