package com.appsmith.server.services;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.PluginType;
import com.appsmith.external.views.Views;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.actioncollections.base.ActionCollectionServiceImpl;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ActionCollectionMoveDTO;
import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ObjectMapperUtils;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.refactors.applications.RefactoringService;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ActionPermissionImpl;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.ApplicationPermissionImpl;
import com.appsmith.server.solutions.PagePermission;
import com.appsmith.server.solutions.PagePermissionImpl;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mongodb.client.result.UpdateResult;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import org.bson.BsonObjectId;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.test.StepVerifier;

import java.io.File;
import java.io.IOException;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@ExtendWith(SpringExtension.class)
@Slf4j
public class ActionCollectionServiceImplTest {

    private final File mockObjects =
            new File("src/test/resources/test_assets/ActionCollectionServiceTest/mockObjects.json");
    ActionCollectionService actionCollectionService;
    LayoutCollectionService layoutCollectionService;

    @MockBean
    NewPageService newPageService;

    @MockBean
    LayoutActionService layoutActionService;

    @MockBean
    UpdateLayoutService updateLayoutService;

    @MockBean
    RefactoringService refactoringService;

    @MockBean
    ActionCollectionRepository actionCollectionRepository;

    @MockBean
    NewActionService newActionService;

    @MockBean
    ApplicationService applicationService;

    @MockBean
    ResponseUtils responseUtils;

    ApplicationPermission applicationPermission;
    PagePermission pagePermission;
    ActionPermission actionPermission;

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
    private PolicyGenerator policyGenerator;

    @BeforeEach
    public void setUp() {
        applicationPermission = new ApplicationPermissionImpl();
        pagePermission = new PagePermissionImpl();
        actionPermission = new ActionPermissionImpl();
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
                responseUtils,
                applicationPermission,
                actionPermission);

        layoutCollectionService = new LayoutCollectionServiceImpl(
                newPageService,
                layoutActionService,
                updateLayoutService,
                refactoringService,
                actionCollectionService,
                newActionService,
                analyticsService,
                responseUtils,
                actionCollectionRepository,
                pagePermission,
                actionPermission);

        Mockito.when(analyticsService.sendCreateEvent(Mockito.any()))
                .thenAnswer(
                        invocationOnMock -> Mono.justOrEmpty(invocationOnMock.getArguments()[0]));

        Mockito.when(analyticsService.sendCreateEvent(Mockito.any(), Mockito.any()))
                .thenAnswer(
                        invocationOnMock -> Mono.justOrEmpty(invocationOnMock.getArguments()[0]));

        Mockito.when(analyticsService.sendUpdateEvent(Mockito.any()))
                .thenAnswer(
                        invocationOnMock -> Mono.justOrEmpty(invocationOnMock.getArguments()[0]));

        Mockito.when(analyticsService.sendUpdateEvent(Mockito.any(), Mockito.any()))
                .thenAnswer(
                        invocationOnMock -> Mono.justOrEmpty(invocationOnMock.getArguments()[0]));

        Mockito.when(analyticsService.sendDeleteEvent(Mockito.any(), Mockito.any()))
                .thenAnswer(
                        invocationOnMock -> Mono.justOrEmpty(invocationOnMock.getArguments()[0]));

        Mockito.when(analyticsService.sendDeleteEvent(Mockito.any(), Mockito.any()))
                .thenAnswer(
                        invocationOnMock -> Mono.justOrEmpty(invocationOnMock.getArguments()[0]));

        Mockito.when(analyticsService.sendArchiveEvent(Mockito.any(), Mockito.any()))
                .thenAnswer(
                        invocationOnMock -> Mono.justOrEmpty(invocationOnMock.getArguments()[0]));
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
        final Mono<ActionCollectionDTO> actionCollectionDTOMono =
                layoutCollectionService.createCollection(actionCollectionDTO, null);

