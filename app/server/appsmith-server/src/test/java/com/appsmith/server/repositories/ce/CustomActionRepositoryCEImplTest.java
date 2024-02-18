package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.PluginType;
import com.appsmith.server.domains.Action;
import com.appsmith.server.dtos.PluginTypeAndCountDTO;
import com.appsmith.server.repositories.ActionRepository;
import com.appsmith.server.solutions.ActionPermission;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.function.Tuple2;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(SpringExtension.class)
@SpringBootTest
public class CustomActionRepositoryCEImplTest {

    @Autowired
    ActionRepository actionRepository;

    @Autowired
    ActionPermission actionPermission;

    @Test
    public void bulkUpdate_WhenIdMatches_NewActionsUpdated() {
        String applicationId = UUID.randomUUID().toString();
        List<Action> actionList = new ArrayList<>();

        for (int i = 0; i < 5; i++) {
            Action action = new Action();
            action.setWorkspaceId("action" + i + "workspace" + i);
            action.setApplicationId(applicationId);
            actionList.add(action);
        }

        Flux<Action> newActionFlux = actionRepository
                .saveAll(actionList)
                .collectList()
                .flatMap(newActions -> {
                    newActions.forEach(newAction -> {
                        newAction.setWorkspaceId("workspace-" + newAction.getId());
                    });
                    return actionRepository.bulkUpdate(newActions);
                })
                .thenMany(actionRepository.findByApplicationId(applicationId));

        StepVerifier.create(newActionFlux.collectList())
                .assertNext(newActions -> {
                    assertThat(newActions).hasSize(5);
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
        List<Action> actionList = new ArrayList<>();

        for (int i = 0; i < 2; i++) {
            Action action = new Action();
            action.setId(duplicateId);
            actionList.add(action);
        }

        StepVerifier.create(actionRepository.bulkInsert(actionList)).verifyError();
    }

    @Test
    public void bulkInsert_WhenInsertedWithProvidedId_InsertedWithProvidedId() {
        List<Action> actionList = new ArrayList<>();
        String applicationId = UUID.randomUUID().toString();

        for (int i = 0; i < 5; i++) {
            String generatedId = new ObjectId().toString();
            Action action = new Action();
            action.setId(generatedId);
            action.setApplicationId(applicationId);
            // set the id to be the workspaceId so that we can check later bulk insert used the provided id
            action.setWorkspaceId("workspace-" + generatedId);
            actionList.add(action);
        }

        Mono<List<Action>> newActionsMono = actionRepository
                .bulkInsert(actionList)
                .thenMany(actionRepository.findByApplicationId(applicationId))
                .collectList();

        StepVerifier.create(newActionsMono)
                .assertNext(newActions -> {
                    assertThat(newActions).hasSize(5);
                    newActions.forEach(newAction -> {
                        assertThat(newAction.getWorkspaceId()).isEqualTo("workspace-" + newAction.getId());
                    });
                })
                .verifyComplete();
    }

    private Action createAction(String applicationId, PluginType pluginType) {
        Action action = new Action();
        action.setApplicationId(applicationId);
        action.setPluginType(pluginType);
        return action;
    }

    private Action createUnpublishedAction(String applicationId, PluginType pluginType) {
        String randomString = UUID.randomUUID().toString();
        Action action = createAction(applicationId, pluginType);
        ActionDTO actionDTO = new ActionDTO();
        actionDTO.setName("unpublishedAction");
        actionDTO.setPageId(randomString);

        // set unpublished action but keep published action empty
        action.setUnpublishedAction(actionDTO);
        action.setPublishedAction(new ActionDTO());

        return action;
    }

    private Action createActionWithDatasource(String applicationId, String datasourceId) {
        Action action = createUnpublishedAction(applicationId, PluginType.API);
        Datasource datasource = new Datasource();
        datasource.setId(datasourceId);
        datasource.setName(datasourceId);
        action.getUnpublishedAction().setDatasource(datasource);
        return action;
    }

    private Action createUnpublishedDeletedAction(String applicationId, PluginType pluginType) {
        Action action = createUnpublishedAction(applicationId, pluginType);
        action.getUnpublishedAction().setDeletedAt(Instant.now());
        return action;
    }

    @Test
    public void countActionsByPluginType_WhenMatchedApplicationId_ReturnsActualCount() {
        // create actions with different plugin types and application ids
        List<Action> actionList = new ArrayList<>();
        String applicationId1 = UUID.randomUUID().toString();
        String applicationId2 = UUID.randomUUID().toString();

        // two actions with applicationId1 and pluginType API
        actionList.add(createAction(applicationId1, PluginType.API));
        actionList.add(createAction(applicationId1, PluginType.API));

        // one action with applicationId1 and pluginType DB and one action with applicationId1 and pluginType SAAS
        actionList.add(createAction(applicationId1, PluginType.DB));
        actionList.add(createAction(applicationId1, PluginType.SAAS));

        // one action with applicationId2 and pluginType API
        actionList.add(createAction(applicationId2, PluginType.API));

        // one deleted action with applicationId1 and pluginType JS
        Action deletedAction = createAction(applicationId1, PluginType.JS);
        deletedAction.setDeletedAt(Instant.now());
        actionList.add(deletedAction);

        Flux<PluginTypeAndCountDTO> pluginTypeAndCountDTOFlux = actionRepository
                .saveAll(actionList)
                .thenMany(actionRepository.countActionsByPluginType(applicationId1));

        StepVerifier.create(pluginTypeAndCountDTOFlux.collectList())
                .assertNext(list -> {
                    assertThat(list).hasSize(3);
                    list.forEach(pluginTypeAndCountDTO -> {
                        if (pluginTypeAndCountDTO.getPluginType().equals(PluginType.API)) {
                            assertThat(pluginTypeAndCountDTO.getCount()).isEqualTo(2);
                        } else if (pluginTypeAndCountDTO.getPluginType().equals(PluginType.DB)) {
                            assertThat(pluginTypeAndCountDTO.getCount()).isEqualTo(1);
                        } else if (pluginTypeAndCountDTO.getPluginType().equals(PluginType.SAAS)) {
                            assertThat(pluginTypeAndCountDTO.getCount()).isEqualTo(1);
                        }
                    });
                })
                .verifyComplete();
    }

    @Test
    public void publishActions_WhenApplicationIdMatches_ActionPublished() {
        // create actions with different application ids
        List<Action> actionList = new ArrayList<>();
        String applicationId1 = UUID.randomUUID().toString();
        String applicationId2 = UUID.randomUUID().toString();

        actionList.add(createUnpublishedAction(applicationId1, PluginType.API));
        actionList.add(createUnpublishedAction(applicationId1, PluginType.DB));
        actionList.add(createUnpublishedAction(applicationId2, PluginType.API));

        Mono<List<Action>> app1ActionsMono =
                actionRepository.findByApplicationId(applicationId1).collectList();
        Mono<List<Action>> app2ActionsMono =
                actionRepository.findByApplicationId(applicationId2).collectList();

        Mono<Tuple2<List<Action>, List<Action>>> applicationActions = actionRepository
                .saveAll(actionList)
                .then(actionRepository.publishActions(applicationId1, null))
                .then(Mono.zip(app1ActionsMono, app2ActionsMono));

        StepVerifier.create(applicationActions)
                .assertNext(objects -> {
                    List<Action> app1Actions = objects.getT1();
                    List<Action> app2Actions = objects.getT2();

                    assertThat(app1Actions).hasSize(2);
                    assertThat(app2Actions).hasSize(1);

                    app1Actions.forEach(action -> {
                        ActionDTO unpublishedActionDto = action.getUnpublishedAction();
                        ActionDTO publishedActionDto = action.getPublishedAction();
                        assertThat(unpublishedActionDto).isNotNull();
                        assertThat(publishedActionDto).isNotNull();
                        assertThat(unpublishedActionDto.getName()).isEqualTo(publishedActionDto.getName());
                        assertThat(unpublishedActionDto.getPageId()).isEqualTo(publishedActionDto.getPageId());
                        assertThat(unpublishedActionDto.getName()).isEqualTo("unpublishedAction");
                    });

                    app2Actions.forEach(action -> {
                        ActionDTO unpublishedActionDto = action.getUnpublishedAction();
                        assertThat(unpublishedActionDto).isNotNull();
                        assertThat(unpublishedActionDto.getName()).isEqualTo("unpublishedAction");

                        ActionDTO publishedActionDto = action.getPublishedAction();
                        assertThat(publishedActionDto).isNotNull();
                        assertThat(publishedActionDto.getName()).isNull();
                        assertThat(publishedActionDto.getPageId()).isNull();
                    });
                })
                .verifyComplete();
    }

    @Test
    public void archiveDeletedUnpublishedActions_WhenApplicationIdMatchesAndDeletedFromEditMode_ActionDeleted() {
        // create actions with different application ids
        List<Action> actionList = new ArrayList<>();
        String applicationId1 = UUID.randomUUID().toString();
        String applicationId2 = UUID.randomUUID().toString();

        actionList.add(createUnpublishedDeletedAction(applicationId1, PluginType.API)); // deleted from app1
        actionList.add(createUnpublishedDeletedAction(applicationId1, PluginType.DB)); // deleted from app1
        actionList.add(createUnpublishedAction(applicationId1, PluginType.API)); // not deleted from app1
        actionList.add(createUnpublishedDeletedAction(applicationId2, PluginType.API)); // deleted from app2

        Mono<List<Action>> app1ActionsMono =
                actionRepository.findByApplicationId(applicationId1).collectList();
        Mono<List<Action>> app2ActionsMono =
                actionRepository.findByApplicationId(applicationId2).collectList();

        Mono<Tuple2<List<Action>, List<Action>>> applicationActions = actionRepository
                .saveAll(actionList)
                .then(actionRepository.archiveDeletedUnpublishedActions(applicationId1, null))
                .then(Mono.zip(app1ActionsMono, app2ActionsMono));

        StepVerifier.create(applicationActions)
                .assertNext(objects -> {
                    List<Action> app1Actions = objects.getT1();
                    List<Action> app2Actions = objects.getT2();

                    assertThat(app1Actions).hasSize(1);
                    assertThat(app2Actions).hasSize(1);

                    // merge actions from both list and verify they are in the same state when created
                    List.of(app1Actions.get(0), app2Actions.get(0)).forEach(action -> {
                        ActionDTO unpublishedActionDto = action.getUnpublishedAction();
                        assertThat(unpublishedActionDto).isNotNull();
                        assertThat(unpublishedActionDto.getName()).isEqualTo("unpublishedAction");

                        ActionDTO publishedActionDto = action.getPublishedAction();
                        assertThat(publishedActionDto).isNotNull();
                        assertThat(publishedActionDto.getName()).isNull();
                        assertThat(publishedActionDto.getPageId()).isNull();
                    });
                })
                .verifyComplete();
    }
}
