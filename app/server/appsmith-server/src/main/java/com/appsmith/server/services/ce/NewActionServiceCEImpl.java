package com.appsmith.server.services.ce;

import com.appsmith.external.dtos.DatasourceDTO;
import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.dtos.ExecutePluginDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.helpers.MustacheHelper;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionRequest;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.Param;
import com.appsmith.external.models.Policy;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.Provider;
import com.appsmith.external.models.RequestParamDTO;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.constants.AnalyticsEvents;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.ActionProvider;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.DatasourceContext;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Page;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.PluginType;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.ActionViewDTO;
import com.appsmith.server.dtos.LayoutActionUpdateDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.AuthenticationValidator;
import com.appsmith.server.services.BaseService;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.DatasourceContextService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.MarketplaceService;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.services.PluginService;
import com.appsmith.server.services.SessionUserService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.ArrayUtils;
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
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.util.function.Tuple2;

import javax.lang.model.SourceVersion;
import javax.validation.Validator;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNewFieldValuesIntoOldObject;
import static com.appsmith.external.helpers.DataTypeStringUtils.getDisplayDataTypes;
import static com.appsmith.server.acl.AclPermission.EXECUTE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.EXECUTE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.MANAGE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.READ_ACTIONS;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static com.appsmith.server.helpers.WidgetSuggestionHelper.getSuggestedWidgets;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;


@Slf4j
public class NewActionServiceCEImpl extends BaseService<NewActionRepository, NewAction, String> implements NewActionServiceCE {

    private final NewActionRepository repository;
    private final DatasourceService datasourceService;
    private final PluginService pluginService;
    private final DatasourceContextService datasourceContextService;
    private final PluginExecutorHelper pluginExecutorHelper;
    private final MarketplaceService marketplaceService;
    private final PolicyGenerator policyGenerator;
    private final NewPageService newPageService;
    private final ApplicationService applicationService;
    private final SessionUserService sessionUserService;
    private final PolicyUtils policyUtils;
    private final ObjectMapper objectMapper;
    private final AuthenticationValidator authenticationValidator;
    private final ConfigService configService;
    private final ResponseUtils responseUtils;

    public NewActionServiceCEImpl(Scheduler scheduler,
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
                                ResponseUtils responseUtils) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.repository = repository;
        this.datasourceService = datasourceService;
        this.pluginService = pluginService;
        this.datasourceContextService = datasourceContextService;
        this.pluginExecutorHelper = pluginExecutorHelper;
        this.marketplaceService = marketplaceService;
        this.policyGenerator = policyGenerator;
        this.newPageService = newPageService;
        this.applicationService = applicationService;
        this.sessionUserService = sessionUserService;
        this.policyUtils = policyUtils;
        this.authenticationValidator = authenticationValidator;
        this.configService = configService;
        this.objectMapper = new ObjectMapper();
        this.responseUtils = responseUtils;
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
        action.setOrganizationId(newAction.getOrganizationId());
        action.setPluginType(newAction.getPluginType());
        action.setPluginId(newAction.getPluginId());
        action.setTemplateId(newAction.getTemplateId());
        action.setProviderId(newAction.getProviderId());
        action.setDocumentation(newAction.getDocumentation());

