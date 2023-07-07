package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.NewAction;
import com.appsmith.server.repositories.NewActionRepository;
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
public class CustomNewActionRepositoryCEImplTest {

    @Autowired
    NewActionRepository newActionRepository;

    @Test
    public void bulkUpdate_WhenIdMatches_NewActionsUpdated() {
        String applicationId = UUID.randomUUID().toString();
        List<NewAction> newActionList = new ArrayList<>();

        for (int i = 0; i < 5; i++) {
            NewAction newAction = new NewAction();
            newAction.setWorkspaceId("action" + i + "workspace" + i);
            newAction.setApplicationId(applicationId);
            newActionList.add(newAction);
        }

        Flux<NewAction> newActionFlux = newActionRepository
                .saveAll(newActionList)
                .collectList()
                .flatMap(newActions -> {
                    newActions.forEach(newAction -> {
                        newAction.setWorkspaceId("workspace-" + newAction.getId());
                    });
                    return newActionRepository.bulkUpdate(newActions);
                })
                .thenMany(newActionRepository.findByApplicationId(applicationId));

        StepVerifier.create(newActionFlux.collectList())
                .assertNext(newActions -> {
                    assertThat(newActions.size()).isEqualTo(5);
                    newActions.forEach(newAction -> {
                        assertThat(newAction.getWorkspaceId()).isEqualTo("workspace-" + newAction.getId());
                    });
                })
                .expectComplete()
                .verify();
    }

    @Test
    public void bulkInsert_WhenDuplicateId_ExceptionThrown() {
        String duplicateId = new ObjectId().toString();
        List<NewAction> actionList = new ArrayList<>();

        for (int i = 0; i < 2; i++) {
            NewAction action = new NewAction();
            action.setId(duplicateId);
            actionList.add(action);
        }

        StepVerifier.create(newActionRepository.bulkInsert(actionList)).verifyError();
    }

    @Test
    public void bulkInsert_WhenInsertedWithProvidedId_InsertedWithProvidedId() {
        List<NewAction> actionList = new ArrayList<>();
        String applicationId = UUID.randomUUID().toString();

        for (int i = 0; i < 5; i++) {
            String generatedId = new ObjectId().toString();
            NewAction action = new NewAction();
            action.setId(generatedId);
            action.setApplicationId(applicationId);
            // set the id to be the workspaceId so that we can check later bulk insert used the provided id
            action.setWorkspaceId("workspace-" + generatedId);
            actionList.add(action);
        }

        Mono<List<NewAction>> newActionsMono = newActionRepository
                .bulkInsert(actionList)
                .thenMany(newActionRepository.findByApplicationId(applicationId))
                .collectList();

        StepVerifier.create(newActionsMono)
                .assertNext(newActions -> {
                    assertThat(newActions.size()).isEqualTo(5);
                    newActions.forEach(newAction -> {
                        assertThat(newAction.getWorkspaceId()).isEqualTo("workspace-" + newAction.getId());
                    });
                })
                .verifyComplete();
    }
}
