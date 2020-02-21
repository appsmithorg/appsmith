package com.appsmith.server.services;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.PaginationField;
import com.appsmith.external.models.PaginationType;
import com.appsmith.external.models.Param;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.constants.AnalyticsEvents;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.PluginType;
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
import org.apache.commons.lang.StringEscapeUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Example;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
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
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static com.appsmith.server.helpers.BeanCopyUtils.copyNewFieldValuesIntoOldObject;
import static com.appsmith.server.helpers.MustacheHelper.extractMustacheKeys;

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
                             SessionUserService sessionUserService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.repository = repository;
        this.datasourceService = datasourceService;
        this.pluginService = pluginService;
        this.pageService = pageService;
        this.objectMapper = objectMapper;
        this.datasourceContextService = datasourceContextService;
        this.pluginExecutorHelper = pluginExecutorHelper;
        this.sessionUserService = sessionUserService;
    }

    /**
     * This function updates an existing action in the DB. We are completely overriding the base update function to
     * ensure that we can populate the JsonPathKeys field in the ActionConfiguration based on any changes that may
     * have happened in the action object.
     * <p>
     * Calling the base function would make redundant DB calls and slow down this API unnecessarily.
     *
     * @param id
     * @param action
     * @return
     */
    @Override
    public Mono<Action> update(String id, Action action) {
        Set<String> invalids = new HashSet<>();
        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }

        Mono<Action> replaceOrCreateNewDataSourceMono = replaceOrCreateNewDataSource(action);
        Mono<Action> dbActionMono = repository.findById(id)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "action", id)));

        return Mono.zip(replaceOrCreateNewDataSourceMono, dbActionMono)
                .map(tuple -> {
                    Action updatedActionWithDatasource = tuple.getT1();
                    Action dbAction = tuple.getT2();
                    copyNewFieldValuesIntoOldObject(updatedActionWithDatasource, dbAction);
                    return dbAction;
                })
                .flatMap(this::validateAndSaveActionToRepository)
                .map(act -> {
                            analyticsService
                                    .sendEvent(AnalyticsEvents.UPDATE + "_" + act.getClass().getSimpleName().toUpperCase(),
                                            act);
                            return act;
                        }
                );
    }

    private Mono<Action> replaceOrCreateNewDataSource(Action action) {
        Datasource datasource = action.getDatasource();
        if (datasource != null) {
            //Update action contains a change for datasource
            if (datasource.getId() != null) {
                //Datasource changed to another existing data source. Confirm and return.
                return datasourceService.findById(datasource.getId())
                        .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "datasource", datasource.getId())))
                        .map(datasource1 -> {
                            action.setDatasource(datasource1);
                            action.setDatasourceId(datasource1.getId());
                            return action;
                        });
            }

            //New datasource needs to be created here.
            return datasourceService.create(datasource)
                    .map(datasource1 -> {
                        action.setDatasource(datasource1);
                        action.setDatasourceId(datasource1.getId());
                        return action;
                    });
        }
        //No changes in the datasource.
        return Mono.just(action);
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
        return sessionUserService.getCurrentUser()
                .map(user -> user.getCurrentOrganizationId())
                .map(orgId -> {
                    action.setOrganizationId(orgId);
                    return action;
                })
                .flatMap(this::validateAndSaveActionToRepository);
    }

    private Mono<Action> validateAndSaveActionToRepository(Action action) {
        //Default the validity to true and invalids to be an empty set.
        Set<String> invalids = new HashSet<>();
        action.setIsValid(true);

        if (action.getName() == null || action.getName().trim().isEmpty()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.NAME));
        }

        if (!validateActionName(action.getName())) {
            action.setIsValid(false);
            invalids.add(AppsmithError.INVALID_ACTION_NAME.getMessage());
        }

        if (action.getActionConfiguration() == null) {
            action.setIsValid(false);
            invalids.add(AppsmithError.NO_CONFIGURATION_FOUND_IN_ACTION.getMessage());
        }

        if (action.getDatasource() == null) {
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
            datasourceMono = datasourceService.findById(action.getDatasource().getId())
                    .switchIfEmpty(Mono.defer(() -> {
                        action.setIsValid(false);
                        invalids.add(AppsmithError.NO_RESOURCE_FOUND.getMessage(FieldName.DATASOURCE, action.getDatasourceId()));
                        return Mono.just(action.getDatasource());
                    }));
        }

        Mono<Plugin> pluginMono = datasourceMono.flatMap(datasource -> pluginService.findById(datasource.getPluginId())
                .switchIfEmpty(Mono.defer(() -> {
                    action.setIsValid(false);
                    invalids.add(AppsmithError.NO_RESOURCE_FOUND.getMessage(FieldName.PLUGIN, datasource.getPluginId()));
                    return Mono.just(new Plugin());
                })));

        return pluginMono
                .zipWith(datasourceMono)
                //Set plugin in the action before saving.
                .map(tuple -> {
                    Plugin plugin = tuple.getT1();
                    Datasource datasource = tuple.getT2();
                    action.setDatasource(datasource);
                    action.setDatasourceId(datasource.getId());
                    action.setInvalids(invalids);
                    action.setPluginType(plugin.getType());
                    return action;
                }).map(act -> extractAndSetJsonPathKeys(act))
                .flatMap(super::create)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.REPOSITORY_SAVE_FAILED)));
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
            return extractMustacheKeys(actionConfigStr);
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
                        if (action.getIsValid() == false) {
                            return Mono.error(new AppsmithException(AppsmithError.INVALID_ACTION));
                        }
                        return Mono.just(action);
                    });
        } else {
            actionMono = Mono.just(actionFromDto);
        }

        // 3. Instantiate the implementation class based on the query type

        Mono<Datasource> datasourceMono = actionMono
                .flatMap(action -> {
                    if (action.getPluginType() == PluginType.JS) {
                        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
                    }
                    if (action.getDatasourceId() != null) {
                        return datasourceService.findById(action.getDatasourceId());
                    } else if (action.getDatasource() != null && action.getDatasource().getId() != null) {
                        return datasourceService.findById(action.getDatasource().getId());
                    }
                    //The data source in the action has not been persisted.
                    if (action.getDatasource() != null) {
                        return Mono.just(action.getDatasource());
                    } else {
                        return Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "Valid action"));
                    }
                })
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "resource")));

        Mono<Plugin> pluginMono = datasourceMono
                .flatMap(datasource -> {
                    if (datasource.getIsValid() != null && datasource.getIsValid() == false) {
                        return Mono.error(new AppsmithException(AppsmithError.INVALID_DATASOURCE));
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
                                .collect(Collectors.toMap(Param::getKey, Param::getValue,
                                        // In case of a conflict, we pick the older value
                                        (oldValue, newValue) -> oldValue)
                                );
                        datasourceConfigurationTemp = (DatasourceConfiguration) variableSubstitution(datasource.getDatasourceConfiguration(), replaceParamsMap);
                        actionConfigurationTemp = (ActionConfiguration) variableSubstitution(action.getActionConfiguration(), replaceParamsMap);

                        // If the action has a body (for RestAPI), then unescape HTML in the string.
                        if (actionConfigurationTemp.getBody() != null) {
                            actionConfigurationTemp.setBody(StringEscapeUtils.unescapeHtml(actionConfigurationTemp.getBody()));
                        }

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
                                if (result.getStatusCode().charAt(0) == '2') {
                                    //If the status code is 2xx, then save the cached response (aka the body) and return.
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
        return repository.findByNameAndPageId(name, pageId);
    }

    @Override
    public Flux<Action> findDistinctRestApiActionsByNameInAndPageIdAndHttpMethod(Set<String> names, String pageId, String httpMethod) {
        return repository.findDistinctActionsByNameInAndPageIdAndActionConfiguration_HttpMethod(names, pageId, httpMethod);
    }

    /**
     * This function replaces the variables in the Object with the actual params
     */
    public Object variableSubstitution(Object configuration,
                                       Map<String, String> replaceParamsMap) {

        try {
            // Convert the object to String as a preparation to send it to mustacheReplacement
            String objectInJsonString = objectMapper.writeValueAsString(configuration);
            objectInJsonString = mustacheReplacement(objectInJsonString, configuration.getClass().getSimpleName(), replaceParamsMap);
            Pattern pattern = Pattern.compile("&#61;");
            Matcher matcher = pattern.matcher(objectInJsonString);
            String res = matcher.replaceAll("=");
            return objectMapper.readValue(res, configuration.getClass());
        } catch (Exception e) {
            log.error("Exception caught while substituting values in mustache template.", e);
        }
        return configuration;
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

        return writer.toString();
    }

    @Override
    public Mono<Action> delete(String id) {
        Mono<Action> actionMono = repository.findById(id)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "action", id)));
        return actionMono
                .flatMap(toDelete ->
                        repository.delete(toDelete)
                                .thenReturn(toDelete))
                .map(deletedObj -> {
                    analyticsService.sendEvent(AnalyticsEvents.DELETE + "_" + deletedObj.getClass().getSimpleName().toUpperCase(), (Action) deletedObj);
                    return (Action) deletedObj;
                });
    }

    @Override
    public Flux<Action> get(MultiValueMap<String, String> params) {
        Action actionExample = new Action();
        Sort sort = Sort.by(FieldName.NAME);

        if (params.getFirst(FieldName.NAME) != null) {
            actionExample.setName(params.getFirst(FieldName.NAME));
        }

        if (params.getFirst(FieldName.PAGE_ID) != null) {
            actionExample.setPageId(params.getFirst(FieldName.PAGE_ID));
        }

        Mono<String> orgIdMono = sessionUserService
                .getCurrentUser()
                .map(user -> user.getCurrentOrganizationId());

        if (params.getFirst(FieldName.APPLICATION_ID) != null) {
            return orgIdMono
                    .flatMapMany(orgId -> pageService
                            .findNamesByApplicationId(params.getFirst(FieldName.APPLICATION_ID))
                            .switchIfEmpty(Mono.error(new AppsmithException(
                                    AppsmithError.NO_RESOURCE_FOUND, "pages for application", params.getFirst(FieldName.APPLICATION_ID)))
                            )
                            .map(pageNameIdDTO -> {
                                Action example = new Action();
                                example.setPageId(pageNameIdDTO.getId());
                                example.setOrganizationId(orgId);
                                return example;
                            })
                            .flatMap(example -> repository.findAll(Example.of(example), sort)));
        }
        return orgIdMono
                .flatMapMany(orgId -> {
                    actionExample.setOrganizationId(orgId);
                    return repository.findAll(Example.of(actionExample), sort);
                });
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
}
