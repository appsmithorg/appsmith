package com.appsmith.server.services;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.Param;
import com.appsmith.external.models.ResourceConfiguration;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.Page;
import com.appsmith.server.domains.PageAction;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Resource;
import com.appsmith.server.domains.ResourceContext;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ExecuteActionDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.ActionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.mustachejava.DefaultMustacheFactory;
import com.github.mustachejava.Mustache;
import com.github.mustachejava.MustacheFactory;
import com.segment.analytics.Analytics;
import lombok.extern.slf4j.Slf4j;
import org.pf4j.PluginManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import javax.validation.constraints.NotNull;
import java.io.StringReader;
import java.io.StringWriter;
import java.io.Writer;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ActionServiceImpl extends BaseService<ActionRepository, Action, String> implements ActionService {

    private final ActionRepository repository;
    private final ResourceService resourceService;
    private final PluginService pluginService;
    private final PageService pageService;
    private final PluginManager pluginManager;
    private final ObjectMapper objectMapper;
    private final ResourceContextService resourceContextService;

    @Autowired
    public ActionServiceImpl(Scheduler scheduler,
                             Validator validator,
                             MongoConverter mongoConverter,
                             ReactiveMongoTemplate reactiveMongoTemplate,
                             ActionRepository repository,
                             ResourceService resourceService,
                             PluginService pluginService,
                             PageService pageService,
                             PluginManager pluginManager,
                             Analytics analytics,
                             SessionUserService sessionUserService,
                             ObjectMapper objectMapper, ResourceContextService resourceContextService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analytics, sessionUserService);
        this.repository = repository;
        this.resourceService = resourceService;
        this.pluginService = pluginService;
        this.pageService = pageService;
        this.pluginManager = pluginManager;
        this.objectMapper = objectMapper;
        this.resourceContextService = resourceContextService;
    }

    @Override
    public Mono<Action> create(@NotNull Action action) {
        if (action.getId() != null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "id"));
        } else if (action.getResourceId() == null) {
            return Mono.error(new AppsmithException(AppsmithError.RESOURCE_ID_NOT_GIVEN));
        } else if (action.getPageId() == null) {
            return Mono.error(new AppsmithException(AppsmithError.PAGE_ID_NOT_GIVEN));
        }

        Mono<User> userMono = super.sessionUserService.getCurrentUser();
        Mono<Resource> resourceMono = resourceService.findById(action.getResourceId());
        Mono<Plugin> pluginMono = resourceMono.flatMap(resource -> pluginService.findById(resource.getPluginId()));
        Mono<Page> pageMono = pageService.findById(action.getPageId());
        Mono<Action> savedActionMono = pluginMono
                //Set plugin in the action before saving.
                .map(plugin -> {
                    action.setPluginId(plugin.getId());
                    return action;
                })
                .flatMap(repository::save)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.REPOSITORY_SAVE_FAILED)));

        return savedActionMono
                //Now that the action has been stored, add it to the page
                .flatMap(action1 -> {
                    return pageMono
                            .map(page -> {
                                PageAction pageAction = new PageAction();
                                pageAction.setId(action1.getId());
                                pageAction.setName(action1.getName());
                                pageAction.setJsonPathKeys(new ArrayList<>());

                                List<PageAction> actions = page.getActions();

                                if (actions == null) {
                                    actions = new ArrayList<>();
                                }

                                actions.add(pageAction);
                                page.setActions(actions);
                                return page;
                            })
                            .flatMap(pageService::save)
                            .then(Mono.just(action1))
                            //Now publish this event
                            .flatMap(this::segmentTrackCreate);
                });
    }

    @Override
    public Mono<ActionExecutionResult> executeAction(ExecuteActionDTO executeActionDTO) {
        String actionId = executeActionDTO.getActionId();

        // 1. Fetch the query from the DB to get the type
        Mono<Action> actionMono = repository.findById(actionId)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "action", actionId)));

        // 2. Instantiate the implementation class based on the query type
        Mono<Plugin> pluginMono = actionMono.flatMap(action -> pluginService.findById(action.getPluginId()))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "plugin")));

        Mono<Resource> resourceMono = actionMono.flatMap(action -> resourceService.findById(action.getResourceId()))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "resource")));

        Mono<PluginExecutor> pluginExecutorMono = pluginMono.flatMap(plugin -> {
                    List<PluginExecutor> executorList = pluginManager.getExtensions(PluginExecutor.class, plugin.getExecutorClass());
                    if (executorList.isEmpty()) {
                        return Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "plugin", plugin.getExecutorClass()));
                    }
                    return Mono.just(executorList.get(0));
                }
        );


        // 3. Execute the query
        return actionMono
                    .flatMap(action -> resourceMono.zipWith(pluginExecutorMono, (resource, pluginExecutor) -> {
                        ResourceConfiguration resourceConfiguration;
                        ActionConfiguration actionConfiguration;
                        //Do variable substitution before invoking the plugin
                        //Do this only if params have been provided in the execute command
                        if (executeActionDTO.getParams() != null && !executeActionDTO.getParams().isEmpty()) {
                            Map<String, String> replaceParamsMap = executeActionDTO
                                    .getParams()
                                    .stream()
                                    .collect(Collectors.toMap(Param::getKey, Param::getValue,
                                            // Incase there's a conflict, we pick the older value
                                            (oldValue, newValue) -> oldValue)
                                    );
                            resourceConfiguration = (ResourceConfiguration) variableSubstitution(resource.getResourceConfiguration(), replaceParamsMap);
                            actionConfiguration = (ActionConfiguration) variableSubstitution(action.getActionConfiguration(), replaceParamsMap);
                        } else {
                            resourceConfiguration = resource.getResourceConfiguration();
                            actionConfiguration = action.getActionConfiguration();
                        }

                        return resourceContextService
                                    .getResourceContext(resource.getId())
                                //Now that we have the context (connection details, execute the action
                                    .flatMap(resourceContext -> pluginExecutor.execute(
                                                                                  resourceContext.getConnection(),
                                                                                  resourceConfiguration,
                                                                                  actionConfiguration));
                    }))
                    .flatMap(obj -> obj);
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
            return objectMapper.readValue(objectInJsonString, configuration.getClass());
        } catch (Exception e) {
            e.printStackTrace();
        }
        return configuration;
    }

    /**
     *
     * @param template : This is the string which contains {{key}} which would be replaced with value
     * @param name : This is the class name of the object from which template string was created
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
}
