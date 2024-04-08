package com.appsmith.server.actioncollections.clonepage;

import com.appsmith.external.models.DefaultResources;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.clonepage.ClonePageServiceCE;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ClonePageMetaDTO;
import com.appsmith.server.newactions.base.NewActionService;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNestedNonNullProperties;

@Service
@RequiredArgsConstructor
public class ActionCollectionClonePageServiceCEImpl implements ClonePageServiceCE<ActionCollection> {
    private final ActionCollectionService actionCollectionService;
    private final NewActionService newActionService;

    @Override
    public Mono<Void> cloneEntities(ClonePageMetaDTO clonePageMetaDTO) {
        return getCloneableActionCollections(clonePageMetaDTO.getBranchedSourcePageId())
                .flatMap(sourceActionCollection -> {
                    final DefaultResources clonedPageDefaultResources =
                            clonePageMetaDTO.getClonedPageDTO().getDefaultResources();
                    ActionCollection toBeClonedActionCollection = new ActionCollection();
                    copyNestedNonNullProperties(sourceActionCollection, toBeClonedActionCollection);

                    final ActionCollectionDTO unpublishedCollection =
                            toBeClonedActionCollection.getUnpublishedCollection();
                    unpublishedCollection.setPageId(
                            clonePageMetaDTO.getClonedPageDTO().getId());
                    toBeClonedActionCollection.setApplicationId(
                            clonePageMetaDTO.getClonedPageDTO().getApplicationId());

                    DefaultResources defaultResources = new DefaultResources();
                    copyNestedNonNullProperties(clonedPageDefaultResources, defaultResources);
                    toBeClonedActionCollection.setDefaultResources(defaultResources);

                    DefaultResources defaultResourcesForDTO = new DefaultResources();
                    defaultResourcesForDTO.setPageId(clonedPageDefaultResources.getPageId());
                    toBeClonedActionCollection.getUnpublishedCollection().setDefaultResources(defaultResourcesForDTO);

                    // Replace all action Ids from map
                    Map<String, String> updatedDefaultToBranchedActionId = new HashMap<>();
                    // Check if the application is connected with git and update
                    // defaultActionIds accordingly
                    //
                    // 1. If the app is connected with git keep the actionDefaultId as it is and
                    // update branchedActionId only
                    //
                    // 2. If app is not connected then both default and branchedActionId will be
                    // same as newly created action Id

                    if (StringUtils.isEmpty(clonedPageDefaultResources.getBranchName())) {
                        unpublishedCollection.getDefaultToBranchedActionIdsMap().forEach((defaultId, oldActionId) -> {
                            // Filter out the actionIds for which the reference is not
                            // present in cloned actions, this happens when we have
                            // deleted action in unpublished mode
                            if (StringUtils.hasLength(oldActionId)
                                    && StringUtils.hasLength(clonePageMetaDTO
                                            .getOldToNewActionIdMap()
                                            .get(oldActionId))) {
                                updatedDefaultToBranchedActionId.put(
                                        clonePageMetaDTO
                                                .getOldToNewActionIdMap()
                                                .get(oldActionId),
                                        clonePageMetaDTO
                                                .getOldToNewActionIdMap()
                                                .get(oldActionId));
                            }
                        });
                    } else {
                        unpublishedCollection.getDefaultToBranchedActionIdsMap().forEach((defaultId, oldActionId) -> {
                            // Filter out the actionIds for which the reference is not
                            // present in cloned actions, this happens when we have
                            // deleted action in unpublished mode
                            if (StringUtils.hasLength(defaultId)
                                    && StringUtils.hasLength(clonePageMetaDTO
                                            .getOldToNewActionIdMap()
                                            .get(oldActionId))) {
                                updatedDefaultToBranchedActionId.put(
                                        defaultId,
                                        clonePageMetaDTO
                                                .getOldToNewActionIdMap()
                                                .get(oldActionId));
                            }
                        });
                    }
                    unpublishedCollection.setDefaultToBranchedActionIdsMap(updatedDefaultToBranchedActionId);

                    // Set id as null, otherwise create (which is using under the hood save)
                    // will try to overwrite same resource instead of creating a new resource
                    toBeClonedActionCollection.setId(null);
                    // Set published version to null as the published version of the page does
                    // not exist when we clone the page.
                    toBeClonedActionCollection.setPublishedCollection(null);
                    toBeClonedActionCollection.getDefaultResources().setPageId(null);
                    // Assign new gitSyncId for cloned actionCollection
                    toBeClonedActionCollection.setGitSyncId(
                            toBeClonedActionCollection.getApplicationId() + "_" + new ObjectId());
                    return actionCollectionService
                            .create(toBeClonedActionCollection)
                            .flatMap(clonedActionCollection -> {
                                clonePageMetaDTO.getClonedActionCollections().add(clonedActionCollection);
                                if (!StringUtils.hasLength(clonedActionCollection
                                        .getDefaultResources()
                                        .getCollectionId())) {
                                    clonedActionCollection
                                            .getDefaultResources()
                                            .setCollectionId(clonedActionCollection.getId());
                                    return actionCollectionService.update(
                                            clonedActionCollection.getId(), clonedActionCollection);
                                }
                                return Mono.just(clonedActionCollection);
                            });
                })
                .collectList()
                .then();
    }

    @Override
    public Mono<Void> updateClonedEntities(ClonePageMetaDTO clonePageMetaDTO) {
        return Flux.fromIterable(clonePageMetaDTO.getClonedActionCollections())
                .flatMap(clonedActionCollection -> {
                    return Flux.fromIterable(clonedActionCollection
                                    .getUnpublishedCollection()
                                    .getDefaultToBranchedActionIdsMap()
                                    .values())
                            .flatMap(newActionService::findById)
                            .flatMap(newlyCreatedAction -> {
                                newlyCreatedAction
                                        .getUnpublishedAction()
                                        .setCollectionId(clonedActionCollection.getId());
                                newlyCreatedAction
                                        .getUnpublishedAction()
                                        .getDefaultResources()
                                        .setCollectionId(clonedActionCollection
                                                .getDefaultResources()
                                                .getCollectionId());
                                return newActionService.update(newlyCreatedAction.getId(), newlyCreatedAction);
                            });
                })
                .collectList()
                .then();
    }

    protected Flux<ActionCollection> getCloneableActionCollections(String pageId) {
        return actionCollectionService.findByPageId(pageId);
    }
}
