package com.appsmith.server.services;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.PaginationField;
import com.appsmith.external.models.PaginationType;
import com.appsmith.external.models.Param;
import com.appsmith.external.models.Policy;
import com.appsmith.external.models.Provider;
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
import com.appsmith.server.dtos.ExecuteActionDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.ActionRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.mustachejava.DefaultMustacheFactory;
import com.github.mustachejava.Mustache;
import com.github.mustachejava.MustacheFactory;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.ArrayUtils;
import org.apache.commons.text.StringEscapeUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.lang.model.SourceVersion;
import javax.validation.Validator;
import javax.validation.constraints.NotNull;
import java.io.StringReader;
import java.io.StringWriter;
import java.io.UnsupportedEncodingException;
import java.io.Writer;
import java.net.URLDecoder;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.EXECUTE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.MANAGE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.MANAGE_PAGES;
import static com.appsmith.server.acl.AclPermission.READ_ACTIONS;
import static com.appsmith.server.acl.AclPermission.READ_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static com.appsmith.server.helpers.MustacheHelper.extractMustacheKeysFromJson;

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

        // Convert the object to String as a preparation to send it to mustache extraction
        try {
            String actionConfigStr = objectMapper.writeValueAsString(action.getActionConfiguration());
            return extractMustacheKeysFromJson(actionConfigStr);
        } catch (JsonProcessingException e) {
            log.error("Exception caught while extracting mustache keys from action configuration. ", e);
        }
        return new HashSet<>();
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
        if (params != null && !params.isEmpty()) {
            for (Param param : params) {
                if (param.getKey() == null || param.getKey().isEmpty()) {
                    continue;
                }

                // In case the parameter values turn out to be null, set it to empty string instead to allow the
                // the execution to go through no matter what.
                else if (param.getValue() == null) {
                    param.setValue("");
                } else {
                    String value = StringEscapeUtils.escapeJava(param.getValue());
                    param.setValue(value);
                }
            }
        }

        // 2. Fetch the query from the DB/from dto to get the type
        Mono<Action> actionMono;
        if (actionFromDto.getId() != null) {
            actionMono = repository.findById(actionFromDto.getId())
                    .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "action", actionFromDto.getId())))
                    .flatMap(action -> {
                        // This is separately done instead of fetching from the repository using id and isValid. This is
                        // because we want to error out with two different statuses -> Wrong action id OR Invalid action
                        if (Boolean.FALSE.equals(action.getIsValid())) {
                            return Mono.error(new AppsmithException(AppsmithError.INVALID_ACTION, action.getName(), action.getId()));
                        }
                        return Mono.just(action);
                    })
                    .cache();
        } else {
            actionMono = Mono.just(actionFromDto);
        }

        // 3. Instantiate the implementation class based on the query type

        Mono<Datasource> datasourceMono = actionMono
                .flatMap(action -> {
                    if (action.getPluginType() == PluginType.JS) {
                        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
                    }
                    if (action.getDatasource() != null && action.getDatasource().getId() != null) {
                        return datasourceService.findById(action.getDatasource().getId(), EXECUTE_DATASOURCES)
                                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "datasource")));
                    }
                    //The data source in the action has not been persisted.
                    if (action.getDatasource() != null) {
                        return Mono.just(action.getDatasource());
                    } else {
                        return Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "Valid action"));
                    }
                });

        Mono<Plugin> pluginMono = datasourceMono
                .flatMap(datasource -> {
                    if (datasource.getId() == null) {
                        return datasourceService.validateDatasource(datasource);
                    } else {
                        return Mono.just(datasource);
                    }
                })
                .flatMap(datasource -> {
                    Set<String> invalids = datasource.getInvalids();
                    if (!CollectionUtils.isEmpty(invalids)) {
                        return Mono.error(new AppsmithException(AppsmithError.INVALID_DATASOURCE, ArrayUtils.toString(invalids)));
                    }
                    return pluginService.findById(datasource.getPluginId());
                })
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "plugin")));

        Mono<PluginExecutor> pluginExecutorMono = pluginExecutorHelper.getPluginExecutor(pluginMono);

        // 4. Execute the query
        return actionMono
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
                                        p -> p.getKey().trim().replaceAll("[\"\\\\]", "\\\\$0"),
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

                    Integer timeoutDuration = actionConfiguration.getTimeoutInMillisecond();

                    log.debug("Execute Action called in Page {}, for action id : {}  action name : {}, {}, {}",
                            action.getPageId(), action.getId(), action.getName(), datasourceConfiguration,
                            actionConfiguration);

                    return datasourceContextService
                            .getDatasourceContext(datasource)
                            //Now that we have the context (connection details, execute the action
                            .flatMap(resourceContext -> pluginExecutor.execute(
                                    resourceContext.getConnection(),
                                    datasourceConfiguration,
                                    actionConfiguration))
                            .timeout(Duration.ofMillis(timeoutDuration));
                }))
                .flatMap(obj -> obj)
                .flatMap(res -> {
                    ActionExecutionResult result = (ActionExecutionResult) res;
                    Mono<ActionExecutionResult> resultMono = Mono.just(result);
                    if (actionFromDto.getId() == null) {
                        // This is a dry-run. We shouldn't query the db because it'll throw NPE on null IDs
                        return resultMono;
                    }

                    Mono<Action> actionFromDbMono = repository.findById(actionFromDto.getId())
                            //If the action is found in the db (i.e. it is not a dry run, save the cached response
                            .flatMap(action -> {
                                if (result.getIsExecutionSuccess()) {
                                    // If the plugin execution result is successful, then cache response body in
                                    // the action and save it.
                                    action.setCacheResponse(result.getBody().toString());
                                    return repository.save(action);
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
    public Mono<Action> findByNameAndPageId(String name, String pageId) {
        return repository.findByNameAndPageId(name, pageId, READ_ACTIONS);
    }

    @Override
    public Flux<Action> findDistinctRestApiActionsByNameInAndPageIdAndHttpMethod(Set<String> names, String pageId, String httpMethod) {
        return repository.findDistinctActionsByNameInAndPageIdAndActionConfiguration_HttpMethod(names, pageId,
                httpMethod, READ_ACTIONS);
    }

    /**
     * This function replaces the variables in the Object with the actual params
     */
    @Override
    public Object variableSubstitution(Object configuration,
                                       Map<String, String> replaceParamsMap) {
        try {
            // Convert the object to String as a preparation to send it to mustacheReplacement
            String objectInJsonString = objectMapper.writeValueAsString(configuration);
            objectInJsonString = mustacheReplacement(objectInJsonString, configuration.getClass().getSimpleName(), replaceParamsMap);
            return objectMapper.readValue(objectInJsonString, configuration.getClass());
        } catch (Exception e) {
            log.error("Exception caught while substituting values in mustache template.", e);
        }
        return configuration;
    }

    @Override
    public Mono<Action> findById(String id) {
        return repository.findById(id);
    }

    @Override
    public Flux<Action> findByPageId(String pageId, AclPermission permission) {
        return repository.findByPageId(pageId, permission);
    }

    /**
     * @param template    : This is the string which contains {{key}} which would be replaced with value
     * @param name        : This is the class name of the object from which template string was created
     * @param keyValueMap : This is the map of keys with values.
     * @return It finally returns the string in which all the keys in template have been replaced with values.
     */
    private String mustacheReplacement(String template, String name, Map<String, String> keyValueMap) {
        MustacheFactory mf = new DefaultMustacheFactory();
        Mustache mustache = mf.compile(new StringReader(template), name);
        Writer writer = new StringWriter();
        mustache.execute(writer, keyValueMap);

        return StringEscapeUtils.unescapeHtml4(writer.toString());
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
                        .findById(datasource.getId(), READ_DATASOURCES)
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
        Set<Policy> documentPolicies = policyGenerator.getAllChildPolicies(user, policySet, Page.class, Action.class);
        action.setPolicies(documentPolicies);
    }
}
