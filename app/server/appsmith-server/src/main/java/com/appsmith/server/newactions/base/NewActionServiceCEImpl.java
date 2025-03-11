package com.appsmith.server.newactions.base;

import com.appsmith.external.dtos.ExecutePluginDTO;
import com.appsmith.external.dtos.RemoteDatasourceDTO;
import com.appsmith.external.git.constants.ce.RefType;
import com.appsmith.external.helpers.MustacheHelper;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.MustacheBindingToken;
import com.appsmith.external.models.PluginType;
import com.appsmith.external.models.Policy;
import com.appsmith.external.models.Property;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.DatasourceContext;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.dtos.ActionViewDTO;
import com.appsmith.server.dtos.ImportActionCollectionResultDTO;
import com.appsmith.server.dtos.ImportActionResultDTO;
import com.appsmith.server.dtos.ImportedActionAndCollectionMapsDTO;
import com.appsmith.server.dtos.LayoutExecutableUpdateDTO;
import com.appsmith.server.dtos.PluginTypeAndCountDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.newactions.helpers.NewActionHelper;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.BaseService;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.PagePermission;
import com.appsmith.server.solutions.PolicySolution;
import com.appsmith.server.validations.EntityValidationService;
import io.micrometer.observation.ObservationRegistry;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.ObjectUtils;
import org.springframework.data.domain.Sort;
import org.springframework.util.CollectionUtils;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import reactor.core.observability.micrometer.Micrometer;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

import static com.appsmith.external.constants.spans.ActionSpan.GET_ACTION_REPOSITORY_CALL;
import static com.appsmith.external.constants.spans.ce.ActionSpanCE.VIEW_MODE_FETCH_ACTIONS_FROM_DB;
import static com.appsmith.external.constants.spans.ce.ActionSpanCE.VIEW_MODE_FETCH_PLUGIN_FROM_DB;
import static com.appsmith.external.constants.spans.ce.ActionSpanCE.VIEW_MODE_SET_PLUGIN_ID_AND_TYPE_ACTION;
import static com.appsmith.external.constants.spans.ce.ActionSpanCE.VIEW_MODE_SET_PLUGIN_ID_AND_TYPE_JS;
import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNestedNonNullProperties;
import static com.appsmith.external.helpers.PluginUtils.setValueSafelyInFormData;
import static com.appsmith.server.acl.AclPermission.EXECUTE_DATASOURCES;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;

