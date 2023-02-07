package com.appsmith.server.services;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.AppsmithDomain;
import com.appsmith.external.models.PluginType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.AnalyticEventDTO;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.services.ce.NewActionServiceCEImpl;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.PagePermission;
import io.micrometer.observation.ObservationRegistry;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import java.util.Map;

@Service
@Slf4j
public class NewActionServiceImpl extends NewActionServiceCEImpl implements NewActionService {

    private final VariableReplacementService variableReplacementService;

    public NewActionServiceImpl(Scheduler scheduler,
                                Validator validator,
                                MongoConverter mongoConverter,
                                ReactiveMongoTemplate reactiveMongoTemplate,
                                NewActionRepository repository,
                                AnalyticsService analyticsService,
                                DatasourceService datasourceService,
                                PluginService pluginService,
                                DatasourceContextService datasourceContextService,
                                PluginExecutorHelper pluginExecutorHelper,
                                MarketplaceService marketplaceService,
                                PolicyGenerator policyGenerator,
                                NewPageService newPageService,
                                ApplicationService applicationService,
                                SessionUserService sessionUserService,
                                PolicyUtils policyUtils,
                                AuthenticationValidator authenticationValidator,
                                ConfigService configService,
                                ResponseUtils responseUtils,
                                VariableReplacementService variableReplacementService,
                                PermissionGroupService permissionGroupService,
                                DatasourcePermission datasourcePermission,
                                ApplicationPermission applicationPermission,
                                PagePermission pagePermission,
                                ActionPermission actionPermission,
                                ObservationRegistry observationRegistry) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService,
                datasourceService, pluginService, datasourceContextService, pluginExecutorHelper, marketplaceService,
                policyGenerator, newPageService, applicationService, sessionUserService, policyUtils,
                authenticationValidator, configService, responseUtils, permissionGroupService, datasourcePermission,
                applicationPermission, pagePermission, actionPermission, observationRegistry);

        this.variableReplacementService = variableReplacementService;
    }

    @Override
    public Mono<ActionDTO> getValidActionForExecution(ExecuteActionDTO executeActionDTO, String actionId, NewAction newAction) {
        return super.getValidActionForExecution(executeActionDTO, actionId, newAction)
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

    /**
     * To send action related general analytics events
     * Mainly used to send events that are originated frontend or backend
     *
     * @param analyticEventDTO
     * @return
     */
    public Mono<NewAction> sendNewActionAnalyticsEvent(AnalyticEventDTO analyticEventDTO, String origin) {
        switch (analyticEventDTO.getEvent()) {
            // JSObject function execute events are executed from frontend on browser
            // This will be reported to backend via API for Audit Logs
            case EXECUTE:
                return this.findById(analyticEventDTO.getResourceId(), AclPermission.EXECUTE_ACTIONS)
                        .filter(newAction -> newAction.getPluginType().equals(PluginType.JS))
                        .flatMap(newAction -> {
                            Map<String, Object> analyticsProperties = getAnalyticsProperties(newAction);
                            analyticsProperties.put(FieldName.AUDIT_LOGS_ORIGIN, origin);
                            if (analyticEventDTO.getMetadata().containsKey(FieldName.AUDIT_LOGS_VIEW_MODE)) {
                                if (null != analyticEventDTO.getMetadata().get(FieldName.AUDIT_LOGS_VIEW_MODE)) {
                                    Boolean isViewMode = (Boolean) analyticEventDTO.getMetadata().get(FieldName.AUDIT_LOGS_VIEW_MODE);
                                    String applicationMode = isViewMode ? ApplicationMode.PUBLISHED.toString() : ApplicationMode.EDIT.toString();
                                    analyticsProperties.put(FieldName.AUDIT_LOGS_VIEW_MODE, applicationMode);
                                }
                                // In case of JSObjects, the function name is passed from client
                                if (null != analyticEventDTO.getMetadata().get(FieldName.AUDIT_LOGS_ACTION_NAME)) {
                                    String actionName = (String) analyticEventDTO.getMetadata().get(FieldName.AUDIT_LOGS_ACTION_NAME);
                                    analyticsProperties.put(FieldName.AUDIT_LOGS_ACTION_NAME, actionName);
                                }
                            }
                            return analyticsService.sendObjectEvent(AnalyticsEvents.EXECUTE_ACTION, newAction, analyticsProperties);
                        });
        }
        return Mono.empty();
    }

}
