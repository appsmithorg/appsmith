package com.appsmith.server.services;

import com.appsmith.external.models.DefaultResources;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.PluginType;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ActionCollectionMoveDTO;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.dtos.RefactorActionCollectionNameDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mongodb.client.result.UpdateResult;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import org.bson.BsonObjectId;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.test.StepVerifier;

import javax.validation.Validator;
import java.io.File;
import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RunWith(SpringRunner.class)
@Slf4j
public class ActionCollectionServiceImplTest {

    ActionCollectionService actionCollectionService;
    LayoutCollectionService layoutCollectionService;
    @MockBean
    private Scheduler scheduler;
    @MockBean
    private Validator validator;
    @MockBean
    private MongoConverter mongoConverter;
    @MockBean
    private ReactiveMongoTemplate reactiveMongoTemplate;
    @MockBean
    private AnalyticsService analyticsService;
    @MockBean
    private SessionUserService sessionUserService;
    @MockBean
    private CollectionService collectionService;
    @MockBean
    private PolicyGenerator policyGenerator;

    @MockBean
    NewPageService newPageService;

    @MockBean
    LayoutActionService layoutActionService;

    @MockBean
    ActionCollectionRepository actionCollectionRepository;

    @MockBean
    NewActionService newActionService;

    @MockBean
    ApplicationService applicationService;

    @MockBean
    ResponseUtils responseUtils;

    private final File mockObjects = new File("src/test/resources/test_assets/ActionCollectionServiceTest/mockObjects.json");

    @Before
    public void setUp() {
        actionCollectionService = new ActionCollectionServiceImpl(
                scheduler,
                validator,
                mongoConverter,
                reactiveMongoTemplate,
                actionCollectionRepository,
                analyticsService,
                newActionService,
                policyGenerator,
                applicationService,
                responseUtils
        );

        layoutCollectionService = new LayoutCollectionServiceImpl(
                newPageService,
                layoutActionService,
                actionCollectionService,
                newActionService,
                analyticsService,
                responseUtils
        );

        Mockito
                .when(analyticsService.sendCreateEvent(Mockito.any()))
                .thenAnswer(invocationOnMock -> Mono.justOrEmpty(invocationOnMock.getArguments()[0]));

        Mockito
                .when(analyticsService.sendUpdateEvent(Mockito.any()))
                .thenAnswer(invocationOnMock -> Mono.justOrEmpty(invocationOnMock.getArguments()[0]));

        Mockito
                .when(analyticsService.sendDeleteEvent(Mockito.any()))
                .thenAnswer(invocationOnMock -> Mono.justOrEmpty(invocationOnMock.getArguments()[0]));
    }

    <T> DefaultResources setDefaultResources(T collection) {
        DefaultResources defaultResources = new DefaultResources();
        if (collection instanceof ActionCollection) {
            defaultResources.setApplicationId("testApplicationId");
            defaultResources.setCollectionId("testCollectionId");
        } else if (collection instanceof ActionCollectionDTO) {
            defaultResources.setPageId("testPageId");
        }
        return defaultResources;
    }

