package com.appsmith.server.services;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.AppsmithDomain;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.PluginType;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.AppsmithRole;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.dtos.AnalyticEventDTO;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.services.ce.NewActionServiceCEImpl;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.PagePermission;
import io.micrometer.observation.ObservationRegistry;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.ListUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Slf4j
public class NewActionServiceImpl extends NewActionServiceCEImpl implements NewActionService {
    private final PermissionGroupRepository permissionGroupRepository;
    private final DatasourceService datasourceService;
    private final PermissionGroupService permissionGroupService;
    private final PolicyUtils policyUtils;
    private final NewPageService newPageService;

    public NewActionServiceImpl(Scheduler scheduler,
                                Validator validator,
                                MongoConverter mongoConverter,
                                ReactiveMongoTemplate reactiveMongoTemplate,
                                NewActionRepository repository,
                                AnalyticsService analyticsService,
                                DatasourceService datasourceService,
                                PluginService pluginService,
                                PluginExecutorHelper pluginExecutorHelper,
                                MarketplaceService marketplaceService,
                                PolicyGenerator policyGenerator,
                                NewPageService newPageService,
                                ApplicationService applicationService,
                                PolicyUtils policyUtils,
                                ConfigService configService,
                                ResponseUtils responseUtils,
                                PermissionGroupService permissionGroupService,
                                DatasourcePermission datasourcePermission,
                                ApplicationPermission applicationPermission,
                                PagePermission pagePermission,
                                ActionPermission actionPermission,
                                ObservationRegistry observationRegistry,
                                PermissionGroupRepository permissionGroupRepository) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService,
                datasourceService, pluginService, pluginExecutorHelper, marketplaceService,
                policyGenerator, newPageService, applicationService, policyUtils,
                configService, responseUtils, permissionGroupService, datasourcePermission,
                applicationPermission, pagePermission, actionPermission, observationRegistry);

        this.permissionGroupRepository = permissionGroupRepository;
        this.datasourceService = datasourceService;
        this.permissionGroupService = permissionGroupService;
        this.policyUtils = policyUtils;
        this.newPageService = newPageService;
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

    /**
     * Once the action has been validated and saved, generate a map of permission to permissionGroupIds for the existing
     * default application roles and give these roles required permissions to access the related datasource, if not already
     * given.
     * @param newAction
     * @return
     */
    @Override
    public Mono<ActionDTO> validateAndSaveActionToRepository(NewAction newAction) {
        Mono<ActionDTO> actionDTOMono = super.validateAndSaveActionToRepository(newAction);
        return actionDTOMono
                .flatMap(actionDTO -> {
                    // We don't want to update the Datasource policy if Plugin Type is JS
                    // Or the Datasource doesn't exist.
                    if (actionDTO.getPluginType() == PluginType.JS || StringUtils.isEmpty(actionDTO.getDatasource().getId())) {
                        return Mono.just(actionDTO);
                    }
                    return newPageService.findById(actionDTO.getPageId(), Optional.empty())
                            .flatMap(newPage -> {
                                Mono<Map<String, List<String>>> mapPermissionToDefaultApplicationRoleIdMono =
                                        getMapDatasourcePermissionToDefaultAppRoleIds(newPage.getApplicationId());
                                return mapPermissionToDefaultApplicationRoleIdMono
                                        .flatMap(mapPermissionToDefaultApplicationRoleId -> {
                                            if (mapPermissionToDefaultApplicationRoleId.isEmpty()) {
                                                return Mono.just(actionDTO);
                                            }
                                            Mono<Datasource> datasourceMono = updateDatasourcePolicyMap(actionDTO.getDatasource().getId(), mapPermissionToDefaultApplicationRoleId);
                                            return datasourceMono.thenReturn(actionDTO);
                                        });
                            });
                });
    }

    /**
     * Updates the policy map for the datasource based on the permissionToPermissionGroupIdMap.
     * If the permissionGroupIds are already given the respective permissions, then we simply return the datasource.
     * Else we update the policy map of the datasource, and then return it.
     * @param datasourceId
     * @param permissionToPermissionGroupIdMap
     * @return
     */
    private Mono<Datasource> updateDatasourcePolicyMap(String datasourceId, Map<String, List<String>> permissionToPermissionGroupIdMap) {
        return datasourceService.findById(datasourceId)
                .flatMap(datasource -> {
                    boolean doAllPermissionsExist = permissionToPermissionGroupIdMap.entrySet().stream()
                            .map(entry -> {
                                List<String> defaultApplicationRoleIds = entry.getValue();
                                return defaultApplicationRoleIds.stream()
                                        .map(id -> permissionGroupService.isEntityAccessible(datasource, entry.getKey(), id))
                                        .allMatch(Boolean.TRUE::equals);
                            }).allMatch(Boolean.TRUE::equals);

                    if (doAllPermissionsExist) {
                        return Mono.just(datasource);
                    }
                    Map<String, Policy> datasourcePolicyMap = new HashMap<>();
                    permissionToPermissionGroupIdMap.forEach((permission, roleIds) -> {
                        Policy policy = Policy.builder()
                                .permission(permission)
                                .permissionGroups(new HashSet<>(roleIds))
                                .build();
                        datasourcePolicyMap.put(permission, policy);
                    });
                    Datasource updatedDatasource = policyUtils.addPoliciesToExistingObject(datasourcePolicyMap, datasource);
                    return datasourceService.save(updatedDatasource);
                });
    }


    /**
     * Generates a Map Mono for datasource permissions to list of default application role ids.
     * Datasource permissions are obtained from only APPLICATION_VIEWER from AppsmithRole based on
     * the default roles which exist for the application.
     *
     * Here we are not giving to application developer role, because we are going to introduce another permission on
     * workspace level which will be responsible for giving permission to create actions for all datasource present inside
     * the workspace.
     * @param applicationId
     * @return
     */
    private Mono<Map<String, List<String>>> getMapDatasourcePermissionToDefaultAppRoleIds(String applicationId) {
        return permissionGroupRepository.findByDefaultApplicationId(applicationId, Optional.empty())
                .collectList()
                .map(defaultApplicationRoles -> {
                    Map<String, List<String>> mapPermissionToDefaultApplicationRoleId = new HashMap<>();
                    defaultApplicationRoles.forEach(defaultApplicationRole -> {
                        if (defaultApplicationRole.getName().startsWith(FieldName.APPLICATION_VIEWER)) {
                            AppsmithRole.APPLICATION_VIEWER.getPermissions()
                                    .stream()
                                    .filter(aclPermission -> aclPermission.getEntity().equals(Datasource.class))
                                    .forEach(aclPermission -> mapPermissionToDefaultApplicationRoleId.merge(aclPermission.getValue(), List.of(defaultApplicationRole.getId()), ListUtils::union));
                        }
                    });
                    return mapPermissionToDefaultApplicationRoleId;
                });
    }
}
