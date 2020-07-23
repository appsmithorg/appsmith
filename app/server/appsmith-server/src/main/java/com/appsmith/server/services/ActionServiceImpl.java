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
import com.appsmith.server.constants.AnalyticsEvents;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.ActionProvider;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.domains.Page;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.PluginType;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ActionViewDTO;
import com.appsmith.server.dtos.ExecuteActionDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.MustacheHelper;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.ActionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.ArrayUtils;
import org.springframework.beans.factory.annotation.Autowired;
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
import javax.validation.constraints.NotNull;
import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.EXECUTE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.EXECUTE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.MANAGE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.MANAGE_PAGES;
import static com.appsmith.server.acl.AclPermission.READ_ACTIONS;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;

@Slf4j
@Service
public class ActionServiceImpl extends BaseService<ActionRepository, Action, String> implements ActionService {

    private final ActionRepository repository;
    private final DatasourceService datasourceService;
    private final PluginService pluginService;
    private final PageService pageService;
    private final ObjectMapper objectMapper;
    private final DatasourceContextService datasourceContextService;
    private final PluginExecutorHelper pluginExecutorHelper;
    private final SessionUserService sessionUserService;
    private final MarketplaceService marketplaceService;
    private final PolicyGenerator policyGenerator;

    @Autowired
    public ActionServiceImpl(Scheduler scheduler,
                             Validator validator,
                             MongoConverter mongoConverter,
                             ReactiveMongoTemplate reactiveMongoTemplate,
                             ActionRepository repository,
                             DatasourceService datasourceService,
                             PluginService pluginService,
                             PageService pageService,
                             AnalyticsService analyticsService,
                             ObjectMapper objectMapper,
                             DatasourceContextService datasourceContextService,
                             PluginExecutorHelper pluginExecutorHelper,
                             SessionUserService sessionUserService,
                             MarketplaceService marketplaceService,
                             PolicyGenerator policyGenerator) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.repository = repository;
        this.datasourceService = datasourceService;
        this.pluginService = pluginService;
        this.pageService = pageService;
        this.objectMapper = objectMapper;
        this.datasourceContextService = datasourceContextService;
        this.pluginExecutorHelper = pluginExecutorHelper;
        this.sessionUserService = sessionUserService;
        this.marketplaceService = marketplaceService;
        this.policyGenerator = policyGenerator;
    }

    private Boolean validateActionName(String name) {
        boolean isValidName = SourceVersion.isName(name);
        String pattern = "^((?=[A-Za-z0-9_])(?![\\\\-]).)*$";
        boolean doesPatternMatch = name.matches(pattern);
        return (isValidName && doesPatternMatch);
    }

    @Override
    public Mono<Action> create(@NotNull Action action) {
        if (action.getId() != null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "id"));
        }

        if (action.getPageId() == null || action.getPageId().isBlank()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.PAGE_ID));
        }

        Mono<User> userMono = sessionUserService
                .getCurrentUser()
                .cache();

        return pageService
                .findById(action.getPageId(), READ_PAGES)
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "page", action.getPageId())))
                .zipWith(userMono)
                .flatMap(tuple -> {
                    Page page = tuple.getT1();
                    User user = tuple.getT2();

                    // Inherit the action policies from the page.
                    generateAndSetActionPolicies(page, user, action);

                    // If the datasource is embedded, check for organizationId and set it in action
                    if (action.getDatasource() != null &&
                            action.getDatasource().getId() == null) {
                        Datasource datasource = action.getDatasource();
                        if (datasource.getOrganizationId() == null) {
                            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ORGANIZATION_ID));
                        }
                        action.setOrganizationId(datasource.getOrganizationId());
                    }

                    return Mono.just(action);
                })
                .flatMap(this::validateAndSaveActionToRepository);
    }

    @Override
    public Mono<Action> validateAndSaveActionToRepository(Action action) {
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
            return super.create(action);
        }

        Mono<Datasource> datasourceMono;
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
                        action.setOrganizationId(datasource.getOrganizationId());
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
                    action.setPluginType(plugin.getType());
                    return action;
                }).map(act -> extractAndSetJsonPathKeys(act))
                .flatMap(super::create)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.REPOSITORY_SAVE_FAILED)))
                .flatMap(this::setTransientFieldsInAction);
    }

    /**
     * This function extracts all the mustache template keys (as per the regex) and returns them to the calling fxn
     * This set of keys is stored separately in the field `jsonPathKeys` in the action object. The client
     * uses the set `jsonPathKeys` to simplify it's value substitution.
     *
     * @param action
     * @return
     */
    private Set<String> extractKeysFromAction(Action action) {
        if (action.getActionConfiguration() == null) {
            return new HashSet<>();
        }

        return MustacheHelper.extractMustacheKeysFromFields(action.getActionConfiguration());
    }

    /**
     * This function extracts the mustache keys and sets them in the field jsonPathKeys in the action object
     *
     * @param action
     * @return
     */
    public Action extractAndSetJsonPathKeys(Action action) {
        Set<String> actionKeys = extractKeysFromAction(action);
        Set<String> datasourceKeys = datasourceService.extractKeysFromDatasource(action.getDatasource());
        Set<String> keys = new HashSet<String>() {{
            addAll(actionKeys);
            addAll(datasourceKeys);
        }};
        action.setJsonPathKeys(keys);
        return action;
    }

    @Override
    public Mono<ActionExecutionResult> executeAction(ExecuteActionDTO executeActionDTO) {
        Action actionFromDto = executeActionDTO.getAction();

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

        // 2. Fetch the query from the DB/from dto to get the type
        Mono<Action> actionMono;
        if (actionFromDto.getId() != null) {
            actionMono = repository.findById(actionFromDto.getId(), EXECUTE_ACTIONS)
                    .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "action", actionFromDto.getId())))
                    .flatMap(action -> {
                        // This is separately done instead of fetching from the repository using id and isValid. This is
                        // because we want to error out with two different statuses -> Wrong action id OR Invalid action
                        if (Boolean.FALSE.equals(action.getIsValid())) {
                            return Mono.error(new AppsmithException(
                                    AppsmithError.INVALID_ACTION,
                                    action.getName(),
                                    action.getId(),
                                    ArrayUtils.toString(action.getInvalids().toArray())
                            ));
                        }
                        return Mono.just(action);
                    })
                    .cache();
        } else {
            actionMono = Mono.just(actionFromDto).cache();
        }

        // 3. Instantiate the implementation class based on the query type

        Mono<Datasource> datasourceMono = actionMono
                .flatMap(action -> {
                    if (action.getPluginType() == PluginType.JS) {
                        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
                    }
                    if (action.getDatasource() != null && action.getDatasource().getId() != null) {
                        return datasourceService.findById(action.getDatasource().getId(), EXECUTE_DATASOURCES)
                                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.DATASOURCE)));
                    }
                    //The data source in the action has not been persisted.
                    if (action.getDatasource() != null) {
                        return Mono.just(action.getDatasource());
                    } else {
                        return Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "Valid action"));
                    }
                })
                .cache();

        Mono<Plugin> pluginMono = datasourceMono
                .flatMap(datasource -> {
                    // For embedded datasources/dry runs, validate the datasource for each execution
                    if (datasource.getId() == null) {
                        return datasourceService.validateDatasource(datasource);
                    }

                    return Mono.just(datasource);
                })
                .flatMap(datasource -> {
                    Set<String> invalids = datasource.getInvalids();
                    if (!CollectionUtils.isEmpty(invalids)) {
                        log.error("Unable to execute actionId: {} because it's datasource is not valid. Cause: {}",
                                actionFromDto.getId(), ArrayUtils.toString(invalids));
                        return Mono.error(new AppsmithException(AppsmithError.INVALID_DATASOURCE, ArrayUtils.toString(invalids)));
                    }
                    return pluginService.findById(datasource.getPluginId());
                })
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "plugin")));

        Mono<PluginExecutor> pluginExecutorMono = pluginExecutorHelper.getPluginExecutor(pluginMono);

        // 4. Execute the query
        Mono<ActionExecutionResult> actionExecutionResultMono = actionMono
                .flatMap(action -> datasourceMono.zipWith(pluginExecutorMono, (datasource, pluginExecutor) -> {
                    DatasourceConfiguration datasourceConfigurationTemp;
                    ActionConfiguration actionConfigurationTemp;
                    //Do variable substitution before invoking the plugin
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

                        datasourceConfigurationTemp = (DatasourceConfiguration) variableSubstitution(datasource.getDatasourceConfiguration(), replaceParamsMap);
                        actionConfigurationTemp = (ActionConfiguration) variableSubstitution(action.getActionConfiguration(), replaceParamsMap);
                    } else {
                        datasourceConfigurationTemp = datasource.getDatasourceConfiguration();
                        actionConfigurationTemp = action.getActionConfiguration();
                    }

                    DatasourceConfiguration datasourceConfiguration;
                    ActionConfiguration actionConfiguration;

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

                    Integer timeoutDuration = actionConfiguration.getTimeoutInMillisecond();

                    log.debug("Execute Action called in Page {}, for action id : {}  action name : {}, {}, {}",
                            action.getPageId(), action.getId(), action.getName(), datasourceConfiguration,
                            actionConfiguration);

                    Mono<Object> executionMono = Mono.just(datasource)
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
                            .onErrorResume(e -> {
                                log.debug("In the action execution error mode.", e);
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
                }))
                .flatMap(obj -> obj)
                .map(obj -> (ActionExecutionResult) obj);

                // Populate the actionExecution result by setting the cached response and saving it to the DB
                return actionExecutionResultMono.flatMap(result -> {
                            Mono<ActionExecutionResult> resultMono = Mono.just(result);
                            if (actionFromDto.getId() == null) {
                                // This is a dry-run. We shouldn't query the db because it'll throw NPE on null IDs
                                return resultMono;
                            }

                            Mono<Action> actionFromDbMono = repository.findById(actionFromDto.getId())
                                    //If the action is found in the db (i.e. it is not a dry run, save the cached response
                                    .flatMap(action -> {
                                        // If the plugin execution result is successful, then cache response body in
                                        // the action and save it.
                                        if (result.getIsExecutionSuccess()) {
                                            // Save the result only if body exists in the body. e.g. Even though 204
                                            // is an execution success, there would be no body expected.
                                            if (result.getBody() != null) {
                                                action.setCacheResponse(result.getBody().toString());
                                                return repository.save(action);
                                            }
                                            // No result body exists. Return the action as is.
                                            return Mono.just(action);
                                        }
                                        log.debug("Action execution resulted in failure beyond the proxy with the result of {}", result);
                                        return Mono.just(action);
                                    });
                            return actionFromDbMono.zipWith(resultMono)
                                    .map(tuple -> {
                                        ActionExecutionResult executionResult = tuple.getT2();
                                        return executionResult;
                                    });
                        });
    }

    @Override
    public Mono<Action> save(Action action) {
        return repository.save(action);
    }

    @Override
    public Mono<Action> findByNameAndPageId(String name, String pageId, AclPermission permission) {
        return repository.findByNameAndPageId(name, pageId, permission);
    }

    /**
     * Given a list of names of actions and pageId, find all the actions matching this criteria of name, pageId, http
     * method 'GET' (for API actions only) or have isExecuteOnLoad be true.
     *
     * @param names Set of Action names. The returned list of actions will be a subset of the actioned named in this set.
     * @param pageId Id of the Page within which to look for Actions.
     * @return A Flux of Actions that are identified to be executed on page-load.
     */
    public Flux<Action> findOnLoadActionsInPage(Set<String> names, String pageId) {
        final Flux<Action> getApiActions = repository
                .findDistinctActionsByNameInAndPageIdAndActionConfiguration_HttpMethod(names, pageId, "GET");

        final Flux<Action> explicitOnLoadActions = repository
                .findDistinctActionsByNameInAndPageIdAndExecuteOnLoadTrue(names, pageId);

        return getApiActions.concatWith(explicitOnLoadActions);
    }

    /**
     * This function replaces the variables in the Object with the actual params
     */
    @Override
    public <T> T variableSubstitution(T configuration, Map<String, String> replaceParamsMap) {
        return MustacheHelper.renderFieldValues(configuration, replaceParamsMap);
    }

    @Override
    public Mono<Action> findById(String id) {
        return repository.findById(id);
    }

    @Override
    public Flux<Action> findByPageId(String pageId, AclPermission permission) {
        return repository.findByPageId(pageId, permission);
    }

    @Override
    public Flux<ActionViewDTO> getActionsForViewMode(String applicationId) {
        Sort sort = Sort.by(FieldName.NAME);
        if (applicationId == null || applicationId.isEmpty()) {
            return Flux.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.APPLICATION_ID));
        }

        return pageService
                .findNamesByApplicationId(applicationId)
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.NO_RESOURCE_FOUND, "pages for application", applicationId))
                )
                .map(applicationPagesDTO -> applicationPagesDTO.getPages())
                .flatMapMany(Flux::fromIterable)
                .map(pageNameIdDTO -> pageNameIdDTO.getId())
                .collectList()
                // Since this is to fetch actions just for execution, instead of reading actions with READ_ACTIONS permission
                // read actions with EXECUTE_ACTIONS permission only
                .flatMapMany(pages -> repository.findAllActionsByNameAndPageIds(null, pages, EXECUTE_ACTIONS, sort))
                .map(action -> {
                    ActionViewDTO actionViewDTO = new ActionViewDTO();
                    actionViewDTO.setId(action.getId());
                    actionViewDTO.setName(action.getName());
                    actionViewDTO.setPageId(action.getPageId());
                    if (action.getJsonPathKeys() != null && !action.getJsonPathKeys().isEmpty()) {
                        Set<String> jsonPathKeys;
                        jsonPathKeys = new HashSet<>();
                        jsonPathKeys.addAll(action.getJsonPathKeys());
                        actionViewDTO.setJsonPathKeys(jsonPathKeys);
                    }
                    if (action.getActionConfiguration() != null) {
                        actionViewDTO.setTimeoutInMillisecond(action.getActionConfiguration().getTimeoutInMillisecond());
                    }
                    return actionViewDTO;
                });
    }

    @Override
    public Mono<Action> delete(String id) {
        Mono<Action> actionMono = repository.findById(id)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "action", id)));
        return actionMono
                .flatMap(toDelete -> repository.delete(toDelete).thenReturn(toDelete))
                .flatMap(deletedObj -> analyticsService.sendEvent(AnalyticsEvents.DELETE + "_" + deletedObj.getClass().getSimpleName().toUpperCase(), (Action) deletedObj));
    }

    @Override
    public Flux<Action> get(MultiValueMap<String, String> params) {
        String name = null;
        List<String> pageIds = new ArrayList<>();
        Sort sort = Sort.by(FieldName.NAME);

        if (params.getFirst(FieldName.NAME) != null) {
            name = params.getFirst(FieldName.NAME);
        }

        if (params.getFirst(FieldName.PAGE_ID) != null) {
            pageIds.add(params.getFirst(FieldName.PAGE_ID));
        }

        if (params.getFirst(FieldName.APPLICATION_ID) != null) {
            String finalName = name;
            return pageService
                    .findNamesByApplicationId(params.getFirst(FieldName.APPLICATION_ID))
                    .switchIfEmpty(Mono.error(new AppsmithException(
                            AppsmithError.NO_RESOURCE_FOUND, "pages for application", params.getFirst(FieldName.APPLICATION_ID)))
                    )
                    .map(applicationPagesDTO -> applicationPagesDTO.getPages())
                    .flatMapMany(Flux::fromIterable)
                    .map(pageNameIdDTO -> pageNameIdDTO.getId())
                    .collectList()
                    .flatMapMany(pages -> {
                        pageIds.addAll(pages);
                        return repository.findAllActionsByNameAndPageIds(finalName, pageIds, READ_ACTIONS, sort);
                    })
                    .flatMap(this::setTransientFieldsInAction);
        }
        return repository.findAllActionsByNameAndPageIds(name, pageIds, READ_ACTIONS, sort)
                .flatMap(this::setTransientFieldsInAction);
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
            try {
                datasourceConfiguration.setUrl(URLDecoder.decode(actionConfiguration.getNext(), "UTF-8"));
            } catch (UnsupportedEncodingException e) {
                e.printStackTrace();
            }
        } else if (PaginationField.PREV.equals(paginationField)) {
            datasourceConfiguration.setUrl(actionConfiguration.getPrev());
        }
        return datasourceConfiguration;
    }

    private Mono<Action> setTransientFieldsInAction(Action action) {

        // Set the plugin id in the action object fetching it from the datasource.

        Mono<Action> pluginIdUpdateMono = null;
        Datasource datasource = action.getDatasource();
        if (datasource != null) {
            if (datasource.getId() != null) {
                // its a global datasource. Get the datasource from the collection
                pluginIdUpdateMono = datasourceService
                        .findById(datasource.getId())
                        .map(datasource1 -> {
                            action.setPluginId(datasource1.getPluginId());
                            return action;
                        });
            } else {
                // Its a nested datasource. Pick up the pluginId from here
                pluginIdUpdateMono = Mono.just(action)
                        .map(action1 -> {
                            action1.setPluginId(datasource.getPluginId());
                            return action1;
                        });
            }
        }

        // In case of an action which was imported from a 3P API, fill in the extra information of the provider required by the front end UI.
        Mono<Action> providerUpdateMono = null;
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

        return Mono.zip(pluginIdUpdateMono, providerUpdateMono)
                .map(tuple -> {
                    Action pluginIdUpdatedAction = tuple.getT1();
                    Action providerUpdatedAction = tuple.getT2();

                    providerUpdatedAction.setPluginId(pluginIdUpdatedAction.getPluginId());
                    return providerUpdatedAction;
                });
    }

    private void generateAndSetActionPolicies(Page page, User user, Action action) {
        Set<Policy> policySet = page.getPolicies().stream()
                .filter(policy -> policy.getPermission().equals(MANAGE_PAGES.getValue())
                        || policy.getPermission().equals(READ_PAGES.getValue()))
                .collect(Collectors.toSet());
        Set<Policy> documentPolicies = policyGenerator.getAllChildPolicies(policySet, Page.class, Action.class);
        action.setPolicies(documentPolicies);
    }
}
