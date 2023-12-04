package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.DefaultResources;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.repositories.ActionCollectionRepository;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(SpringExtension.class)
@SpringBootTest
public class CustomActionCollectionRepositoryCEImplTest {
    @Autowired
    ActionCollectionRepository actionCollectionRepository;

    @Test
    public void bulkUpdate_WhenIdMatches_ActionCollectionsUpdated() {
        String applicationId = UUID.randomUUID().toString();
        List<ActionCollection> actionCollections = new ArrayList<>();

        for (int i = 0; i < 5; i++) {
            ActionCollection actionCollection = new ActionCollection();
            actionCollection.setWorkspaceId("action" + i + "workspace" + i);
            actionCollection.setApplicationId(applicationId);
            actionCollections.add(actionCollection);
        }

        Flux<ActionCollection> actionCollectionFlux = actionCollectionRepository
                .saveAll(actionCollections)
                .collectList()
                .flatMap(actionCollections1 -> {
                    actionCollections1.forEach(newAction -> {
                        newAction.setWorkspaceId("workspace-" + newAction.getId());
                    });
                    return actionCollectionRepository.bulkUpdate(actionCollections1);
                })
                .thenMany(actionCollectionRepository.findByApplicationId(applicationId));

        StepVerifier.create(actionCollectionFlux.collectList())
                .assertNext(actionCollectionList -> {
                    assertThat(actionCollectionList.size()).isEqualTo(5);
                    actionCollectionList.forEach(newAction -> {
                        assertThat(newAction.getWorkspaceId()).isEqualTo("workspace-" + newAction.getId());
                    });
                })
                .expectComplete()
                .verify();
    }

    @Test
    public void bulkInsert_WhenDuplicateId_ExceptionThrown() {
        String duplicateId = new ObjectId().toString();
        List<ActionCollection> actionCollections = new ArrayList<>();

        for (int i = 0; i < 2; i++) {
            ActionCollection actionCollection = new ActionCollection();
            actionCollection.setId(duplicateId);
            actionCollections.add(actionCollection);
        }

        StepVerifier.create(actionCollectionRepository.bulkInsert(actionCollections))
                .verifyError();
    }

    @Test
    public void bulkInsert_WhenInsertedWithProvidedId_InsertedWithProvidedId() {
        List<ActionCollection> actionCollectionList = new ArrayList<>();
        String applicationId = UUID.randomUUID().toString();

        for (int i = 0; i < 5; i++) {
            String generatedId = new ObjectId().toString();
            ActionCollection actionCollection = new ActionCollection();
            actionCollection.setId(generatedId);
            actionCollection.setApplicationId(applicationId);
            // set the id to be the workspaceId so that we can check later bulk insert used the provided id
            actionCollection.setWorkspaceId("workspace-" + generatedId);
            actionCollectionList.add(actionCollection);
        }

        Mono<List<ActionCollection>> actionCollectionsMono = actionCollectionRepository
                .bulkInsert(actionCollectionList)
                .thenMany(actionCollectionRepository.findByApplicationId(applicationId))
                .collectList();

        StepVerifier.create(actionCollectionsMono)
                .assertNext(actionCollections -> {
                    assertThat(actionCollections.size()).isEqualTo(5);
                    actionCollections.forEach(newAction -> {
                        assertThat(newAction.getWorkspaceId()).isEqualTo("workspace-" + newAction.getId());
                    });
                })
                .verifyComplete();
    }

    private void testFindAllActionCollectionsByNamePageIdsViewModeAndBranch(boolean isViewMode) {
        String defaultPageId = "default-page-id", branchName = "main", childPageId = "child-page-id";

        // create action collection that has different values in pageId and defaultResources.pageId
        ActionCollection actionCollection = new ActionCollection();
        ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
        actionCollectionDTO.setPageId(childPageId);
        actionCollectionDTO.setDefaultResources(new DefaultResources());
        actionCollectionDTO.getDefaultResources().setPageId(defaultPageId);

        if (isViewMode) {
            actionCollection.setPublishedCollection(actionCollectionDTO);
        } else {
            actionCollection.setUnpublishedCollection(actionCollectionDTO);
        }

        actionCollection.setDefaultResources(new DefaultResources());
        actionCollection.getDefaultResources().setBranchName(branchName);

        Mono<ActionCollection> createActionCollectionMono =
                actionCollectionRepository.save(actionCollection).cache();

        // check whether action collection is found when branch and default page id matches
        Mono<List<ActionCollection>> actionCollectionListMono = createActionCollectionMono
                .thenMany(actionCollectionRepository.findAllActionCollectionsByNameDefaultPageIdsViewModeAndBranch(
                        null, List.of(defaultPageId), isViewMode, branchName, null, null))
                .collectList();

        StepVerifier.create(actionCollectionListMono)
                .assertNext(actionCollectionList -> {
                    assertThat(actionCollectionList.size()).isEqualTo(1);
                })
                .verifyComplete();

        // check whether action collection is not found when branch name does not match
        Mono<List<ActionCollection>> actionCollectionListMono2 = createActionCollectionMono
                .thenMany(actionCollectionRepository.findAllActionCollectionsByNameDefaultPageIdsViewModeAndBranch(
                        null, List.of(defaultPageId), isViewMode, "feature", null, null))
                .collectList();

        StepVerifier.create(actionCollectionListMono2)
                .assertNext(actionCollectionList -> {
                    assertThat(actionCollectionList.size()).isEqualTo(0);
                })
                .verifyComplete();

        // check whether action collection is not found when default page id does not match
        Mono<List<ActionCollection>> actionCollectionListMono3 = createActionCollectionMono
                .thenMany(actionCollectionRepository.findAllActionCollectionsByNameDefaultPageIdsViewModeAndBranch(
                        null, List.of(childPageId), isViewMode, branchName, null, null))
                .collectList();

        StepVerifier.create(actionCollectionListMono3)
                .assertNext(actionCollectionList -> {
                    assertThat(actionCollectionList.size()).isEqualTo(0);
                })
                .verifyComplete();
    }

    @Test
    public void findAllActionCollectionsByNamePageIdsViewModeAndBranch_ForChildBranch_Successful() {
        testFindAllActionCollectionsByNamePageIdsViewModeAndBranch(false);
        testFindAllActionCollectionsByNamePageIdsViewModeAndBranch(true);
    }
}
