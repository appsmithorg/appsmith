package com.appsmith.server.actioncollections.clonepage;

import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.clonepage.ClonePageServiceCE;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ClonePageMetaDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNestedNonNullProperties;

@Service
@RequiredArgsConstructor
public class ActionCollectionClonePageServiceCEImpl implements ClonePageServiceCE<ActionCollection> {
    private final ActionCollectionService actionCollectionService;

    @Override
    public Mono<Void> cloneEntities(ClonePageMetaDTO clonePageMetaDTO) {
        return getCloneableActionCollections(clonePageMetaDTO.getBranchedSourcePageId())
                .flatMap(sourceActionCollection -> {
                    ActionCollection toBeClonedActionCollection = new ActionCollection();
                    copyNestedNonNullProperties(sourceActionCollection, toBeClonedActionCollection);

                    final ActionCollectionDTO unpublishedCollection =
                            toBeClonedActionCollection.getUnpublishedCollection();
                    unpublishedCollection.setPageId(
                            clonePageMetaDTO.getClonedPageDTO().getId());
                    toBeClonedActionCollection.setApplicationId(
                            clonePageMetaDTO.getClonedPageDTO().getApplicationId());

                    // Set id as null, otherwise create (which is using under the hood save)
                    // will try to overwrite same resource instead of creating a new resource
                    toBeClonedActionCollection.setId(null);
                    toBeClonedActionCollection.setBaseId(null);
                    // Set published version to null as the published version of the page does
                    // not exist when we clone the page.
                    toBeClonedActionCollection.setPublishedCollection(null);
                    // Assign new gitSyncId for cloned actionCollection
                    toBeClonedActionCollection.setGitSyncId(
                            toBeClonedActionCollection.getApplicationId() + "_" + UUID.randomUUID());
                    return actionCollectionService
                            .create(toBeClonedActionCollection)
                            .flatMap(clonedActionCollection -> {
                                clonePageMetaDTO
                                        .getOldToNewCollectionIds()
                                        .put(sourceActionCollection.getId(), clonedActionCollection.getId());
                                if (!StringUtils.hasLength(clonedActionCollection.getBaseId())) {
                                    clonedActionCollection.setBaseId(clonedActionCollection.getId());
                                    return actionCollectionService.update(
                                            clonedActionCollection.getId(), clonedActionCollection);
                                }
                                return Mono.just(clonedActionCollection);
                            });
                })
                .collectList()
                .then();
    }

    protected Flux<ActionCollection> getCloneableActionCollections(String pageId) {
        return actionCollectionService.findByPageId(pageId);
    }
}