        StepVerifier.create(actionCollectionDTOMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.ID)))
                .verify();
    }

    @Test
    public void testCreateCollection_withoutOrgPageApplicationPluginIds_throwsError() {
        ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
        final Mono<ActionCollectionDTO> actionCollectionDTOMono =
                layoutCollectionService.createCollection(actionCollectionDTO, null);

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
        actionCollectionDTO.setWorkspaceId("testWorkspaceId");
        actionCollectionDTO.setPluginId("testPluginId");
        actionCollectionDTO.setPluginType(PluginType.JS);

        ObjectMapper objectMapper = new ObjectMapper();
        final JsonNode jsonNode = objectMapper.readValue(mockObjects, JsonNode.class);
        final NewPage newPage = objectMapper.convertValue(jsonNode.get("newPage"), NewPage.class);
        Mockito.when(newPageService.findById(Mockito.any(), Mockito.<AclPermission>any()))
                .thenReturn(Mono.just(newPage));
        Mockito.when(newPageService.findByBranchNameAndDefaultPageId(Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(newPage));
        Mockito.when(refactoringService.isNameAllowed(Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(false));

        Mockito.when(actionCollectionRepository.findAllActionCollectionsByNameDefaultPageIdsViewModeAndBranch(
                        Mockito.any(),
                        Mockito.any(),
                        Mockito.anyBoolean(),
                        Mockito.any(),
                        Mockito.any(),
                        Mockito.any()))
                .thenReturn(Flux.empty());

        final Mono<ActionCollectionDTO> actionCollectionDTOMono =
                layoutCollectionService.createCollection(actionCollectionDTO, null);

        StepVerifier.create(actionCollectionDTOMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .equals(AppsmithError.DUPLICATE_KEY_USER_ERROR.getMessage(
                                        actionCollectionDTO.getName(), FieldName.NAME)))
                .verify();
    }

    @Test
    public void testCreateCollection_createActionFailure_returnsWithIncompleteCollection() throws IOException {
        ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
        actionCollectionDTO.setName("testCollection");
        actionCollectionDTO.setPageId("testPageId");
        actionCollectionDTO.setApplicationId("testApplicationId");
        actionCollectionDTO.setWorkspaceId("testWorkspaceId");
        actionCollectionDTO.setPluginId("testPluginId");
        actionCollectionDTO.setPluginType(PluginType.JS);
        actionCollectionDTO.setDefaultResources(setDefaultResources(actionCollectionDTO));

        ObjectMapper objectMapper = new ObjectMapper();
        final JsonNode jsonNode = objectMapper.readValue(mockObjects, JsonNode.class);
        final NewPage newPage = objectMapper.convertValue(jsonNode.get("newPage"), NewPage.class);

        Mockito.when(newPageService.findById(Mockito.any(), Mockito.<AclPermission>any()))
                .thenReturn(Mono.just(newPage));
        Mockito.when(newPageService.findByBranchNameAndDefaultPageId(Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(newPage));
        Mockito.when(refactoringService.isNameAllowed(Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(true));

        Mockito.when(actionCollectionRepository.findAllActionCollectionsByNameDefaultPageIdsViewModeAndBranch(
                        Mockito.any(),
                        Mockito.any(),
                        Mockito.anyBoolean(),
                        Mockito.any(),
                        Mockito.any(),
                        Mockito.any()))
                .thenReturn(Flux.empty());

        Mockito.when(layoutActionService.createAction(Mockito.any())).thenReturn(Mono.just(new ActionDTO()));

        Mockito.when(updateLayoutService.updatePageLayoutsByPageId(Mockito.anyString()))
                .thenAnswer(invocationOnMock -> {
                    return Mono.just(actionCollectionDTO.getPageId());
                });

        Mockito.when(actionCollectionRepository.save(Mockito.any())).thenAnswer(invocation -> {
            final ActionCollection argument = (ActionCollection) invocation.getArguments()[0];
            argument.setId("testActionCollectionId");
            return Mono.just(argument);
        });
        Mockito.when(actionCollectionRepository.setUserPermissionsInObject(Mockito.any()))
                .thenAnswer(invocation -> {
                    final ActionCollection argument =
                            (ActionCollection) invocation.getArguments()[0];
                    argument.setId("testActionCollectionId");
                    argument.setUserPermissions(Set.of("test-user-permission1", "test-user-permission2"));
                    return Mono.just(argument);
                });

        Mockito.when(responseUtils.updateCollectionDTOWithDefaultResources(Mockito.any()))
                .thenAnswer(invocation -> {
                    final ActionCollectionDTO argument =
                            (ActionCollectionDTO) invocation.getArguments()[0];
                    argument.setDefaultResources(setDefaultResources(argument));
                    return argument;
                });

        final Mono<ActionCollectionDTO> actionCollectionDTOMono =
                layoutCollectionService.createCollection(actionCollectionDTO, null);

        StepVerifier.create(actionCollectionDTOMono)
                .assertNext(actionCollectionDTO1 -> {
                    assertTrue(actionCollectionDTO1.getActions().isEmpty());
                    assertThat(actionCollectionDTO1.getUserPermissions()).hasSize(2);
                })
                .verifyComplete();
    }

    @Test
    public void testCreateCollection_validCollection_returnsPopulatedCollection() throws IOException {
        ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
        actionCollectionDTO.setName("testCollection");
        actionCollectionDTO.setPageId("testPageId");
        actionCollectionDTO.setApplicationId("testApplicationId");
        actionCollectionDTO.setWorkspaceId("testWorkspaceId");
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

        Mockito.when(newPageService.findById(Mockito.any(), Mockito.<AclPermission>any()))
                .thenReturn(Mono.just(newPage));
        Mockito.when(newPageService.findByBranchNameAndDefaultPageId(Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(newPage));
        Mockito.when(refactoringService.isNameAllowed(Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(true));

        Mockito.when(actionCollectionRepository.findAllActionCollectionsByNameDefaultPageIdsViewModeAndBranch(
                        Mockito.any(),
                        Mockito.any(),
                        Mockito.anyBoolean(),
                        Mockito.any(),
                        Mockito.any(),
                        Mockito.any()))
                .thenReturn(Flux.empty());

        Mockito.when(layoutActionService.createSingleAction(Mockito.any(), Mockito.any()))
                .thenAnswer(invocation -> {
                    final ActionDTO argument = (ActionDTO) invocation.getArguments()[0];
                    argument.setId("testActionId");
                    return Mono.just(argument);
                });
        Mockito.when(newActionService.generateActionDomain(Mockito.any())).thenAnswer(invocation -> {
            final ActionDTO argument = (ActionDTO) invocation.getArguments()[0];
            NewAction newAction = new NewAction();
            newAction.setId(argument.getId());
            newAction.setUnpublishedAction(argument);
            return newAction;
        });
        Mockito.when(newActionService.validateAndSaveActionToRepository(Mockito.any()))
                .thenAnswer(invocation -> {
                    final NewAction argument = (NewAction) invocation.getArguments()[0];
                    ActionDTO unpublishedAction = argument.getUnpublishedAction();
                    unpublishedAction.setId("testActionId");
                    return Mono.just(unpublishedAction);
                });

        Mockito.when(updateLayoutService.updatePageLayoutsByPageId(Mockito.anyString()))
                .thenAnswer(invocationOnMock -> {
                    return Mono.just(actionCollectionDTO.getPageId());
                });

        Mockito.when(actionCollectionRepository.save(Mockito.any())).thenAnswer(invocation -> {
            final ActionCollection argument = (ActionCollection) invocation.getArguments()[0];
            argument.setId("testActionCollectionId");
            return Mono.just(argument);
        });

        Mockito.when(layoutActionService.updateSingleAction(Mockito.any(), Mockito.any()))
                .thenAnswer(invocation -> {
                    final ActionDTO argument = (ActionDTO) invocation.getArguments()[1];
                    return Mono.just(argument);
                });

        Mockito.when(actionCollectionRepository.setUserPermissionsInObject(Mockito.any()))
                .thenAnswer(invocation -> {
                    final ActionCollection argument =
                            (ActionCollection) invocation.getArguments()[0];
                    argument.setId("testActionCollectionId");
                    argument.setUserPermissions(Set.of("test-user-permission1", "test-user-permission2"));
                    return Mono.just(argument);
                });

        Mockito.when(responseUtils.updateCollectionDTOWithDefaultResources(Mockito.any()))
                .thenAnswer(invocation -> {
                    final ActionCollectionDTO argument =
                            (ActionCollectionDTO) invocation.getArguments()[0];
                    argument.setDefaultResources(setDefaultResources(argument));
                    return argument;
                });

        final Mono<ActionCollectionDTO> actionCollectionDTOMono =
                layoutCollectionService.createCollection(actionCollectionDTO, null);

        StepVerifier.create(actionCollectionDTOMono)
                .assertNext(actionCollectionDTO1 -> {
                    assertEquals(1, actionCollectionDTO1.getActions().size());
                    assertThat(actionCollectionDTO1.getUserPermissions()).hasSize(2);
                    final ActionDTO actionDTO =
                            actionCollectionDTO1.getActions().get(0);
                    assertEquals("testAction", actionDTO.getName());
                    assertEquals("testActionId", actionDTO.getId());
                    assertEquals("testCollection.testAction", actionDTO.getFullyQualifiedName());
                    assertEquals(
                            "testActionCollectionId",
                            actionDTO.getDefaultResources().getCollectionId());
                    assertTrue(actionDTO.getClientSideExecution());
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
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.ID)))
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

        Mockito.when(actionCollectionRepository.findById(Mockito.anyString(), Mockito.<AclPermission>any()))
                .thenReturn(Mono.empty());

        Mockito.when(newPageService.findByBranchNameAndDefaultPageId(Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(newPage));

        Mockito.when(newPageService.findById(Mockito.any(), Mockito.<AclPermission>any()))
                .thenReturn(Mono.just(newPage));

        final Mono<ActionCollectionDTO> actionCollectionDTOMono =
                layoutCollectionService.updateUnpublishedActionCollection("testId", actionCollectionDTO, null);

        StepVerifier.create(actionCollectionDTOMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .equals(AppsmithError.NO_RESOURCE_FOUND.getMessage(
                                        FieldName.ACTION_COLLECTION, "testId")))
                .verify();
    }

    @Test
    public void testUpdateUnpublishedActionCollection_withModifiedCollection_returnsValidCollection()
            throws IOException {
        ObjectMapper objectMapper = new ObjectMapper();
        ObjectMapperUtils objectMapperUtils = new ObjectMapperUtils(objectMapper);

        final JsonNode jsonNode = objectMapperUtils.readFromFile(mockObjects, Views.Public.class, JsonNode.class);

        String actionCollectionString =
                objectMapperUtils.writeAsString(jsonNode.get("actionCollectionWithAction"), Views.Public.class);
        final ActionCollection actionCollection =
                objectMapperUtils.readFromString(actionCollectionString, Views.Public.class, ActionCollection.class);

        String actionCollectionDTOWithModifiedActionsString = objectMapperUtils.writeAsString(
                jsonNode.get("actionCollectionDTOWithModifiedActions"), Views.Public.class);
        final ActionCollectionDTO modifiedActionCollectionDTO = objectMapperUtils.readFromString(
                actionCollectionDTOWithModifiedActionsString, Views.Public.class, ActionCollectionDTO.class);

        String actionCollectionAfterModifiedActionsString = objectMapperUtils.writeAsString(
                jsonNode.get("actionCollectionAfterModifiedActions"), Views.Public.class);
        final ActionCollection modifiedActionCollection = objectMapperUtils.readFromString(
                actionCollectionAfterModifiedActionsString, Views.Public.class, ActionCollection.class);

        final ActionCollectionDTO unpublishedCollection = modifiedActionCollection.getUnpublishedCollection();
        unpublishedCollection.setDefaultToBranchedActionIdsMap(
                Map.of("defaultTestActionId1", "testActionId1", "defaultTestActionId3", "testActionId3"));
        unpublishedCollection.setDefaultToBranchedArchivedActionIdsMap(Map.of("defaultTestActionId2", "testActionId2"));
        actionCollection.setDefaultResources(setDefaultResources(actionCollection));
        modifiedActionCollection.setDefaultResources(actionCollection.getDefaultResources());
        modifiedActionCollectionDTO.setDefaultResources(setDefaultResources(modifiedActionCollectionDTO));
        unpublishedCollection.setDefaultResources(setDefaultResources(unpublishedCollection));

        final Instant archivedAfter = Instant.now();

        Map<String, ActionDTO> updatedActions = new HashMap<>();
        Mockito.when(layoutActionService.updateSingleAction(Mockito.any(), Mockito.any()))
                .thenAnswer(invocation -> {
                    final ActionDTO argument = (ActionDTO) invocation.getArguments()[1];
                    DefaultResources defaultResources = new DefaultResources();
                    defaultResources.setActionId((String) invocation.getArguments()[0]);
                    argument.setDefaultResources(defaultResources);
                    argument.setId(defaultResources.getActionId());
                    updatedActions.put(argument.getId(), argument);
                    return Mono.just(argument);
                });

        Mockito.when(newActionService.deleteUnpublishedAction(Mockito.any())).thenAnswer(invocation -> {
            final ActionDTO argument = (ActionDTO) invocation.getArguments()[1];
            return Mono.just(argument);
        });

        Mockito.when(reactiveMongoTemplate.updateFirst(Mockito.any(), Mockito.any(), Mockito.any(Class.class)))
                .thenReturn(Mono.just((Mockito.mock(UpdateResult.class))));

        Mockito.when(actionCollectionRepository.findById(Mockito.anyString(), Mockito.<AclPermission>any()))
                .thenReturn(Mono.just(actionCollection));

        Mockito.when(actionCollectionRepository.findById(Mockito.anyString()))
                .thenReturn(Mono.just(modifiedActionCollection));

        Mockito.when(newActionService.findActionDTObyIdAndViewMode(Mockito.any(), Mockito.any(), Mockito.any()))
                .thenAnswer(invocation -> {
                    String id = (String) invocation.getArguments()[0];
                    return Mono.just(updatedActions.get(id));
                });

        Mockito.when(responseUtils.updateCollectionDTOWithDefaultResources(Mockito.any()))
                .thenReturn(modifiedActionCollectionDTO);

        final NewPage newPage = objectMapper.convertValue(jsonNode.get("newPage"), NewPage.class);

        Mockito.when(newPageService.findByBranchNameAndDefaultPageId(Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(newPage));

        Mockito.when(newPageService.findById(Mockito.any(), Mockito.<AclPermission>any()))
                .thenReturn(Mono.just(newPage));

        Mockito.when(actionCollectionRepository.setUserPermissionsInObject(Mockito.any()))
                .thenReturn(Mono.just(modifiedActionCollection));

        Mockito.when(updateLayoutService.updatePageLayoutsByPageId(Mockito.anyString()))
                .thenAnswer(invocationOnMock -> {
                    return Mono.just(actionCollection.getUnpublishedCollection().getPageId());
                });

        final Mono<ActionCollectionDTO> actionCollectionDTOMono =
                layoutCollectionService.updateUnpublishedActionCollection(
                        "testCollectionId", modifiedActionCollectionDTO, null);

        StepVerifier.create(actionCollectionDTOMono)
                .assertNext(actionCollectionDTO1 -> {
                    assertEquals(2, actionCollectionDTO1.getActions().size());
                    assertEquals(1, actionCollectionDTO1.getArchivedActions().size());
                    assertTrue(actionCollectionDTO1.getActions().stream()
                            .map(ActionDTO::getId)
                            .collect(Collectors.toSet())
                            .containsAll(Set.of("testActionId1", "testActionId3")));
                    assertEquals(
                            "testActionId2",
                            actionCollectionDTO1.getArchivedActions().get(0).getId());
                    assertTrue(archivedAfter.isBefore(
                            actionCollectionDTO1.getArchivedActions().get(0).getDeletedAt()));
                })
                .verifyComplete();
    }

    @Test
    public void testDeleteUnpublishedActionCollection_withInvalidId_throwsError() {
        Mockito.when(actionCollectionRepository.findById(Mockito.any(), Mockito.<Optional<AclPermission>>any()))
                .thenReturn(Mono.empty());

        final Mono<ActionCollectionDTO> actionCollectionMono =
                actionCollectionService.deleteUnpublishedActionCollection("invalidId");

        StepVerifier.create(actionCollectionMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .equals(AppsmithError.NO_RESOURCE_FOUND.getMessage(
                                        FieldName.ACTION_COLLECTION, "invalidId")))
                .verify();
    }

    @Test
    public void testDeleteUnpublishedActionCollection_withPublishedCollectionAndNoActions_returnsActionCollectionDTO()
            throws IOException {
        ObjectMapper objectMapper = new ObjectMapper();
        final JsonNode jsonNode = objectMapper.readValue(mockObjects, JsonNode.class);
        final ActionCollection actionCollection = objectMapper
                .readerWithView(Views.Public.class)
                .readValue(jsonNode.get("actionCollectionWithAction"), ActionCollection.class);
        final ActionCollectionDTO unpublishedCollection = actionCollection.getUnpublishedCollection();
        unpublishedCollection.setActions(List.of());
        actionCollection.setDefaultResources(setDefaultResources(actionCollection));
        unpublishedCollection.setDefaultResources(setDefaultResources(unpublishedCollection));

        Instant deletedAt = Instant.now();

        Mockito.when(actionCollectionRepository.findById(Mockito.any(), Mockito.<Optional<AclPermission>>any()))
                .thenReturn(Mono.just(actionCollection));

        Mockito.when(actionCollectionRepository.save(Mockito.any())).thenAnswer(invocation -> {
            final ActionCollection argument = (ActionCollection) invocation.getArguments()[0];
            return Mono.just(argument);
        });

        final Mono<ActionCollectionDTO> actionCollectionDTOMono =
                actionCollectionService.deleteUnpublishedActionCollection("testCollectionId");

        StepVerifier.create(actionCollectionDTOMono)
                .assertNext(actionCollectionDTO -> {
                    assertEquals("testCollection", actionCollectionDTO.getName());
                    assertEquals(0, actionCollectionDTO.getActions().size());
                    assertTrue(deletedAt.isBefore(actionCollectionDTO.getDeletedAt()));
                })
                .verifyComplete();
    }

    @Test
    public void testDeleteUnpublishedActionCollection_withPublishedCollectionAndActions_returnsActionCollectionDTO()
            throws IOException {
        ObjectMapper objectMapper = new ObjectMapper();
        final JsonNode jsonNode =
                objectMapper.readerWithView(Views.Public.class).readValue(mockObjects, JsonNode.class);
        final ActionCollection actionCollection = objectMapper
                .readerWithView(Views.Public.class)
                .readValue(
                        objectMapper
                                .writerWithView(Views.Public.class)
                                .writeValueAsString(jsonNode.get("actionCollectionWithAction")),
                        ActionCollection.class);
        ActionCollectionDTO unpublishedCollection = actionCollection.getUnpublishedCollection();
        unpublishedCollection.setDefaultToBranchedActionIdsMap(
                Map.of("defaultTestActionId1", "testActionId1", "defaultTestActionId2", "testActionId2"));
        actionCollection.setDefaultResources(setDefaultResources(actionCollection));
        unpublishedCollection.setDefaultResources(setDefaultResources(unpublishedCollection));
        Instant deletedAt = Instant.now();

        Mockito.when(actionCollectionRepository.findById(Mockito.any(), Mockito.<Optional<AclPermission>>any()))
                .thenReturn(Mono.just(actionCollection));

        Mockito.when(newActionService.deleteUnpublishedAction(Mockito.any()))
                .thenReturn(Mono.just(
                        actionCollection.getUnpublishedCollection().getActions().get(0)));

        Mockito.when(actionCollectionRepository.save(Mockito.any())).thenAnswer(invocation -> {
            final ActionCollection argument = (ActionCollection) invocation.getArguments()[0];
            return Mono.just(argument);
        });

        final Mono<ActionCollectionDTO> actionCollectionDTOMono =
                actionCollectionService.deleteUnpublishedActionCollection("testCollectionId");

        StepVerifier.create(actionCollectionDTOMono)
                .assertNext(actionCollectionDTO -> {
                    assertEquals("testCollection", actionCollectionDTO.getName());
                    assertEquals(2, actionCollectionDTO.getActions().size());
                    assertTrue(deletedAt.isBefore(actionCollectionDTO.getDeletedAt()));
                })
                .verifyComplete();
    }

    @Test
    public void
            testDeleteUnpublishedActionCollection_withoutPublishedCollectionAndNoActions_returnsActionCollectionDTO()
                    throws IOException {
        ObjectMapper objectMapper = new ObjectMapper();
        final JsonNode jsonNode =
                objectMapper.readerWithView(Views.Public.class).readValue(mockObjects, JsonNode.class);
        final ActionCollection actionCollection = objectMapper
                .readerWithView(Views.Public.class)
                .readValue(
                        objectMapper
                                .writerWithView(Views.Public.class)
                                .writeValueAsString(jsonNode.get("actionCollectionWithAction")),
                        ActionCollection.class);

        actionCollection.setPublishedCollection(null);
        actionCollection.setDefaultResources(setDefaultResources(actionCollection));
        actionCollection
                .getUnpublishedCollection()
                .setDefaultResources(setDefaultResources(actionCollection.getUnpublishedCollection()));

        Mockito.when(actionCollectionRepository.findById(Mockito.any(), Mockito.<Optional<AclPermission>>any()))
                .thenReturn(Mono.just(actionCollection));

        Mockito.when(actionCollectionRepository.findById(Mockito.anyString())).thenReturn(Mono.just(actionCollection));

        Mockito.when(actionCollectionRepository.archive(Mockito.any())).thenReturn(Mono.empty());

        final Mono<ActionCollectionDTO> actionCollectionDTOMono =
                actionCollectionService.deleteUnpublishedActionCollection("testCollectionId");

        StepVerifier.create(actionCollectionDTOMono)
                .assertNext(Assertions::assertNotNull)
                .verifyComplete();
    }

    @Test
    public void
            testDeleteUnpublishedActionCollection_withoutPublishedCollectionAndWithActions_returnsActionCollectionDTO()
                    throws IOException {
        ObjectMapper objectMapper = new ObjectMapper();
        final JsonNode jsonNode =
                objectMapper.readerWithView(Views.Public.class).readValue(mockObjects, JsonNode.class);
        final ActionCollection actionCollection = objectMapper
                .readerWithView(Views.Public.class)
                .readValue(
                        objectMapper
                                .writerWithView(Views.Public.class)
                                .writeValueAsString(jsonNode.get("actionCollectionWithAction")),
                        ActionCollection.class);
        actionCollection
                .getUnpublishedCollection()
                .setDefaultToBranchedActionIdsMap(
                        Map.of("defaultTestActionId1", "testActionId1", "defaultTestActionId2", "testActionId2"));
        actionCollection.setPublishedCollection(null);
        DefaultResources resources = new DefaultResources();
        resources.setApplicationId("testApplicationId");
        resources.setApplicationId("testCollectionId");
        actionCollection.setDefaultResources(setDefaultResources(actionCollection));
        actionCollection
                .getUnpublishedCollection()
                .setDefaultResources(setDefaultResources(actionCollection.getUnpublishedCollection()));

        Mockito.when(actionCollectionRepository.findById(Mockito.any(), Mockito.<Optional<AclPermission>>any()))
                .thenReturn(Mono.just(actionCollection));

        Mockito.when(actionCollectionRepository.findById(Mockito.anyString())).thenReturn(Mono.just(actionCollection));

        Mockito.when(newActionService.archiveById(Mockito.any())).thenReturn(Mono.just(new NewAction()));

        Mockito.when(actionCollectionRepository.archive(Mockito.any())).thenReturn(Mono.empty());

        final Mono<ActionCollectionDTO> actionCollectionDTOMono =
                actionCollectionService.deleteUnpublishedActionCollection("testCollectionId");

        StepVerifier.create(actionCollectionDTOMono)
                .assertNext(Assertions::assertNotNull)
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

        Mockito.when(actionCollectionRepository.findById(Mockito.any(), Mockito.<AclPermission>any()))
                .thenReturn(Mono.just(actionCollection));

        Mockito.when(newActionService.findActionDTObyIdAndViewMode(Mockito.any(), Mockito.anyBoolean(), Mockito.any()))
                .thenReturn(Mono.just(action));

        Mockito.when(newActionService.updateUnpublishedAction(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(new ActionDTO()));

        Mockito.when(actionCollectionRepository.findById(Mockito.anyString())).thenReturn(Mono.just(actionCollection));

        Mockito.when(reactiveMongoTemplate.updateFirst(Mockito.any(), Mockito.any(), Mockito.any(Class.class)))
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

        Mockito.when(newPageService.findPageById(Mockito.any(), Mockito.any(), Mockito.anyBoolean()))
                .thenReturn(Mono.just(oldPageDTO))
                .thenReturn(Mono.just(newPageDTO));

        Mockito.when(newPageService.findById(Mockito.any(), Mockito.<AclPermission>any()))
                .thenReturn(Mono.just(newPage));

        LayoutDTO layout = new LayoutDTO();
        final JSONObject jsonObject = new JSONObject();
        jsonObject.put("key", "value");
        layout.setDsl(jsonObject);

        Mockito.when(updateLayoutService.unescapeMongoSpecialCharacters(Mockito.any()))
                .thenReturn(jsonObject);

        Mockito.when(updateLayoutService.updateLayout(Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(layout));

        Mockito.when(actionCollectionRepository.setUserPermissionsInObject(Mockito.any()))
                .thenReturn(Mono.just(actionCollection));

        final Mono<ActionCollectionDTO> actionCollectionDTOMono =
                layoutCollectionService.moveCollection(actionCollectionMoveDTO);

        StepVerifier.create(actionCollectionDTOMono)
                .assertNext(actionCollectionDTO -> {
                    assertEquals("newPageId", actionCollectionDTO.getPageId());
                })
                .verifyComplete();
    }

    @Test
    public void testGenerateActionCollectionByViewModeTestTransientFields() {
        ActionCollection actionCollection = new ActionCollection();
        String mockId = "mock-id";
        String mockAppId = "mock-app-id";
        String mockWorkspaceId = "mock-workspace-id";
        Set<String> mockPermissions = Set.of("mock-permission-1", "mock-permission-2", "mock-permission-3");
        DefaultResources mockDefaultResources = new DefaultResources();
        mockDefaultResources.setApplicationId(mockAppId);
        ActionCollectionDTO mockApplicationCollectionDTO = new ActionCollectionDTO();
        mockApplicationCollectionDTO.setDefaultResources(mockDefaultResources);
        actionCollection.setId(mockId);
        actionCollection.setApplicationId(mockAppId);
        actionCollection.setWorkspaceId(mockWorkspaceId);
        actionCollection.setUserPermissions(mockPermissions);
        actionCollection.setPublishedCollection(mockApplicationCollectionDTO);
        actionCollection.setUnpublishedCollection(mockApplicationCollectionDTO);
        actionCollection.setDefaultResources(mockDefaultResources);

        Mono<ActionCollectionDTO> unpublishedActionCollectionDTOMono =
                actionCollectionService.generateActionCollectionByViewMode(actionCollection, false);
        Mono<ActionCollectionDTO> publishedActionCollectionDTOMono =
                actionCollectionService.generateActionCollectionByViewMode(actionCollection, true);

        StepVerifier.create(Mono.zip(publishedActionCollectionDTOMono, unpublishedActionCollectionDTOMono))
                .assertNext(tuple -> {
                    ActionCollectionDTO publishedActionCollectionDTO = tuple.getT1();
                    ActionCollectionDTO unpublishedActionCollectionDTO = tuple.getT2();
                    assertNotNull(publishedActionCollectionDTO);
                    assertEquals(mockId, publishedActionCollectionDTO.getId());
                    assertEquals(mockAppId, publishedActionCollectionDTO.getApplicationId());
                    assertEquals(mockWorkspaceId, publishedActionCollectionDTO.getWorkspaceId());
                    assertEquals(mockPermissions, publishedActionCollectionDTO.getUserPermissions());
                    assertEquals(
                            mockAppId,
                            publishedActionCollectionDTO.getDefaultResources().getApplicationId());

                    assertNotNull(unpublishedActionCollectionDTO);
                    assertEquals(mockId, unpublishedActionCollectionDTO.getId());
                    assertEquals(mockAppId, unpublishedActionCollectionDTO.getApplicationId());
                    assertEquals(mockWorkspaceId, unpublishedActionCollectionDTO.getWorkspaceId());
                    assertEquals(mockPermissions, unpublishedActionCollectionDTO.getUserPermissions());
                    assertEquals(
                            mockAppId,
                            unpublishedActionCollectionDTO.getDefaultResources().getApplicationId());
                })
                .verifyComplete();
    }
}
