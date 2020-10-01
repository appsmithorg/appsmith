package com.appsmith.server.services;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Page;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.NewActionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.lang.model.SourceVersion;
import javax.validation.Validator;
import javax.validation.constraints.NotNull;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.READ_PAGES;

public class NewActionServiceImpl extends BaseService<NewActionRepository, NewAction, String> implements NewActionService {

    private final NewActionRepository repository;
    private final DatasourceService datasourceService;
    private final PluginService pluginService;
    private final ObjectMapper objectMapper;
    private final DatasourceContextService datasourceContextService;
    private final PluginExecutorHelper pluginExecutorHelper;
    private final SessionUserService sessionUserService;
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
                                ObjectMapper objectMapper,
                                DatasourceContextService datasourceContextService,
                                PluginExecutorHelper pluginExecutorHelper,
                                SessionUserService sessionUserService,
                                MarketplaceService marketplaceService,
                                PolicyGenerator policyGenerator,
                                NewPageService newPageService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.repository = repository;
        this.datasourceService = datasourceService;
        this.pluginService = pluginService;
        this.objectMapper = objectMapper;
        this.datasourceContextService = datasourceContextService;
        this.pluginExecutorHelper = pluginExecutorHelper;
        this.sessionUserService = sessionUserService;
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

    private ActionDTO generateDTOFromAction(Action action) {
        ActionDTO actionDTO = new ActionDTO();
        actionDTO.setName(action.getName());
        actionDTO.setDatasource(action.getDatasource());
        actionDTO.setPageId(action.getPageId());
        actionDTO.setActionConfiguration(action.getActionConfiguration());
        actionDTO.setExecuteOnLoad(action.getExecuteOnLoad());
        actionDTO.setDynamicBindingPathList(action.getDynamicBindingPathList());
        actionDTO.setIsValid(action.getIsValid());
        actionDTO.setInvalids(action.getInvalids());
        actionDTO.setJsonPathKeys(action.getJsonPathKeys());
        actionDTO.setCacheResponse(action.getCacheResponse());
        actionDTO.setUserSetOnLoad(action.getUserSetOnLoad());
        actionDTO.setConfirmBeforeExecute(action.getConfirmBeforeExecute());

        return actionDTO;
    }

    private Action createActionFromDTO(ActionDTO actionDTO) {
        Action action = new Action();
        action.setName(actionDTO.getName());
        action.setDatasource(actionDTO.getDatasource());
        action.setPageId(actionDTO.getPageId());
        action.setCollectionId(actionDTO.getCollectionId());
        action.setActionConfiguration(actionDTO.getActionConfiguration());
        action.setExecuteOnLoad(actionDTO.getExecuteOnLoad());
        action.setDynamicBindingPathList(actionDTO.getDynamicBindingPathList());
        action.setIsValid(actionDTO.getIsValid());
        action.setInvalids(actionDTO.getInvalids());
        action.setJsonPathKeys(actionDTO.getJsonPathKeys());
        action.setCacheResponse(actionDTO.getCacheResponse());
        action.setUserSetOnLoad(actionDTO.getUserSetOnLoad());
        action.setConfirmBeforeExecute(actionDTO.getConfirmBeforeExecute());

        return action;
    }

    private void setCommonFieldsFromNewActionIntoAction(NewAction newAction, Action action) {
        // Set the fields from NewAction into Action
        action.setOrganizationId(newAction.getOrganizationId());
        action.setPluginType(newAction.getPluginType());
        action.setPluginId(newAction.getPluginId());
        action.setTemplateId(newAction.getTemplateId());
        action.setProviderId(newAction.getProviderId());
        action.setDocumentation(newAction.getDocumentation());
    }

    private void setCommonFieldsFromActionIntoNewAction(Action action, NewAction newAction) {
        // Set the fields from NewAction into Action
        newAction.setOrganizationId(action.getOrganizationId());
        newAction.setPluginType(action.getPluginType());
        newAction.setPluginId(action.getPluginId());
        newAction.setTemplateId(action.getTemplateId());
        newAction.setProviderId(action.getProviderId());
        newAction.setDocumentation(action.getDocumentation());
    }

    private Mono<Action> getActionByViewMode(NewAction newAction, Boolean viewMode) {
        Action action = null;

        if (Boolean.TRUE.equals(viewMode)) {
            if (newAction.getPublishedAction() != null) {
                action = createActionFromDTO(newAction.getPublishedAction());
            } else {
                // We are trying to fetch published action but it doesnt exist because the action hasn't been published yet
                return Mono.empty();
            }
        } else {
            if (newAction.getUnpublishedAction() != null) {
                action = createActionFromDTO(newAction.getUnpublishedAction());
            }
        }

        // Set the base domain fields
        action.setUserPermissions(newAction.getUserPermissions());
        action.setId(newAction.getId());
        action.setPolicies(newAction.getPolicies());

        // Set the fields from NewAction into Action
        setCommonFieldsFromNewActionIntoAction(newAction, action);

        return Mono.just(action);
    }

    private void generateAndSetActionPolicies(NewPage page, NewAction action) {
        Set<Policy> documentPolicies = policyGenerator.getAllChildPolicies(page.getPolicies(), Page.class, Action.class);
        action.setPolicies(documentPolicies);
    }

    @Override
    public Mono<Action> createAction(@NotNull Action action) {
        if (action.getId() != null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "id"));
        }

        if (action.getPageId() == null || action.getPageId().isBlank()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.PAGE_ID));
        }

        NewAction newAction = new NewAction();

        return newPageService
                .findById(action.getPageId(), READ_PAGES)
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "page", action.getPageId())))
                .flatMap(page -> {

                    // Set the applicationId
                    newAction.setApplicationId(page.getApplicationId());

                    // Inherit the action policies from the page.
                    generateAndSetActionPolicies(page, newAction);

                    // If the datasource is embedded, check for organizationId and set it in action
                    if (action.getDatasource() != null &&
                            action.getDatasource().getId() == null) {
                        Datasource datasource = action.getDatasource();
                        if (datasource.getOrganizationId() == null) {
                            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ORGANIZATION_ID));
                        }
                        action.setOrganizationId(datasource.getOrganizationId());
                    }

                    newAction.setUnpublishedAction(generateDTOFromAction(action));
                    setCommonFieldsFromActionIntoNewAction(action, newAction);

                    return Mono.just(newAction);
                })
                .flatMap(this::validateAndSaveActionToRepository)
                .flatMap(savedAction -> getActionByViewMode(savedAction, false));
    }

    private Mono<NewAction> validateAndSaveActionToRepository(NewAction newAction) {
        return null;
    }
}
