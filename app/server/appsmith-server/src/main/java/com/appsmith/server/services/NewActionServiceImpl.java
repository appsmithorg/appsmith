package com.appsmith.server.services;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.PaginationField;
import com.appsmith.external.models.PaginationType;
import com.appsmith.external.models.Param;
import com.appsmith.external.models.Policy;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.Provider;
import com.appsmith.external.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.pluginExceptions.StaleConnectionException;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.ActionProvider;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Page;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.PluginType;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.ActionViewDTO;
import com.appsmith.server.dtos.ExecuteActionDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.MustacheHelper;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.NewActionRepository;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.ArrayUtils;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.lang.model.SourceVersion;
import javax.validation.Validator;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.EXECUTE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.EXECUTE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.MANAGE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.READ_ACTIONS;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static com.appsmith.server.helpers.BeanCopyUtils.copyNewFieldValuesIntoOldObject;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;

@Service
@Slf4j
public class NewActionServiceImpl extends BaseService<NewActionRepository, NewAction, String> implements NewActionService {

    private final NewActionRepository repository;
    private final DatasourceService datasourceService;
    private final PluginService pluginService;
    private final DatasourceContextService datasourceContextService;
    private final PluginExecutorHelper pluginExecutorHelper;
    private final MarketplaceService marketplaceService;
    private final PolicyGenerator policyGenerator;
    private final NewPageService newPageService;

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
                                NewPageService newPageService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.repository = repository;
        this.datasourceService = datasourceService;
        this.pluginService = pluginService;
        this.datasourceContextService = datasourceContextService;
        this.pluginExecutorHelper = pluginExecutorHelper;
        this.marketplaceService = marketplaceService;
        this.policyGenerator = policyGenerator;
        this.newPageService = newPageService;
    }

    private Boolean validateActionName(String name) {
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

    private void setCommonFieldsFromActionDTOIntoNewAction(ActionDTO action, NewAction newAction) {
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
    public Mono<ActionDTO> generateActionByViewMode(NewAction newAction, Boolean viewMode) {
        ActionDTO action = null;

        if (TRUE.equals(viewMode)) {
            if (newAction.getPublishedAction() != null) {
                action = newAction.getPublishedAction();
            } else {
                // We are trying to fetch published action but it doesnt exist because the action hasn't been published yet
                return Mono.empty();
            }
        } else {
            if (newAction.getUnpublishedAction() != null) {
                action = newAction.getUnpublishedAction();
            }
        }

        // Set the fields from NewAction into Action
        setCommonFieldsFromNewActionIntoAction(newAction, action);

        return Mono.just(action);
    }

    private void generateAndSetActionPolicies(NewPage page, NewAction action) {
        Set<Policy> documentPolicies = policyGenerator.getAllChildPolicies(page.getPolicies(), Page.class, Action.class);
        action.setPolicies(documentPolicies);
    }

    @Override
    public Mono<ActionDTO> createAction(ActionDTO action) {
        if (action.getId() != null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "id"));
        }

        if (action.getPageId() == null || action.getPageId().isBlank()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.PAGE_ID));
        }

        NewAction newAction = new NewAction();
        newAction.setPublishedAction(new ActionDTO());
        newAction.getPublishedAction().setDatasource(new Datasource());

        return newPageService
                .findById(action.getPageId(), READ_PAGES)
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.PAGE, action.getPageId())))
                .flatMap(page -> {

                    // Inherit the action policies from the page.
                    generateAndSetActionPolicies(page, newAction);

                    setCommonFieldsFromActionDTOIntoNewAction(action, newAction);

                    // Set the application id in the main domain
                    newAction.setApplicationId(page.getApplicationId());

                    // If the datasource is embedded, check for organizationId and set it in action
                    if (action.getDatasource() != null &&
                            action.getDatasource().getId() == null) {
                        Datasource datasource = action.getDatasource();
                        if (datasource.getOrganizationId() == null) {
                            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ORGANIZATION_ID));
                        }
                        newAction.setOrganizationId(datasource.getOrganizationId());
                    }

                    // New actions will never be set to auto-magical execution
                    action.setExecuteOnLoad(false);

                    newAction.setUnpublishedAction(action);

                    return Mono.just(newAction);
                })
                .flatMap(this::validateAndSaveActionToRepository);
    }

    private Mono<ActionDTO> validateAndSaveActionToRepository(NewAction newAction) {
        ActionDTO action = newAction.getUnpublishedAction();

        //Default the validity to true and invalids to be an empty set.
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

        if (action.getDatasource() == null || action.getDatasource().getIsAutoGenerated()) {
            if (action.getPluginType() != PluginType.JS) {
                // This action isn't of type JS functions which requires that the pluginType be set by the client. Hence,
                // datasource is very much required for such an action.
                action.setIsValid(false);
                invalids.add(AppsmithError.DATASOURCE_NOT_GIVEN.getMessage());
            }
            action.setInvalids(invalids);
            return super.create(newAction)
                    .flatMap(savedAction -> generateActionByViewMode(savedAction, false));
        }

        Mono<Datasource> datasourceMono;
        if (action.getDatasource().getId() == null) {
            if (action.getDatasource().getDatasourceConfiguration() != null &&
                    action.getDatasource().getDatasourceConfiguration().getAuthentication() != null) {
                action.getDatasource()
                        .getDatasourceConfiguration()
                        .setAuthentication(datasourceService.encryptAuthenticationFields(action
                                .getDatasource()
                                .getDatasourceConfiguration()
                                .getAuthentication()
                        ));
            }

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
                    });
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
                }).map(act -> extractAndSetJsonPathKeys(act))
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
                .flatMap(super::create)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.REPOSITORY_SAVE_FAILED)))
                .flatMap(this::setTransientFieldsInUnpublishedAction);
    }

    /**
     * This function extracts all the mustache template keys (as per the regex) and returns them to the calling fxn
     * This set of keys is stored separately in the field `jsonPathKeys` in the action object. The client
     * uses the set `jsonPathKeys` to simplify it's value substitution.
     *
     * @param actionConfiguration
     * @return
     */
    private Set<String> extractKeysFromAction(ActionConfiguration actionConfiguration) {
        if (actionConfiguration == null) {
            return new HashSet<>();
        }

        return MustacheHelper.extractMustacheKeysFromFields(actionConfiguration);
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
        Set<String> actionKeys = extractKeysFromAction(action.getActionConfiguration());
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
                    newAction.setUnpublishedAction(actionDTO);
                    return newAction;
                })
                .flatMap(action1 -> generateActionByViewMode(action1, false));
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
        Mono<ActionDTO> actionMono = repository.findById(actionId, EXECUTE_ACTIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ACTION, actionId)))
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
                })
                .cache();

        // 3. Instantiate the implementation class based on the query type

        Mono<Datasource> datasourceMono = actionMono
                .flatMap(action -> {
                    // Global datasource requires us to fetch the datasource from DB.
                    if (action.getDatasource() != null && action.getDatasource().getId() != null) {
                        return datasourceService.findById(action.getDatasource().getId(), EXECUTE_DATASOURCES)
                                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND,
                                        FieldName.DATASOURCE,
                                        action.getDatasource().getId())));
                    }
                    // This is a nested datasource. Return as is.
                    return Mono.just(action.getDatasource());
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
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.PLUGIN)));

        Mono<PluginExecutor> pluginExecutorMono = pluginExecutorHelper.getPluginExecutor(pluginMono);

        // 4. Execute the query
        Mono<ActionExecutionResult> actionExecutionResultMono = Mono
                .zip(
                        actionMono,
                        datasourceMono,
                        pluginExecutorMono
                )
                .flatMap(tuple -> {
                    final ActionDTO action = tuple.getT1();
                    final Datasource datasource = tuple.getT2();
                    final PluginExecutor pluginExecutor = tuple.getT3();

                    // Set the action name
                    actionName.set(action.getName());

                    DatasourceConfiguration datasourceConfiguration = datasource.getDatasourceConfiguration();
                    ActionConfiguration actionConfiguration = action.getActionConfiguration();

                    prepareConfigurationsForExecution(action, datasource, executeActionDTO, actionConfiguration, datasourceConfiguration);

                    Integer timeoutDuration = actionConfiguration.getTimeoutInMillisecond();

                    log.debug("[{}]Execute Action called in Page {}, for action id : {}  action name : {}, {}, {}",
                            Thread.currentThread().getName(),
                            action.getPageId(), actionId, action.getName(), datasourceConfiguration,
                            actionConfiguration);

                    Mono<ActionExecutionResult> executionMono = Mono.just(datasource)
                            .flatMap(datasourceContextService::getDatasourceContext)
                            // Now that we have the context (connection details), execute the action.
                            .flatMap(
                                    resourceContext -> pluginExecutor.execute(
                                            resourceContext.getConnection(),
                                            datasourceConfiguration,
                                            actionConfiguration
                                    )
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
                                            AppsmithPluginError.PLUGIN_TIMEOUT_ERROR,
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
                                } else {
                                    result.setStatusCode(AppsmithPluginError.PLUGIN_ERROR.getAppErrorCode().toString());
                                }
                                return Mono.just(result);
                            });
                });

        return actionExecutionResultMono
                .onErrorResume(AppsmithException.class, error -> {
                    ActionExecutionResult result = new ActionExecutionResult();
                    result.setIsExecutionSuccess(false);
                    result.setStatusCode(error.getAppErrorCode().toString());
                    result.setBody(error.getMessage());
                    return Mono.just(result);
                })
                .elapsed()
                .map(tuple -> {
                    log.debug("{}: Action {} with id {} execution time : {} ms",
                            Thread.currentThread().getName(),
                            actionName.get(),
                            actionId,
                            tuple.getT1()
                    );
                    return tuple.getT2();
                });
    }

    private void prepareConfigurationsForExecution(ActionDTO action,
                                                   Datasource datasource,
                                                   ExecuteActionDTO executeActionDTO,
                                                   ActionConfiguration actionConfiguration,
                                                   DatasourceConfiguration datasourceConfiguration) {
        DatasourceConfiguration datasourceConfigurationTemp;
        ActionConfiguration actionConfigurationTemp;

        //Do variable substitution
        //Do this only if params have been provided in the execute command
        if (executeActionDTO.getParams() != null && !executeActionDTO.getParams().isEmpty()) {
            Map<String, String> replaceParamsMap = executeActionDTO
                    .getParams()
                    .stream()
                    .collect(Collectors.toMap(
                            // Trimming here for good measure. If the keys have space on either side,
                            // Mustache won't be able to find the key.
                            // We also add a backslash before every double-quote or backslash character
                            // because we apply the template replacing in a JSON-stringified version of
                            // these properties, where these two characters are escaped.
                            p -> p.getKey().trim(), // .replaceAll("[\"\n\\\\]", "\\\\$0"),
                            Param::getValue,
                            // In case of a conflict, we pick the older value
                            (oldValue, newValue) -> oldValue)
                    );

            datasourceConfigurationTemp = variableSubstitution(datasource.getDatasourceConfiguration(), replaceParamsMap);
            actionConfigurationTemp = variableSubstitution(action.getActionConfiguration(), replaceParamsMap);
        } else {
            datasourceConfigurationTemp = datasource.getDatasourceConfiguration();
            actionConfigurationTemp = action.getActionConfiguration();
        }

        // If the action is paginated, update the configurations to update the correct URL.
        if (action.getActionConfiguration() != null &&
                action.getActionConfiguration().getPaginationType() != null &&
                PaginationType.URL.equals(action.getActionConfiguration().getPaginationType()) &&
                executeActionDTO.getPaginationField() != null) {
            datasourceConfiguration = updateDatasourceConfigurationForPagination(actionConfigurationTemp, datasourceConfigurationTemp, executeActionDTO.getPaginationField());
            actionConfiguration = updateActionConfigurationForPagination(actionConfigurationTemp, executeActionDTO.getPaginationField());
        } else {
            datasourceConfiguration = datasourceConfigurationTemp;
            actionConfiguration = actionConfigurationTemp;
        }

        // Filter out any empty headers
        if (actionConfiguration.getHeaders() != null && !actionConfiguration.getHeaders().isEmpty()) {
            List<Property> headerList = actionConfiguration.getHeaders().stream()
                    .filter(header -> !StringUtils.isEmpty(header.getKey()))
                    .collect(Collectors.toList());
            actionConfiguration.setHeaders(headerList);
        }
    }

    private ActionConfiguration updateActionConfigurationForPagination(ActionConfiguration actionConfiguration,
                                                                       PaginationField paginationField) {
        if (PaginationField.NEXT.equals(paginationField) || PaginationField.PREV.equals(paginationField)) {
            actionConfiguration.setPath("");
            actionConfiguration.setQueryParameters(null);
        }
        return actionConfiguration;
    }

    private DatasourceConfiguration updateDatasourceConfigurationForPagination(ActionConfiguration actionConfiguration,
                                                                               DatasourceConfiguration datasourceConfiguration,
                                                                               PaginationField paginationField) {
        if (PaginationField.NEXT.equals(paginationField)) {
            if (actionConfiguration.getNext() == null) {
                datasourceConfiguration.setUrl(null);
            } else {
                datasourceConfiguration.setUrl(URLDecoder.decode(actionConfiguration.getNext(), StandardCharsets.UTF_8));
            }
        } else if (PaginationField.PREV.equals(paginationField)) {
            datasourceConfiguration.setUrl(actionConfiguration.getPrev());
        }
        return datasourceConfiguration;
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
    public Flux<ActionViewDTO> getActionsForViewMode(String applicationId) {

        if (applicationId == null || applicationId.isEmpty()) {
            return Flux.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.APPLICATION_ID));
        }

        // fetch the published actions by applicationId
        // No need to sort the results
        return findAllByApplicationIdAndViewMode(applicationId, true, EXECUTE_ACTIONS, null)
                .map(action -> {
                    ActionViewDTO actionViewDTO = new ActionViewDTO();
                    actionViewDTO.setId(action.getId());
                    actionViewDTO.setName(action.getPublishedAction().getName());
                    actionViewDTO.setPageId(action.getPublishedAction().getPageId());
                    actionViewDTO.setConfirmBeforeExecute(action.getPublishedAction().getConfirmBeforeExecute());
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
            return repository
                    .findByApplicationIdAndViewMode(params.getFirst(FieldName.APPLICATION_ID), false, READ_ACTIONS)
                    .flatMap(this::setTransientFieldsInUnpublishedAction);
        }
        return repository.findAllActionsByNameAndPageIdsAndViewMode(name, pageIds, false, READ_ACTIONS, sort)
                .flatMap(this::setTransientFieldsInUnpublishedAction);
    }

    @Override
    public Mono<NewAction> save(NewAction action) {
        return repository.save(action);
    }

    @Override
    public Flux<NewAction> saveAll(List<NewAction> actions) {
        return repository.saveAll(actions);
    }

    @Override
    public Flux<NewAction> findByPageId(String pageId) {
        return repository.findByPageId(pageId);
    }

    @Override
    public Mono<Boolean> setOnLoad(List<ActionDTO> actions) {
        if (actions == null) {
            return Mono.just(FALSE);
        }

        List<ActionDTO> toUpdateActions = new ArrayList<>();

        for (ActionDTO action : actions) {
            // If a user has ever set execute on load, this field can not be changed automatically. It has to be
            // explicitly changed by the user again. Add the action to update only if this condition is false.
            if (FALSE.equals(action.getUserSetOnLoad())) {
                action.setExecuteOnLoad(TRUE);
                toUpdateActions.add(action);
            }
        }

        return Flux.fromIterable(toUpdateActions)
                .flatMap(actionDTO -> updateUnpublishedAction(actionDTO.getId(), actionDTO))
                .then(Mono.just(TRUE));
    }

    @Override
    public Mono<NewAction> delete(String id) {
        Mono<NewAction> actionMono = repository.findById(id)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ACTION, id)));
        return actionMono
                .flatMap(toDelete -> repository.delete(toDelete).thenReturn(toDelete))
                .flatMap(analyticsService::sendDeleteEvent);
    }

}
