package com.appsmith.server.services.ce;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Page;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ActionCollectionViewDTO;
import com.appsmith.server.dtos.ce.ImportActionCollectionResultDTO;
import com.appsmith.server.dtos.ce.ImportActionResultDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.DefaultResourcesUtils;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.helpers.ce.ImportApplicationPermissionProvider;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.BaseService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.ObjectUtils;
import org.apache.commons.lang3.StringUtils;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.util.CollectionUtils;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNestedNonNullProperties;
import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNewFieldValuesIntoOldObject;
import static java.lang.Boolean.TRUE;

@Slf4j
public class ActionCollectionServiceCEImpl extends BaseService<ActionCollectionRepository, ActionCollection, String>
        implements ActionCollectionServiceCE {

    private final NewActionService newActionService;
    private final PolicyGenerator policyGenerator;
    private final ApplicationService applicationService;
    private final ResponseUtils responseUtils;
    private final ApplicationPermission applicationPermission;
    private final ActionPermission actionPermission;

    @Autowired
    public ActionCollectionServiceCEImpl(
            Scheduler scheduler,
            Validator validator,
            MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate,
            ActionCollectionRepository repository,
            AnalyticsService analyticsService,
            NewActionService newActionService,
            PolicyGenerator policyGenerator,
            ApplicationService applicationService,
            ResponseUtils responseUtils,
            ApplicationPermission applicationPermission,
            ActionPermission actionPermission) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.newActionService = newActionService;
        this.policyGenerator = policyGenerator;
        this.applicationService = applicationService;
        this.responseUtils = responseUtils;
        this.applicationPermission = applicationPermission;
        this.actionPermission = actionPermission;
    }

    @Override
    public Flux<ActionCollection> findAllByApplicationIdAndViewMode(
            String applicationId, Boolean viewMode, AclPermission permission, Sort sort) {
        return repository
                .findByApplicationId(applicationId, permission, sort)
                // In case of view mode being true, filter out all the actions which haven't been published
                .flatMap(collection -> {
                    if (Boolean.TRUE.equals(viewMode)) {
                        // In case we are trying to fetch published actions but this action has not been published, do
                        // not return
                        if (collection.getPublishedCollection() == null) {
                            return Mono.empty();
                        }
                    }
                    // No need to handle the edge case of unpublished action not being present. This is not possible
                    // because
                    // every created action starts from an unpublishedAction state.

                    return Mono.just(collection);
                });
    }

    @Override
    public void generateAndSetPolicies(NewPage page, ActionCollection actionCollection) {
        Set<Policy> documentPolicies =
                policyGenerator.getAllChildPolicies(page.getPolicies(), Page.class, Action.class);
        actionCollection.setPolicies(documentPolicies);
    }

    @Override
    public Mono<ActionCollection> save(ActionCollection collection) {
        if (collection.getGitSyncId() == null) {
            collection.setGitSyncId(collection.getApplicationId() + "_" + new ObjectId());
        }
        return repository.save(collection);
    }

    @Override
    public Flux<ActionCollection> saveAll(List<ActionCollection> collections) {
        collections.forEach(collection -> {
            if (collection.getGitSyncId() == null) {
                collection.setGitSyncId(collection.getApplicationId() + "_" + new ObjectId());
            }
        });
        return repository.saveAll(collections);
    }

    @Override
    public Mono<ActionCollection> findByIdAndBranchName(String id, String branchName) {
        // TODO sanitise resonse for default IDs
        return this.findByBranchNameAndDefaultCollectionId(branchName, id, actionPermission.getReadPermission());
    }

    @Override
    public Flux<ActionCollectionDTO> getPopulatedActionCollectionsByViewMode(
            MultiValueMap<String, String> params, Boolean viewMode) {
        return this.getActionCollectionsByViewMode(params, viewMode)
                .flatMap(actionCollectionDTO -> this.populateActionCollectionByViewMode(actionCollectionDTO, viewMode));
    }

    @Override
    public Flux<ActionCollectionDTO> getPopulatedActionCollectionsByViewMode(
            MultiValueMap<String, String> params, Boolean viewMode, String branchName) {
        MultiValueMap<String, String> updatedMap = new LinkedMultiValueMap<>(params);
        if (!StringUtils.isEmpty(branchName)) {
            updatedMap.add(FieldName.BRANCH_NAME, branchName);
        }
        return this.getPopulatedActionCollectionsByViewMode(updatedMap, viewMode)
                .map(responseUtils::updateCollectionDTOWithDefaultResources);
    }

    @Override
    public Mono<ActionCollectionDTO> populateActionCollectionByViewMode(
            ActionCollectionDTO actionCollectionDTO1, Boolean viewMode) {
        return Mono.just(actionCollectionDTO1).flatMap(actionCollectionDTO -> Flux.fromIterable(
                        actionCollectionDTO.getDefaultToBranchedActionIdsMap().values())
                .mergeWith(Flux.fromIterable(actionCollectionDTO
                        .getDefaultToBranchedArchivedActionIdsMap()
                        .values()))
                .flatMap(actionId -> {
                    return newActionService.findActionDTObyIdAndViewMode(
                            actionId, viewMode, actionPermission.getReadPermission());
                })
                .collectList()
                .flatMap(actionsList -> splitValidActionsByViewMode(actionCollectionDTO, actionsList, viewMode)));
    }

    /**
     * This method splits the actions associated to an action collection into valid and archived actions
     */
    @Override
    public Mono<ActionCollectionDTO> splitValidActionsByViewMode(
            ActionCollectionDTO actionCollectionDTO, List<ActionDTO> actionsList, Boolean viewMode) {
        return Mono.just(actionCollectionDTO).map(actionCollectionDTO1 -> {
            List<ActionDTO> archivedActionList = new ArrayList<>();
            List<ActionDTO> validActionList = new ArrayList<>();
            final List<String> collect = actionsList.stream()
                    .parallel()
                    .map(ActionDTO::getPluginId)
                    .distinct()
                    .collect(Collectors.toList());
            if (collect.size() == 1) {
                actionCollectionDTO.setPluginId(collect.get(0));
                actionCollectionDTO.setPluginType(actionsList.get(0).getPluginType());
            }
            actionsList.forEach(action -> {
                if (action.getDeletedAt() == null) {
                    validActionList.add(action);
                } else {
                    archivedActionList.add(action);
                }
            });
            actionCollectionDTO.setActions(validActionList);
            if (Boolean.FALSE.equals(viewMode)) {
                actionCollectionDTO.setArchivedActions(archivedActionList);
            }
            return actionCollectionDTO;
        });
    }

    @Override
    public Flux<ActionCollectionViewDTO> getActionCollectionsForViewMode(String applicationId, String branchName) {
        if (applicationId == null || applicationId.isEmpty()) {
            return Flux.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.APPLICATION_ID));
        }

        return applicationService
                .findBranchedApplicationId(branchName, applicationId, applicationPermission.getReadPermission())
                .flatMapMany(branchedApplicationId -> repository
                        .findByApplicationIdAndViewMode(
                                branchedApplicationId, true, actionPermission.getExecutePermission())
                        // Filter out all the action collections which haven't been published
                        .flatMap(actionCollection -> {
                            if (actionCollection.getPublishedCollection() == null) {
                                return Mono.empty();
                            }
                            return Mono.just(actionCollection);
                        })
                        .flatMap(actionCollection -> {
                            ActionCollectionViewDTO actionCollectionViewDTO = new ActionCollectionViewDTO();
                            final ActionCollectionDTO publishedCollection = actionCollection.getPublishedCollection();
                            actionCollectionViewDTO.setId(actionCollection.getId());
                            actionCollectionViewDTO.setName(publishedCollection.getName());
                            actionCollectionViewDTO.setPageId(publishedCollection.getPageId());
                            actionCollectionViewDTO.setApplicationId(actionCollection.getApplicationId());
                            actionCollectionViewDTO.setVariables(publishedCollection.getVariables());
                            actionCollectionViewDTO.setBody(publishedCollection.getBody());
                            // Update default resources :
                            // actionCollection.defaultResources contains appId, collectionId and branch(optional).
                            // Default pageId will be taken from publishedCollection.defaultResources
                            DefaultResources defaults = actionCollection.getDefaultResources();
                            // Consider a situation when collection is not published but user is viewing in deployed
                            // mode
                            if (publishedCollection.getDefaultResources() != null && defaults != null) {
                                defaults.setPageId(publishedCollection
                                        .getDefaultResources()
                                        .getPageId());
                            } else {
                                log.debug(
                                        "Unreachable state, unable to find default ids for actionCollection: {}",
                                        actionCollection.getId());
                                if (defaults == null) {
                                    defaults = new DefaultResources();
                                    defaults.setApplicationId(actionCollection.getApplicationId());
                                    defaults.setCollectionId(actionCollection.getId());
                                }
                                defaults.setPageId(actionCollection
                                        .getPublishedCollection()
                                        .getPageId());
                            }
                            actionCollectionViewDTO.setDefaultResources(defaults);
                            return Flux.fromIterable(publishedCollection
                                            .getDefaultToBranchedActionIdsMap()
                                            .values())
                                    .flatMap(actionId -> {
                                        return newActionService.findActionDTObyIdAndViewMode(
                                                actionId, true, actionPermission.getExecutePermission());
                                    })
                                    .collectList()
                                    .map(actionDTOList -> {
                                        actionCollectionViewDTO.setActions(actionDTOList);
                                        return actionCollectionViewDTO;
                                    });
                        })
                        .map(responseUtils::updateActionCollectionViewDTOWithDefaultResources));
    }

    @Override
    public Flux<ActionCollectionDTO> getActionCollectionsByViewMode(
            MultiValueMap<String, String> params, Boolean viewMode) {
        if (params == null || viewMode == null) {
            return Flux.empty();
        }
        if (params.getFirst(FieldName.APPLICATION_ID) != null) {
            // Fetch unpublished pages because GET actions is only called during edit mode. For view mode, different
            // function call is made which takes care of returning only the essential fields of an action
            return applicationService
                    .findBranchedApplicationId(
                            params.getFirst(FieldName.BRANCH_NAME),
                            params.getFirst(FieldName.APPLICATION_ID),
                            applicationPermission.getReadPermission())
                    .flatMapMany(childApplicationId -> repository.findByApplicationIdAndViewMode(
                            childApplicationId, viewMode, actionPermission.getReadPermission()))
                    .flatMap(actionCollection -> generateActionCollectionByViewMode(actionCollection, viewMode));
        }

        String name = null;
        List<String> pageIds = new ArrayList<>();
        String branch = null;

        // In the edit mode, the actions should be displayed in the order they were created.
        Sort sort = Sort.by(FieldName.CREATED_AT);

        if (params.getFirst(FieldName.NAME) != null) {
            name = params.getFirst(FieldName.NAME);
        }

        if (params.getFirst(FieldName.BRANCH_NAME) != null) {
            branch = params.getFirst(FieldName.BRANCH_NAME);
        }

        if (params.getFirst(FieldName.PAGE_ID) != null) {
            pageIds.add(params.getFirst(FieldName.PAGE_ID));
        }
        return repository
                .findAllActionCollectionsByNamePageIdsViewModeAndBranch(
                        name, pageIds, viewMode, branch, actionPermission.getReadPermission(), sort)
                .flatMap(actionCollection -> generateActionCollectionByViewMode(actionCollection, viewMode));
    }

    @Override
    public Mono<ActionCollectionDTO> update(String id, ActionCollectionDTO actionCollectionDTO) {
        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }

        Mono<ActionCollection> actionCollectionMono = repository
                .findById(id, actionPermission.getEditPermission())
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.ACTION_COLLECTION, id)))
                .cache();

        return actionCollectionMono
                .map(dbActionCollection -> {
                    copyNewFieldValuesIntoOldObject(actionCollectionDTO, dbActionCollection.getUnpublishedCollection());
                    // No need to save defaultPageId at actionCollection level as this will be stored inside the
                    // actionCollectionDTO
                    DefaultResourcesUtils.createDefaultIdsOrUpdateWithGivenResourceIds(
                            dbActionCollection,
                            dbActionCollection.getDefaultResources().getBranchName());
                    return dbActionCollection;
                })
                .flatMap(actionCollection -> this.update(id, actionCollection))
                .flatMap(repository::setUserPermissionsInObject)
                .flatMap(actionCollection -> this.generateActionCollectionByViewMode(actionCollection, false)
                        .flatMap(actionCollectionDTO1 -> this.populateActionCollectionByViewMode(
                                actionCollection.getUnpublishedCollection(), false)));
    }

    @Override
    public Mono<ActionCollectionDTO> deleteWithoutPermissionUnpublishedActionCollection(String id) {
        return deleteUnpublishedActionCollectionEx(id, Optional.empty());
    }

    @Override
    public Mono<ActionCollectionDTO> deleteUnpublishedActionCollection(String id) {
        return deleteUnpublishedActionCollectionEx(id, Optional.of(actionPermission.getDeletePermission()));
    }

    public Mono<ActionCollectionDTO> deleteUnpublishedActionCollectionEx(
            String id, Optional<AclPermission> permission) {
        Mono<ActionCollection> actionCollectionMono = repository
                .findById(id, permission)
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ACTION_COLLECTION, id)));
        return actionCollectionMono
                .flatMap(toDelete -> {
                    Mono<ActionCollection> modifiedActionCollectionMono;

                    if (toDelete.getPublishedCollection() != null) {
                        toDelete.getUnpublishedCollection().setDeletedAt(Instant.now());
                        modifiedActionCollectionMono = Flux.fromIterable(toDelete.getUnpublishedCollection()
                                        .getDefaultToBranchedActionIdsMap()
                                        .values())
                                .flatMap(actionId -> newActionService
                                        .deleteUnpublishedAction(actionId)
                                        // return an empty action so that the filter can remove it from the list
                                        .onErrorResume(throwable -> {
                                            log.debug(
                                                    "Failed to delete action with id {} for collection: {}",
                                                    actionId,
                                                    toDelete.getUnpublishedCollection()
                                                            .getName());
                                            log.error(throwable.getMessage());
                                            return Mono.empty();
                                        }))
                                .collectList()
                                .then(repository.save(toDelete))
                                .flatMap(modifiedActionCollection -> {
                                    return analyticsService.sendArchiveEvent(
                                            modifiedActionCollection, getAnalyticsProperties(modifiedActionCollection));
                                });
                    } else {
                        // This actionCollection was never published. This document can be safely archived
                        modifiedActionCollectionMono = this.archiveById(toDelete.getId());
                    }

                    return modifiedActionCollectionMono;
                })
                .flatMap(updatedAction -> generateActionCollectionByViewMode(updatedAction, false));
    }

    @Override
    public Mono<ActionCollectionDTO> deleteUnpublishedActionCollection(String id, String branchName) {
        Mono<String> branchedCollectionId = StringUtils.isEmpty(branchName)
                ? Mono.just(id)
                : this.findByBranchNameAndDefaultCollectionId(branchName, id, actionPermission.getDeletePermission())
                        .map(ActionCollection::getId);

        return branchedCollectionId
                .flatMap(this::deleteUnpublishedActionCollection)
                .map(responseUtils::updateCollectionDTOWithDefaultResources);
    }

    @Override
    public Mono<ActionCollectionDTO> generateActionCollectionByViewMode(
            ActionCollection actionCollection, Boolean viewMode) {
        ActionCollectionDTO actionCollectionDTO = null;

        if (TRUE.equals(viewMode)) {
            if (actionCollection.getPublishedCollection() != null) {
                actionCollectionDTO = actionCollection.getPublishedCollection();
            } else {
                // We are trying to fetch published action but it doesnt exist because the action hasn't been published
                // yet
                return Mono.empty();
            }
        } else {
            if (actionCollection.getUnpublishedCollection() != null) {
                actionCollectionDTO = actionCollection.getUnpublishedCollection();
            }
        }

        assert actionCollectionDTO != null;
        actionCollectionDTO.populateTransientFields(actionCollection);

        return Mono.just(actionCollectionDTO);
    }

    @Override
    public Mono<ActionCollection> findById(String id, AclPermission aclPermission) {
        return repository.findById(id, aclPermission);
    }

    @Override
    public Mono<ActionCollectionDTO> findActionCollectionDTObyIdAndViewMode(
            String id, Boolean viewMode, AclPermission permission) {
        return this.findById(id, permission)
                .flatMap(action -> this.generateActionCollectionByViewMode(action, viewMode));
    }

    @Override
    public Mono<List<ActionCollection>> archiveActionCollectionByApplicationId(
            String applicationId, AclPermission permission) {
        return repository
                .findByApplicationId(applicationId, permission, null)
                .flatMap(actionCollection -> {
                    Set<String> actionIds = new HashSet<>();
                    actionIds.addAll(actionCollection
                            .getUnpublishedCollection()
                            .getDefaultToBranchedActionIdsMap()
                            .values());
                    if (actionCollection.getPublishedCollection() != null
                            && !CollectionUtils.isEmpty(
                                    actionCollection.getPublishedCollection().getDefaultToBranchedActionIdsMap())) {
                        actionIds.addAll(actionCollection
                                .getPublishedCollection()
                                .getDefaultToBranchedActionIdsMap()
                                .values());
                    }
                    return Flux.fromIterable(actionIds)
                            .flatMap(newActionService::archiveById)
                            .onErrorResume(throwable -> {
                                log.error(throwable.getMessage());
                                return Mono.empty();
                            })
                            .then(repository.archive(actionCollection));
                })
                .collectList();
    }

    @Override
    public Flux<ActionCollection> findByPageId(String pageId) {
        return repository.findByPageId(pageId);
    }

    @Override
    public Mono<ActionCollection> archiveById(String id) {
        Mono<ActionCollection> actionCollectionMono = repository
                .findById(id)
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ACTION_COLLECTION, id)))
                .cache();
        return actionCollectionMono
                .map(actionCollection -> {
                    final ActionCollectionDTO unpublishedCollection = actionCollection.getUnpublishedCollection();
                    final ActionCollectionDTO publishedCollection = actionCollection.getPublishedCollection();
                    final Set<String> actionIds = new HashSet<>();
                    if (unpublishedCollection != null) {
                        actionIds.addAll(unpublishedCollection
                                .getDefaultToBranchedActionIdsMap()
                                .values());
                        actionIds.addAll(unpublishedCollection
                                .getDefaultToBranchedArchivedActionIdsMap()
                                .values());
                    }
                    if (publishedCollection != null
                            && !CollectionUtils.isEmpty(publishedCollection.getDefaultToBranchedActionIdsMap())) {
                        actionIds.addAll(publishedCollection
                                .getDefaultToBranchedActionIdsMap()
                                .values());
                        actionIds.addAll(publishedCollection
                                .getDefaultToBranchedArchivedActionIdsMap()
                                .values());
                    }
                    return actionIds;
                })
                .flatMapMany(Flux::fromIterable)
                .flatMap(actionId -> newActionService
                        .archiveById(actionId)
                        // return an empty action so that the filter can remove it from the list
                        .onErrorResume(throwable -> {
                            log.debug("Failed to delete action with id {} for collection with id: {}", actionId, id);
                            log.error(throwable.getMessage());
                            return Mono.empty();
                        }))
                .collectList()
                .flatMap(actionList -> actionCollectionMono)
                .flatMap(
                        actionCollection -> repository.archive(actionCollection).thenReturn(actionCollection))
                .flatMap(deletedActionCollection -> analyticsService.sendDeleteEvent(
                        deletedActionCollection, getAnalyticsProperties(deletedActionCollection)));
    }

    @Override
    public Mono<ActionCollection> archiveByIdAndBranchName(String id, String branchName) {
        Mono<ActionCollection> branchedCollectionMono = this.findByBranchNameAndDefaultCollectionId(
                        branchName, id, actionPermission.getDeletePermission())
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.ACTION_COLLECTION, id)));

        return branchedCollectionMono
                .map(ActionCollection::getId)
                .flatMap(this::archiveById)
                .map(responseUtils::updateActionCollectionWithDefaultResources);
    }

    @Override
    public Mono<ActionCollection> findByBranchNameAndDefaultCollectionId(
            String branchName, String defaultCollectionId, AclPermission permission) {

        if (StringUtils.isEmpty(defaultCollectionId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.COLLECTION_ID));
        } else if (StringUtils.isEmpty(branchName)) {
            return this.findById(defaultCollectionId, permission)
                    .switchIfEmpty(Mono.error(new AppsmithException(
                            AppsmithError.NO_RESOURCE_FOUND, FieldName.ACTION_COLLECTION, defaultCollectionId)));
        }
        return repository
                .findByBranchNameAndDefaultCollectionId(branchName, defaultCollectionId, permission)
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.ACTION_COLLECTION, defaultCollectionId)));
    }

    @Override
    public Map<String, Object> getAnalyticsProperties(ActionCollection savedActionCollection) {
        final ActionCollectionDTO unpublishedCollection = savedActionCollection.getUnpublishedCollection();
        Map<String, Object> analyticsProperties = new HashMap<>();
        analyticsProperties.put("actionCollectionName", ObjectUtils.defaultIfNull(unpublishedCollection.getName(), ""));
        analyticsProperties.put(
                "applicationId", ObjectUtils.defaultIfNull(savedActionCollection.getApplicationId(), ""));
        analyticsProperties.put("pageId", ObjectUtils.defaultIfNull(unpublishedCollection.getPageId(), ""));
        analyticsProperties.put("orgId", ObjectUtils.defaultIfNull(savedActionCollection.getWorkspaceId(), ""));
        return analyticsProperties;
    }

    @Override
    public Mono<ActionCollection> create(ActionCollection collection) {
        if (collection.getGitSyncId() == null) {
            collection.setGitSyncId(collection.getApplicationId() + "_" + new ObjectId());
        }
        return super.create(collection);
    }

    @Override
    public void populateDefaultResources(
            ActionCollection actionCollection, ActionCollection branchedActionCollection, String branchName) {
        DefaultResources defaultResources = branchedActionCollection.getDefaultResources();
        // Create new action but keep defaultApplicationId and defaultActionId same for both the actions
        defaultResources.setBranchName(branchName);
        actionCollection.setDefaultResources(defaultResources);

        String defaultPageId = branchedActionCollection.getUnpublishedCollection() != null
                ? branchedActionCollection
                        .getUnpublishedCollection()
                        .getDefaultResources()
                        .getPageId()
                : branchedActionCollection
                        .getPublishedCollection()
                        .getDefaultResources()
                        .getPageId();
        DefaultResources defaultsDTO = new DefaultResources();
        defaultsDTO.setPageId(defaultPageId);
        if (actionCollection.getUnpublishedCollection() != null) {
            actionCollection.getUnpublishedCollection().setDefaultResources(defaultsDTO);
        }
        if (actionCollection.getPublishedCollection() != null) {
            actionCollection.getPublishedCollection().setDefaultResources(defaultsDTO);
        }
        actionCollection
                .getUnpublishedCollection()
                .setDeletedAt(
                        branchedActionCollection.getUnpublishedCollection().getDeletedAt());
        actionCollection.setDeletedAt(branchedActionCollection.getDeletedAt());
        actionCollection.setDeleted(branchedActionCollection.getDeleted());
        // Set policies from existing branch object
        actionCollection.setPolicies(branchedActionCollection.getPolicies());
    }

    private NewPage updatePageInActionCollection(ActionCollectionDTO collectionDTO, Map<String, NewPage> pageNameMap) {
        NewPage parentPage = pageNameMap.get(collectionDTO.getPageId());
        if (parentPage == null) {
            return null;
        }
        collectionDTO.setPageId(parentPage.getId());

        // Update defaultResources in actionCollectionDTO
        DefaultResources defaultResources = new DefaultResources();
        defaultResources.setPageId(parentPage.getDefaultResources().getPageId());
        collectionDTO.setDefaultResources(defaultResources);

        return parentPage;
    }

    /**
     * Method to
     * - save imported actionCollections with updated policies
     * - update default resource ids along with branch-name if the application is connected to git
     *
     * @param importedActionCollectionList          action list extracted from the imported JSON file
     * @param application                   imported and saved application in DB
     * @param branchName                            branch to which the actions needs to be saved if the application is connected to git
     * @param pageNameMap                           map of page name to saved page in DB
     * @param pluginMap                             map of plugin name to saved plugin id in DB
     * @param permissionProvider
     * @return tuple of imported actionCollectionId and saved actionCollection in DB
     */
    @Override
    public Mono<ImportActionCollectionResultDTO> importActionCollections(
            ImportActionResultDTO importActionResultDTO,
            Application application,
            String branchName,
            List<ActionCollection> importedActionCollectionList,
            Map<String, String> pluginMap,
            Map<String, NewPage> pageNameMap,
            ImportApplicationPermissionProvider permissionProvider) {

        /* Mono.just(application) is created to avoid the eagerly fetching of existing actionCollections
         * during the pipeline construction. It should be fetched only when the pipeline is subscribed/executed.
         */
        return Mono.just(application).flatMap(importedApplication -> {
            ImportActionCollectionResultDTO resultDTO = new ImportActionCollectionResultDTO();
            final String workspaceId = importedApplication.getWorkspaceId();

            // Map of gitSyncId to actionCollection of the existing records in DB
            Mono<Map<String, ActionCollection>> actionCollectionsInCurrentAppMono = repository
                    .findByApplicationId(importedApplication.getId())
                    .filter(collection -> collection.getGitSyncId() != null)
                    .collectMap(ActionCollection::getGitSyncId);

            Mono<Map<String, ActionCollection>> actionCollectionsInBranchesMono;
            if (importedApplication.getGitApplicationMetadata() != null) {
                final String defaultApplicationId =
                        importedApplication.getGitApplicationMetadata().getDefaultApplicationId();
                actionCollectionsInBranchesMono = repository
                        .findByDefaultApplicationId(defaultApplicationId, Optional.empty())
                        .filter(actionCollection -> actionCollection.getGitSyncId() != null)
                        .collectMap(ActionCollection::getGitSyncId);
            } else {
                actionCollectionsInBranchesMono = Mono.just(Collections.emptyMap());
            }

            return Mono.zip(actionCollectionsInCurrentAppMono, actionCollectionsInBranchesMono)
                    .flatMap(objects -> {
                        Map<String, ActionCollection> actionsCollectionsInCurrentApp = objects.getT1();
                        Map<String, ActionCollection> actionsCollectionsInBranches = objects.getT2();

                        // set the existing action collections in the result DTO, this will be required in next phases
                        resultDTO.setExistingActionCollections(actionsCollectionsInCurrentApp.values());

                        List<ActionCollection> newActionCollections = new ArrayList<>();
                        List<ActionCollection> existingActionCollections = new ArrayList<>();

                        for (ActionCollection actionCollection : importedActionCollectionList) {
                            if (actionCollection.getUnpublishedCollection() == null
                                    || StringUtils.isEmpty(actionCollection
                                            .getUnpublishedCollection()
                                            .getPageId())) {
                                continue; // invalid action collection, skip it
                            }
                            final String idFromJsonFile = actionCollection.getId();
                            NewPage parentPage = new NewPage();
                            final ActionCollectionDTO unpublishedCollection =
                                    actionCollection.getUnpublishedCollection();
                            final ActionCollectionDTO publishedCollection = actionCollection.getPublishedCollection();

                            // If pageId is missing in the actionCollectionDTO create a fallback pageId
                            final String fallbackParentPageId = unpublishedCollection.getPageId();

                            if (unpublishedCollection.getName() != null) {
                                unpublishedCollection.setDefaultToBranchedActionIdsMap(importActionResultDTO
                                        .getUnpublishedCollectionIdToActionIdsMap()
                                        .get(idFromJsonFile));
                                unpublishedCollection.setPluginId(pluginMap.get(unpublishedCollection.getPluginId()));
                                parentPage = updatePageInActionCollection(unpublishedCollection, pageNameMap);
                            }

                            if (publishedCollection != null && publishedCollection.getName() != null) {
                                publishedCollection.setDefaultToBranchedActionIdsMap(importActionResultDTO
                                        .getPublishedCollectionIdToActionIdsMap()
                                        .get(idFromJsonFile));
                                publishedCollection.setPluginId(pluginMap.get(publishedCollection.getPluginId()));
                                if (StringUtils.isEmpty(publishedCollection.getPageId())) {
                                    publishedCollection.setPageId(fallbackParentPageId);
                                }
                                NewPage publishedCollectionPage =
                                        updatePageInActionCollection(publishedCollection, pageNameMap);
                                parentPage = parentPage == null ? publishedCollectionPage : parentPage;
                            }

                            actionCollection.makePristine();
                            actionCollection.setWorkspaceId(workspaceId);
                            actionCollection.setApplicationId(importedApplication.getId());

                            // Check if the action has gitSyncId and if it's already in DB
                            if (actionCollection.getGitSyncId() != null
                                    && actionsCollectionsInCurrentApp.containsKey(actionCollection.getGitSyncId())) {

                                // Since the resource is already present in DB, just update resource
                                ActionCollection existingActionCollection =
                                        actionsCollectionsInCurrentApp.get(actionCollection.getGitSyncId());

                                Set<Policy> existingPolicy = existingActionCollection.getPolicies();
                                copyNestedNonNullProperties(actionCollection, existingActionCollection);
                                // Update branchName
                                existingActionCollection.getDefaultResources().setBranchName(branchName);
                                // Recover the deleted state present in DB from imported actionCollection
                                existingActionCollection
                                        .getUnpublishedCollection()
                                        .setDeletedAt(actionCollection
                                                .getUnpublishedCollection()
                                                .getDeletedAt());
                                existingActionCollection.setDeletedAt(actionCollection.getDeletedAt());
                                existingActionCollection.setDeleted(actionCollection.getDeleted());
                                existingActionCollection.setPolicies(existingPolicy);

                                existingActionCollection.updateForBulkWriteOperation();
                                existingActionCollections.add(existingActionCollection);
                                resultDTO.getSavedActionCollectionIds().add(existingActionCollection.getId());
                                resultDTO.getSavedActionCollectionMap().put(idFromJsonFile, existingActionCollection);
                            } else {
                                if (!permissionProvider.canCreateAction(parentPage)) {
                                    throw new AppsmithException(
                                            AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.PAGE, parentPage.getId());
                                }

                                if (importedApplication.getGitApplicationMetadata() != null) {
                                    final String defaultApplicationId = importedApplication
                                            .getGitApplicationMetadata()
                                            .getDefaultApplicationId();
                                    if (actionsCollectionsInBranches.containsKey(actionCollection.getGitSyncId())) {
                                        ActionCollection branchedActionCollection =
                                                actionsCollectionsInBranches.get(actionCollection.getGitSyncId());
                                        populateDefaultResources(
                                                actionCollection, branchedActionCollection, branchName);
                                    } else {
                                        DefaultResources defaultResources = new DefaultResources();
                                        defaultResources.setApplicationId(defaultApplicationId);
                                        defaultResources.setBranchName(branchName);
                                        actionCollection.setDefaultResources(defaultResources);
                                    }
                                }

                                // this will generate the id and other auto generated fields e.g. createdAt
                                actionCollection.updateForBulkWriteOperation();
                                generateAndSetPolicies(parentPage, actionCollection);

                                // create or update default resources for the action
                                // values already set to defaultResources are kept unchanged
                                DefaultResourcesUtils.createDefaultIdsOrUpdateWithGivenResourceIds(
                                        actionCollection, branchName);

                                // generate gitSyncId if it's not present
                                if (actionCollection.getGitSyncId() == null) {
                                    actionCollection.setGitSyncId(
                                            actionCollection.getApplicationId() + "_" + new ObjectId());
                                }

                                // it's new actionCollection
                                newActionCollections.add(actionCollection);
                                resultDTO.getSavedActionCollectionIds().add(actionCollection.getId());
                                resultDTO.getSavedActionCollectionMap().put(idFromJsonFile, actionCollection);
                            }
                        }
                        log.info(
                                "Saving action collections in bulk. New: {}, Updated: {}",
                                newActionCollections.size(),
                                existingActionCollections.size());
                        return repository
                                .bulkInsert(newActionCollections)
                                .then(repository.bulkUpdate(existingActionCollections))
                                .thenReturn(resultDTO);
                    });
        });
    }
}