        action.setId(newAction.getId());
        action.setUserPermissions(newAction.getUserPermissions());
        action.setPolicies(newAction.getPolicies());
    }

    @Override
    public void setCommonFieldsFromActionDTOIntoNewAction(ActionDTO action, NewAction newAction) {
        // Set the fields from NewAction into Action
        newAction.setOrganizationId(action.getOrganizationId());
        newAction.setPluginType(action.getPluginType());
        newAction.setPluginId(action.getPluginId());
        newAction.setTemplateId(action.getTemplateId());
        newAction.setProviderId(action.getProviderId());
        newAction.setDocumentation(action.getDocumentation());
        newAction.setApplicationId(action.getApplicationId());
    }

    @Override
    public Mono<NewAction> findByIdAndBranchName(String id, String branchName) {
        return this.findByBranchNameAndDefaultActionId(branchName, id, READ_ACTIONS)
                .map(responseUtils::updateNewActionWithDefaultResources);
    }

    @Override
    public Mono<ActionDTO> generateActionByViewMode(NewAction newAction, Boolean viewMode) {
        ActionDTO action = null;

        if (TRUE.equals(viewMode)) {
            if (newAction.getPublishedAction() != null) {
                action = newAction.getPublishedAction();
            } else {
                // We are trying to fetch published action but it doesn't exist because the action hasn't been published yet
                return Mono.empty();
            }
        } else {
            if (newAction.getUnpublishedAction() != null) {
                action = newAction.getUnpublishedAction();
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
        Set<Policy> documentPolicies = policyGenerator.getAllChildPolicies(page.getPolicies(), Page.class, Action.class);
        action.setPolicies(documentPolicies);
    }

    @Override
    public Mono<ActionDTO> validateAndSaveActionToRepository(NewAction newAction) {

        if (newAction.getGitSyncId() == null) {
            newAction.setGitSyncId(newAction.getApplicationId() + "_" + new ObjectId());
        }

        ActionDTO action = newAction.getUnpublishedAction();

        if (action.getDefaultResources() == null) {
            return Mono.error(new AppsmithException(AppsmithError.DEFAULT_RESOURCES_UNAVAILABLE, "action", action.getName()));
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

        if (action.getPageId() == null || action.getPageId().isBlank()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.PAGE_ID));
        }

        if (!validateActionName(action.getName())) {
            action.setIsValid(false);
            invalids.add(AppsmithError.INVALID_ACTION_NAME.getMessage());
        }

        if (action.getActionConfiguration() == null) {
            action.setIsValid(false);
            invalids.add(AppsmithError.NO_CONFIGURATION_FOUND_IN_ACTION.getMessage());
        }

        if (action.getPluginType() == PluginType.JS && Boolean.FALSE.equals(action.getActionConfiguration().getIsValid())) {
            action.setIsValid(false);
            invalids.add(AppsmithError.INVALID_JS_ACTION.getMessage());
        }

        // Validate actionConfiguration
        ActionConfiguration actionConfig = action.getActionConfiguration();
        if (actionConfig != null) {
            validator.validate(actionConfig)
                    .stream()
                    .forEach(x -> invalids.add(x.getMessage()));
        }

        if (action.getDatasource() == null || action.getDatasource().getIsAutoGenerated()) {
            if (action.getPluginType() != PluginType.JS) {
                // This action isn't of type JS functions which requires that the pluginType be set by the client. Hence,
                // datasource is very much required for such an action.
                action.setIsValid(false);
                invalids.add(AppsmithError.DATASOURCE_NOT_GIVEN.getMessage());
                action.setInvalids(invalids);
                return super.create(newAction)
                        .flatMap(savedAction -> {
                            // If the default action is not set then current action will be the default one
                            if (StringUtils.isEmpty(savedAction.getDefaultResources().getActionId())) {
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
                datasourceMono = Mono.just(action.getDatasource())
                        .flatMap(datasourceService::validateDatasource);
            } else {
                //Data source already exists. Find the same.
                datasourceMono = datasourceService.findById(action.getDatasource().getId(), MANAGE_DATASOURCES)
                        .switchIfEmpty(Mono.defer(() -> {
                            action.setIsValid(false);
                            invalids.add(AppsmithError.NO_RESOURCE_FOUND.getMessage(FieldName.DATASOURCE, action.getDatasource().getId()));
                            return Mono.just(action.getDatasource());
                        }))
                        .map(datasource -> {
                            // datasource is found. Update the action.
                            newAction.setOrganizationId(datasource.getOrganizationId());
                            return datasource;
                        })
                        // If the action is publicly executable, update the datasource policy
                        .flatMap(datasource -> updateDatasourcePolicyForPublicAction(newAction.getPolicies(), datasource));
            }
        }

        Mono<Plugin> pluginMono = datasourceMono.flatMap(datasource -> {
            if (datasource.getPluginId() == null) {
                return Mono.error(new AppsmithException(AppsmithError.PLUGIN_ID_NOT_GIVEN));
            }
            return pluginService.findById(datasource.getPluginId())
                    .switchIfEmpty(Mono.defer(() -> {
                        action.setIsValid(false);
                        invalids.add(AppsmithError.NO_RESOURCE_FOUND.getMessage(FieldName.PLUGIN, datasource.getPluginId()));
                        return Mono.just(new Plugin());
                    }));
        });

        return pluginMono
                .zipWith(datasourceMono)
                //Set plugin in the action before saving.
                .map(tuple -> {
                    Plugin plugin = tuple.getT1();
                    Datasource datasource = tuple.getT2();
                    action.setDatasource(datasource);
                    action.setInvalids(invalids);
                    newAction.setUnpublishedAction(action);
                    newAction.setPluginType(plugin.getType());
                    newAction.setPluginId(plugin.getId());
                    return newAction;
                }).map(this::extractAndSetJsonPathKeys)
                .map(updatedAction -> {
                    // In case of external datasource (not embedded) instead of storing the entire datasource
                    // again inside the action, instead replace it with just the datasource ID. This is so that
                    // datasource data is not duplicated across actions and datasource.
                    ActionDTO unpublishedAction = updatedAction.getUnpublishedAction();
                    if (unpublishedAction.getDatasource().getId() != null) {
                        Datasource datasource = new Datasource();
                        datasource.setId(unpublishedAction.getDatasource().getId());
                        datasource.setPluginId(updatedAction.getPluginId());
                        unpublishedAction.setDatasource(datasource);
                        updatedAction.setUnpublishedAction(unpublishedAction);
                    }
                    return updatedAction;
                })
                .flatMap(repository::save)
                .flatMap(savedAction -> {
                    // If the default action is not set then current action will be the default one
                    if (StringUtils.isEmpty(savedAction.getDefaultResources().getActionId())) {
                        savedAction.getDefaultResources().setActionId(savedAction.getId());
                    }
                    return repository.save(savedAction);
                })
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.REPOSITORY_SAVE_FAILED)))
                .flatMap(this::setTransientFieldsInUnpublishedAction);
    }

    /**
     * This function extracts all the mustache template keys (as per the regex) and returns them to the calling fxn
     * This set of keys is stored separately in the field `jsonPathKeys` in the action object. The client
     * uses the set `jsonPathKeys` to simplify it's value substitution.
     *
     * @param actionDTO
     * @return
     */
    private Set<String> extractKeysFromAction(ActionDTO actionDTO) {
        if (actionDTO == null) {
            return new HashSet<>();
        }

        ActionConfiguration actionConfiguration = actionDTO.getActionConfiguration();
        if (actionConfiguration == null) {
            return new HashSet<>();
        }

        Set<String> keys = MustacheHelper.extractMustacheKeysFromFields(actionConfiguration);

        // Add JS function body to jsonPathKeys field.
        if (PluginType.JS.equals(actionDTO.getPluginType()) && actionConfiguration.getBody() != null) {
            keys.add(actionConfiguration.getBody());

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
        Set<String> actionKeys = extractKeysFromAction(action);
        Set<String> datasourceKeys = datasourceService.extractKeysFromDatasource(action.getDatasource());
        Set<String> keys = new HashSet<>() {{
            addAll(actionKeys);
            addAll(datasourceKeys);
        }};
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

        // In case of an action which was imported from a 3P API, fill in the extra information of the provider required by the front end UI.
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
                        throw new AppsmithException(AppsmithError.DEFAULT_RESOURCES_UNAVAILABLE, "action", newAction.getId());
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

        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }

        // The client does not know about this field. Hence the default value takes over. Set this to null to ensure
        // the update doesn't lead to resetting of this field.
        action.setUserSetOnLoad(null);

        Mono<NewAction> updatedActionMono = repository.findById(id, MANAGE_ACTIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ACTION, id)))
                .map(dbAction -> {
                    copyNewFieldValuesIntoOldObject(action, dbAction.getUnpublishedAction());
                    return dbAction;
                })
                .cache();

        Mono<ActionDTO> savedUpdatedActionMono = updatedActionMono
                .flatMap(this::validateAndSaveActionToRepository)
                .cache();

        Mono<NewAction> analyticsUpdateMono = updatedActionMono
                .flatMap(analyticsService::sendUpdateEvent);

        // First Update the Action
        return savedUpdatedActionMono
                // Now send the update event to analytics service
                .then(analyticsUpdateMono)
                // Now return the updated action back.
                .then(savedUpdatedActionMono);
    }

    @Override
    public Mono<ActionExecutionResult> executeAction(ExecuteActionDTO executeActionDTO) {
        // 1. Validate input parameters which are required for mustache replacements
        List<Param> params = executeActionDTO.getParams();
        if (!CollectionUtils.isEmpty(params)) {
            for (Param param : params) {
                // In case the parameter values turn out to be null, set it to empty string instead to allow the
                // the execution to go through no matter what.
                if (!StringUtils.isEmpty(param.getKey()) && param.getValue() == null) {
                    param.setValue("");
                }
            }
        }

        String actionId = executeActionDTO.getActionId();
        AtomicReference<String> actionName = new AtomicReference<>();
        // Initialize the name to be empty value
        actionName.set("");
        // 2. Fetch the action from the DB and check if it can be executed
        Mono<NewAction> actionMono = repository.findById(actionId, EXECUTE_ACTIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ACTION, actionId)))
                .cache();

        Mono<ActionDTO> actionDTOMono = actionMono
                .flatMap(action -> getValidActionForExecution(executeActionDTO, actionId, action))
                .cache();

        // 3. Instantiate the implementation class based on the query type

        Mono<Datasource> datasourceMono = actionDTOMono
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
                .cache();

        Mono<Plugin> pluginMono = datasourceMono
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
                    return pluginService.findById(datasource.getPluginId());
                })
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.PLUGIN)))
                .cache();

        Mono<PluginExecutor> pluginExecutorMono = pluginExecutorHelper.getPluginExecutor(pluginMono);

        // 4. Execute the query
        Mono<ActionExecutionResult> actionExecutionResultMono = Mono
                .zip(
                        actionDTOMono,
                        datasourceMono,
                        pluginExecutorMono,
                        pluginMono
                )
                .flatMap(tuple -> {
                    final ActionDTO action = tuple.getT1();
                    final Datasource datasource = tuple.getT2();
                    final PluginExecutor pluginExecutor = tuple.getT3();
                    final Plugin plugin = tuple.getT4();

                    // Set the action name
                    actionName.set(action.getName());

                    ActionConfiguration actionConfiguration = action.getActionConfiguration();

                    Integer timeoutDuration = actionConfiguration.getTimeoutInMillisecond();

                    log.debug("[{}]Execute Action called in Page {}, for action id : {}  action name : {}",
                            Thread.currentThread().getName(),
                            action.getPageId(), actionId, action.getName());

                    Mono<Datasource> validatedDatasourceMono = authenticationValidator.validateAuthentication(datasource).cache();

                    Mono<ActionExecutionResult> executionMono = validatedDatasourceMono
                            .flatMap(datasource1 -> {
                                if (plugin.isRemotePlugin()) {
                                    return this.getRemoteDatasourceContext(plugin, datasource1);
                                } else {
                                    return datasourceContextService.getDatasourceContext(datasource1);
                                }
                            })
                            // Now that we have the context (connection details), execute the action.
                            .flatMap(resourceContext -> validatedDatasourceMono
                                    .flatMap(datasource1 -> {
                                        return (Mono<ActionExecutionResult>) pluginExecutor.executeParameterized(
                                                resourceContext.getConnection(),
                                                executeActionDTO,
                                                datasource1.getDatasourceConfiguration(),
                                                actionConfiguration
                                        );
                                    })
                            );

                    return executionMono
                            .onErrorResume(StaleConnectionException.class, error -> {
                                log.info("Looks like the connection is stale. Retrying with a fresh context.");
                                return datasourceContextService
                                        .deleteDatasourceContext(datasource.getId())
                                        .then(executionMono);
                            })
                            .timeout(Duration.ofMillis(timeoutDuration))
                            .onErrorMap(TimeoutException.class,
                                    error -> new AppsmithPluginException(
                                            AppsmithPluginError.PLUGIN_QUERY_TIMEOUT_ERROR,
                                            action.getName(), timeoutDuration
                                    )
                            )
                            .onErrorMap(
                                    StaleConnectionException.class,
                                    error -> new AppsmithPluginException(
                                            AppsmithPluginError.PLUGIN_ERROR,
                                            "Secondary stale connection error."
                                    )
                            )
                            .onErrorResume(e -> {
                                log.debug("{}: In the action execution error mode.",
                                        Thread.currentThread().getName(), e);
                                ActionExecutionResult result = new ActionExecutionResult();
                                result.setBody(e.getMessage());
                                result.setIsExecutionSuccess(false);
                                // Set the status code for Appsmith plugin errors
                                if (e instanceof AppsmithPluginException) {
                                    result.setStatusCode(((AppsmithPluginException) e).getAppErrorCode().toString());
                                    result.setTitle(((AppsmithPluginException) e).getTitle());
                                    result.setErrorType(((AppsmithPluginException) e).getErrorType());
                                } else {
                                    result.setStatusCode(AppsmithPluginError.PLUGIN_ERROR.getAppErrorCode().toString());

                                    if (e instanceof AppsmithException) {
                                        result.setTitle(((AppsmithException) e).getTitle());
                                        result.setErrorType(((AppsmithException) e).getErrorType());
                                    }
                                }
                                return Mono.just(result);
                            })
                            .elapsed()
                            // Now send the analytics event for this execution
                            .flatMap(tuple1 -> {
                                        Long timeElapsed = tuple1.getT1();
                                        ActionExecutionResult result = tuple1.getT2();

                                        log.debug("{}: Action {} with id {} execution time : {} ms",
                                                Thread.currentThread().getName(),
                                                actionName.get(),
                                                actionId,
                                                timeElapsed
                                        );

                                        return Mono.zip(actionMono, actionDTOMono, datasourceMono)
                                                .flatMap(tuple2 -> {
                                                    ActionExecutionResult actionExecutionResult = result;
                                                    NewAction actionFromDb = tuple2.getT1();
                                                    ActionDTO actionDTO = tuple2.getT2();
                                                    Datasource datasourceFromDb = tuple2.getT3();

                                                    return Mono.when(sendExecuteAnalyticsEvent(actionFromDb, actionDTO, datasourceFromDb, executeActionDTO.getViewMode(), actionExecutionResult, timeElapsed))
                                                            .thenReturn(result);
                                                });
                                    }
                            );
                })
                .onErrorResume(AppsmithException.class, error -> {
                    ActionExecutionResult result = new ActionExecutionResult();
                    result.setIsExecutionSuccess(false);
                    result.setStatusCode(error.getAppErrorCode().toString());
                    result.setBody(error.getMessage());
                    result.setTitle(error.getTitle());
                    result.setErrorType(error.getErrorType());
                    return Mono.just(result);
                });

        Mono<Map> editorConfigLabelMapMono = datasourceMono
                .flatMap(datasource -> {
                    if (datasource.getId() != null) {
                        return pluginService.getEditorConfigLabelMap(datasource.getPluginId());
                    }

                    return Mono.just(new HashMap());
                });

        return Mono.zip(actionExecutionResultMono, editorConfigLabelMapMono)
                .flatMap(tuple -> {
                    ActionExecutionResult result = tuple.getT1();
                    // In case the action was executed in view mode, do not return the request object
                    if (TRUE.equals(executeActionDTO.getViewMode())) {
                        result.setRequest(null);
                        return Mono.just(result);
                    }

                    if (result.getRequest() == null || result.getRequest().getRequestParams() == null) {
                        return Mono.just(result);
                    }

                    Map labelMap = tuple.getT2();
                    transformRequestParams(result, labelMap);

                    return Mono.just(result);
                })
                .map(result -> addDataTypesAndSetSuggestedWidget(result, executeActionDTO.getViewMode()));
    }

    @Override
    public Mono<ActionDTO> getValidActionForExecution(ExecuteActionDTO executeActionDTO, String actionId, NewAction newAction) {
        Mono<ActionDTO> actionDTOMono = Mono.just(newAction)
                .flatMap(dbAction -> {
                    ActionDTO action;
                    if (TRUE.equals(executeActionDTO.getViewMode())) {
                        action = dbAction.getPublishedAction();
                        // If the action has not been published, return error
                        if (action == null) {
                            return Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ACTION, actionId));
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
                });
        return actionDTOMono;
    }

    @Override
    public Mono<ActionExecutionResult> executeAction(ExecuteActionDTO executeActionDTO, String branchName){

        return this.findByBranchNameAndDefaultActionId(branchName, executeActionDTO.getActionId(), EXECUTE_ACTIONS)
                .flatMap(branchedAction -> {
                    executeActionDTO.setActionId(branchedAction.getId());
                    return executeAction(executeActionDTO);
                });
    }
    /*
     * - Get label for request params.
     * - Transform request params list: [""] to a map: {"label": {"value": ...}}
     * - Rearrange request params in the order as they appear in query editor form.
     */
    private void transformRequestParams(ActionExecutionResult result, Map<String, String> labelMap) {
        Map<String, Object> transformedParams = new LinkedHashMap<>();
        Map<String, RequestParamDTO> requestParamsConfigMap = new HashMap();
        ((List)result.getRequest().getRequestParams()).stream()
                .forEach(param -> requestParamsConfigMap.put(((RequestParamDTO) param).getConfigProperty(),
                        (RequestParamDTO) param));

        labelMap.entrySet().stream()
                .forEach(e -> {
                    String configProperty = e.getKey();
                    if(requestParamsConfigMap.containsKey(configProperty)) {
                        RequestParamDTO param = requestParamsConfigMap.get(configProperty);
                        transformedParams.put(e.getValue(), param);
                    }
                });

        result.getRequest().setRequestParams(transformedParams);
    }

    private ActionExecutionResult addDataTypesAndSetSuggestedWidget(ActionExecutionResult result, Boolean viewMode) {

        if(FALSE.equals(viewMode)) {
            result.setSuggestedWidgets(getSuggestedWidgets(result.getBody()));
        }

        /*
         * - Do not process if data types are already present.
         * - It means that data types have been added by specific plugin.
         */

        if (!CollectionUtils.isEmpty(result.getDataTypes())) {
            return result;
        }

        result.setDataTypes(getDisplayDataTypes(result.getBody()));

        return result;
    }

    private Mono<ActionExecutionRequest> sendExecuteAnalyticsEvent(
            NewAction action,
            ActionDTO actionDTO,
            Datasource datasource,
            Boolean viewMode,
            ActionExecutionResult actionExecutionResult,
            Long timeElapsed
    ) {

        // Since we're loading the application from DB *only* for analytics, we check if analytics is
        // active before making the call to DB.
        if (!analyticsService.isActive()) {
            return Mono.empty();
        }

        ActionExecutionRequest actionExecutionRequest = actionExecutionResult.getRequest();
        ActionExecutionRequest request;
        if (actionExecutionRequest != null) {
            // Do a deep copy of request to not edit
            request = new ActionExecutionRequest(
                    actionExecutionRequest.getQuery(),
                    actionExecutionRequest.getBody(),
                    actionExecutionRequest.getHeaders(),
                    actionExecutionRequest.getHttpMethod(),
                    actionExecutionRequest.getUrl(),
                    actionExecutionRequest.getProperties(),
                    actionExecutionRequest.getExecutionParameters(),
                    null
            );
        } else {
            request = new ActionExecutionRequest();
        }

        if (request.getHeaders() != null) {
            JsonNode headers = objectMapper.convertValue(request.getHeaders(), JsonNode.class);
            try {
                String headersAsString = objectMapper.writeValueAsString(headers);
                request.setHeaders(headersAsString);
            } catch (JsonProcessingException e) {
                log.error(e.getMessage());
            }
        }

        if (!CollectionUtils.isEmpty(request.getProperties())) {
            final Map<String, String> stringProperties = new HashMap<>();
            for (final Map.Entry<String, ?> entry : request.getProperties().entrySet()) {
                String jsonValue;
                try {
                    jsonValue = objectMapper.writeValueAsString(entry.getValue());
                } catch (JsonProcessingException e) {
                    jsonValue = "\"Error serializing value to JSON.\"";
                }
                stringProperties.put(entry.getKey(), jsonValue);
            }
            request.setProperties(stringProperties);
        }

        return Mono.justOrEmpty(action.getApplicationId())
                .flatMap(applicationService::findById)
                .defaultIfEmpty(new Application())
                .flatMap(application -> Mono.zip(
                        Mono.just(application),
                        sessionUserService.getCurrentUser(),
                        newPageService.getNameByPageId(actionDTO.getPageId(), viewMode),
                        pluginService.getById(action.getPluginId())
                ))
                .map(tuple -> {
                    final Application application = tuple.getT1();
                    final User user = tuple.getT2();
                    final String pageName = tuple.getT3();
                    final Plugin plugin = tuple.getT4();

                    final PluginType pluginType = action.getPluginType();
                    final Map<String, Object> data = new HashMap<>();

                    data.putAll(Map.of(
                            "username", user.getUsername(),
                            "type", pluginType,
                            "pluginName", plugin.getName(),
                            "name", actionDTO.getName(),
                            "datasource", Map.of(
                                    "name", datasource.getName()
                            ),
                            "orgId", application.getOrganizationId(),
                            "appId", action.getApplicationId(),
                            "appMode", TRUE.equals(viewMode) ? "view" : "edit",
                            "appName", application.getName(),
                            "isExampleApp", application.isAppIsExample()
                    ));

                    data.putAll(Map.of(
                            "request", request,
                            "pageId", ObjectUtils.defaultIfNull(actionDTO.getPageId(), ""),
                            "pageName", pageName,
                            "isSuccessfulExecution", ObjectUtils.defaultIfNull(actionExecutionResult.getIsExecutionSuccess(), false),
                            "statusCode", ObjectUtils.defaultIfNull(actionExecutionResult.getStatusCode(), ""),
                            "timeElapsed", timeElapsed
                    ));

                    // Add the error message in case of erroneous execution
                    if (FALSE.equals(actionExecutionResult.getIsExecutionSuccess())) {
                        String errorJson;
                        try {
                            errorJson = objectMapper.writeValueAsString(actionExecutionResult.getBody());
                        } catch (JsonProcessingException e) {
                            log.warn("Unable to serialize action execution error result to JSON.", e);
                            errorJson = "\"Failed to serialize error data to JSON.\"";
                        }
                        data.put("error", errorJson);
                    }

                    if (actionExecutionResult.getStatusCode() != null) {
                        data.putAll(Map.of(
                                "statusCode", actionExecutionResult.getStatusCode()
                        ));
                    }

                    analyticsService.sendEvent(AnalyticsEvents.EXECUTE_ACTION.getEventName(), user.getUsername(), data);
                    return request;
                })
                .onErrorResume(error -> {
                    log.warn("Error sending action execution data point", error);
                    return Mono.just(request);
                });
    }

    /**
     * This function replaces the variables in the Object with the actual params
     */
    @Override
    public <T> T variableSubstitution(T configuration, Map<String, String> replaceParamsMap) {
        return MustacheHelper.renderFieldValues(configuration, replaceParamsMap);
    }

    @Override
    public Mono<ActionDTO> findByUnpublishedNameAndPageId(String name, String pageId, AclPermission permission) {
        return repository.findByUnpublishedNameAndPageId(name, pageId, permission)
                .flatMap(action -> generateActionByViewMode(action, false));
    }

    @Override
    public Mono<ActionDTO> findActionDTObyIdAndViewMode(String id, Boolean viewMode, AclPermission permission) {
        return this.findById(id, permission)
                .flatMap(action -> generateActionByViewMode(action, viewMode));
    }

    @Override
    public Flux<NewAction> findUnpublishedOnLoadActionsExplicitSetByUserInPage(String pageId) {
        return repository
                .findUnpublishedActionsByPageIdAndExecuteOnLoadSetByUserTrue(pageId, MANAGE_ACTIONS);
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
                .findUnpublishedActionsByNameInAndPageId(names, pageId, MANAGE_ACTIONS);
    }

    @Override
    public Mono<NewAction> findById(String id) {
        return repository.findById(id);
    }

    @Override
    public Mono<NewAction> findById(String id, AclPermission aclPermission) {
        return repository.findById(id, aclPermission);
    }

    @Override
    public Flux<NewAction> findByPageId(String pageId, AclPermission permission) {
        return repository.findByPageId(pageId, permission);
    }

    @Override
    public Flux<NewAction> findByPageIdAndViewMode(String pageId, Boolean viewMode, AclPermission permission) {
        return repository.findByPageIdAndViewMode(pageId, viewMode, permission);
    }

    @Override
    public Flux<NewAction> findAllByApplicationIdAndViewMode(String applicationId, Boolean viewMode, AclPermission permission, Sort sort) {
        return repository.findByApplicationId(applicationId, permission, sort)
                // In case of view mode being true, filter out all the actions which haven't been published
                .flatMap(action -> {
                    if (Boolean.TRUE.equals(viewMode)) {
                        // In case we are trying to fetch published actions but this action has not been published, do not return
                        if (action.getPublishedAction() == null) {
                            return Mono.empty();
                        }
                    }
                    // No need to handle the edge case of unpublished action not being present. This is not possible because
                    // every created action starts from an unpublishedAction state.

                    return Mono.just(action);
                });
    }

    @Override
    public Flux<ActionViewDTO> getActionsForViewMode(String defaultApplicationId, String branchName) {
        return applicationService.findBranchedApplicationId(branchName, defaultApplicationId, READ_APPLICATIONS)
                .flatMapMany(this::getActionsForViewMode)
                .map(responseUtils::updateActionViewDTOWithDefaultResources);
    }

    @Override
    public Flux<ActionViewDTO> getActionsForViewMode(String applicationId) {

        if (applicationId == null || applicationId.isEmpty()) {
            return Flux.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.APPLICATION_ID));
        }

        // fetch the published actions by applicationId
        // No need to sort the results
        return findAllByApplicationIdAndViewMode(applicationId, true, EXECUTE_ACTIONS, null)
                .filter(newAction -> !PluginType.JS.equals(newAction.getPluginType()))
                .map(action -> {
                    ActionViewDTO actionViewDTO = new ActionViewDTO();
                    actionViewDTO.setId(action.getDefaultResources().getActionId());
                    actionViewDTO.setName(action.getPublishedAction().getValidName());
                    actionViewDTO.setPageId(action.getPublishedAction().getPageId());
                    actionViewDTO.setConfirmBeforeExecute(action.getPublishedAction().getConfirmBeforeExecute());
                    // Update defaultResources
                    DefaultResources defaults = action.getDefaultResources();
                    // Consider a situation when action is not published but user is viewing in deployed mode
                    if (action.getPublishedAction().getDefaultResources() != null) {
                        defaults.setPageId(action.getPublishedAction().getDefaultResources().getPageId());
                        defaults.setCollectionId(action.getPublishedAction().getDefaultResources().getCollectionId());
                    } else {
                        defaults.setPageId(null);
                        defaults.setCollectionId(null);
                    }
                    actionViewDTO.setDefaultResources(defaults);
                    if (action.getPublishedAction().getJsonPathKeys() != null && !action.getPublishedAction().getJsonPathKeys().isEmpty()) {
                        Set<String> jsonPathKeys;
                        jsonPathKeys = new HashSet<>();
                        jsonPathKeys.addAll(action.getPublishedAction().getJsonPathKeys());
                        actionViewDTO.setJsonPathKeys(jsonPathKeys);
                    }
                    if (action.getPublishedAction().getActionConfiguration() != null) {
                        actionViewDTO.setTimeoutInMillisecond(action.getPublishedAction().getActionConfiguration().getTimeoutInMillisecond());
                    }
                    return actionViewDTO;
                });
    }

    @Override
    public Mono<ActionDTO> deleteUnpublishedAction(String id) {
        Mono<NewAction> actionMono = repository.findById(id, MANAGE_ACTIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ACTION, id)));
        return actionMono
                .flatMap(toDelete -> {

                    Mono<NewAction> newActionMono;

                    // Using the name field to determine if the action was ever published. In case of never published
                    // action, publishedAction would exist with empty datasource and default fields.
                    if (toDelete.getPublishedAction() != null && toDelete.getPublishedAction().getName() != null) {
                        toDelete.getUnpublishedAction().setDeletedAt(Instant.now());
                        newActionMono = repository.save(toDelete);
                    } else {
                        // This action was never published. This can be safely deleted from the db
                        newActionMono = repository.delete(toDelete).thenReturn(toDelete);
                    }

                    return newActionMono;
                })
                .flatMap(analyticsService::sendDeleteEvent)
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
        }
        else if (action.getDatasource().getId() != null) {
            dsConfigMono = datasourceService.findById(action.getDatasource().getId())
                    .flatMap(datasource -> {
                        if (datasource.getDatasourceConfiguration() == null) {
                            return Mono.just(new DatasourceConfiguration());
                        }

                        return Mono.just(datasource.getDatasourceConfiguration());
                    })
                    .switchIfEmpty(
                            Mono.error(
                                    new AppsmithException(
                                            AppsmithError.NO_RESOURCE_FOUND,
                                            FieldName.DATASOURCE,
                                            action.getDatasource().getId()
                                    )
                            )
                    );
        }
        else {
            dsConfigMono = Mono.just(new DatasourceConfiguration());
        }

        return Mono.zip(pluginExecutorMono, dsConfigMono)
                .flatMap(tuple ->{
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
    public Flux<ActionDTO> getUnpublishedActions(MultiValueMap<String, String> params) {
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

        if (params.getFirst(FieldName.APPLICATION_ID) != null) {
            // Fetch unpublished pages because GET actions is only called during edit mode. For view mode, different
            // function call is made which takes care of returning only the essential fields of an action
            return applicationService
                    .findById(params.getFirst(FieldName.APPLICATION_ID), READ_APPLICATIONS)
                    .flatMapMany(application -> repository.findByApplicationIdAndViewMode(application.getId(), false, READ_ACTIONS))
                    .flatMap(this::setTransientFieldsInUnpublishedAction);
        }
        return repository.findAllActionsByNameAndPageIdsAndViewMode(name, pageIds, false, READ_ACTIONS, sort)
                .flatMap(this::setTransientFieldsInUnpublishedAction);
    }

    @Override
    public Flux<ActionDTO> getUnpublishedActions(MultiValueMap<String, String> params, String branchName) {

        MultiValueMap<String, String> updatedParams = new LinkedMultiValueMap<>(params);
        // Get branched applicationId and pageId
        Mono<NewPage> branchedPageMono = StringUtils.isEmpty(params.getFirst(FieldName.PAGE_ID))
                ? Mono.just(new NewPage())
                : newPageService.findByBranchNameAndDefaultPageId(branchName, params.getFirst(FieldName.PAGE_ID), READ_PAGES);
        Mono<Application> branchedApplicationMono = StringUtils.isEmpty(params.getFirst(FieldName.APPLICATION_ID))
                ? Mono.just(new Application())
                : applicationService.findByBranchNameAndDefaultApplicationId(branchName, params.getFirst(FieldName.APPLICATION_ID), READ_APPLICATIONS);

        return Mono.zip(branchedApplicationMono, branchedPageMono)
                .flatMapMany(tuple -> {
                    String applicationId = tuple.getT1().getId();
                    String pageId = tuple.getT2().getId();
                    if (!CollectionUtils.isEmpty(params.get(FieldName.PAGE_ID)) && !StringUtils.isEmpty(pageId)) {
                        updatedParams.set(FieldName.PAGE_ID, pageId);
                    }
                    if (!CollectionUtils.isEmpty(params.get(FieldName.APPLICATION_ID)) && !StringUtils.isEmpty(applicationId)) {
                        updatedParams.set(FieldName.APPLICATION_ID, applicationId);
                    }
                    return getUnpublishedActions(updatedParams);
                })
                .map(responseUtils::updateActionDTOWithDefaultResources);
    }

    @Override
    public Flux<ActionDTO> getUnpublishedActionsExceptJs(MultiValueMap<String, String> params) {
        return this.getUnpublishedActions(params)
                .filter(actionDTO -> !PluginType.JS.equals(actionDTO.getPluginType()));
    }

    @Override
    public Flux<ActionDTO> getUnpublishedActionsExceptJs(MultiValueMap<String, String> params, String branchName) {
        return this.getUnpublishedActions(params, branchName)
                .filter(actionDTO -> !PluginType.JS.equals(actionDTO.getPluginType()));
    }

    // We can afford to make this call all the time since we already have all the info we need in context
    private Mono<DatasourceContext> getRemoteDatasourceContext(Plugin plugin, Datasource datasource) {
        final DatasourceContext datasourceContext = new DatasourceContext();

        return configService.getInstanceId()
                .map(instanceId -> {
                    ExecutePluginDTO executePluginDTO = new ExecutePluginDTO();
                    executePluginDTO.setInstallationKey(instanceId);
                    executePluginDTO.setPluginName(plugin.getPluginName());
                    executePluginDTO.setPluginVersion(plugin.getVersion());
                    executePluginDTO.setDatasource(new DatasourceDTO(datasource.getId(), datasource.getDatasourceConfiguration()));
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
        return repository.save(action);
    }

    @Override
    public Flux<NewAction> saveAll(List<NewAction> actions) {
        actions.stream()
                .filter(action -> action.getGitSyncId() == null)
                .forEach(action -> action.setGitSyncId(action.getApplicationId() + "_" + Instant.now().toString()));
        return repository.saveAll(actions);
    }

    @Override
    public Flux<NewAction> findByPageId(String pageId) {
        return repository.findByPageId(pageId);
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
    public Mono<Boolean> updateActionsExecuteOnLoad(List<ActionDTO> onLoadActions,
                                                    String pageId,
                                                    List<LayoutActionUpdateDTO> actionUpdates,
                                                    List<String> messages) {

        List<ActionDTO> toUpdateActions = new ArrayList<>();

        MultiValueMap<String, String> params = CollectionUtils.toMultiValueMap(new LinkedCaseInsensitiveMap<>(8, Locale.ENGLISH));
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
                    Set<String> existingOnPageLoadActionNames = existingOnPageLoadActions
                            .stream()
                            .map(ActionDTO::getValidName)
                            .collect(Collectors.toSet());

                    Set<String> newOnLoadActionNames = onLoadActions
                            .stream()
                            .map(ActionDTO::getValidName)
                            .collect(Collectors.toSet());


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
                        // If a user has ever set execute on load, this field can not be changed automatically. It has to be
                        // explicitly changed by the user again. Add the action to update only if this condition is false.
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
                    actionUpdates.addAll(
                            addActionUpdatesForActionNames(pageActions, turnedOnActionNames)
                    );

                    // Add newly turned off page actions to report back to the caller
                    actionUpdates.addAll(
                            addActionUpdatesForActionNames(pageActions, turnedOffActionNames)
                    );

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

    private List<LayoutActionUpdateDTO> addActionUpdatesForActionNames(List<ActionDTO> pageActions,
                                                                       Set<String> actionNames) {

        return pageActions
                .stream()
                .filter(pageAction -> actionNames.contains(pageAction.getValidName()))
                .map(pageAction -> {
                    LayoutActionUpdateDTO layoutActionUpdateDTO = new LayoutActionUpdateDTO();
                    layoutActionUpdateDTO.setId(pageAction.getId());
                    layoutActionUpdateDTO.setName(pageAction.getValidName());
                    layoutActionUpdateDTO.setCollectionId(pageAction.getCollectionId());
                    layoutActionUpdateDTO.setExecuteOnLoad(pageAction.getExecuteOnLoad());
                    layoutActionUpdateDTO.setDefaultActionId(pageAction.getDefaultResources().getActionId());
                    return layoutActionUpdateDTO;
                })
                .collect(Collectors.toList());
    }

    @Override
    public Mono<NewAction> delete(String id) {
        Mono<NewAction> actionMono = repository.findById(id)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ACTION, id)));
        return actionMono
                .flatMap(toDelete -> repository.delete(toDelete).thenReturn(toDelete))
                .flatMap(analyticsService::sendDeleteEvent);
    }

    @Override
    public Mono<NewAction> deleteByIdAndBranchName(String id, String branchName) {
        Mono<NewAction> branchedActionMono = this.findByBranchNameAndDefaultActionId(branchName, id, MANAGE_ACTIONS);

        return branchedActionMono
                .flatMap(newAction -> this.delete(newAction.getId()))
                .map(responseUtils::updateNewActionWithDefaultResources);
    }

    @Override
    public Mono<NewAction> archive(String id) {
        Mono<NewAction> actionMono = repository.findById(id)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ACTION, id)));
        return actionMono
                .flatMap(toArchive -> {
                    toArchive.getUnpublishedAction().setArchivedAt(Instant.now());
                    return repository.save(toArchive);
                })
                .flatMap(analyticsService::sendArchiveEvent);
    }

    @Override
    public Mono<List<NewAction>> archiveActionsByApplicationId(String applicationId, AclPermission permission) {
        return repository.findByApplicationId(applicationId, permission)
                .flatMap(repository::archive)
                .collectList();
    }

    public List<String> extractMustacheKeysInOrder(String query) {
        return MustacheHelper.extractMustacheKeysInOrder(query);
    }

    @Override
    public String replaceMustacheWithQuestionMark(String query, List<String> mustacheBindings) {

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody(query);
        Map<String, String> replaceParamsMap = mustacheBindings
                .stream()
                .collect(Collectors.toMap(Function.identity(), v -> "?"));

        ActionConfiguration updatedActionConfiguration = MustacheHelper.renderFieldValues(actionConfiguration, replaceParamsMap);
        return updatedActionConfiguration.getBody();
    }

    private Mono<Datasource> updateDatasourcePolicyForPublicAction(Set<Policy> actionPolicies, Datasource datasource) {
        if (datasource.getId() == null) {
            // This seems to be a nested datasource. Return as is.
            return Mono.just(datasource);
        }

        // If action has EXECUTE permission for anonymous, check and assign the same to the datasource.
        if (policyUtils.isPermissionPresentForUser(actionPolicies, EXECUTE_ACTIONS.getValue(), FieldName.ANONYMOUS_USER)) {
            // Check if datasource has execute permission
            if (policyUtils.isPermissionPresentForUser(datasource.getPolicies(), EXECUTE_DATASOURCES.getValue(), FieldName.ANONYMOUS_USER)) {
                // Datasource has correct permission. Return as is
                return Mono.just(datasource);
            }
            // Add the permission to datasource
            AclPermission datasourcePermission = EXECUTE_DATASOURCES;

            User user = new User();
            user.setName(FieldName.ANONYMOUS_USER);
            user.setEmail(FieldName.ANONYMOUS_USER);
            user.setIsAnonymous(true);

            Map<String, Policy> datasourcePolicyMap = policyUtils.generatePolicyFromPermission(Set.of(datasourcePermission), user);

            Datasource updatedDatasource = policyUtils.addPoliciesToExistingObject(datasourcePolicyMap, datasource);

            return datasourceService.save(updatedDatasource);
        }

        return Mono.just(datasource);
    }

    public Mono<NewAction> findByBranchNameAndDefaultActionId(String branchName, String defaultActionId, AclPermission permission) {
        if (StringUtils.isEmpty(branchName)) {
            return repository.findById(defaultActionId, permission)
                    .switchIfEmpty(Mono.error(
                            new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ACTION, defaultActionId))
                    );
        }
        return repository.findByBranchNameAndDefaultActionId(branchName, defaultActionId, permission)
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ACTION, defaultActionId + "," + branchName))
                );
    }

    public Mono<String> findBranchedIdByBranchNameAndDefaultActionId(String branchName, String defaultActionId, AclPermission permission) {
        if (StringUtils.isEmpty(branchName)) {
            return Mono.just(defaultActionId);
        }
        return repository.findByBranchNameAndDefaultActionId(branchName, defaultActionId, permission)
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.ACTION, defaultActionId + "," + branchName))
                )
                .map(NewAction::getId);
    }


}
