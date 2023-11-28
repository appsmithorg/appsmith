package com.appsmith.server.newactions.base;

import com.appsmith.external.dtos.ExecutePluginDTO;
import com.appsmith.external.dtos.RemoteDatasourceDTO;
import com.appsmith.external.helpers.MustacheHelper;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.ActionProvider;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.Executable;
import com.appsmith.external.models.MustacheBindingToken;
import com.appsmith.external.models.PluginType;
import com.appsmith.external.models.Policy;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.Provider;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.DatasourceContext;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Page;
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
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.BaseService;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.MarketplaceService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.PagePermission;
import com.appsmith.server.solutions.PolicySolution;
import com.mongodb.bulk.BulkWriteResult;
import io.micrometer.observation.ObservationRegistry;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.ObjectUtils;
import org.bson.types.ObjectId;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.util.CollectionUtils;
import org.springframework.util.LinkedCaseInsensitiveMap;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import reactor.core.observability.micrometer.Micrometer;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.util.function.Tuple2;

import javax.lang.model.SourceVersion;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.appsmith.external.constants.spans.ActionSpan.GET_ACTION_REPOSITORY_CALL;
import static com.appsmith.external.constants.spans.ActionSpan.GET_UNPUBLISHED_ACTION;
import static com.appsmith.external.constants.spans.ActionSpan.GET_VIEW_MODE_ACTION;
import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNewFieldValuesIntoOldObject;
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
    private final MarketplaceService marketplaceService;
    private final PolicyGenerator policyGenerator;
    private final NewPageService newPageService;
    private final ApplicationService applicationService;
    private final PolicySolution policySolution;
    private final ConfigService configService;
    private final ResponseUtils responseUtils;

    private final PermissionGroupService permissionGroupService;
    private final DatasourcePermission datasourcePermission;
    private final ApplicationPermission applicationPermission;
    private final PagePermission pagePermission;
    protected final ActionPermission actionPermission;

    private final ObservationRegistry observationRegistry;
    private final Map<String, Plugin> defaultPluginMap = new HashMap<>();
    private final AtomicReference<Plugin> jsTypePluginReference = new AtomicReference<>();

    public NewActionServiceCEImpl(
            Scheduler scheduler,
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
            PolicySolution policySolution,
            ConfigService configService,
            ResponseUtils responseUtils,
            PermissionGroupService permissionGroupService,
            DatasourcePermission datasourcePermission,
            ApplicationPermission applicationPermission,
            PagePermission pagePermission,
            ActionPermission actionPermission,
            ObservationRegistry observationRegistry) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.repository = repository;
        this.datasourceService = datasourceService;
        this.pluginService = pluginService;
        this.pluginExecutorHelper = pluginExecutorHelper;
        this.marketplaceService = marketplaceService;
        this.policyGenerator = policyGenerator;
        this.newPageService = newPageService;
        this.applicationService = applicationService;
        this.policySolution = policySolution;
        this.permissionGroupService = permissionGroupService;
        this.observationRegistry = observationRegistry;
        this.responseUtils = responseUtils;
        this.configService = configService;
        this.datasourcePermission = datasourcePermission;
        this.applicationPermission = applicationPermission;
        this.pagePermission = pagePermission;
        this.actionPermission = actionPermission;
    }

    @Override
    public Boolean validateActionName(String name) {
        boolean isValidName = SourceVersion.isName(name);
        String pattern = "^((?=[A-Za-z0-9_])(?![\\\\-]).)*$";
        boolean doesPatternMatch = name.matches(pattern);
        return (isValidName && doesPatternMatch);
    }

    private void setCommonFieldsFromNewActionIntoAction(NewAction newAction, ActionDTO action) {

        // Set the fields from NewAction into Action
        action.setWorkspaceId(newAction.getWorkspaceId());
        action.setApplicationId(newAction.getApplicationId());
        action.setPluginType(newAction.getPluginType());
        action.setPluginId(newAction.getPluginId());
        action.setTemplateId(newAction.getTemplateId());
        action.setProviderId(newAction.getProviderId());
        action.setDocumentation(newAction.getDocumentation());

        action.setId(newAction.getId());
        action.setUserPermissions(newAction.getUserPermissions());
        action.setPolicies(newAction.getPolicies());
        action.setCreatedAt(newAction.getCreatedAt());
    }

    @Override
    public void setCommonFieldsFromActionDTOIntoNewAction(ActionDTO action, NewAction newAction) {
        // Set the fields from NewAction into Action
        newAction.setWorkspaceId(action.getWorkspaceId());
        newAction.setPluginType(action.getPluginType());
        newAction.setPluginId(action.getPluginId());
        newAction.setTemplateId(action.getTemplateId());
        newAction.setProviderId(action.getProviderId());
        newAction.setDocumentation(action.getDocumentation());
        newAction.setApplicationId(action.getApplicationId());
    }

    @Override
    public Mono<NewAction> findByIdAndBranchName(String id, String branchName) {
        return this.findByBranchNameAndDefaultActionId(branchName, id, actionPermission.getReadPermission())
                .map(responseUtils::updateNewActionWithDefaultResources);
    }

    @Override
    public Mono<ActionDTO> generateActionByViewMode(NewAction newAction, Boolean viewMode) {
        ActionDTO action = null;

        if (TRUE.equals(viewMode)) {
            if (newAction.getPublishedAction() != null) {
                action = newAction.getPublishedAction();
            } else {
                // We are trying to fetch published action but it doesn't exist because the action hasn't been published
                // yet
                return Mono.empty();
            }
        } else {
            if (newAction.getUnpublishedAction() != null) {
                action = newAction.getUnpublishedAction();
            } else {
                return Mono.error(new AppsmithException(
                        AppsmithError.INVALID_ACTION, newAction.getId(), "No unpublished action found for edit mode"));
            }
        }

        // Set the fields from NewAction into Action
        setCommonFieldsFromNewActionIntoAction(newAction, action);

        // Update the default fields from newAction to actionDTO which includes defaultAppId and defaultActionId
        DefaultResources defaultResources = newAction.getDefaultResources();
        if (action.getDefaultResources() != null) {
            action.getDefaultResources().setActionId(defaultResources.getActionId());
            action.getDefaultResources().setApplicationId(defaultResources.getApplicationId());
        }

        return Mono.just(action);
    }

    @Override
    public void generateAndSetActionPolicies(NewPage page, NewAction action) {
        if (page == null) {
            throw new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR, "No page found to copy policies from.");
        }
        Set<Policy> documentPolicies =
                policyGenerator.getAllChildPolicies(page.getPolicies(), Page.class, Action.class);
        action.setPolicies(documentPolicies);
    }

    @Override
    public Mono<ActionDTO> validateAndSaveActionToRepository(NewAction newAction) {

        this.setGitSyncIdInNewAction(newAction);

        ActionDTO action = newAction.getUnpublishedAction();

        if (action.getDefaultResources() == null) {
            return Mono.error(
                    new AppsmithException(AppsmithError.DEFAULT_RESOURCES_UNAVAILABLE, "action", action.getName()));
        }

        // Remove default appId, branchName and actionId to avoid duplication these resources will be present in
        // NewAction level default resource
        action.getDefaultResources().setActionId(null);
        action.getDefaultResources().setBranchName(null);
        action.getDefaultResources().setApplicationId(null);

        // Default the validity to true and invalids to be an empty set.
        Set<String> invalids = new HashSet<>();

        action.setIsValid(true);

        if (action.getName() == null || action.getName().trim().isEmpty()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.NAME));
        }

        this.validateCreatorId(action);

        if (!validateActionName(action.getName())) {
            action.setIsValid(false);
            invalids.add(AppsmithError.INVALID_ACTION_NAME.getMessage());
        }

        if (action.getActionConfiguration() == null) {
            action.setIsValid(false);
            invalids.add(AppsmithError.NO_CONFIGURATION_FOUND_IN_ACTION.getMessage());
        }

        if (action.getPluginType() == PluginType.JS
                && action.getActionConfiguration() != null
                && Boolean.FALSE.equals(action.getActionConfiguration().getIsValid())) {
            action.setIsValid(false);
            invalids.add(AppsmithError.INVALID_JS_ACTION.getMessage());
        }

        // Validate actionConfiguration
        ActionConfiguration actionConfig = action.getActionConfiguration();
        if (actionConfig != null) {
            validator.validate(actionConfig).stream().forEach(x -> invalids.add(x.getMessage()));
        }

        if (action.getDatasource() == null || action.getDatasource().getIsAutoGenerated()) {
            if (action.getPluginType() != PluginType.JS) {
                // This action isn't of type JS functions which requires that the pluginType be set by the client.
                // Hence, datasource is very much required for such an action.
                action.setIsValid(false);
                invalids.add(AppsmithError.DATASOURCE_NOT_GIVEN.getMessage());
                action.setInvalids(invalids);
                return super.create(newAction)
                        .flatMap(savedAction -> {
                            // If the default action is not set then current action will be the default one
                            if (!StringUtils.hasLength(
                                    savedAction.getDefaultResources().getActionId())) {
                                savedAction.getDefaultResources().setActionId(savedAction.getId());
                            }
                            return repository.save(savedAction);
                        })
                        .flatMap(savedAction -> generateActionByViewMode(savedAction, false));
            }
        }

        Mono<Datasource> datasourceMono = Mono.just(action.getDatasource());
        if (action.getPluginType() != PluginType.JS) {
            if (action.getDatasource().getId() == null) {

                // This is a nested datasource. If the action is in bad state (aka without workspace id, add the same)
                if (action.getDatasource().getWorkspaceId() == null
                        && action.getDatasource().getOrganizationId() != null) {
                    action.getDatasource().setWorkspaceId(action.getDatasource().getOrganizationId());
                }

                datasourceMono = Mono.just(action.getDatasource()).flatMap(datasourceService::validateDatasource);
            } else {
                // TODO: check if datasource should be fetched with edit during action create or update.
                // Data source already exists. Find the same.
                datasourceMono = datasourceService
                        .findById(action.getDatasource().getId())
                        .switchIfEmpty(Mono.defer(() -> {
                            action.setIsValid(false);
                            invalids.add(AppsmithError.NO_RESOURCE_FOUND.getMessage(
                                    FieldName.DATASOURCE, action.getDatasource().getId()));
                            return Mono.just(action.getDatasource());
                        }))
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
                invalids.add(AppsmithError.NO_RESOURCE_FOUND.getMessage(FieldName.PLUGIN, datasource.getPluginId()));
                return Mono.just(new Plugin());
            }));
        });

        return pluginMono
                .zipWith(datasourceMono)
                // Set plugin in the action before saving.
                .map(tuple -> {
                    Plugin plugin = tuple.getT1();
                    Datasource datasource = tuple.getT2();
                    action.setDatasource(datasource);
                    action.setInvalids(invalids);
                    action.setPluginName(plugin.getName());
                    newAction.setUnpublishedAction(action);
                    return newAction;
                })
                .flatMap(this::sanitizeAction)
                .map(this::extractAndSetJsonPathKeys)
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
                })
                .flatMap(repository::save)
                .flatMap(savedAction -> {
                    // If the default action is not set then current action will be the default one
                    if (!StringUtils.hasLength(savedAction.getDefaultResources().getActionId())) {
                        savedAction.getDefaultResources().setActionId(savedAction.getId());
                        return repository.save(savedAction);
                    }
                    return Mono.just(savedAction);
                })
                .flatMap(repository::setUserPermissionsInObject)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.REPOSITORY_SAVE_FAILED)))
                .flatMap(this::setTransientFieldsInUnpublishedAction);
    }

    protected Mono<ActionDTO> validateCreatorId(ActionDTO action) {
        if (action.getPageId() == null || action.getPageId().isBlank()) {
            throw new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.PAGE_ID);
        }
        return Mono.just(action);
    }

    protected void setGitSyncIdInNewAction(NewAction newAction) {
        if (newAction.getGitSyncId() == null) {
            newAction.setGitSyncId(newAction.getApplicationId() + "_" + new ObjectId());
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
    public NewAction extractAndSetJsonPathKeys(NewAction newAction) {
        ActionDTO action = newAction.getUnpublishedAction();
        Set<String> actionKeys = extractKeysFromAction(action).stream()
                .map(token -> token.getValue())
                .collect(Collectors.toSet());
        Set<String> datasourceKeys = datasourceService.extractKeysFromDatasource(action.getDatasource()).stream()
                .map(token -> token.getValue())
                .collect(Collectors.toSet());
        Set<String> keys = new HashSet<>() {
            {
                addAll(actionKeys);
                addAll(datasourceKeys);
            }
        };
        action.setJsonPathKeys(keys);

        return newAction;
    }

    private Mono<ActionDTO> setTransientFieldsInUnpublishedAction(NewAction newAction) {
        ActionDTO action = newAction.getUnpublishedAction();

        // In case the action is deleted in edit mode (but still exists because this action has been published before
        // drop the action and return empty
        if (action.getDeletedAt() != null) {
            return Mono.empty();
        }

        // In case of an action which was imported from a 3P API, fill in the extra information of the provider required
        // by the front end UI.
        Mono<ActionDTO> providerUpdateMono;
        if ((action.getTemplateId() != null) && (action.getProviderId() != null)) {

            providerUpdateMono = marketplaceService
                    .getProviderById(action.getProviderId())
                    .switchIfEmpty(Mono.just(new Provider()))
                    .map(provider -> {
                        ActionProvider actionProvider = new ActionProvider();
                        actionProvider.setName(provider.getName());
                        actionProvider.setCredentialSteps(provider.getCredentialSteps());
                        actionProvider.setDescription(provider.getDescription());
                        actionProvider.setImageUrl(provider.getImageUrl());
                        actionProvider.setUrl(provider.getUrl());

                        action.setProvider(actionProvider);
                        return action;
                    });
        } else {
            providerUpdateMono = Mono.just(action);
        }

        return providerUpdateMono
                .map(actionDTO -> {
                    DefaultResources defaults = newAction.getDefaultResources();
                    if (defaults == null) {
                        throw new AppsmithException(
                                AppsmithError.DEFAULT_RESOURCES_UNAVAILABLE, "action", newAction.getId());
                    }
                    actionDTO.getDefaultResources().setActionId(defaults.getActionId());
                    actionDTO.getDefaultResources().setApplicationId(defaults.getApplicationId());
                    newAction.setUnpublishedAction(actionDTO);
                    return newAction;
                })
                .flatMap(action1 -> generateActionByViewMode(action1, false))
                .flatMap(this::populateHintMessages);
    }

    @Override
    public Mono<ActionDTO> updateUnpublishedAction(String id, ActionDTO action) {

        return updateUnpublishedActionWithoutAnalytics(id, action, Optional.of(actionPermission.getEditPermission()))
                .zipWith(Mono.defer(() -> {
                    if (action.getDatasource() != null && action.getDatasource().getId() != null) {
                        return datasourceService.findById(action.getDatasource().getId());
                    } else {
                        return Mono.justOrEmpty(action.getDatasource());
                    }
                }))
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
     *
     * This method performs an update of an unpublished action in the database without triggering an analytics event.
     *
     * @param id The unique identifier of the unpublished action to be updated.
     * @param action The updated action object.
     * @param permission An optional permission parameter for access control.
     * @return A Mono emitting a Tuple containing the updated ActionDTO and NewAction after modification.
     *
     * @throws AppsmithException if the provided ID is invalid or if the action is not found.
     *
     * @implNote
     * This method is used by {#updateUnpublishedAction(String, ActionDTO)}, but it does not send an analytics event. If analytics event tracking is not required for the update, this method can be used to improve performance and reduce overhead.
     */
    @Override
    public Mono<Tuple2<ActionDTO, NewAction>> updateUnpublishedActionWithoutAnalytics(
            String id, ActionDTO action, Optional<AclPermission> permission) {
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
                    copyNewFieldValuesIntoOldObject(action, unpublishedAction);
                    return dbAction;
                })
                .flatMap(this::extractAndSetNativeQueryFromFormData)
                .cache();

        return updatedActionMono.flatMap(savedNewAction ->
                this.validateAndSaveActionToRepository(savedNewAction).zipWith(Mono.just(savedNewAction)));
    }

    private Mono<NewAction> extractAndSetNativeQueryFromFormData(NewAction action) {
        Mono<Plugin> pluginMono = pluginService.getById(action.getPluginId());
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
                .flatMap(action -> generateActionByViewMode(action, false));
    }

    @Override
    public Mono<ActionDTO> findActionDTObyIdAndViewMode(String id, Boolean viewMode, AclPermission permission) {
        return this.findById(id, permission).flatMap(action -> generateActionByViewMode(action, viewMode));
    }

    @Override
    public Flux<NewAction> findUnpublishedOnLoadActionsExplicitSetByUserInPage(String pageId) {
        return repository
                .findUnpublishedActionsByPageIdAndExecuteOnLoadSetByUserTrue(
                        pageId, actionPermission.getEditPermission())
                .flatMap(this::sanitizeAction);
    }

    /**
     * Given a list of names of actions and pageId, find all the actions matching this criteria of names and pageId
     *
     * @param names  Set of Action names. The returned list of actions will be a subset of the actioned named in this set.
     * @param pageId Id of the Page within which to look for Actions.
     * @return A Flux of Actions that are identified to be executed on page-load.
     */
    @Override
    public Flux<NewAction> findUnpublishedActionsInPageByNames(Set<String> names, String pageId) {
        return repository
                .findUnpublishedActionsByNameInAndPageId(names, pageId, actionPermission.getEditPermission())
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

    @Override
    public Flux<ActionViewDTO> getActionsForViewMode(String defaultApplicationId, String branchName) {
        return applicationService
                .findBranchedApplicationId(branchName, defaultApplicationId, applicationPermission.getReadPermission())
                .flatMapMany(this::getActionsForViewMode)
                .map(responseUtils::updateActionViewDTOWithDefaultResources)
                .name(GET_VIEW_MODE_ACTION)
                .tap(Micrometer.observation(observationRegistry));
    }

    @Override
    public Flux<ActionViewDTO> getActionsForViewMode(String applicationId) {

        if (applicationId == null || applicationId.isEmpty()) {
            return Flux.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.APPLICATION_ID));
        }

        // fetch the published actions by applicationId
        // No need to sort the results
        return findAllByApplicationIdAndViewMode(applicationId, true, actionPermission.getExecutePermission(), null)
                .filter(newAction -> !PluginType.JS.equals(newAction.getPluginType()))
                .map(action -> generateActionViewDTO(action, action.getPublishedAction()));
    }

    @Override
    public ActionViewDTO generateActionViewDTO(NewAction action, ActionDTO actionDTO) {
        ActionViewDTO actionViewDTO = new ActionViewDTO();
        actionViewDTO.setId(action.getDefaultResources().getActionId());
        actionViewDTO.setName(actionDTO.getValidName());
        actionViewDTO.setPageId(actionDTO.getPageId());
        actionViewDTO.setConfirmBeforeExecute(actionDTO.getConfirmBeforeExecute());
        // Update defaultResources
        DefaultResources defaults = action.getDefaultResources();
        // Consider a situation when action is not published but user is viewing in deployed mode
        if (actionDTO.getDefaultResources() != null) {
            defaults.setPageId(actionDTO.getDefaultResources().getPageId());
            defaults.setCollectionId(actionDTO.getDefaultResources().getCollectionId());
        } else {
            defaults.setPageId(null);
            defaults.setCollectionId(null);
        }
        actionViewDTO.setDefaultResources(defaults);
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
        Mono<NewAction> actionMono = repository
                .findById(id, actionPermission.getDeletePermission())
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ACTION, id)));
        return actionMono
                .flatMap(toDelete -> {
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
                                    final Map<String, Object> data =
                                            this.getAnalyticsProperties(newAction1, datasource);
                                    final Map<String, Object> eventData = Map.of(
                                            FieldName.APP_MODE,
                                            ApplicationMode.EDIT.toString(),
                                            FieldName.ACTION,
                                            newAction1);
                                    data.put(FieldName.EVENT_DATA, eventData);

                                    return analyticsService
                                            .sendArchiveEvent(newAction1, data)
                                            .thenReturn(zippedActions.getT1());
                                })
                                .thenReturn(toDelete);
                    } else {
                        // This action was never published. This document can be safely archived
                        newActionMono = repository
                                .archive(toDelete)
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
                                    final Map<String, Object> data =
                                            this.getAnalyticsProperties(newAction1, datasource);
                                    final Map<String, Object> eventData = Map.of(
                                            FieldName.APP_MODE,
                                            ApplicationMode.EDIT.toString(),
                                            FieldName.ACTION,
                                            newAction1);
                                    data.put(FieldName.EVENT_DATA, eventData);

                                    return analyticsService
                                            .sendDeleteEvent(newAction1, data)
                                            .thenReturn(zippedActions.getT1());
                                })
                                .thenReturn(toDelete);
                    }

                    return newActionMono;
                })
                .flatMap(updatedAction -> generateActionByViewMode(updatedAction, false));
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

        return actionsFromRepository
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

    @Override
    public Flux<ActionDTO> getUnpublishedActions(
            MultiValueMap<String, String> params, String branchName, Boolean includeJsActions) {

        MultiValueMap<String, String> updatedParams = new LinkedMultiValueMap<>(params);
        // Get branched applicationId and pageId
        Mono<NewPage> branchedPageMono = !StringUtils.hasLength(params.getFirst(FieldName.PAGE_ID))
                ? Mono.just(new NewPage())
                : newPageService.findByBranchNameAndDefaultPageId(
                        branchName, params.getFirst(FieldName.PAGE_ID), pagePermission.getReadPermission());
        Mono<Application> branchedApplicationMono = !StringUtils.hasLength(params.getFirst(FieldName.APPLICATION_ID))
                ? Mono.just(new Application())
                : applicationService.findByBranchNameAndDefaultApplicationId(
                        branchName,
                        params.getFirst(FieldName.APPLICATION_ID),
                        applicationPermission.getReadPermission());

        return Mono.zip(branchedApplicationMono, branchedPageMono)
                .flatMapMany(tuple -> {
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
                })
                .map(responseUtils::updateActionDTOWithDefaultResources);
    }

    @Override
    public Flux<ActionDTO> getUnpublishedActions(MultiValueMap<String, String> params) {
        return getUnpublishedActions(params, TRUE);
    }

    @Override
    public Flux<ActionDTO> getUnpublishedActions(MultiValueMap<String, String> params, String branchName) {
        return getUnpublishedActions(params, branchName, TRUE);
    }

    @Override
    public Flux<ActionDTO> getUnpublishedActionsExceptJs(MultiValueMap<String, String> params) {
        return this.getUnpublishedActions(params, FALSE)
                .filter(actionDTO -> !PluginType.JS.equals(actionDTO.getPluginType()));
    }

    @Override
    public Flux<ActionDTO> getUnpublishedActionsExceptJs(MultiValueMap<String, String> params, String branchName) {
        return this.getUnpublishedActions(params, branchName, FALSE)
                .filter(actionDTO -> !PluginType.JS.equals(actionDTO.getPluginType()))
                .name(GET_UNPUBLISHED_ACTION)
                .tap(Micrometer.observation(observationRegistry));
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
            actionMono = providePluginTypeAndIdToNewActionObjectUsingJSTypeOrDatasource(action);
        }

        return actionMono;
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
        Mono<Plugin> pluginMono = pluginService.getById(actionDTO.getPluginId());
        Mono<PluginExecutor> pluginExecutorMono = pluginExecutorHelper.getPluginExecutor(pluginMono);

        return pluginExecutorMono.map(pluginExecutor -> {
            actionDTO
                    .getActionConfiguration()
                    .setSelfReferencingDataPaths(pluginExecutor.getSelfReferencingDataPaths());
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
            return setPluginIdAndTypeForJSAction(action);
        } else if (datasource != null && datasource.getPluginId() != null) {
            String pluginId = datasource.getPluginId();
            action.setPluginId(pluginId);

            return setPluginTypeFromId(action, pluginId);
        }

        return Mono.just(action);
    }

    private Mono<NewAction> setPluginTypeFromId(NewAction action, String pluginId) {
        return pluginService.findById(pluginId).flatMap(plugin -> {
            action.setPluginType(plugin.getType());
            return Mono.just(action);
        });
    }

    private Mono<NewAction> setPluginIdAndTypeForJSAction(NewAction action) {
        action.setPluginType(JS_PLUGIN_TYPE);

        return pluginService.findByPackageName(JS_PLUGIN_PACKAGE_NAME).flatMap(plugin -> {
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
            action.setGitSyncId(action.getApplicationId() + "_" + Instant.now().toString());
        }

        return sanitizeAction(action).flatMap(sanitizedAction -> repository.save(sanitizedAction));
    }

    @Override
    public Flux<NewAction> saveAll(List<NewAction> actions) {
        actions.stream()
                .filter(action -> action.getGitSyncId() == null)
                .forEach(action -> action.setGitSyncId(
                        action.getApplicationId() + "_" + Instant.now().toString()));

        return Flux.fromIterable(actions)
                .flatMap(this::sanitizeAction)
                .collectList()
                .flatMapMany(actionList -> repository.saveAll(actionList));
    }

    @Override
    public Flux<NewAction> findByPageId(String pageId) {
        return repository.findByPageId(pageId).flatMap(this::sanitizeAction);
    }

    /**
     * !!!WARNING!!! This function edits the parameters actionUpdates and messages which are eventually returned back to
     * the caller with the updates values.
     *
     * @param onLoadActions : All the actions which have been found to be on page load
     * @param pageId
     * @param actionUpdates : Empty array list which would be set in this function with all the page actions whose
     *                      execute on load setting has changed (whether flipped from true to false, or vice versa)
     * @param messages      : Empty array list which would be set in this function with all the messages that should be
     *                      displayed to the developer user communicating the action executeOnLoad changes.
     * @return
     */
    @Override
    public Mono<Boolean> updateActionsExecuteOnLoad(
            List<Executable> onLoadActions,
            String pageId,
            List<LayoutExecutableUpdateDTO> actionUpdates,
            List<String> messages) {

        List<ActionDTO> toUpdateActions = new ArrayList<>();

        MultiValueMap<String, String> params =
                CollectionUtils.toMultiValueMap(new LinkedCaseInsensitiveMap<>(8, Locale.ENGLISH));
        params.add(FieldName.PAGE_ID, pageId);

        // Fetch all the actions which exist in this page.
        Flux<ActionDTO> pageActionsFlux = this.getUnpublishedActions(params).cache();

        // Before we update the actions, fetch all the actions which are currently set to execute on load.
        Mono<List<ActionDTO>> existingOnPageLoadActionsMono = pageActionsFlux
                .flatMap(action -> {
                    if (TRUE.equals(action.getExecuteOnLoad())) {
                        return Mono.just(action);
                    }
                    return Mono.empty();
                })
                .collectList();

        return existingOnPageLoadActionsMono
                .zipWith(pageActionsFlux.collectList())
                .flatMap(tuple -> {
                    List<ActionDTO> existingOnPageLoadActions = tuple.getT1();
                    List<ActionDTO> pageActions = tuple.getT2();

                    // There are no actions in this page. No need to proceed further since no actions would get updated
                    if (pageActions.isEmpty()) {
                        return Mono.just(FALSE);
                    }

                    // No actions require an update if no actions have been found as page load actions as well as
                    // existing on load page actions are empty
                    if (existingOnPageLoadActions.isEmpty() && (onLoadActions == null || onLoadActions.isEmpty())) {
                        return Mono.just(FALSE);
                    }

                    // Extract names of existing page load actions and new page load actions for quick lookup.
                    Set<String> existingOnPageLoadActionNames = existingOnPageLoadActions.stream()
                            .map(ActionDTO::getValidName)
                            .collect(Collectors.toSet());

                    Set<String> newOnLoadActionNames =
                            onLoadActions.stream().map(Executable::getValidName).collect(Collectors.toSet());

                    // Calculate the actions which would need to be updated from execute on load TRUE to FALSE.
                    Set<String> turnedOffActionNames = new HashSet<>();
                    turnedOffActionNames.addAll(existingOnPageLoadActionNames);
                    turnedOffActionNames.removeAll(newOnLoadActionNames);

                    // Calculate the actions which would need to be updated from execute on load FALSE to TRUE
                    Set<String> turnedOnActionNames = new HashSet<>();
                    turnedOnActionNames.addAll(newOnLoadActionNames);
                    turnedOnActionNames.removeAll(existingOnPageLoadActionNames);

                    for (ActionDTO action : pageActions) {

                        String actionName = action.getValidName();
                        // If a user has ever set execute on load, this field can not be changed automatically. It has
                        // to be
                        // explicitly changed by the user again. Add the action to update only if this condition is
                        // false.
                        if (FALSE.equals(action.getUserSetOnLoad())) {

                            // If this action is no longer an onload action, turn the execute on load to false
                            if (turnedOffActionNames.contains(actionName)) {
                                action.setExecuteOnLoad(FALSE);
                                toUpdateActions.add(action);
                            }

                            // If this action is newly found to be on load, turn execute on load to true
                            if (turnedOnActionNames.contains(actionName)) {
                                action.setExecuteOnLoad(TRUE);
                                toUpdateActions.add(action);
                            }
                        } else {
                            // Remove the action name from either of the lists (if present) because this action should
                            // not be updated
                            turnedOnActionNames.remove(actionName);
                            turnedOffActionNames.remove(actionName);
                        }
                    }

                    // Add newly turned on page actions to report back to the caller
                    actionUpdates.addAll(addActionUpdatesForActionNames(pageActions, turnedOnActionNames));

                    // Add newly turned off page actions to report back to the caller
                    actionUpdates.addAll(addActionUpdatesForActionNames(pageActions, turnedOffActionNames));

                    // Now add messages that would eventually be displayed to the developer user informing them
                    // about the action setting change.
                    if (!turnedOffActionNames.isEmpty()) {
                        messages.add(turnedOffActionNames.toString() + " will no longer be executed on page load");
                    }

                    if (!turnedOnActionNames.isEmpty()) {
                        messages.add(turnedOnActionNames.toString() + " will be executed automatically on page load");
                    }

                    // Finally update the actions which require an update
                    return Flux.fromIterable(toUpdateActions)
                            .flatMap(actionDTO -> updateUnpublishedAction(actionDTO.getId(), actionDTO))
                            .then(Mono.just(TRUE));
                });
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
                    layoutExecutableUpdateDTO.setDefaultActionId(
                            pageAction.getDefaultResources().getActionId());
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
        return actionMono.flatMap(toDelete -> repository
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
                .thenReturn(toDelete));
    }

    @Override
    public Mono<NewAction> archiveByIdAndBranchName(String id, String branchName) {
        Mono<NewAction> branchedActionMono =
                this.findByBranchNameAndDefaultActionId(branchName, id, actionPermission.getDeletePermission());

        return branchedActionMono
                .flatMap(branchedAction -> this.archiveById(branchedAction.getId()))
                .map(responseUtils::updateNewActionWithDefaultResources);
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

    public List<MustacheBindingToken> extractMustacheKeysInOrder(String query) {
        return MustacheHelper.extractMustacheKeysInOrder(query);
    }

    @Override
    public String replaceMustacheWithQuestionMark(String query, List<String> mustacheBindings) {

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody(query);
        Map<String, String> replaceParamsMap =
                mustacheBindings.stream().collect(Collectors.toMap(Function.identity(), v -> "?"));

        ActionConfiguration updatedActionConfiguration =
                MustacheHelper.renderFieldValues(actionConfiguration, replaceParamsMap);
        return updatedActionConfiguration.getBody();
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

                return datasourceService.save(updatedDatasource);
            });
        });
    }

    public Mono<NewAction> findByBranchNameAndDefaultActionId(
            String branchName, String defaultActionId, AclPermission permission) {
        if (!StringUtils.hasLength(branchName)) {
            return repository
                    .findById(defaultActionId, permission)
                    .switchIfEmpty(Mono.error(
                            new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ACTION, defaultActionId)));
        }
        return repository
                .findByBranchNameAndDefaultActionId(branchName, defaultActionId, permission)
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.NO_RESOURCE_FOUND, FieldName.ACTION, defaultActionId + "," + branchName)))
                .flatMap(this::sanitizeAction);
    }

    public Mono<String> findBranchedIdByBranchNameAndDefaultActionId(
            String branchName, String defaultActionId, AclPermission permission) {
        if (!StringUtils.hasLength(branchName)) {
            return Mono.just(defaultActionId);
        }
        return repository
                .findByBranchNameAndDefaultActionId(branchName, defaultActionId, permission)
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.ACTION, defaultActionId + "," + branchName)))
                .map(NewAction::getId);
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
        analyticsProperties.put("orgId", ObjectUtils.defaultIfNull(savedAction.getWorkspaceId(), ""));
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
        return analyticsProperties;
    }

    @Override
    public void populateDefaultResources(NewAction newAction, NewAction branchedAction, String branchName) {
        DefaultResources defaultResources = branchedAction.getDefaultResources();
        // Create new action but keep defaultApplicationId and defaultActionId same for both the actions
        defaultResources.setBranchName(branchName);
        newAction.setDefaultResources(defaultResources);

        String defaultPageId = branchedAction.getUnpublishedAction() != null
                ? branchedAction.getUnpublishedAction().getDefaultResources().getPageId()
                : branchedAction.getPublishedAction().getDefaultResources().getPageId();
        DefaultResources defaultsDTO = new DefaultResources();
        defaultsDTO.setPageId(defaultPageId);
        if (newAction.getUnpublishedAction() != null) {
            newAction.getUnpublishedAction().setDefaultResources(defaultsDTO);
        }
        if (newAction.getPublishedAction() != null) {
            newAction.getPublishedAction().setDefaultResources(defaultsDTO);
        }

        newAction
                .getUnpublishedAction()
                .setDeletedAt(branchedAction.getUnpublishedAction().getDeletedAt());
        newAction.setDeletedAt(branchedAction.getDeletedAt());
        newAction.setDeleted(branchedAction.getDeleted());
        // Set policies from existing branch object
        newAction.setPolicies(branchedAction.getPolicies());
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
            final String defaultCollectionId =
                    savedActionCollection.getDefaultResources().getCollectionId();
            List<String> collectionIds = List.of(savedActionCollectionId, defaultCollectionId);

            importActionResultDTO
                    .getUnpublishedCollectionIdToActionIdsMap()
                    .getOrDefault(importedActionCollectionId, Map.of())
                    .forEach((defaultActionId, actionId) -> {
                        mapsDTO.getUnpublishedActionIdToCollectionIdMap().putIfAbsent(actionId, collectionIds);
                    });

            importActionResultDTO
                    .getPublishedCollectionIdToActionIdsMap()
                    .getOrDefault(importedActionCollectionId, Map.of())
                    .forEach((defaultActionId, actionId) -> {
                        mapsDTO.getPublishedActionIdToCollectionIdMap().putIfAbsent(actionId, collectionIds);
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
                                .get(newAction.getId())
                                .get(0));
                        if (unpublishedAction.getDefaultResources() != null
                                && org.apache.commons.lang3.StringUtils.isEmpty(
                                        unpublishedAction.getDefaultResources().getCollectionId())) {

                            unpublishedAction
                                    .getDefaultResources()
                                    .setCollectionId(mapsDTO.getUnpublishedActionIdToCollectionIdMap()
                                            .get(newAction.getId())
                                            .get(1));
                        }
                    }
                    if (!CollectionUtils.isEmpty(mapsDTO.getPublishedActionIdToCollectionIdMap())
                            && mapsDTO.getPublishedActionIdToCollectionIdMap().containsKey(newAction.getId())) {

                        publishedAction.setCollectionId(mapsDTO.getPublishedActionIdToCollectionIdMap()
                                .get(newAction.getId())
                                .get(0));

                        if (publishedAction.getDefaultResources() != null
                                && org.apache.commons.lang3.StringUtils.isEmpty(
                                        publishedAction.getDefaultResources().getCollectionId())) {

                            publishedAction
                                    .getDefaultResources()
                                    .setCollectionId(mapsDTO.getPublishedActionIdToCollectionIdMap()
                                            .get(newAction.getId())
                                            .get(1));
                        }
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
    public Mono<List<BulkWriteResult>> publishActions(String applicationId, AclPermission permission) {
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
    public Flux<NewAction> findByListOfPageIds(
            List<String> unpublishedPages, Optional<AclPermission> optionalPermission) {
        return repository.findByListOfPageIds(unpublishedPages, optionalPermission);
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
}
