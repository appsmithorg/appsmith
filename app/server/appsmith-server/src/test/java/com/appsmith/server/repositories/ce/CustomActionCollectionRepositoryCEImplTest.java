package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.extensions.AfterAllCleanUpExtension;
import com.appsmith.server.repositories.cakes.ActionCollectionRepositoryCake;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(AfterAllCleanUpExtension.class)
@SpringBootTest
public class CustomActionCollectionRepositoryCEImplTest {
    @Autowired
    ActionCollectionRepositoryCake actionCollectionRepository;

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
                    return actionCollectionRepository.bulkUpdate(actionCollectionRepository, actionCollections1);
                })
                .thenMany(actionCollectionRepository.findByApplicationId(applicationId));

        StepVerifier.create(actionCollectionFlux.collectList())
                .assertNext(actionCollectionList -> {
                    assertThat(actionCollectionList).hasSize(5);
                    actionCollectionList.forEach(newAction -> {
                        assertThat(newAction.getWorkspaceId()).isEqualTo("workspace-" + newAction.getId());
                    });
                })
                .expectComplete()
                .verify();
    }

    @Test
    public void bulkInsert_WhenDuplicateId_ExceptionThrown() {
        String duplicateId = UUID.randomUUID().toString();
        List<ActionCollection> actionCollections = new ArrayList<>();

        for (int i = 0; i < 2; i++) {
            ActionCollection actionCollection = new ActionCollection();
            actionCollection.setId(duplicateId);
            actionCollections.add(actionCollection);
        }

        StepVerifier.create(actionCollectionRepository.bulkInsert(actionCollectionRepository, actionCollections))
                .verifyError();
    }

    @Test
    public void bulkInsert_WhenInsertedWithProvidedId_InsertedWithProvidedId() {
        List<ActionCollection> actionCollectionList = new ArrayList<>();
        String applicationId = UUID.randomUUID().toString();

        for (int i = 0; i < 5; i++) {
            String generatedId = UUID.randomUUID().toString();
            ActionCollection actionCollection = new ActionCollection();
            actionCollection.setId(generatedId);
            actionCollection.setApplicationId(applicationId);
            // set the id to be the workspaceId so that we can check later bulk insert used the provided id
            actionCollection.setWorkspaceId("workspace-" + generatedId);
            actionCollectionList.add(actionCollection);
        }

        Mono<List<ActionCollection>> actionCollectionsMono = actionCollectionRepository
                .bulkInsert(actionCollectionRepository, actionCollectionList)
                .thenMany(actionCollectionRepository.findByApplicationId(applicationId))
                .collectList();

        StepVerifier.create(actionCollectionsMono)
                .assertNext(actionCollections -> {
                    assertThat(actionCollections).hasSize(5);
                    actionCollections.forEach(newAction -> {
                        assertThat(newAction.getWorkspaceId()).isEqualTo("workspace-" + newAction.getId());
                    });
                })
                .verifyComplete();
    }
}
