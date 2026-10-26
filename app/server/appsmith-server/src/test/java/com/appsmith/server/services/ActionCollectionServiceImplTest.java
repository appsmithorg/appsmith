package com.appsmith.server.services;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.PluginType;
import com.appsmith.external.views.Views;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.actioncollections.base.ActionCollectionServiceImpl;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
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
import io.micrometer.observation.ObservationRegistry;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;
import reactor.test.StepVerifier;

import java.io.File;
import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;

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

    ApplicationPermission applicationPermission;
    PagePermission pagePermission;
    ActionPermission actionPermission;

    @MockBean
    ObservationRegistry observationRegistry;

    @MockBean
    private Validator validator;

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
                validator,
                actionCollectionRepository,
                analyticsService,
                newActionService,
                policyGenerator,
                applicationService,
                applicationPermission,
                actionPermission,
                observationRegistry);

        layoutCollectionService = new LayoutCollectionServiceImpl(
                newPageService,
                layoutActionService,
                updateLayoutService,
                refactoringService,
                actionCollectionService,
                newActionService,
                analyticsService,
                actionCollectionRepository,
                pagePermission,
                actionPermission,
                observationRegistry);

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

        ObservationRegistry.ObservationConfig mockObservationConfig =
                Mockito.mock(ObservationRegistry.ObservationConfig.class);
        Mockito.when(observationRegistry.observationConfig()).thenReturn(mockObservationConfig);

        Mockito.when(newActionService.postProcessNewlyAddedActions(Mockito.any()))
                .thenReturn(Mono.empty().then());
    }

    @Test
    public void testCreateCollection_withId_throwsError() {
        ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
        actionCollectionDTO.setId("testId");
        final Mono<ActionCollectionDTO> actionCollectionDTOMono =
                layoutCollectionService.createCollection(actionCollectionDTO);

        StepVerifier.create(actionCollectionDTOMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.ID)))
                .verify();
    }

    @Test
    public void testCreateCollection_withoutOrgPageApplicationPluginIds_throwsError() {
        ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
        final Mono<ActionCollectionDTO> actionCollectionDTOMono =
                layoutCollectionService.createCollection(actionCollectionDTO);

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
        Mockito.when(newPageService.findByRefTypeAndRefNameAndBasePageId(
                        any(), Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(newPage));
        Mockito.when(refactoringService.isNameAllowed(Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(false));

        final Mono<ActionCollectionDTO> actionCollectionDTOMono =
                layoutCollectionService.createCollection(actionCollectionDTO);

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

        ObjectMapper objectMapper = new ObjectMapper();
        final JsonNode jsonNode = objectMapper.readValue(mockObjects, JsonNode.class);
        final NewPage newPage = objectMapper.convertValue(jsonNode.get("newPage"), NewPage.class);

        Mockito.when(newPageService.findById(Mockito.any(), Mockito.<AclPermission>any()))
                .thenReturn(Mono.just(newPage));
        Mockito.when(newPageService.findByRefTypeAndRefNameAndBasePageId(
                        any(), Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(newPage));
        Mockito.when(refactoringService.isNameAllowed(Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(true));

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

        final Mono<ActionCollectionDTO> actionCollectionDTOMono =
                layoutCollectionService.createCollection(actionCollectionDTO);

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

        ObjectMapper objectMapper = new ObjectMapper();
        final JsonNode jsonNode = objectMapper.readValue(mockObjects, JsonNode.class);
        final NewPage newPage = objectMapper.convertValue(jsonNode.get("newPage"), NewPage.class);

        Mockito.when(newPageService.findById(Mockito.any(), Mockito.<AclPermission>any()))
                .thenReturn(Mono.just(newPage));
        Mockito.when(newPageService.findByRefTypeAndRefNameAndBasePageId(
                        any(), Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(newPage));
        Mockito.when(refactoringService.isNameAllowed(Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(true));

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

        final Mono<ActionCollectionDTO> actionCollectionDTOMono =
                layoutCollectionService.createCollection(actionCollectionDTO);

        StepVerifier.create(actionCollectionDTOMono)
                .assertNext(actionCollectionDTO1 -> {
                    assertEquals(1, actionCollectionDTO1.getActions().size());
                    assertThat(actionCollectionDTO1.getUserPermissions()).hasSize(2);
                    final ActionDTO actionDTO =
                            actionCollectionDTO1.getActions().get(0);
                    assertEquals("testAction", actionDTO.getName());
                    assertEquals("testActionId", actionDTO.getId());
                    assertEquals("testCollection.testAction", actionDTO.getFullyQualifiedName());
                    assertTrue(actionDTO.getClientSideExecution());
                })
                .verifyComplete();
    }

    /**
     * Regression test for the concurrent mutation of the {@code newlyAddedActions} list in
     * {@link com.appsmith.server.actioncollections.base.ActionCollectionServiceCEImpl#validateAndSaveCollection}.
     *
     * <p>That method creates the collection's new JS actions with a concurrent {@code flatMap} and
     * side-effects each created action into a shared list via {@code doOnNext(newlyAddedActions::add)}.
     * In production each inner action-save completes on a MongoDB/Netty worker thread, so the adds race.
     * A non-thread-safe {@link ArrayList} corrupts under that race — most visibly throwing
     * {@link ArrayIndexOutOfBoundsException} from {@code ArrayList.add}, but it can also silently drop
     * entries so that {@code postProcessNewlyAddedActions} sees fewer than were created.
     *
     * <p>This test forces that concurrency deterministically: every action-save is scheduled on its own
     * worker thread and released simultaneously through a {@link CyclicBarrier}, so all the adds happen
     * at once. It fails against the pre-fix source (non-thread-safe list) and passes once the list is
     * made thread-safe.
     */
    @Test
    public void testCreateCollection_concurrentJsActionCreation_createsEveryActionWithoutRace() throws IOException {
        final int actionCount = 64;
        final int iterations = 5;

        ObjectMapper objectMapper = new ObjectMapper();
        final JsonNode jsonNode = objectMapper.readValue(mockObjects, JsonNode.class);
        final NewPage newPage = objectMapper.convertValue(jsonNode.get("newPage"), NewPage.class);

        Mockito.when(newPageService.findById(Mockito.any(), Mockito.<AclPermission>any()))
                .thenReturn(Mono.just(newPage));
        Mockito.when(newPageService.findByRefTypeAndRefNameAndBasePageId(
                        any(), Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(newPage));
        Mockito.when(refactoringService.isNameAllowed(Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(true));

        Mockito.when(newActionService.generateActionDomain(Mockito.any())).thenAnswer(invocation -> {
            final ActionDTO argument = (ActionDTO) invocation.getArguments()[0];
            NewAction newAction = new NewAction();
            newAction.setUnpublishedAction(argument);
            return newAction;
        });

        // One worker thread per action, released together, so every doOnNext(list::add) runs at the
        // same instant — the same concurrency MongoDB/Netty produces in production.
        final CyclicBarrier barrier = new CyclicBarrier(actionCount);
        final Scheduler raceScheduler =
                Schedulers.newBoundedElastic(actionCount + 4, Integer.MAX_VALUE, "jsaction-race-test");

        Mockito.when(newActionService.validateAndSaveActionToRepository(Mockito.any()))
                .thenAnswer(invocation -> {
                    final NewAction argument = (NewAction) invocation.getArguments()[0];
                    final ActionDTO unpublishedAction = argument.getUnpublishedAction();
                    unpublishedAction.setId("id-" + unpublishedAction.getName());
                    return Mono.fromCallable(() -> {
                                barrier.await(20, TimeUnit.SECONDS);
                                return unpublishedAction;
                            })
                            .subscribeOn(raceScheduler);
                });

        final List<Integer> postProcessedSizes = new CopyOnWriteArrayList<>();
        Mockito.when(newActionService.postProcessNewlyAddedActions(Mockito.any()))
                .thenAnswer(invocation -> {
                    @SuppressWarnings("unchecked")
                    final List<ActionDTO> list = (List<ActionDTO>) invocation.getArguments()[0];
                    // size() is read after collectList() has completed (all adds done), so it is stable.
                    postProcessedSizes.add(list.size());
                    return Mono.empty().then();
                });

        Mockito.when(updateLayoutService.updatePageLayoutsByPageId(Mockito.anyString()))
                .thenAnswer(invocationOnMock -> Mono.just("testPageId"));

        Mockito.when(actionCollectionRepository.save(Mockito.any())).thenAnswer(invocation -> {
            final ActionCollection argument = (ActionCollection) invocation.getArguments()[0];
            argument.setId("testActionCollectionId");
            return Mono.just(argument);
        });
        Mockito.when(layoutActionService.updateSingleAction(Mockito.any(), Mockito.any()))
                .thenAnswer(invocation -> Mono.just((ActionDTO) invocation.getArguments()[1]));
        Mockito.when(actionCollectionRepository.setUserPermissionsInObject(Mockito.any()))
                .thenAnswer(invocation -> {
                    final ActionCollection argument =
                            (ActionCollection) invocation.getArguments()[0];
                    argument.setId("testActionCollectionId");
                    return Mono.just(argument);
                });

        try {
            for (int iteration = 0; iteration < iterations; iteration++) {
                ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
                actionCollectionDTO.setName("testCollection");
                actionCollectionDTO.setPageId("testPageId");
                actionCollectionDTO.setApplicationId("testApplicationId");
                actionCollectionDTO.setWorkspaceId("testWorkspaceId");
                actionCollectionDTO.setPluginId("testPluginId");
                actionCollectionDTO.setPluginType(PluginType.JS);

                List<ActionDTO> actions = new ArrayList<>();
                for (int i = 0; i < actionCount; i++) {
                    ActionDTO action = new ActionDTO();
                    action.setName("testAction" + i);
                    action.setClientSideExecution(true);
                    actions.add(action);
                }
                actionCollectionDTO.setActions(actions);

                final Mono<ActionCollectionDTO> actionCollectionDTOMono =
                        layoutCollectionService.createCollection(actionCollectionDTO);

                StepVerifier.create(actionCollectionDTOMono)
                        .assertNext(result ->
                                assertEquals(actionCount, result.getActions().size()))
                        .verifyComplete();
            }
        } finally {
            raceScheduler.dispose();
        }

        assertEquals(iterations, postProcessedSizes.size());
        postProcessedSizes.forEach(size -> assertEquals(actionCount, size.intValue()));
    }

    @Test
    public void testUpdateUnpublishedActionCollection_withoutId_throwsError() {
        ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
        actionCollectionDTO.setId("testId");
        final Mono<ActionCollectionDTO> actionCollectionDTOMono =
                layoutCollectionService.updateUnpublishedActionCollection(null, actionCollectionDTO);

        StepVerifier.create(actionCollectionDTOMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.ID)))
                .verify();
    }

    @Test
    public void testUpdateUnpublishedActionCollection_withInvalidId_throwsError() throws IOException {
        ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
        actionCollectionDTO.setId("testId");
        actionCollectionDTO.setPageId("testPageId");

        ObjectMapper objectMapper = new ObjectMapper();
        final JsonNode jsonNode = objectMapper.readValue(mockObjects, JsonNode.class);
        final NewPage newPage = objectMapper.convertValue(jsonNode.get("newPage"), NewPage.class);

        Mockito.when(actionCollectionRepository.findById(Mockito.anyString(), Mockito.<AclPermission>any()))
                .thenReturn(Mono.empty());

        Mockito.when(newPageService.findByRefTypeAndRefNameAndBasePageId(
                        any(), Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(newPage));

        Mockito.when(newPageService.findById(Mockito.any(), Mockito.<AclPermission>any()))
                .thenReturn(Mono.just(newPage));

        Mockito.when(newActionService.findByCollectionIdAndViewMode(
                        Mockito.anyString(), Mockito.anyBoolean(), Mockito.any()))
                .thenReturn(Flux.empty());

        final Mono<ActionCollectionDTO> actionCollectionDTOMono =
                layoutCollectionService.updateUnpublishedActionCollection("testId", actionCollectionDTO);

        StepVerifier.create(actionCollectionDTOMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .equals(AppsmithError.NO_RESOURCE_FOUND.getMessage(
                                        FieldName.ACTION_COLLECTION, "testId")))
                .verify();
    }

    @Test
    public void testDeleteUnpublishedActionCollection_withInvalidId_throwsError() {
        Mockito.when(actionCollectionRepository.findById(Mockito.any(), Mockito.<AclPermission>any()))
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
    public void testArchiveActionCollection_propagatesChildActionError() throws IOException {
        ObjectMapper objectMapper = new ObjectMapper();
        JsonNode jsonNode = objectMapper.readValue(mockObjects, JsonNode.class);
        ActionCollection actionCollection = objectMapper
                .readerWithView(Views.Public.class)
                .readValue(jsonNode.get("actionCollectionWithAction"), ActionCollection.class);
        actionCollection.setPublishedCollection(null);

        NewAction childAction = new NewAction();
        childAction.setUnpublishedAction(actionCollection.getUnpublishedCollection().getActions().get(0));

        Mockito.when(actionCollectionRepository.findById(Mockito.anyString()))
                .thenReturn(Mono.just(actionCollection));
        Mockito.when(newActionService.findByCollectionIdAndViewMode(
                        Mockito.anyString(), Mockito.anyBoolean(), Mockito.any()))
                .thenReturn(Flux.just(childAction));
        Mockito.when(newActionService.archiveGivenNewAction(Mockito.any()))
                .thenReturn(Mono.error(new IllegalStateException("child archive failed")));

        StepVerifier.create(actionCollectionService.archiveById("testCollectionId"))
                .expectErrorMessage("child archive failed")
                .verify();

        Mockito.verify(actionCollectionRepository, Mockito.never()).archive(Mockito.any());
    }

    @Test
    public void testDeleteUnpublishedActionCollection_propagatesChildActionError() throws IOException {
        ObjectMapper objectMapper = new ObjectMapper();
        JsonNode jsonNode = objectMapper.readValue(mockObjects, JsonNode.class);
        ActionCollection actionCollection = objectMapper
                .readerWithView(Views.Public.class)
                .readValue(jsonNode.get("actionCollectionWithAction"), ActionCollection.class);

        NewAction childAction = new NewAction();
        childAction.setUnpublishedAction(actionCollection.getUnpublishedCollection().getActions().get(0));

        Mockito.when(actionCollectionRepository.findById(Mockito.any(), Mockito.<AclPermission>any()))
                .thenReturn(Mono.just(actionCollection));
        Mockito.when(newActionService.findByCollectionIdAndViewMode(
                        Mockito.anyString(), Mockito.anyBoolean(), Mockito.any()))
                .thenReturn(Flux.just(childAction));
        Mockito.when(newActionService.deleteGivenNewAction(Mockito.any()))
                .thenReturn(Mono.error(new IllegalStateException("child delete failed")));

        StepVerifier.create(actionCollectionService.deleteUnpublishedActionCollection("testCollectionId"))
                .expectErrorMessage("child delete failed")
                .verify();

        Mockito.verify(actionCollectionRepository, Mockito.never()).save(Mockito.any());
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

        Instant deletedAt = Instant.now();

        Mockito.when(actionCollectionRepository.findById(Mockito.any(), Mockito.<AclPermission>any()))
                .thenReturn(Mono.just(actionCollection));

        Mockito.when(newActionService.findByCollectionIdAndViewMode(
                        Mockito.anyString(), Mockito.anyBoolean(), Mockito.any()))
                .thenReturn(Flux.empty());

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
        Instant deletedAt = Instant.now();

        Mockito.when(actionCollectionRepository.findById(Mockito.any(), Mockito.<AclPermission>any()))
                .thenReturn(Mono.just(actionCollection));

        ActionDTO actionDTO =
                actionCollection.getUnpublishedCollection().getActions().get(0);
        NewAction newAction = new NewAction();
        newAction.setUnpublishedAction(actionDTO);
        Mockito.when(newActionService.findByCollectionIdAndViewMode(
                        Mockito.anyString(), Mockito.anyBoolean(), Mockito.any()))
                .thenReturn(Flux.just(newAction));

        Mockito.when(newActionService.deleteGivenNewAction(Mockito.any())).thenReturn(Mono.just(actionDTO));

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

        Mockito.when(actionCollectionRepository.findById(Mockito.any(), Mockito.<AclPermission>any()))
                .thenReturn(Mono.just(actionCollection));

        ActionDTO actionDTO =
                actionCollection.getUnpublishedCollection().getActions().get(0);
        NewAction newAction = new NewAction();
        newAction.setUnpublishedAction(actionDTO);
        Mockito.when(newActionService.findByCollectionIdAndViewMode(
                        Mockito.anyString(), Mockito.anyBoolean(), Mockito.any()))
                .thenReturn(Flux.just(newAction));

        Mockito.when(newActionService.archiveGivenNewAction(Mockito.any())).thenReturn(Mono.just(newAction));

        Mockito.when(actionCollectionRepository.findById(Mockito.anyString())).thenReturn(Mono.just(actionCollection));

        Mockito.when(actionCollectionRepository.archive(Mockito.any())).thenReturn(Mono.empty());

        Mockito.when(newActionService.generateActionByViewMode(any(NewAction.class), Mockito.anyBoolean()))
                .thenAnswer(x -> x.getArgument(0, NewAction.class).getUnpublishedAction());
        Mockito.when(newActionService.postProcessDeletedActions(Mockito.any())).thenReturn(Mono.empty());

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
        actionCollection.setPublishedCollection(null);

        Mockito.when(actionCollectionRepository.findById(Mockito.any(), Mockito.<AclPermission>any()))
                .thenReturn(Mono.just(actionCollection));

        ActionDTO actionDTO =
                actionCollection.getUnpublishedCollection().getActions().get(0);
        NewAction newAction = new NewAction();
        newAction.setUnpublishedAction(actionDTO);
        Mockito.when(newActionService.findByCollectionIdAndViewMode(
                        Mockito.anyString(), Mockito.anyBoolean(), Mockito.any()))
                .thenReturn(Flux.just(newAction));

        Mockito.when(newActionService.archiveGivenNewAction(Mockito.any())).thenReturn(Mono.just(newAction));

        Mockito.when(actionCollectionRepository.findById(Mockito.anyString())).thenReturn(Mono.just(actionCollection));

        Mockito.when(newActionService.archiveById(Mockito.any())).thenReturn(Mono.just(new NewAction()));

        Mockito.when(actionCollectionRepository.archive(Mockito.any())).thenReturn(Mono.empty());

        Mockito.when(newActionService.generateActionByViewMode(any(NewAction.class), Mockito.anyBoolean()))
                .thenAnswer(x -> x.getArgument(0, NewAction.class).getUnpublishedAction());
        Mockito.when(newActionService.postProcessDeletedActions(Mockito.any())).thenReturn(Mono.empty());

        final Mono<ActionCollectionDTO> actionCollectionDTOMono =
                actionCollectionService.deleteUnpublishedActionCollection("testCollectionId");

        StepVerifier.create(actionCollectionDTOMono)
                .assertNext(Assertions::assertNotNull)
                .verifyComplete();
    }

    @Test
    public void testGenerateActionCollectionByViewModeTestTransientFields() {
        ActionCollection actionCollection = new ActionCollection();
        String mockId = "mock-id";
        String mockAppId = "mock-app-id";
        String mockWorkspaceId = "mock-workspace-id";
        Set<String> mockPermissions = Set.of("mock-permission-1", "mock-permission-2", "mock-permission-3");
        ActionCollectionDTO mockApplicationCollectionDTO = new ActionCollectionDTO();

        actionCollection.setId(mockId);
        actionCollection.setApplicationId(mockAppId);
        actionCollection.setWorkspaceId(mockWorkspaceId);
        actionCollection.setUserPermissions(mockPermissions);
        actionCollection.setPublishedCollection(mockApplicationCollectionDTO);
        actionCollection.setUnpublishedCollection(mockApplicationCollectionDTO);

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

                    assertNotNull(unpublishedActionCollectionDTO);
                    assertEquals(mockId, unpublishedActionCollectionDTO.getId());
                    assertEquals(mockAppId, unpublishedActionCollectionDTO.getApplicationId());
                    assertEquals(mockWorkspaceId, unpublishedActionCollectionDTO.getWorkspaceId());
                    assertEquals(mockPermissions, unpublishedActionCollectionDTO.getUserPermissions());
                })
                .verifyComplete();
    }
}