@Slf4j
public class NewActionServiceCEImpl extends BaseService<NewActionRepository, NewAction, String>
        implements NewActionServiceCE {

    public static final String DATA = "data";
    public static final String STATUS = "status";
    public static final String ERROR = "ERROR";
    public static final String NATIVE_QUERY_PATH = "formToNativeQuery";
    public static final String NATIVE_QUERY_PATH_DATA = NATIVE_QUERY_PATH + "." + DATA;
    public static final String NATIVE_QUERY_PATH_STATUS = NATIVE_QUERY_PATH + "." + STATUS;
    public static final PluginType JS_PLUGIN_TYPE = PluginType.JS;
    public static final String JS_PLUGIN_PACKAGE_NAME = "js-plugin";
    protected final NewActionRepository repository;
    private final DatasourceService datasourceService;
    private final PluginService pluginService;
    private final PluginExecutorHelper pluginExecutorHelper;
    private final PolicyGenerator policyGenerator;
    private final NewPageService newPageService;
    private final ApplicationService applicationService;
    private final PolicySolution policySolution;
    private final ConfigService configService;
    private final PermissionGroupService permissionGroupService;
    private final NewActionHelper newActionHelper;
    private final DatasourcePermission datasourcePermission;
    private final ApplicationPermission applicationPermission;
    private final PagePermission pagePermission;
    protected final ActionPermission actionPermission;
    private final EntityValidationService entityValidationService;
    private final ObservationRegistry observationRegistry;
    private final Map<String, Plugin> defaultPluginMap = new HashMap<>();
    private final AtomicReference<Plugin> jsTypePluginReference = new AtomicReference<>();

    public NewActionServiceCEImpl(
            Validator validator,
            NewActionRepository repository,
            AnalyticsService analyticsService,
            DatasourceService datasourceService,
            PluginService pluginService,
            PluginExecutorHelper pluginExecutorHelper,
            PolicyGenerator policyGenerator,
            NewPageService newPageService,
            ApplicationService applicationService,
            PolicySolution policySolution,
            ConfigService configService,
            PermissionGroupService permissionGroupService,
            NewActionHelper newActionHelper,
            DatasourcePermission datasourcePermission,
            ApplicationPermission applicationPermission,
            PagePermission pagePermission,
            ActionPermission actionPermission,
            EntityValidationService entityValidationService,
            ObservationRegistry observationRegistry) {

        super(validator, repository, analyticsService);
        this.repository = repository;
        this.datasourceService = datasourceService;
        this.pluginService = pluginService;
        this.pluginExecutorHelper = pluginExecutorHelper;
        this.policyGenerator = policyGenerator;
        this.newPageService = newPageService;
        this.applicationService = applicationService;
        this.policySolution = policySolution;
        this.permissionGroupService = permissionGroupService;
        this.newActionHelper = newActionHelper;
        this.entityValidationService = entityValidationService;
        this.observationRegistry = observationRegistry;
        this.configService = configService;
        this.datasourcePermission = datasourcePermission;
        this.applicationPermission = applicationPermission;
        this.pagePermission = pagePermission;
        this.actionPermission = actionPermission;
    }

    protected void setCommonFieldsFromNewActionIntoAction(NewAction newAction, ActionDTO action) {

        // Set the fields from NewAction into Action
        action.setWorkspaceId(newAction.getWorkspaceId());
        action.setApplicationId(newAction.getApplicationId());
        action.setPluginType(newAction.getPluginType());
        action.setPluginId(newAction.getPluginId());
        action.setDocumentation(newAction.getDocumentation());

        action.setId(newAction.getId());
        action.setBaseId(newAction.getBaseIdOrFallback());
        action.setRefType(newAction.getRefType());
        action.setRefName(newAction.getRefName());
        action.setUserPermissions(newAction.getUserPermissions());
        action.setPolicies(newAction.getPolicies());
        /*
         * Important: This null check before setting the createdAt field to ActionDTO is temporary.
         * createdAt is part of exported JSON, and we used to import actions with the same value from JSON.
         * It's wrong but if we fix this, the existing Git connected applications will show a diff for all actions.
         * We want to avoid this and hence this null check is there.
         * We're going to remove the createdAt field from JSON and post that this null check will be removed.
         */
        if (action.getCreatedAt() == null) {
            action.setCreatedAt(newAction.getCreatedAt());
        }
    }

    @Override
    public void setCommonFieldsFromActionDTOIntoNewAction(ActionDTO action, NewAction newAction) {
        // Set the fields from NewAction into Action
        newAction.setWorkspaceId(action.getWorkspaceId());
        newAction.setPluginType(action.getPluginType());
        newAction.setPluginId(action.getPluginId());
        newAction.setDocumentation(action.getDocumentation());
        newAction.setApplicationId(action.getApplicationId());
        newAction.setBaseId(action.getBaseId());
        newAction.setRefType(action.getRefType());
        newAction.setRefName(action.getRefName());
    }

    @Override
    public ActionDTO generateActionByViewMode(NewAction newAction, Boolean viewMode) {
        ActionDTO action = null;

        if (TRUE.equals(viewMode)) {
            if (newAction.getPublishedAction() != null) {
                action = newAction.getPublishedAction();
            } else {
                // We are trying to fetch published action but it doesn't exist because the action hasn't been published
                // yet
                return null;
            }
        } else {
            if (newAction.getUnpublishedAction() != null) {
                action = newAction.getUnpublishedAction();
            } else {
                throw new AppsmithException(
                        AppsmithError.INVALID_ACTION, newAction.getId(), "No unpublished action found for edit mode");
            }
        }

        // Set the fields from NewAction into Action
        setCommonFieldsFromNewActionIntoAction(newAction, action);

        action.setBaseId(newAction.getBaseIdOrFallback());

        return action;
    }

    @Override
    public void generateAndSetActionPolicies(NewPage page, NewAction action) {
        if (page == null) {
            throw new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR, "No page found to copy policies from.");
        }
        Set<Policy> documentPolicies =
                policyGenerator.getAllChildPolicies(page.getPolicies(), NewPage.class, NewAction.class);
        action.setPolicies(documentPolicies);
    }

    /**
     * Whenever we save an action into the repository using this method, we expect that the action has all its required fields populated,
     * and that this is not a partial update. As a result, all validations can be performed, and values can be reset if they do not fit
     * our validations.
     *
     * @param newAction
     * @return
     */
    @Override
    public Mono<ActionDTO> validateAndSaveActionToRepository(NewAction newAction) {
        return validateAction(newAction)
                .flatMap(validatedAction -> create(validatedAction))
                .flatMap(createdAction -> {
                    // If the default action is not set then current action will be the default one
                    if (!StringUtils.hasLength(createdAction.getBaseId())) {
                        createdAction.setBaseId(createdAction.getId());
                        return repository.save(createdAction);
                    }
                    return Mono.just(createdAction);
                })
                .flatMap(repository::setUserPermissionsInObject)
                .flatMap(this::setTransientFieldsInUnpublishedAction);
    }

    @Override
    public Mono<NewAction> validateAction(NewAction newAction) {
        return validateAction(newAction, false);
    }

    @Override
    public Mono<NewAction> validateAction(NewAction newAction, boolean isDryOps) {
        this.setGitSyncIdInNewAction(newAction);

        ActionDTO action = newAction.getUnpublishedAction();

        setCommonFieldsFromNewActionIntoAction(newAction, action);

        // Default the validity to true and invalids to be an empty set.
        Set<String> invalids = new HashSet<>();

        action.setIsValid(true);

        if (action.getName() == null || action.getName().trim().isEmpty()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.NAME));
        }

        newActionHelper.validateCreatorId(action);

        if (!this.isValidActionName(action)) {
            action.setIsValid(false);
            invalids.add(AppsmithError.INVALID_ACTION_NAME.getMessage());
        }

        if (action.getActionConfiguration() == null) {
            action.setIsValid(false);
            invalids.add(AppsmithError.NO_CONFIGURATION_FOUND_IN_ACTION.getMessage());
        }

        if (action.getPluginType() == PluginType.JS
                && action.getActionConfiguration() != null
                && FALSE.equals(action.getActionConfiguration().getIsValid())) {
            action.setIsValid(false);
            invalids.add(AppsmithError.INVALID_JS_ACTION.getMessage());
        }

        // Validate actionConfiguration
        ActionConfiguration actionConfig = action.getActionConfiguration();
        if (actionConfig != null) {
            validator.validate(actionConfig).stream().forEach(x -> invalids.add(x.getMessage()));
        }

        /**
         * If the Datasource is null, create one and set the autoGenerated flag to true. This is required because spring-data
         * cannot add the createdAt and updatedAt properties for null embedded objects. At this juncture, we couldn't find
         * a way to disable the auditing for nested objects.
         *
         */
        if (action.getDatasource() == null) {
            action.autoGenerateDatasource();
        }

        Mono<NewAction> validatedActionMono = Mono.just(newAction);

        if (action.getDatasource().getIsAutoGenerated()) {
            if (action.getPluginType() != PluginType.JS) {
                // This action isn't of type JS functions which requires that the pluginType be set by the client.
                // Hence, datasource is very much required for such an action.
                action.setIsValid(false);
                invalids.add(AppsmithError.DATASOURCE_NOT_GIVEN.getMessage());
                action.setInvalids(invalids);
            }
        } else {

            Mono<Datasource> datasourceMono = Mono.just(action.getDatasource());
            if (action.getPluginType() != PluginType.JS) {
                if (action.getDatasource().getId() == null) {
                    datasourceMono = Mono.just(action.getDatasource()).flatMap(datasourceService::validateDatasource);
                } else {
                    // TODO: check if datasource should be fetched with edit during action create or update.
                    // Data source already exists. Find the same.

                    if (isDryOps) {
                        datasourceMono = Mono.just(action.getDatasource());
                    } else {
                        datasourceMono = datasourceService
                                .findById(action.getDatasource().getId())
                                .switchIfEmpty(Mono.defer(() -> {
                                    if (!isDryOps) {
                                        action.setIsValid(false);
                                        invalids.add(AppsmithError.NO_RESOURCE_FOUND.getMessage(
                                                FieldName.DATASOURCE,
                                                action.getDatasource().getId()));
                                    }
                                    return Mono.just(action.getDatasource());
                                }));
                    }
                    datasourceMono = datasourceMono
                            .map(datasource -> {
                                // datasource is found. Update the action.
                                newAction.setWorkspaceId(datasource.getWorkspaceId());
                                return datasource;
                            })
                            // If the action is publicly executable, update the datasource policy
                            .flatMap(datasource -> updateDatasourcePolicyForPublicAction(newAction, datasource));
                }
            }

            Mono<Plugin> pluginMono = datasourceMono.flatMap(datasource -> {
                if (datasource.getPluginId() == null) {
                    return Mono.error(new AppsmithException(AppsmithError.PLUGIN_ID_NOT_GIVEN));
                }
                return pluginService.findById(datasource.getPluginId()).switchIfEmpty(Mono.defer(() -> {
                    action.setIsValid(false);
                    invalids.add(
                            AppsmithError.NO_RESOURCE_FOUND.getMessage(FieldName.PLUGIN, datasource.getPluginId()));
                    return Mono.just(new Plugin());
                }));
            });

            validatedActionMono = pluginMono
                    .zipWith(datasourceMono)
                    // Set plugin in the action before saving.
                    .map(tuple -> {
                        Plugin plugin = tuple.getT1();
                        Datasource datasource = tuple.getT2();
                        action.setDatasource(datasource);
                        action.setPluginName(plugin.getName());
                        return newAction;
                    });
        }

        return validatedActionMono
                .map(newAction1 -> {
                    action.setInvalids(invalids);
                    newAction1.setUnpublishedAction(action);
                    return newAction1;
                })
                .flatMap(this::sanitizeAction)
                .flatMap(this::extractAndSetJsonPathKeys)
                .map(updatedAction -> {
                    // In case of external datasource (not embedded) instead of storing the entire datasource
                    // again inside the action, instead replace it with just the datasource ID. This is so that
                    // datasource data is not duplicated across actions and datasource.
                    ActionDTO unpublishedAction = updatedAction.getUnpublishedAction();
                    if (unpublishedAction.getDatasource().getId() != null) {
                        Datasource datasource = new Datasource();
                        datasource.setId(unpublishedAction.getDatasource().getId());
                        datasource.setPluginId(updatedAction.getPluginId());
                        datasource.setName(unpublishedAction.getDatasource().getName());
                        unpublishedAction.setDatasource(datasource);
                        updatedAction.setUnpublishedAction(unpublishedAction);
                    }
                    return updatedAction;
                });
    }

    @Override
    public Mono<Void> bulkValidateAndInsertActionInRepository(List<NewAction> newActionList) {
        return Flux.fromIterable(newActionList)
                .flatMap(newAction -> validateAction(newAction, true))
                .collectList()
                .flatMap(repository::bulkInsert);
    }

    @Override
    public Mono<Void> bulkValidateAndUpdateActionInRepository(List<NewAction> newActionList) {
        return Flux.fromIterable(newActionList)
                .flatMap(newAction -> validateAction(newAction, true))
                .collectList()
                .flatMap(repository::bulkUpdate);
    }

    protected boolean isValidActionName(ActionDTO action) {
        return entityValidationService.validateName(action.getName());
    }

    protected Mono<ActionDTO> validateCreatorId(ActionDTO action) {
        if (action.getPageId() == null || action.getPageId().isBlank()) {
            throw new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.PAGE_ID);
        }
        return Mono.just(action);
    }

    protected void setGitSyncIdInNewAction(NewAction newAction) {
        if (newAction.getGitSyncId() == null) {
            newAction.setGitSyncId(newAction.getApplicationId() + "_" + UUID.randomUUID());
        }
    }

    /**
     * This function extracts all the mustache template keys (as per the regex) and returns them to the calling fxn
     * This set of keys is stored separately in the field `jsonPathKeys` in the action object. The client
     * uses the set `jsonPathKeys` to simplify it's value substitution.
     *
     * @param actionDTO
     * @return
     */
    private Set<MustacheBindingToken> extractKeysFromAction(ActionDTO actionDTO) {
        if (actionDTO == null) {
            return new HashSet<>();
        }

        ActionConfiguration actionConfiguration = actionDTO.getActionConfiguration();
        if (actionConfiguration == null) {
            return new HashSet<>();
        }

        Set<MustacheBindingToken> keys = MustacheHelper.extractMustacheKeysFromFields(actionConfiguration);

        // Add JS function body to jsonPathKeys field.
        if (PluginType.JS.equals(actionDTO.getPluginType()) && actionConfiguration.getBody() != null) {
            keys.add(new MustacheBindingToken(actionConfiguration.getBody(), 0, false));

            // Since this is a JS function, we should also set the dynamic binding path list if absent
            List<Property> dynamicBindingPathList = actionDTO.getDynamicBindingPathList();
            if (CollectionUtils.isEmpty(dynamicBindingPathList)) {
                dynamicBindingPathList = new ArrayList<>();
                // Add a key static the key `body` contains JS
                dynamicBindingPathList.add(new Property("body", null));
                actionDTO.setDynamicBindingPathList(dynamicBindingPathList);
            }
        }

        return keys;
    }

    /**
     * This function extracts the mustache keys and sets them in the field jsonPathKeys in the action object
     *
     * @param newAction
     * @return
     */
    @Override
    public Mono<NewAction> extractAndSetJsonPathKeys(NewAction newAction) {
        ActionDTO action = newAction.getUnpublishedAction();

        // The execute action payload consists of the parameter map which has the required key-value pair being
        // consumed on backend in binding process. These parameter maps are filled via
        // action's JsonPathKeys attribute which holds the reference to client side objects e.g. : "input1.Text", e.t.c,
        // JsonPath keys are modified when the action is updated.
        return datasourceService
                .extractKeysFromDatasource(action.getDatasource())
                .map(datasourceBindings -> {
                    Set<String> actionKeys = extractKeysFromAction(action).stream()
                            .map(token -> token.getValue())
                            .collect(Collectors.toSet());

                    Set<String> datasourceKeys = datasourceBindings.stream()
                            .map(token -> token.getValue())
                            .collect(Collectors.toSet());
                    Set<String> keys = new HashSet<>();
                    keys.addAll(actionKeys);
                    keys.addAll(datasourceKeys);

                    action.setJsonPathKeys(keys);
                    return newAction;
                });
    }

    private Mono<ActionDTO> setTransientFieldsInUnpublishedAction(NewAction newAction) {
        ActionDTO action = newAction.getUnpublishedAction();

        // In case the action is deleted in edit mode (but still exists because this action has been published before
        // drop the action and return empty
        if (action.getDeletedAt() != null) {
            return Mono.empty();
        }

        return Mono.just(action)
                .map(actionDTO -> {
                    // Added this condition to get a value for updatedAt field since createdAt will always be present
                    if (newAction.getUpdatedAt() != null) {
                        actionDTO.setUpdatedAt(newAction.getUpdatedAt());
                    } else {
                        actionDTO.setUpdatedAt(newAction.getCreatedAt());
                    }
                    newAction.setUnpublishedAction(actionDTO);
                    return newAction;
                })
                .map(action1 -> generateActionByViewMode(action1, false))
                .flatMap(this::populateHintMessages);
    }

    @Override
    public Mono<ActionDTO> updateUnpublishedAction(String id, ActionDTO action) {
        log.debug(
                "Updating unpublished action with action id: {} and id: {} ",
                action != null ? action.getId() : null,
                id);

        return updateUnpublishedActionWithoutAnalytics(id, action, actionPermission.getEditPermission())
                .zipWhen(zippedActions -> {
                    ActionDTO updatedActionDTO = zippedActions.getT1();
                    if (updatedActionDTO.getDatasource() != null
                            && updatedActionDTO.getDatasource().getId() != null) {
                        return datasourceService.findById(
                                updatedActionDTO.getDatasource().getId());
                    } else {
                        return Mono.justOrEmpty(updatedActionDTO.getDatasource());
                    }
                })
                .flatMap(zippedData -> {
                    final Tuple2<ActionDTO, NewAction> zippedActions = zippedData.getT1();
                    final Datasource datasource = zippedData.getT2();
                    final NewAction newAction1 = zippedActions.getT2();

                    // This is being done in order to avoid any usage of datasource storages in client side.
                    // the ideas is that datasourceStorages shouldn't be used for action's datasource configuration.
                    final ActionDTO savedActionDTO = zippedActions.getT1();
                    if (savedActionDTO.getDatasource() != null) {
                        savedActionDTO.getDatasource().setDatasourceStorages(null);
                    }

                    final Map<String, Object> data = this.getAnalyticsProperties(newAction1, datasource);

                    final Map<String, Object> eventData =
                            Map.of(FieldName.APP_MODE, ApplicationMode.EDIT.toString(), FieldName.ACTION, newAction1);
                    data.put(FieldName.EVENT_DATA, eventData);

                    return analyticsService.sendUpdateEvent(newAction1, data).thenReturn(savedActionDTO);
                });
    }

    /**
     * Updates an unpublished action in the database without sending an analytics event.
     * <p>
     * This method performs an update of an unpublished action in the database without triggering an analytics event.
     *
     * @param id         The unique identifier of the unpublished action to be updated.
     * @param action     The updated action object.
     * @param permission An optional permission parameter for access control.
     * @return A Mono emitting a Tuple containing the updated ActionDTO and NewAction after modification.
     * @throws AppsmithException if the provided ID is invalid or if the action is not found.
     * @implNote This method is used by {#updateUnpublishedAction(String, ActionDTO)}, but it does not send an analytics event. If analytics event tracking is not required for the update, this method can be used to improve performance and reduce overhead.
     */
    @Override
    public Mono<Tuple2<ActionDTO, NewAction>> updateUnpublishedActionWithoutAnalytics(
            String id, ActionDTO action, AclPermission permission) {
        log.debug(
                "Updating unpublished action without analytics with action id: {} ",
                action != null ? action.getId() : null);
        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }

        // The client does not know about this field. Hence, the default value takes over. Set this to null to ensure
        // the update doesn't lead to resetting of this field.
        action.setUserSetOnLoad(null);

        Mono<NewAction> updatedActionMono = repository
                .findById(id, permission)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ACTION, id)))
                .map(dbAction -> {
                    final ActionDTO unpublishedAction = dbAction.getUnpublishedAction();
                    copyNestedNonNullProperties(action, unpublishedAction);
                    return dbAction;
                })
                .flatMap(newAction -> this.extractAndSetNativeQueryFromFormData(newAction));

        return updatedActionMono.flatMap(savedNewAction ->
                this.validateAndSaveActionToRepository(savedNewAction).zipWith(Mono.just(savedNewAction)));
    }

    private Mono<NewAction> extractAndSetNativeQueryFromFormData(NewAction action) {
        Mono<Plugin> pluginMono = pluginService.getByIdWithoutPermissionCheck(action.getPluginId());
        Mono<PluginExecutor> pluginExecutorMono = pluginExecutorHelper.getPluginExecutor(pluginMono);

        return pluginExecutorMono
                .flatMap(pluginExecutor -> {
                    pluginExecutor.extractAndSetNativeQueryFromFormData(
                            action.getUnpublishedAction().getActionConfiguration());

                    return Mono.just(action);
                })
                .onErrorResume(e -> {
                    /**
                     * In the event of any failure, it does not make sense to stop the flow since this error is not
                     * caused by user input, and it does not impact the execution of the action in any way. This
                     * method is part of the action configuration persistence flow and hence
                     * users are free to persist any data in the action configuration as they see fit. At best, a
                     * failure here would only cause a minor inconvenience to a beginner user since the form data would
                     * not be auto translated to the raw query.
                     */
                    Map<String, Object> formData = action.getUnpublishedAction()
                            .getActionConfiguration()
                            .getFormData();
                    setValueSafelyInFormData(formData, NATIVE_QUERY_PATH_STATUS, ERROR);
                    setValueSafelyInFormData(formData, NATIVE_QUERY_PATH_DATA, e.getMessage());
                    return Mono.just(action);
                });
    }

    @Override
    public Mono<ActionDTO> findByUnpublishedNameAndPageId(String name, String pageId, AclPermission permission) {
        return repository
                .findByUnpublishedNameAndPageId(name, pageId, permission)
                .map(action -> generateActionByViewMode(action, false));
    }

    @Override
    public Mono<ActionDTO> findActionDTObyIdAndViewMode(String id, Boolean viewMode, AclPermission permission) {
        return this.findById(id, permission).map(action -> generateActionByViewMode(action, viewMode));
    }

    @Override
    public Flux<NewAction> findUnpublishedOnLoadActionsExplicitSetByUserInPage(String pageId) {
        return repository
                .findUnpublishedActionsByPageIdAndExecuteOnLoadSetByUserTrue(
                        pageId, actionPermission.getEditPermission())
                .flatMap(this::sanitizeAction);
    }

    @Override
    public Mono<NewAction> findById(String id) {
        return repository.findById(id).flatMap(this::sanitizeAction);
    }

    @Override
    public Flux<NewAction> findAllById(Iterable<String> id) {
        return repository.findAllByIdIn(id).flatMap(this::sanitizeAction);
    }

    @Override
    public Mono<NewAction> findById(String id, AclPermission aclPermission) {
        return repository.findById(id, aclPermission).flatMap(this::sanitizeAction);
    }

    @Override
    public Flux<NewAction> findByPageId(String pageId, AclPermission permission) {
        return repository.findByPageId(pageId, permission).flatMap(this::sanitizeAction);
    }

    @Override
    public Flux<NewAction> findByPageId(String pageId, Optional<AclPermission> permission) {
        return repository.findByPageId(pageId, permission).flatMap(this::sanitizeAction);
    }

    @Override
    public Flux<NewAction> findByPageIdAndViewMode(String pageId, Boolean viewMode, AclPermission permission) {
        return repository.findByPageIdAndViewMode(pageId, viewMode, permission).flatMap(this::sanitizeAction);
    }

    @Override
    public Flux<NewAction> findAllByApplicationIdAndViewMode(
            String applicationId, Boolean viewMode, AclPermission permission, Sort sort) {
        return repository
                .findByApplicationId(applicationId, permission, sort)
                // In case of view mode being true, filter out all the actions which haven't been published
                .flatMap(action -> this.filterAction(action, viewMode))
                .flatMap(this::sanitizeAction);
    }

    @Override
    public Flux<NewAction> findAllByApplicationIdAndViewMode(
            String applicationId, Boolean viewMode, Optional<AclPermission> permission, Optional<Sort> sort) {
        return repository
                .findByApplicationId(applicationId, permission, sort)
                // In case of view mode being true, filter out all the actions which haven't been published
                .flatMap(action -> {
                    if (Boolean.TRUE.equals(viewMode)) {
                        // In case we are trying to fetch published actions but this action has not been published, do
                        // not return
                        if (action.getPublishedAction() == null) {
                            return Mono.empty();
                        }
                    }
                    // No need to handle the edge case of unpublished action not being present. This is not possible
                    // because
                    // every created action starts from an unpublishedAction state.

                    return Mono.just(action);
                })
                .collectList()
                .flatMapMany(this::addMissingPluginDetailsIntoAllActions);
    }

    public Flux<ActionViewDTO> getActionsForViewMode(String applicationId) {

        if (applicationId == null || applicationId.isEmpty()) {
            return Flux.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.PAGE_ID));
        }

        List<String> excludedPluginTypes = List.of(PluginType.JS.toString());

        // fetch the published actions by appId
        // No need to sort the results
        return repository
                .findPublishedActionsByAppIdAndExcludedPluginType(
                        applicationId, excludedPluginTypes, actionPermission.getExecutePermission(), null)
                .name(VIEW_MODE_FETCH_ACTIONS_FROM_DB)
                .tap(Micrometer.observation(observationRegistry))
                .map(action -> generateActionViewDTO(action, action.getPublishedAction(), true));
    }

    @Override
    public Flux<ActionViewDTO> getActionsForViewModeByPageId(String pageId) {

        if (pageId == null || pageId.isEmpty()) {
            return Flux.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.PAGE_ID));
        }

        List<String> excludedPluginTypes = List.of(PluginType.JS.toString());

        // fetch the published actions by pageId
        // No need to sort the results
        return repository
                .findPublishedActionsByPageIdAndExcludedPluginType(
                        pageId, excludedPluginTypes, actionPermission.getExecutePermission(), null)
                .name(VIEW_MODE_FETCH_ACTIONS_FROM_DB)
                .tap(Micrometer.observation(observationRegistry))
                .map(action -> generateActionViewDTO(action, action.getPublishedAction(), true));
    }

    @Override
    public ActionViewDTO generateActionViewDTO(NewAction action, ActionDTO actionDTO, boolean viewMode) {
        ActionViewDTO actionViewDTO = new ActionViewDTO();
        actionViewDTO.setId(action.getId());
        actionViewDTO.setBaseId(action.getBaseIdOrFallback());
        actionViewDTO.setName(actionDTO.getValidName());
        actionViewDTO.setPageId(actionDTO.getPageId());
        actionViewDTO.setConfirmBeforeExecute(actionDTO.getConfirmBeforeExecute());

        if (actionDTO.getJsonPathKeys() != null && !actionDTO.getJsonPathKeys().isEmpty()) {
            Set<String> jsonPathKeys;
            jsonPathKeys = new HashSet<>();
            jsonPathKeys.addAll(actionDTO.getJsonPathKeys());
            actionViewDTO.setJsonPathKeys(jsonPathKeys);
        }
        if (actionDTO.getActionConfiguration() != null) {
            actionViewDTO.setTimeoutInMillisecond(
                    actionDTO.getActionConfiguration().getTimeoutInMillisecond());
        }
        return actionViewDTO;
    }

    @Override
    public Mono<ActionDTO> deleteUnpublishedAction(String id) {
        return actionPermission.getDeletePermission().flatMap(permission -> deleteUnpublishedAction(id, permission));
    }

    @Override
    public Mono<ActionDTO> deleteUnpublishedAction(String id, AclPermission newActionDeletePermission) {
        Mono<NewAction> actionMono = repository
                .findById(id, newActionDeletePermission)
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ACTION, id)));
        return actionMono.flatMap(this::deleteGivenNewAction);
    }

    @Override
    public Mono<ActionDTO> deleteGivenNewAction(NewAction toDelete) {
        Mono<NewAction> newActionMono;

        // Using the name field to determine if the action was ever published. In case of never published
        // action, publishedAction would exist with empty datasource and default fields.
        if (toDelete.getPublishedAction() != null
                && toDelete.getPublishedAction().getName() != null) {
            toDelete.getUnpublishedAction().setDeletedAt(Instant.now());
            newActionMono = repository
                    .save(toDelete)
                    .zipWith(Mono.defer(() -> {
                        final ActionDTO action = toDelete.getUnpublishedAction();
                        if (action.getDatasource() != null
                                && action.getDatasource().getId() != null) {
                            return datasourceService.findById(
                                    action.getDatasource().getId());
                        } else {
                            return Mono.justOrEmpty(action.getDatasource());
                        }
                    }))
                    .flatMap(zippedActions -> {
                        final Datasource datasource = zippedActions.getT2();
                        final NewAction newAction1 = zippedActions.getT1();
                        final Map<String, Object> data = this.getAnalyticsProperties(newAction1, datasource);
                        final Map<String, Object> eventData = Map.of(
                                FieldName.APP_MODE, ApplicationMode.EDIT.toString(), FieldName.ACTION, newAction1);
                        data.put(FieldName.EVENT_DATA, eventData);

                        return analyticsService
                                .sendArchiveEvent(newAction1, data)
                                .thenReturn(zippedActions.getT1());
                    })
                    .thenReturn(toDelete);
        } else {
            // This action was never published. This document can be safely archived
            newActionMono = archiveGivenNewAction(toDelete);
        }

        return newActionMono.map(updatedAction -> generateActionByViewMode(updatedAction, false));
    }

    /*
     * - Any hint message specific to action configuration can be handled here.
     */
    public Mono<ActionDTO> populateHintMessages(ActionDTO action) {
        /*
         * - No need for this null check: action == null. By the time the code flow reaches here, action is
         *   guaranteed to be non-null.
         */

        /**
         * ImportExportApplicationServiceTests.java seem to have TCs that introduce actionDTOs with datasource or
         * pluginId being null. Hence, need adding a check here. I am not sure at this point if that is a scenario
         * that can be expected in production.
         * TBD: need to confirm if this check is actually required or if an error should be returned from here.
         */
        if (action.getDatasource() == null || action.getDatasource().getPluginId() == null) {
            return Mono.just(action);
        }

        Mono<Plugin> pluginMono = pluginService.findById(action.getDatasource().getPluginId());
        Mono<PluginExecutor> pluginExecutorMono = pluginExecutorHelper.getPluginExecutor(pluginMono);

        Mono<DatasourceConfiguration> dsConfigMono;
        if (action.getDatasource().getDatasourceConfiguration() != null) {
            dsConfigMono = Mono.just(action.getDatasource().getDatasourceConfiguration());
        } else if (action.getDatasource().getId() != null) {
            dsConfigMono = datasourceService
                    .findById(action.getDatasource().getId())
                    .flatMap(datasource -> {
                        if (datasource.getDatasourceConfiguration() == null) {
                            return Mono.just(new DatasourceConfiguration());
                        }

                        return Mono.just(datasource.getDatasourceConfiguration());
                    })
                    .switchIfEmpty(Mono.error(new AppsmithException(
                            AppsmithError.NO_RESOURCE_FOUND,
                            FieldName.DATASOURCE,
                            action.getDatasource().getId())));
        } else {
            dsConfigMono = Mono.just(new DatasourceConfiguration());
        }

        return Mono.zip(pluginExecutorMono, dsConfigMono)
                .flatMap(tuple -> {
                    PluginExecutor pluginExecutor = tuple.getT1();
                    DatasourceConfiguration dsConfig = tuple.getT2();

                    /**
                     * Delegate the task of generating hint messages to the concerned plugin, since only the
                     * concerned plugin can correctly interpret their configuration.
                     */
                    return pluginExecutor.getHintMessages(action.getActionConfiguration(), dsConfig);
                })
                .flatMap(tuple -> {
                    Set datasourceHintMessages = ((Tuple2<Set, Set>) tuple).getT1();
                    action.getDatasource().getMessages().addAll(datasourceHintMessages);

                    Set actionHintMessages = ((Tuple2<Set, Set>) tuple).getT2();
                    action.getMessages().addAll(actionHintMessages);

                    return Mono.just(action);
                });
    }

    @Override
    public Flux<ActionDTO> getUnpublishedActions(MultiValueMap<String, String> params, Boolean includeJsActions) {
        return getUnpublishedActionsFromRepo(params, includeJsActions)
                .collectList()
                .flatMapMany(this::addMissingPluginDetailsIntoAllActions)
                .flatMap(this::setTransientFieldsInUnpublishedAction)
                // this generates four different tags, (ApplicationId, FieldId) *(True, False)
                .tag(
                        "includeJsAction",
                        (params.get(FieldName.APPLICATION_ID) == null ? FieldName.PAGE_ID : FieldName.APPLICATION_ID)
                                + includeJsActions.toString())
                .name(GET_ACTION_REPOSITORY_CALL)
                .tap(Micrometer.observation(observationRegistry));
    }

    protected Flux<NewAction> getUnpublishedActionsFromRepo(
            MultiValueMap<String, String> params, Boolean includeJsActions) {
        String name = null;
        List<String> pageIds = new ArrayList<>();

        // In the edit mode, the actions should be displayed in the order they were created.
        Sort sort = Sort.by(FieldName.CREATED_AT);

        if (params.getFirst(FieldName.NAME) != null) {
            name = params.getFirst(FieldName.NAME);
        }

        if (params.getFirst(FieldName.PAGE_ID) != null) {
            pageIds.add(params.getFirst(FieldName.PAGE_ID));
        }

        Flux<NewAction> actionsFromRepository;

        if (params.getFirst(FieldName.APPLICATION_ID) != null) {
            // Fetch unpublished pages because GET actions is only called during edit mode. For view mode, different
            // function call is made which takes care of returning only the essential fields of an action

            if (FALSE.equals(includeJsActions)) {
                actionsFromRepository = repository.findNonJsActionsByApplicationIdAndViewMode(
                        params.getFirst(FieldName.APPLICATION_ID), false, actionPermission.getReadPermission());

            } else {
                actionsFromRepository = repository.findByApplicationIdAndViewMode(
                        params.getFirst(FieldName.APPLICATION_ID), false, actionPermission.getReadPermission());
            }

        } else {

            if (FALSE.equals(includeJsActions)) {
                actionsFromRepository = repository.findAllNonJsActionsByNameAndPageIdsAndViewMode(
                        name, pageIds, false, actionPermission.getReadPermission(), sort);
            } else {
                actionsFromRepository = repository.findAllActionsByNameAndPageIdsAndViewMode(
                        name, pageIds, false, actionPermission.getReadPermission(), sort);
            }
        }

        return actionsFromRepository;
    }

    @Override
    public Flux<ActionDTO> getUnpublishedActions(
            MultiValueMap<String, String> params, RefType refType, String refName, Boolean includeJsActions) {

        MultiValueMap<String, String> updatedParams = new LinkedMultiValueMap<>(params);
        // Get branched applicationId and pageId
        Mono<NewPage> branchedPageMono = !StringUtils.hasLength(params.getFirst(FieldName.PAGE_ID))
                ? Mono.just(new NewPage())
                : newPageService.findByRefTypeAndRefNameAndBasePageId(
                        refType, refName, params.getFirst(FieldName.PAGE_ID), pagePermission.getReadPermission(), null);
        Mono<Application> branchedApplicationMono = !StringUtils.hasLength(params.getFirst(FieldName.APPLICATION_ID))
                ? Mono.just(new Application())
                : applicationService.findByBranchNameAndBaseApplicationId(
                        refName, params.getFirst(FieldName.APPLICATION_ID), applicationPermission.getReadPermission());

        return Mono.zip(branchedApplicationMono, branchedPageMono).flatMapMany(tuple -> {
            String applicationId = tuple.getT1().getId();
            String pageId = tuple.getT2().getId();
            if (!CollectionUtils.isEmpty(params.get(FieldName.PAGE_ID)) && StringUtils.hasLength(pageId)) {
                updatedParams.set(FieldName.PAGE_ID, pageId);
            }
            if (!CollectionUtils.isEmpty(params.get(FieldName.APPLICATION_ID))
                    && StringUtils.hasLength(applicationId)) {
                updatedParams.set(FieldName.APPLICATION_ID, applicationId);
            }
            return getUnpublishedActions(updatedParams, includeJsActions);
        });
    }

    @Override
    public Flux<ActionDTO> getUnpublishedActions(MultiValueMap<String, String> params) {
        return getUnpublishedActions(params, TRUE);
    }

    @Override
    public Flux<ActionDTO> getUnpublishedActionsByPageId(String pageId, AclPermission permission) {
        return this.repository
                .findByPageIdAndViewMode(pageId, false, permission)
                .collectList()
                .flatMapMany(this::addMissingPluginDetailsIntoAllActions)
                .flatMap(this::setTransientFieldsInUnpublishedAction);
    }

    @Override
    public Flux<ActionDTO> getUnpublishedActions(
            MultiValueMap<String, String> params, RefType refType, String refName) {
        return getUnpublishedActions(params, refType, refName, TRUE);
    }

    @Override
    public Flux<ActionDTO> getUnpublishedActionsExceptJs(MultiValueMap<String, String> params) {
        return this.getUnpublishedActions(params, FALSE)
                .filter(actionDTO -> !PluginType.JS.equals(actionDTO.getPluginType()));
    }

    /**
     * This method is meant to be used to check for any missing or bad values in NewAction object and attempt to fix it.
     * <p>
     * This method is added in response to certain cases where it was found that pluginId and pluginType keys
     * were missing from the NewAction object in the database.Since it is currently not know what exactly causes
     * these values to go missing, this check will serve as a workaround by fetching and setting pluginId and
     * pluginType using the datasource object contained in the ActionDTO object.
     * Ref: https://github.com/appsmithorg/appsmith/issues/11927
     */
    public Mono<NewAction> sanitizeAction(NewAction action) {
        Mono<NewAction> actionMono = Mono.just(action);
        if (isPluginTypeOrPluginIdMissing(action)) {
            log.debug(
                    "Sanitizing the action for missing plugin type or plugin Id with action id: {} ",
                    action != null ? action.getId() : null);
            actionMono = providePluginTypeAndIdToNewActionObjectUsingJSTypeOrDatasource(action);
        }

        return actionMono;
    }

    public Mono<NewAction> filterAction(NewAction action, Boolean viewMode) {
        if (Boolean.TRUE.equals(viewMode)) {
            // In case we are trying to fetch published actions but this action has not been published, do
            // not return
            if (action.getPublishedAction() == null) {
                return Mono.empty();
            }
        }
        // No need to handle the edge case of unpublished action not being present. This is not possible
        // because every created action starts from an unpublishedAction state.

        return Mono.just(action);
    }

    public Flux<NewAction> addMissingPluginDetailsIntoAllActions(List<NewAction> actionList) {

        Mono<Map<String, Plugin>> pluginMapMono = Mono.just(defaultPluginMap);

        /* This conditional would be false once per pod per restart, as soon as first request goes through
        the default plugin map will have all the plugins and subsequent requests might not require to fetch again.
         */

        if (CollectionUtils.isEmpty(defaultPluginMap)) {
            pluginMapMono = pluginService
                    .getDefaultPlugins()
                    .collectMap(Plugin::getId)
                    .map(pluginMap -> {
                        pluginMap.forEach((pluginId, plugin) -> {
                            defaultPluginMap.put(pluginId, plugin);
                            if (JS_PLUGIN_PACKAGE_NAME.equals(plugin.getPackageName())) {
                                jsTypePluginReference.set(plugin);
                            }
                        });
                        return pluginMap;
                    });
        }

        return pluginMapMono.thenMany(Flux.fromIterable(actionList)).flatMap(action -> {
            if (!isPluginTypeOrPluginIdMissing(action)) {
                return Mono.just(action);
            }
            return addMissingPluginDetailsToNewActionObjects(action);
        });
    }

    private Mono<NewAction> addMissingPluginDetailsToNewActionObjects(NewAction action) {
        ActionDTO actionDTO = action.getUnpublishedAction();
        if (actionDTO == null) {
            return Mono.just(action);
        }

        Datasource datasource = actionDTO.getDatasource();
        if (actionDTO.getCollectionId() != null) {
            action.setPluginType(JS_PLUGIN_TYPE);
            action.setPluginId(jsTypePluginReference.get().getId());
            return Mono.just(action);

        } else if (datasource != null && datasource.getPluginId() != null) {
            String pluginId = datasource.getPluginId();
            action.setPluginId(pluginId);

            if (defaultPluginMap.containsKey(pluginId)) {
                Plugin plugin = defaultPluginMap.get(pluginId);
                action.setPluginType(plugin.getType());
            } else {
                setPluginTypeFromId(action, pluginId);
            }
        }

        return Mono.just(action);
    }

    @Override
    public Mono<ActionDTO> fillSelfReferencingDataPaths(ActionDTO actionDTO) {
        Mono<Plugin> pluginMono = pluginService.getByIdWithoutPermissionCheck(actionDTO.getPluginId());
        Mono<PluginExecutor> pluginExecutorMono = pluginExecutorHelper.getPluginExecutor(pluginMono);

        return pluginExecutorMono.map(pluginExecutor -> {
            if (actionDTO.getActionConfiguration() != null) {
                actionDTO
                        .getActionConfiguration()
                        .setSelfReferencingDataPaths(pluginExecutor.getSelfReferencingDataPaths());
            }
            return actionDTO;
        });
    }

    private boolean isPluginTypeOrPluginIdMissing(NewAction action) {
        return action.getPluginId() == null || action.getPluginType() == null;
    }

    private Mono<NewAction> providePluginTypeAndIdToNewActionObjectUsingJSTypeOrDatasource(NewAction action) {
        ActionDTO actionDTO = action.getUnpublishedAction();
        if (actionDTO == null) {
            return Mono.just(action);
        }

        /**
         * if path:
         * In case an action object is related to a JS Object then it must have a non-null collectionId.
         *
         * else path:
         * Otherwise, check if the datasource object has the pluginId. If so, use this pluginId to fetch the correct
         * pluginType.
         */
        Datasource datasource = actionDTO.getDatasource();
        if (actionDTO.getCollectionId() != null) {
            return setPluginIdAndTypeForJSAction(action)
                    .name(VIEW_MODE_SET_PLUGIN_ID_AND_TYPE_JS)
                    .tap(Micrometer.observation(observationRegistry));
        } else if (datasource != null && datasource.getPluginId() != null) {
            String pluginId = datasource.getPluginId();
            action.setPluginId(pluginId);

            return setPluginTypeFromId(action, pluginId)
                    .name(VIEW_MODE_SET_PLUGIN_ID_AND_TYPE_ACTION)
                    .tap(Micrometer.observation(observationRegistry));
        }

        return Mono.just(action);
    }

    private Mono<NewAction> setPluginTypeFromId(NewAction action, String pluginId) {
        return pluginService
                .findById(pluginId)
                .name(VIEW_MODE_FETCH_PLUGIN_FROM_DB)
                .tap(Micrometer.observation(observationRegistry))
                .flatMap(plugin -> {
                    action.setPluginType(plugin.getType());
                    return Mono.just(action);
                });
    }

    private Mono<NewAction> setPluginIdAndTypeForJSAction(NewAction action) {
        action.setPluginType(JS_PLUGIN_TYPE);

        return pluginService
                .findByPackageName(JS_PLUGIN_PACKAGE_NAME)
                .name(VIEW_MODE_FETCH_PLUGIN_FROM_DB)
                .tap(Micrometer.observation(observationRegistry))
                .flatMap(plugin -> {
                    action.setPluginId(plugin.getId());
                    return Mono.just(action);
                });
    }

    // We can afford to make this call all the time since we already have all the info we need in context
    private Mono<DatasourceContext> getRemoteDatasourceContext(Plugin plugin, Datasource datasource) {
        final DatasourceContext datasourceContext = new DatasourceContext();

        return configService.getInstanceId().map(instanceId -> {
            ExecutePluginDTO executePluginDTO = new ExecutePluginDTO();
            executePluginDTO.setInstallationKey(instanceId);
            executePluginDTO.setPluginName(plugin.getPluginName());
            executePluginDTO.setPluginVersion(plugin.getVersion());
            executePluginDTO.setDatasource(
                    new RemoteDatasourceDTO(datasource.getId(), datasource.getDatasourceConfiguration()));
            datasourceContext.setConnection(executePluginDTO);

            return datasourceContext;
        });
    }

    @Override
    public Mono<NewAction> save(NewAction action) {
        // gitSyncId will be used to sync resource across instances
        if (action.getGitSyncId() == null) {
            setGitSyncIdInNewAction(action);
        }

        return sanitizeAction(action).flatMap(repository::save);
    }

    @Override
    public Flux<NewAction> saveAll(List<NewAction> actions) {
        actions.stream().filter(action -> action.getGitSyncId() == null).forEach(this::setGitSyncIdInNewAction);

        return Flux.fromIterable(actions)
                .flatMap(this::sanitizeAction)
                .collectList()
                .flatMapMany(repository::saveAll);
    }

    @Override
    public Flux<NewAction> findByPageId(String pageId) {
        return repository.findByPageId(pageId).flatMap(this::sanitizeAction);
    }

    private List<LayoutExecutableUpdateDTO> addActionUpdatesForActionNames(
            List<ActionDTO> pageActions, Set<String> actionNames) {

        return pageActions.stream()
                .filter(pageAction -> actionNames.contains(pageAction.getValidName()))
                .map(pageAction -> {
                    LayoutExecutableUpdateDTO layoutExecutableUpdateDTO = new LayoutExecutableUpdateDTO();
                    layoutExecutableUpdateDTO.setId(pageAction.getId());
                    layoutExecutableUpdateDTO.setName(pageAction.getValidName());
                    layoutExecutableUpdateDTO.setCollectionId(pageAction.getCollectionId());
                    layoutExecutableUpdateDTO.setExecuteOnLoad(pageAction.getExecuteOnLoad());
                    return layoutExecutableUpdateDTO;
                })
                .collect(Collectors.toList());
    }

    @Override
    public Mono<NewAction> archiveById(String id) {
        Mono<NewAction> actionMono = repository
                .findById(id)
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ACTION, id)));
        return actionMono.flatMap(this::archiveGivenNewAction);
    }

    @Override
    public Mono<NewAction> archiveGivenNewAction(NewAction toDelete) {
        return repository
                .archive(toDelete)
                .zipWith(Mono.defer(() -> {
                    final ActionDTO action = toDelete.getUnpublishedAction();
                    if (action.getDatasource() != null && action.getDatasource().getId() != null) {
                        return datasourceService.findById(action.getDatasource().getId());
                    } else {
                        return Mono.justOrEmpty(action.getDatasource());
                    }
                }))
                .flatMap(zippedActions -> {
                    final Datasource datasource = zippedActions.getT2();
                    final NewAction newAction1 = zippedActions.getT1();
                    final Map<String, Object> data = this.getAnalyticsProperties(newAction1, datasource);
                    final Map<String, Object> eventData =
                            Map.of(FieldName.APP_MODE, ApplicationMode.EDIT.toString(), FieldName.ACTION, newAction1);
                    data.put(FieldName.EVENT_DATA, eventData);

                    return analyticsService.sendDeleteEvent(newAction1, data).thenReturn(zippedActions.getT1());
                })
                .thenReturn(toDelete);
    }

    @Override
    public Mono<NewAction> archive(NewAction newAction) {
        return repository.archive(newAction);
    }

    @Override
    public Mono<List<NewAction>> archiveActionsByApplicationId(String applicationId, AclPermission permission) {
        return repository
                .findByApplicationId(applicationId, permission)
                .flatMap(repository::archive)
                .onErrorResume(throwable -> {
                    log.error(throwable.getMessage());
                    return Mono.empty();
                })
                .collectList();
    }

    private Mono<Datasource> updateDatasourcePolicyForPublicAction(NewAction action, Datasource datasource) {
        if (datasource.getId() == null) {
            // This seems to be a nested datasource. Return as is.
            return Mono.just(datasource);
        }

        String applicationId = action.getApplicationId();

        return permissionGroupService.getPublicPermissionGroup().flatMap(publicPermissionGroup -> {
            String publicPermissionGroupId = publicPermissionGroup.getId();
            // If action has EXECUTE permission for anonymous, check and assign the same to the datasource.
            boolean isPublicAction = permissionGroupService.isEntityAccessible(
                    action, actionPermission.getExecutePermission().getValue(), publicPermissionGroupId);

            if (!isPublicAction) {
                return Mono.just(datasource);
            }
            // Check if datasource has execute permission
            boolean isPublicDatasource = permissionGroupService.isEntityAccessible(
                    datasource, datasourcePermission.getExecutePermission().getValue(), publicPermissionGroupId);
            if (isPublicDatasource) {
                // Datasource has correct permission. Return as is
                return Mono.just(datasource);
            }

            // Add the permission to datasource
            return applicationService.findById(applicationId).flatMap(application -> {
                if (!application.getIsPublic()) {
                    return Mono.error(new AppsmithException(AppsmithError.PUBLIC_APP_NO_PERMISSION_GROUP));
                }

                Policy executePolicy = Policy.builder()
                        .permission(EXECUTE_DATASOURCES.getValue())
                        .permissionGroups(Set.of(publicPermissionGroupId))
                        .build();
                Map<String, Policy> datasourcePolicyMap = Map.of(EXECUTE_DATASOURCES.getValue(), executePolicy);

                Datasource updatedDatasource =
                        policySolution.addPoliciesToExistingObject(datasourcePolicyMap, datasource);

                return datasourceService.save(updatedDatasource, false);
            });
        });
    }

    private Map<String, Object> getAnalyticsProperties(NewAction savedAction, Datasource datasource) {
        final Datasource embeddedDatasource = savedAction.getUnpublishedAction().getDatasource();
        embeddedDatasource.setIsMock(datasource.getIsMock());
        embeddedDatasource.setIsTemplate(datasource.getIsTemplate());
        if (!StringUtils.hasLength(savedAction.getUnpublishedAction().getPluginName())) {
            savedAction.getUnpublishedAction().setPluginName(datasource.getPluginName());
        }
        Map<String, Object> analyticsProperties = this.getAnalyticsProperties(savedAction);
        Map<String, Object> eventData = Map.of(FieldName.DATASOURCE, datasource);
        analyticsProperties.put(FieldName.EVENT_DATA, eventData);
        return analyticsProperties;
    }

    @Override
    public Map<String, Object> getAnalyticsProperties(NewAction savedAction) {
        ActionDTO unpublishedAction = savedAction.getUnpublishedAction();
        Map<String, Object> analyticsProperties = new HashMap<>();
        analyticsProperties.put("actionName", ObjectUtils.defaultIfNull(unpublishedAction.getValidName(), ""));
        analyticsProperties.put("applicationId", ObjectUtils.defaultIfNull(savedAction.getApplicationId(), ""));
        analyticsProperties.put("pageId", ObjectUtils.defaultIfNull(unpublishedAction.getPageId(), ""));
        analyticsProperties.put("workspaceId", ObjectUtils.defaultIfNull(savedAction.getWorkspaceId(), ""));
        analyticsProperties.put("pluginId", ObjectUtils.defaultIfNull(savedAction.getPluginId(), ""));
        analyticsProperties.put("pluginType", ObjectUtils.defaultIfNull(savedAction.getPluginType(), ""));
        analyticsProperties.put("pluginName", ObjectUtils.defaultIfNull(unpublishedAction.getPluginName(), ""));
        if (unpublishedAction.getDatasource() != null) {
            analyticsProperties.put(
                    "dsId",
                    ObjectUtils.defaultIfNull(unpublishedAction.getDatasource().getId(), ""));
            analyticsProperties.put(
                    "dsName",
                    ObjectUtils.defaultIfNull(unpublishedAction.getDatasource().getName(), ""));
            analyticsProperties.put(
                    "dsIsTemplate",
                    ObjectUtils.defaultIfNull(unpublishedAction.getDatasource().getIsTemplate(), ""));
            analyticsProperties.put(
                    "dsIsMock",
                    ObjectUtils.defaultIfNull(unpublishedAction.getDatasource().getIsMock(), ""));
        }

        analyticsProperties.put("source", ObjectUtils.defaultIfNull(unpublishedAction.getSource(), null));
        return analyticsProperties;
    }

    @Override
    public Mono<ImportedActionAndCollectionMapsDTO> updateActionsWithImportedCollectionIds(
            ImportActionCollectionResultDTO importActionCollectionResultDTO,
            ImportActionResultDTO importActionResultDTO) {

        ImportedActionAndCollectionMapsDTO mapsDTO = new ImportedActionAndCollectionMapsDTO();
        final HashSet<String> actionIds = new HashSet<>();

        for (Map.Entry<String, ActionCollection> entry :
                importActionCollectionResultDTO.getSavedActionCollectionMap().entrySet()) {
            String importedActionCollectionId = entry.getKey();
            ActionCollection savedActionCollection = entry.getValue();
            final String savedActionCollectionId = savedActionCollection.getId();

            importActionResultDTO
                    .getUnpublishedCollectionIdToActionIdsMap()
                    .getOrDefault(importedActionCollectionId, Map.of())
                    .forEach((defaultActionId, actionId) -> {
                        mapsDTO.getUnpublishedActionIdToCollectionIdMap()
                                .putIfAbsent(actionId, savedActionCollectionId);
                    });

            importActionResultDTO
                    .getPublishedCollectionIdToActionIdsMap()
                    .getOrDefault(importedActionCollectionId, Map.of())
                    .forEach((defaultActionId, actionId) -> {
                        mapsDTO.getPublishedActionIdToCollectionIdMap().putIfAbsent(actionId, savedActionCollectionId);
                    });

            actionIds.addAll(mapsDTO.getUnpublishedActionIdToCollectionIdMap().keySet());
            actionIds.addAll(mapsDTO.getPublishedActionIdToCollectionIdMap().keySet());
        }

        return repository
                .findAllByIdIn(actionIds)
                .map(newAction -> {
                    // Update collectionId and defaultCollectionIds in actionDTOs
                    ActionDTO unpublishedAction = newAction.getUnpublishedAction();
                    ActionDTO publishedAction = newAction.getPublishedAction();

                    if (!CollectionUtils.isEmpty(mapsDTO.getUnpublishedActionIdToCollectionIdMap())
                            && mapsDTO.getUnpublishedActionIdToCollectionIdMap().containsKey(newAction.getId())) {

                        unpublishedAction.setCollectionId(mapsDTO.getUnpublishedActionIdToCollectionIdMap()
                                .get(newAction.getId()));
                    }
                    if (!CollectionUtils.isEmpty(mapsDTO.getPublishedActionIdToCollectionIdMap())
                            && mapsDTO.getPublishedActionIdToCollectionIdMap().containsKey(newAction.getId())) {

                        publishedAction.setCollectionId(
                                mapsDTO.getPublishedActionIdToCollectionIdMap().get(newAction.getId()));
                    }
                    return newAction;
                })
                .collectList()
                .flatMap(actions -> repository.bulkUpdate(actions))
                .thenReturn(mapsDTO);
    }

    /**
     * This method is used to publish actions of an application. It does two things:
     * 1. it deletes actions which are deleted from the edit mode.
     * 2. It updates actions in bulk by setting publishedAction=unpublishedAction
     *
     * @param applicationId
     * @param permission
     * @return
     */
    @Override
    public Mono<Void> publishActions(String applicationId, AclPermission permission) {
        // delete the actions that were deleted in edit mode
        return repository
                .archiveDeletedUnpublishedActions(applicationId, permission)
                // copy the unpublished action dto to published action dto
                .then(repository.publishActions(applicationId, permission));
    }

    @Override
    public Flux<PluginTypeAndCountDTO> countActionsByPluginType(String applicationId) {
        return repository.countActionsByPluginType(applicationId);
    }

    @Override
    public Flux<NewAction> findByPageIdsForExport(
            List<String> unpublishedPages, Optional<AclPermission> optionalPermission) {
        return repository.findByPageIds(unpublishedPages, optionalPermission).doOnNext(newAction -> {
            this.setCommonFieldsFromNewActionIntoAction(newAction, newAction.getUnpublishedAction());
            this.setCommonFieldsFromNewActionIntoAction(newAction, newAction.getPublishedAction());
        });
    }

    @Override
    public Flux<NewAction> findAllActionsByContextIdAndContextTypeAndViewMode(
            String contextId,
            CreatorContextType contextType,
            AclPermission permission,
            boolean viewMode,
            boolean includeJs) {
        if (viewMode) {
            return repository.findAllPublishedActionsByContextIdAndContextType(
                    contextId, contextType, permission, includeJs);
        }
        return repository.findAllUnpublishedActionsByContextIdAndContextType(
                contextId, contextType, permission, includeJs);
    }

    @Override
    public NewAction generateActionDomain(ActionDTO action) {
        if (action.getId() != null) {
            throw new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID);
        }

        if (action.getName() == null || action.getName().isBlank()) {
            throw new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.NAME);
        }

        NewAction newAction = new NewAction();
        newAction.setPublishedAction(new ActionDTO());
        newAction.getPublishedAction().setDatasource(new Datasource());

        return newAction;
    }

    @Override
    public Mono<Void> saveLastEditInformationInParent(ActionDTO actionDTO) {
        // Do nothing as this is already taken care for actions in the context of page
        return Mono.empty().then();
    }

    @Override
    public Flux<NewAction> findByCollectionIdAndViewMode(
            String collectionId, boolean viewMode, AclPermission aclPermission) {
        return repository.findAllByCollectionIds(List.of(collectionId), viewMode, aclPermission);
    }
}