    @Test
    public void testCreateCollection_withId_throwsError() {
        ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
        actionCollectionDTO.setId("testId");
        final Mono<ActionCollectionDTO> actionCollectionDTOMono = layoutCollectionService.createCollection(actionCollectionDTO);

        StepVerifier.create(actionCollectionDTOMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.ID)))
                .verify();
    }

    @Test
    public void testCreateCollection_withoutOrgPageApplicationPluginIds_throwsError() {
        ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
        final Mono<ActionCollectionDTO> actionCollectionDTOMono = layoutCollectionService.createCollection(actionCollectionDTO);

        StepVerifier.create(actionCollectionDTOMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException)
                .verify();
    }

    @Test
    public void testCreateCollection_withRepeatedActionName_throwsError() throws IOException {
        ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
        actionCollectionDTO.setName("testCollection");
        actionCollectionDTO.setPageId("testPageId");
        actionCollectionDTO.setApplicationId("testApplicationId");
        actionCollectionDTO.setOrganizationId("testOrganizationId");
        actionCollectionDTO.setPluginId("testPluginId");
        actionCollectionDTO.setPluginType(PluginType.JS);

        ObjectMapper objectMapper = new ObjectMapper();
        final JsonNode jsonNode = objectMapper.readValue(mockObjects, JsonNode.class);
        final NewPage newPage = objectMapper.convertValue(jsonNode.get("newPage"), NewPage.class);
        Mockito
                .when(newPageService.findById(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(newPage));
        Mockito
                .when(layoutActionService.isNameAllowed(Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(false));

        Mockito
                .when(actionCollectionRepository
                        .findAllActionCollectionsByNamePageIdsViewModeAndBranch(
                                Mockito.any(),
                                Mockito.any(),
                                Mockito.anyBoolean(),
                                Mockito.any(),
                                Mockito.any(),
                                Mockito.any()))
                .thenReturn(Flux.empty());

        final Mono<ActionCollectionDTO> actionCollectionDTOMono = layoutCollectionService.createCollection(actionCollectionDTO);

        StepVerifier.create(actionCollectionDTOMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage()
                                .equals(AppsmithError.DUPLICATE_KEY_USER_ERROR
                                        .getMessage(actionCollectionDTO.getName(), FieldName.NAME)))
                .verify();
    }

    @Test
    public void testCreateCollection_createActionFailure_returnsWithIncompleteCollection() throws IOException {
        ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
        actionCollectionDTO.setName("testCollection");
        actionCollectionDTO.setPageId("testPageId");
        actionCollectionDTO.setApplicationId("testApplicationId");
        actionCollectionDTO.setOrganizationId("testOrganizationId");
        actionCollectionDTO.setPluginId("testPluginId");
        actionCollectionDTO.setPluginType(PluginType.JS);
        actionCollectionDTO.setDefaultResources(setDefaultResources(actionCollectionDTO));

        ObjectMapper objectMapper = new ObjectMapper();
        final JsonNode jsonNode = objectMapper.readValue(mockObjects, JsonNode.class);
        final NewPage newPage = objectMapper.convertValue(jsonNode.get("newPage"), NewPage.class);

        Mockito
                .when(newPageService.findById(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(newPage));
        Mockito
                .when(layoutActionService.isNameAllowed(Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(true));

        Mockito
                .when(actionCollectionRepository
                        .findAllActionCollectionsByNamePageIdsViewModeAndBranch(
                                Mockito.any(),
                                Mockito.any(),
                                Mockito.anyBoolean(),
                                Mockito.any(),
                                Mockito.any(),
                                Mockito.any()))
                .thenReturn(Flux.empty());

        Mockito
                .when(layoutActionService.createAction(Mockito.any()))
                .thenReturn(Mono.just(new ActionDTO()));

        Mockito
                .when(actionCollectionRepository.save(Mockito.any()))
                .thenAnswer(invocation -> {
                    final ActionCollection argument = (ActionCollection) invocation.getArguments()[0];
                    argument.setId("testActionCollectionId");
                    return Mono.just(argument);
                });

        final Mono<ActionCollectionDTO> actionCollectionDTOMono = layoutCollectionService.createCollection(actionCollectionDTO);

        StepVerifier.create(actionCollectionDTOMono)
                .assertNext(actionCollectionDTO1 -> {
                    Assert.assertTrue(actionCollectionDTO1.getActions().isEmpty());
                })
                .verifyComplete();
    }

    @Test
    public void testCreateCollection_validCollection_returnsPopulatedCollection() throws IOException {
        ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
        actionCollectionDTO.setName("testCollection");
        actionCollectionDTO.setPageId("testPageId");
        actionCollectionDTO.setApplicationId("testApplicationId");
        actionCollectionDTO.setOrganizationId("testOrganizationId");
        actionCollectionDTO.setPluginId("testPluginId");
        ActionDTO action = new ActionDTO();
        action.setName("testAction");
        action.setClientSideExecution(true);
        actionCollectionDTO.setActions(List.of(action));
        actionCollectionDTO.setPluginType(PluginType.JS);
        actionCollectionDTO.setDefaultResources(setDefaultResources(actionCollectionDTO));

        ObjectMapper objectMapper = new ObjectMapper();
        final JsonNode jsonNode = objectMapper.readValue(mockObjects, JsonNode.class);
        final NewPage newPage = objectMapper.convertValue(jsonNode.get("newPage"), NewPage.class);

        Mockito
                .when(newPageService.findById(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(newPage));
        Mockito
                .when(layoutActionService.isNameAllowed(Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(true));

        Mockito
                .when(actionCollectionRepository
                        .findAllActionCollectionsByNamePageIdsViewModeAndBranch(
                                Mockito.any(),
                                Mockito.any(),
                                Mockito.anyBoolean(),
                                Mockito.any(),
                                Mockito.any(),
                                Mockito.any()))
                .thenReturn(Flux.empty());

        Mockito
                .when(layoutActionService.createSingleAction(Mockito.any()))
                .thenAnswer(invocation -> {
                    final ActionDTO argument = (ActionDTO) invocation.getArguments()[0];
                    argument.setId("testActionId");
                    return Mono.just(argument);
                });

        Mockito
                .when(actionCollectionRepository.save(Mockito.any()))
                .thenAnswer(invocation -> {
                    final ActionCollection argument = (ActionCollection) invocation.getArguments()[0];
                    argument.setId("testActionCollectionId");
                    return Mono.just(argument);
                });

        Mockito
                .when(layoutActionService.updateSingleAction(Mockito.any(), Mockito.any()))
                .thenAnswer(invocation -> {
                    final ActionDTO argument = (ActionDTO) invocation.getArguments()[1];
                    return Mono.just(argument);
                });

        final Mono<ActionCollectionDTO> actionCollectionDTOMono = layoutCollectionService.createCollection(actionCollectionDTO);

        StepVerifier.create(actionCollectionDTOMono)
                .assertNext(actionCollectionDTO1 -> {
                    Assert.assertEquals(1, actionCollectionDTO1.getActions().size());
                    final ActionDTO actionDTO = actionCollectionDTO1.getActions().get(0);
                    Assert.assertEquals("testAction", actionDTO.getName());
                    Assert.assertEquals("testActionId", actionDTO.getId());
                    Assert.assertEquals("testCollection.testAction", actionDTO.getFullyQualifiedName());
                    Assert.assertEquals("testActionCollectionId", actionDTO.getDefaultResources().getCollectionId());
                    Assert.assertTrue(actionDTO.getClientSideExecution());
                })
                .verifyComplete();
    }

    @Test
    public void testUpdateUnpublishedActionCollection_withoutId_throwsError() {
        ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
        actionCollectionDTO.setId("testId");
        final Mono<ActionCollectionDTO> actionCollectionDTOMono =
                layoutCollectionService.updateUnpublishedActionCollection(null, actionCollectionDTO, null);

        StepVerifier.create(actionCollectionDTOMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.ID)))
                .verify();
    }

    @Test
    public void testUpdateUnpublishedActionCollection_withInvalidId_throwsError() throws IOException {
        ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
        actionCollectionDTO.setId("testId");
        actionCollectionDTO.setDefaultResources(setDefaultResources(actionCollectionDTO));
        actionCollectionDTO.setPageId("testPageId");

        ObjectMapper objectMapper = new ObjectMapper();
        final JsonNode jsonNode = objectMapper.readValue(mockObjects, JsonNode.class);
        final NewPage newPage = objectMapper.convertValue(jsonNode.get("newPage"), NewPage.class);

        Mockito
                .when(actionCollectionRepository.findById(Mockito.anyString(), Mockito.any()))
                .thenReturn(Mono.empty());

        Mockito
                .when(newPageService
                        .findByBranchNameAndDefaultPageId(Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(newPage));

        final Mono<ActionCollectionDTO> actionCollectionDTOMono =
                layoutCollectionService.updateUnpublishedActionCollection("testId", actionCollectionDTO, null);

        StepVerifier.create(actionCollectionDTOMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.NO_RESOURCE_FOUND.getMessage(FieldName.ACTION_COLLECTION, "testId")))
                .verify();
    }

    @Test
    public void testUpdateUnpublishedActionCollection_withModifiedCollection_returnsValidCollection() throws IOException {
        ObjectMapper objectMapper = new ObjectMapper();
        final JsonNode jsonNode = objectMapper.readValue(mockObjects, JsonNode.class);
        final ActionCollection actionCollection = objectMapper.convertValue(jsonNode.get("actionCollectionWithAction"), ActionCollection.class);
        final ActionCollectionDTO modifiedActionCollectionDTO = objectMapper.convertValue(jsonNode.get("actionCollectionDTOWithModifiedActions"), ActionCollectionDTO.class);
        final ActionCollection modifiedActionCollection = objectMapper.convertValue(jsonNode.get("actionCollectionAfterModifiedActions"), ActionCollection.class);
        final ActionCollectionDTO unpublishedCollection = modifiedActionCollection.getUnpublishedCollection();
        unpublishedCollection.setDefaultToBranchedActionIdsMap(Map.of("defaultTestActionId1", "testActionId1", "defaultTestActionId3", "testActionId3"));
        unpublishedCollection.setDefaultToBranchedArchivedActionIdsMap(Map.of("defaultTestActionId2", "testActionId2"));
        actionCollection.setDefaultResources(setDefaultResources(actionCollection));
        modifiedActionCollection.setDefaultResources(actionCollection.getDefaultResources());
        modifiedActionCollectionDTO.setDefaultResources(setDefaultResources(modifiedActionCollectionDTO));
        unpublishedCollection.setDefaultResources(setDefaultResources(unpublishedCollection));

        final Instant archivedAfter = Instant.now();

        Map<String, ActionDTO> updatedActions = new HashMap<>();
        Mockito
                .when(layoutActionService.updateSingleAction(Mockito.any(), Mockito.any()))
                .thenAnswer(invocation -> {
                    final ActionDTO argument = (ActionDTO) invocation.getArguments()[1];
                    DefaultResources defaultResources = new DefaultResources();
                    defaultResources.setActionId((String) invocation.getArguments()[0]);
                    argument.setDefaultResources(defaultResources);
                    argument.setId(defaultResources.getActionId());
                    updatedActions.put(argument.getId(), argument);
                    return Mono.just(argument);
                });

        Mockito
                .when(newActionService.deleteUnpublishedAction(Mockito.any()))
                .thenAnswer(invocation -> {
                    final ActionDTO argument = (ActionDTO) invocation.getArguments()[1];
                    return Mono.just(argument);
                });

        Mockito
                .when(reactiveMongoTemplate.updateFirst(Mockito.any(), Mockito.any(), Mockito.any(Class.class)))
                .thenReturn(Mono.just((Mockito.mock(UpdateResult.class))));

        Mockito
                .when(actionCollectionRepository.findById(Mockito.anyString(), Mockito.any()))
                .thenReturn(Mono.just(actionCollection));

        Mockito
                .when(actionCollectionRepository.findById(Mockito.anyString()))
                .thenReturn(Mono.just(modifiedActionCollection));

        Mockito
                .when(newActionService.findActionDTObyIdAndViewMode(Mockito.any(), Mockito.any(), Mockito.any()))
                .thenAnswer(invocation -> {
                    String id = (String) invocation.getArguments()[0];
                    return Mono.just(updatedActions.get(id));
                });

        Mockito
                .when(responseUtils.updateCollectionDTOWithDefaultResources(Mockito.any()))
                .thenReturn(modifiedActionCollectionDTO);

        final NewPage newPage = objectMapper.convertValue(jsonNode.get("newPage"), NewPage.class);

        Mockito
                .when(newPageService.findByBranchNameAndDefaultPageId(Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(newPage));

        final Mono<ActionCollectionDTO> actionCollectionDTOMono =
                layoutCollectionService.updateUnpublishedActionCollection("testCollectionId", modifiedActionCollectionDTO, null);

        StepVerifier.create(actionCollectionDTOMono)
                .assertNext(actionCollectionDTO1 -> {
                    Assert.assertEquals(2, actionCollectionDTO1.getActions().size());
                    Assert.assertEquals(1, actionCollectionDTO1.getArchivedActions().size());
                    Assert.assertTrue(
                            actionCollectionDTO1
                                    .getActions()
                                    .stream()
                                    .map(ActionDTO::getId)
                                    .collect(Collectors.toSet())
                                    .containsAll(Set.of("testActionId1", "testActionId3")));
                    Assert.assertEquals("testActionId2", actionCollectionDTO1.getArchivedActions().get(0).getId());
                    Assert.assertTrue(archivedAfter.isBefore(actionCollectionDTO1.getArchivedActions().get(0).getArchivedAt()));
                })
                .verifyComplete();
    }

    @Test
    public void testDeleteUnpublishedActionCollection_withInvalidId_throwsError() {
        Mockito
                .when(actionCollectionRepository.findById(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.empty());

        final Mono<ActionCollectionDTO> actionCollectionMono =
                actionCollectionService.deleteUnpublishedActionCollection("invalidId");

        StepVerifier
                .create(actionCollectionMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable
                                .getMessage()
                                .equals(AppsmithError.NO_RESOURCE_FOUND.getMessage(FieldName.ACTION_COLLECTION, "invalidId")))
                .verify();
    }

    @Test
    public void testDeleteUnpublishedActionCollection_withPublishedCollectionAndNoActions_returnsActionCollectionDTO() throws IOException {
        ObjectMapper objectMapper = new ObjectMapper();
        final JsonNode jsonNode = objectMapper.readValue(mockObjects, JsonNode.class);
        final ActionCollection actionCollection = objectMapper.convertValue(jsonNode.get("actionCollectionWithAction"), ActionCollection.class);
        final ActionCollectionDTO unpublishedCollection = actionCollection.getUnpublishedCollection();
        unpublishedCollection.setActions(List.of());
        actionCollection.setDefaultResources(setDefaultResources(actionCollection));
        unpublishedCollection.setDefaultResources(setDefaultResources(unpublishedCollection));

        Instant deletedAt = Instant.now();

        Mockito
                .when(actionCollectionRepository.findById(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(actionCollection));

        Mockito
                .when(actionCollectionRepository.save(Mockito.any()))
                .thenAnswer(invocation -> {
                    final ActionCollection argument = (ActionCollection) invocation.getArguments()[0];
                    return Mono.just(argument);
                });

        final Mono<ActionCollectionDTO> actionCollectionDTOMono = actionCollectionService.deleteUnpublishedActionCollection("testCollectionId");

        StepVerifier
                .create(actionCollectionDTOMono)
                .assertNext(actionCollectionDTO -> {
                    Assert.assertEquals("testCollection", actionCollectionDTO.getName());
                    Assert.assertEquals(0, actionCollectionDTO.getActions().size());
                    Assert.assertTrue(deletedAt.isBefore(actionCollectionDTO.getDeletedAt()));
                })
                .verifyComplete();
    }

    @Test
    public void testDeleteUnpublishedActionCollection_withPublishedCollectionAndActions_returnsActionCollectionDTO() throws IOException {
        ObjectMapper objectMapper = new ObjectMapper();
        final JsonNode jsonNode = objectMapper.readValue(mockObjects, JsonNode.class);
        final ActionCollection actionCollection = objectMapper.convertValue(jsonNode.get("actionCollectionWithAction"), ActionCollection.class);
        ActionCollectionDTO unpublishedCollection = actionCollection.getUnpublishedCollection();
        unpublishedCollection.setDefaultToBranchedActionIdsMap(Map.of("defaultTestActionId1", "testActionId1", "defaultTestActionId2", "testActionId2"));
        actionCollection.setDefaultResources(setDefaultResources(actionCollection));
        unpublishedCollection.setDefaultResources(setDefaultResources(unpublishedCollection));
        Instant deletedAt = Instant.now();

        Mockito
                .when(actionCollectionRepository.findById(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(actionCollection));

        Mockito
                .when(newActionService.deleteUnpublishedAction(Mockito.any()))
                .thenReturn(Mono.just(actionCollection.getUnpublishedCollection().getActions().get(0)));

        Mockito
                .when(actionCollectionRepository.save(Mockito.any()))
                .thenAnswer(invocation -> {
                    final ActionCollection argument = (ActionCollection) invocation.getArguments()[0];
                    return Mono.just(argument);
                });

        final Mono<ActionCollectionDTO> actionCollectionDTOMono = actionCollectionService.deleteUnpublishedActionCollection("testCollectionId");

        StepVerifier
                .create(actionCollectionDTOMono)
                .assertNext(actionCollectionDTO -> {
                    Assert.assertEquals("testCollection", actionCollectionDTO.getName());
                    Assert.assertEquals(2, actionCollectionDTO.getActions().size());
                    Assert.assertTrue(deletedAt.isBefore(actionCollectionDTO.getDeletedAt()));
                })
                .verifyComplete();
    }

    @Test
    public void testDeleteUnpublishedActionCollection_withoutPublishedCollectionAndNoActions_returnsActionCollectionDTO() throws IOException {
        ObjectMapper objectMapper = new ObjectMapper();
        final JsonNode jsonNode = objectMapper.readValue(mockObjects, JsonNode.class);
        final ActionCollection actionCollection = objectMapper.convertValue(jsonNode.get("actionCollectionWithAction"), ActionCollection.class);

        actionCollection.setPublishedCollection(null);
        actionCollection.setDefaultResources(setDefaultResources(actionCollection));
        actionCollection.getUnpublishedCollection().setDefaultResources(setDefaultResources(actionCollection.getUnpublishedCollection()));

        Mockito
                .when(actionCollectionRepository.findById(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(actionCollection));

        Mockito
                .when(actionCollectionRepository.findById(Mockito.anyString()))
                .thenReturn(Mono.just(actionCollection));

        Mockito
                .when(actionCollectionRepository.delete(Mockito.any()))
                .thenReturn(Mono.empty());

        final Mono<ActionCollectionDTO> actionCollectionDTOMono = actionCollectionService.deleteUnpublishedActionCollection("testCollectionId");

        StepVerifier
                .create(actionCollectionDTOMono)
                .assertNext(Assert::assertNotNull)
                .verifyComplete();
    }

    @Test
    public void testDeleteUnpublishedActionCollection_withoutPublishedCollectionAndWithActions_returnsActionCollectionDTO() throws IOException {
        ObjectMapper objectMapper = new ObjectMapper();
        final JsonNode jsonNode = objectMapper.readValue(mockObjects, JsonNode.class);
        final ActionCollection actionCollection = objectMapper.convertValue(jsonNode.get("actionCollectionWithAction"), ActionCollection.class);
        actionCollection.getUnpublishedCollection().setDefaultToBranchedActionIdsMap(Map.of("defaultTestActionId1", "testActionId1", "defaultTestActionId2", "testActionId2"));
        actionCollection.setPublishedCollection(null);
        DefaultResources resources = new DefaultResources();
        resources.setApplicationId("testApplicationId");
        resources.setApplicationId("testCollectionId");
        actionCollection.setDefaultResources(setDefaultResources(actionCollection));
        actionCollection.getUnpublishedCollection().setDefaultResources(setDefaultResources(actionCollection.getUnpublishedCollection()));

        Mockito
                .when(actionCollectionRepository.findById(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(actionCollection));

        Mockito
                .when(actionCollectionRepository.findById(Mockito.anyString()))
                .thenReturn(Mono.just(actionCollection));

        Mockito
                .when(newActionService.delete(Mockito.any()))
                .thenReturn(Mono.just(new NewAction()));

        Mockito
                .when(actionCollectionRepository.delete(Mockito.any()))
                .thenReturn(Mono.empty());

        final Mono<ActionCollectionDTO> actionCollectionDTOMono = actionCollectionService.deleteUnpublishedActionCollection("testCollectionId");

        StepVerifier
                .create(actionCollectionDTOMono)
                .assertNext(Assert::assertNotNull)
                .verifyComplete();
    }

    @Test
    public void testRefactorCollectionName_withDuplicateName_throwsError() {
        final RefactorActionCollectionNameDTO refactorActionCollectionNameDTO = new RefactorActionCollectionNameDTO();
        refactorActionCollectionNameDTO.setActionCollectionId("testCollectionId");
        refactorActionCollectionNameDTO.setPageId("testPageId");
        refactorActionCollectionNameDTO.setLayoutId("testLayoutId");
        refactorActionCollectionNameDTO.setOldName("oldName");
        refactorActionCollectionNameDTO.setNewName("newName");

        final ActionCollection oldActionCollection = new ActionCollection();
        final ActionCollectionDTO oldUnpublishedCollection = new ActionCollectionDTO();
        oldUnpublishedCollection.setPageId("testPageId");
        oldUnpublishedCollection.setName("oldName");
        oldActionCollection.setUnpublishedCollection(oldUnpublishedCollection);

        final ActionCollection duplicateActionCollection = new ActionCollection();
        final ActionCollectionDTO duplicateUnpublishedCollection = new ActionCollectionDTO();
        duplicateUnpublishedCollection.setPageId("testPageId");
        duplicateUnpublishedCollection.setName("newName");
        duplicateActionCollection.setUnpublishedCollection(duplicateUnpublishedCollection);

        Mockito
                .when(actionCollectionRepository.findAllActionCollectionsByNamePageIdsViewModeAndBranch(
                        Mockito.any(),
                        Mockito.any(),
                        Mockito.anyBoolean(),
                        Mockito.any(),
                        Mockito.any(),
                        Mockito.any()))
                .thenReturn(Flux.just(oldActionCollection, duplicateActionCollection));

        Mockito
                .when(layoutActionService.isNameAllowed(Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(false));

        final Mono<LayoutDTO> layoutDTOMono = layoutCollectionService.refactorCollectionName(refactorActionCollectionNameDTO, null);

        StepVerifier
                .create(layoutDTOMono)
                .expectErrorMatches(e -> AppsmithError.DUPLICATE_KEY_USER_ERROR.getMessage("newName", FieldName.NAME).equals(e.getMessage()))
                .verify();
    }

    @Test
    public void testRefactorCollectionName_withEmptyActions_returnsValidLayout() {
        final RefactorActionCollectionNameDTO refactorActionCollectionNameDTO = new RefactorActionCollectionNameDTO();
        refactorActionCollectionNameDTO.setActionCollectionId("testCollectionId");
        refactorActionCollectionNameDTO.setPageId("testPageId");
        refactorActionCollectionNameDTO.setLayoutId("testLayoutId");
        refactorActionCollectionNameDTO.setOldName("oldName");
        refactorActionCollectionNameDTO.setNewName("newName");

        final ActionCollection oldActionCollection = new ActionCollection();
        final ActionCollectionDTO oldUnpublishedCollection = new ActionCollectionDTO();
        oldActionCollection.setId("testCollectionId");
        oldUnpublishedCollection.setPageId("testPageId");
        oldUnpublishedCollection.setName("oldName");
        oldActionCollection.setUnpublishedCollection(oldUnpublishedCollection);
        oldUnpublishedCollection.setDefaultResources(setDefaultResources(oldUnpublishedCollection));
        oldActionCollection.setDefaultResources(setDefaultResources(oldActionCollection));

        Mockito
                .when(actionCollectionRepository.findAllActionCollectionsByNamePageIdsViewModeAndBranch(
                        Mockito.any(),
                        Mockito.any(),
                        Mockito.anyBoolean(),
                        Mockito.any(),
                        Mockito.any(),
                        Mockito.any()))
                .thenReturn(Flux.just(oldActionCollection));

        Mockito
                .when(layoutActionService.isNameAllowed(Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(true));

        Mockito
                .when(actionCollectionRepository.findById(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(oldActionCollection));

        Mockito
                .when(actionCollectionRepository.findById(Mockito.anyString()))
                .thenReturn(Mono.just(oldActionCollection));

        Mockito
                .when(reactiveMongoTemplate.updateFirst(Mockito.any(), Mockito.any(), Mockito.any(Class.class)))
                .thenReturn(Mono.just(UpdateResult.acknowledged(1, 1L, new BsonObjectId())));

        LayoutDTO layout = new LayoutDTO();
        final JSONObject jsonObject = new JSONObject();
        jsonObject.put("key", "value");
        layout.setDsl(jsonObject);
        Mockito
                .when(layoutActionService.refactorName(Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(layout));

        Mockito
                .when(responseUtils.updateLayoutDTOWithDefaultResources(Mockito.any()))
                .thenReturn(layout);

        final Mono<LayoutDTO> layoutDTOMono = layoutCollectionService.refactorCollectionName(refactorActionCollectionNameDTO, null);

        StepVerifier
                .create(layoutDTOMono)
                .assertNext(layoutDTO -> {
                    Assert.assertNotNull(layoutDTO.getDsl());
                    Assert.assertEquals("value", layoutDTO.getDsl().get("key"));
                })
                .verifyComplete();
    }

    @Test
    public void testRefactorCollectionName_withActions_returnsValidLayout() {
        final RefactorActionCollectionNameDTO refactorActionCollectionNameDTO = new RefactorActionCollectionNameDTO();
        refactorActionCollectionNameDTO.setActionCollectionId("testCollectionId");
        refactorActionCollectionNameDTO.setPageId("testPageId");
        refactorActionCollectionNameDTO.setLayoutId("testLayoutId");
        refactorActionCollectionNameDTO.setOldName("oldName");
        refactorActionCollectionNameDTO.setNewName("newName");

        final ActionCollection oldActionCollection = new ActionCollection();
        final ActionCollectionDTO oldUnpublishedCollection = new ActionCollectionDTO();
        oldActionCollection.setId("testCollectionId");
        oldUnpublishedCollection.setPageId("testPageId");
        oldUnpublishedCollection.setName("oldName");
        oldUnpublishedCollection.setDefaultToBranchedActionIdsMap(Map.of("defaultTestActionId", "testActionId"));
        oldActionCollection.setUnpublishedCollection(oldUnpublishedCollection);
        oldActionCollection.setDefaultResources(setDefaultResources(oldActionCollection));
        oldUnpublishedCollection.setDefaultResources(setDefaultResources(oldUnpublishedCollection));

        Mockito
                .when(actionCollectionRepository.findAllActionCollectionsByNamePageIdsViewModeAndBranch(
                        Mockito.any(),
                        Mockito.any(),
                        Mockito.anyBoolean(),
                        Mockito.any(),
                        Mockito.any(),
                        Mockito.any()))
                .thenReturn(Flux.just(oldActionCollection));

        Mockito
                .when(layoutActionService.isNameAllowed(Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(true));

        Mockito
                .when(actionCollectionRepository.findById(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(oldActionCollection));

        Mockito
                .when(newActionService.findActionDTObyIdAndViewMode(Mockito.any(), Mockito.anyBoolean(), Mockito.any()))
                .thenReturn(Mono.just(new ActionDTO()));

        Mockito
                .when(newActionService.updateUnpublishedAction(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(new ActionDTO()));

        Mockito
                .when(actionCollectionRepository.findById(Mockito.anyString()))
                .thenReturn(Mono.just(oldActionCollection));

        Mockito
                .when(reactiveMongoTemplate.updateFirst(Mockito.any(), Mockito.any(), Mockito.any(Class.class)))
                .thenReturn(Mono.just(UpdateResult.acknowledged(1, 1L, new BsonObjectId())));

        LayoutDTO layout = new LayoutDTO();
        final JSONObject jsonObject = new JSONObject();
        jsonObject.put("key", "value");
        layout.setDsl(jsonObject);
        layout.setActionUpdates(new ArrayList<>());
        layout.setLayoutOnLoadActions(new ArrayList<>());
        Mockito
                .when(layoutActionService.refactorName(Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(layout));

        Mockito
                .when(responseUtils.updateLayoutDTOWithDefaultResources(Mockito.any()))
                .thenReturn(layout);

        final Mono<LayoutDTO> layoutDTOMono = layoutCollectionService.refactorCollectionName(refactorActionCollectionNameDTO, null);

        StepVerifier
                .create(layoutDTOMono)
                .assertNext(layoutDTO -> {
                    Assert.assertNotNull(layoutDTO.getDsl());
                    Assert.assertEquals("value", layoutDTO.getDsl().get("key"));
                })
                .verifyComplete();
    }

    @Test
    public void testMoveCollection_toValidPage_returnsCollection() throws IOException {
        final ActionCollectionMoveDTO actionCollectionMoveDTO = new ActionCollectionMoveDTO();
        actionCollectionMoveDTO.setCollectionId("testCollectionId");
        actionCollectionMoveDTO.setDestinationPageId("newPageId");

        final ActionCollection actionCollection = new ActionCollection();
        final ActionCollectionDTO unpublishedCollection = new ActionCollectionDTO();
        unpublishedCollection.setPageId("oldPageId");
        unpublishedCollection.setName("collectionName");
        unpublishedCollection.setDefaultResources(setDefaultResources(unpublishedCollection));
        unpublishedCollection.setDefaultToBranchedActionIdsMap(Map.of("defaultTestActionId", "testActionId"));
        actionCollection.setUnpublishedCollection(unpublishedCollection);
        actionCollection.setDefaultResources(setDefaultResources(actionCollection));
        unpublishedCollection.setDefaultResources(setDefaultResources(unpublishedCollection));

        ActionDTO action = new ActionDTO();
        action.setName("testAction");
        DefaultResources actionResources = new DefaultResources();
        actionResources.setActionId("testAction");
        actionResources.setPageId("newPageId");
        action.setDefaultResources(actionResources);

        Mockito
                .when(actionCollectionRepository.findById(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(actionCollection));

        Mockito
                .when(newActionService.findActionDTObyIdAndViewMode(Mockito.any(), Mockito.anyBoolean(), Mockito.any()))
                .thenReturn(Mono.just(action));

        Mockito
                .when(newActionService.updateUnpublishedAction(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(new ActionDTO()));

        Mockito
                .when(actionCollectionRepository.findById(Mockito.anyString()))
                .thenReturn(Mono.just(actionCollection));

        Mockito
                .when(reactiveMongoTemplate.updateFirst(Mockito.any(), Mockito.any(), Mockito.any(Class.class)))
                .thenReturn(Mono.just(UpdateResult.acknowledged(1, 1L, new BsonObjectId())));

        PageDTO oldPageDTO = new PageDTO();
        oldPageDTO.setId("oldPageId");
        oldPageDTO.setLayouts(List.of(new Layout()));

        PageDTO newPageDTO = new PageDTO();
        newPageDTO.setId("newPageId");
        newPageDTO.setLayouts(List.of(new Layout()));

        ObjectMapper objectMapper = new ObjectMapper();
        final JsonNode jsonNode = objectMapper.readValue(mockObjects, JsonNode.class);
        final NewPage newPage = objectMapper.convertValue(jsonNode.get("newPage"), NewPage.class);
        DefaultResources pageDefaultResources = new DefaultResources();
        pageDefaultResources.setPageId(newPage.getId());
        newPage.setDefaultResources(pageDefaultResources);

        Mockito
                .when(newPageService.findPageById(Mockito.any(), Mockito.any(), Mockito.anyBoolean()))
                .thenReturn(Mono.just(oldPageDTO))
                .thenReturn(Mono.just(newPageDTO));

        Mockito
                .when(newPageService.findById(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(newPage));

        LayoutDTO layout = new LayoutDTO();
        final JSONObject jsonObject = new JSONObject();
        jsonObject.put("key", "value");
        layout.setDsl(jsonObject);

        Mockito
                .when(layoutActionService.unescapeMongoSpecialCharacters(Mockito.any()))
                .thenReturn(jsonObject);

        Mockito
                .when(layoutActionService.updateLayout(Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(layout));

        final Mono<ActionCollectionDTO> actionCollectionDTOMono = layoutCollectionService.moveCollection(actionCollectionMoveDTO);

        StepVerifier
                .create(actionCollectionDTOMono)
                .assertNext(actionCollectionDTO -> {
                    Assert.assertEquals("newPageId", actionCollectionDTO.getPageId());
                })
                .verifyComplete();
    }
}