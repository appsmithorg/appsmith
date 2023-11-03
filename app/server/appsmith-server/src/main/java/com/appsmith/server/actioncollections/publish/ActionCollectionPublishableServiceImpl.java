package com.appsmith.server.actioncollections.publish;

import com.appsmith.external.helpers.AppsmithBeanUtils;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.PublishingMetaDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.newactions.publish.internal.JSActionPublishableService;
import com.appsmith.server.publish.publishable.PackagePublishableService;
import com.appsmith.server.repositories.ActionCollectionRepository;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ActionCollectionPublishableServiceImpl implements PackagePublishableService<ActionCollection> {
    private final ActionCollectionRepository actionCollectionRepository;
    private final JSActionPublishableService jsActionPublishableService;

    public ActionCollectionPublishableServiceImpl(
            ActionCollectionRepository actionCollectionRepository,
            JSActionPublishableService jsActionPublishableService) {
        this.actionCollectionRepository = actionCollectionRepository;
        this.jsActionPublishableService = jsActionPublishableService;
    }

    @Override
    public Mono<List<ActionCollection>> getPublishableEntities(PublishingMetaDTO publishingMetaDTO) {
        final List<String> sourceCollectionIds = new ArrayList<>();

        final Map<String, String> oldToNewCollectionIdMap = new HashMap<>();

        final List<String> sourceModuleIds = new ArrayList<>(
                publishingMetaDTO.getOldModuleIdToNewModuleIdMap().keySet());

        return actionCollectionRepository
                .findAllByModuleIds(sourceModuleIds, null)
                .collectList()
                .flatMap(sourceActionCollections -> {
                    Map<String, ActionCollection> newCollectionIdToNewCollectionMap = sourceActionCollections.stream()
                            .map(sourceActionCollection -> {
                                ActionCollection toBePublishedActionCollection = new ActionCollection();

                                AppsmithBeanUtils.copyNestedNonNullProperties(
                                        sourceActionCollection, toBePublishedActionCollection);
                                toBePublishedActionCollection.setId(new ObjectId().toString());
                                toBePublishedActionCollection.setUnpublishedCollection(new ActionCollectionDTO());
                                toBePublishedActionCollection.setPublishedCollection(
                                        sourceActionCollection.getUnpublishedCollection());

                                DefaultResources defaultResources = sourceActionCollection.getDefaultResources();
                                defaultResources.setCollectionId(toBePublishedActionCollection.getId());

                                toBePublishedActionCollection.setDefaultResources(defaultResources);

                                oldToNewCollectionIdMap.put(
                                        sourceActionCollection.getId(), toBePublishedActionCollection.getId());
                                sourceCollectionIds.add(sourceActionCollection.getId());

                                return toBePublishedActionCollection;
                            })
                            .collect(Collectors.toMap(
                                    newActionCollection -> newActionCollection.getId(),
                                    newActionCollection -> newActionCollection));

                    return jsActionPublishableService
                            .createPublishableJSActions(publishingMetaDTO, sourceCollectionIds, oldToNewCollectionIdMap)
                            .flatMap(newCollectionIdToNewActionsMap -> {
                                for (Map.Entry<String, ActionCollection> entry :
                                        newCollectionIdToNewCollectionMap.entrySet()) {
                                    ActionCollection toBePublishedActionCollection = entry.getValue();
                                    List<String> newActionIds = newCollectionIdToNewActionsMap.getOrDefault(
                                            entry.getKey(), new ArrayList<>());

                                    Map<String, String> defaultToBranchedActionIdsMap = newActionIds.stream()
                                            .collect(Collectors.toMap(
                                                    newActionId -> newActionId, newActionId -> newActionId));
                                    toBePublishedActionCollection
                                            .getPublishedCollection()
                                            .setDefaultToBranchedActionIdsMap(defaultToBranchedActionIdsMap);
                                }
                                return actionCollectionRepository
                                        .saveAll(newCollectionIdToNewCollectionMap.values())
                                        .collectList();
                            });
                });
    }

    @Override
    public Mono<Void> updatePublishableEntities(PublishingMetaDTO publishingMetaDTO) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }
}
