package com.appsmith.server.onload.internal;

import com.appsmith.external.dtos.LayoutExecutableUpdateDTO;
import com.appsmith.external.enums.FeatureFlagEnum;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.Executable;
import com.appsmith.external.models.RunBehaviourEnum;
import com.appsmith.server.helpers.ObservationHelperImpl;
import com.appsmith.server.helpers.RunBehaviourAnalyticsUtils;
import com.appsmith.server.onload.executables.ExecutableOnLoadService;
import com.appsmith.server.services.AstService;
import com.appsmith.server.services.FeatureFlagService;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.micrometer.observation.ObservationRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.List;

import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class OnLoadExecutablesUtilCEImplTest {

    @Mock
    private AstService astService;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private ExecutableOnLoadService executableOnLoadService;

    @Mock
    private ObservationRegistry observationRegistry;

    @Mock
    private ObservationHelperImpl observationHelper;

    @Mock
    private FeatureFlagService featureFlagService;

    private OnLoadExecutablesUtilCEImpl onLoadExecutablesUtilCE;

    @Mock
    private RunBehaviourAnalyticsUtils runBehaviourAnalyticsUtils;

    @BeforeEach
    public void setUp() {
        onLoadExecutablesUtilCE = spy(new OnLoadExecutablesUtilCEImpl(
                astService,
                objectMapper,
                executableOnLoadService,
                observationRegistry,
                observationHelper,
                featureFlagService,
                runBehaviourAnalyticsUtils));

        ObservationRegistry.ObservationConfig mockObservationConfig =
                Mockito.mock(ObservationRegistry.ObservationConfig.class);
        Mockito.when(observationRegistry.observationConfig()).thenReturn(mockObservationConfig);
    }

    @Test
    public void testUpdateExecutablesRunBehaviour_WhenFeatureFlagEnabled_SetsRunBehaviourToAutomatic() {
        // Setup
        String creatorId = "testCreatorId";
        CreatorContextType creatorType = CreatorContextType.PAGE;
        List<LayoutExecutableUpdateDTO> executableUpdatesRef = new ArrayList<>();
        List<String> messagesRef = new ArrayList<>();

        // Create test executables
        List<Executable> onLoadExecutables = createTestExecutables("newOnLoad1", "newOnLoad2");
        List<Executable> existingOnLoadExecutables = createTestExecutables("existingOnLoad1");
        List<Executable> allExecutables = new ArrayList<>();
        allExecutables.addAll(onLoadExecutables);
        allExecutables.addAll(existingOnLoadExecutables);
        allExecutables.add(createTestExecutable("turnedOff1", RunBehaviourEnum.ON_PAGE_LOAD));

        // Mock behavior
        when(featureFlagService.check(FeatureFlagEnum.release_reactive_actions_enabled))
                .thenReturn(Mono.just(TRUE));

        when(executableOnLoadService.getAllExecutablesByCreatorIdFlux(anyString()))
                .thenReturn(Flux.fromIterable(allExecutables));

        when(executableOnLoadService.updateUnpublishedExecutable(anyString(), any(ActionDTO.class)))
                .thenAnswer(invocation -> Mono.just(invocation.getArgument(1)));

        // mock runBehaviourAnalyticsUtils to return mono of void
        doAnswer(invocation -> Mono.empty()).when(runBehaviourAnalyticsUtils).sendRunBehaviourChangedAnalytics(any());

        // Execute
        Mono<Boolean> result = onLoadExecutablesUtilCE.updateExecutablesRunBehaviour(
                onLoadExecutables, creatorId, executableUpdatesRef, messagesRef, creatorType);

        // Verify
        StepVerifier.create(result).expectNext(TRUE).verifyComplete();

        // Verify that executables were updated with AUTOMATIC run behavior
        verify(executableOnLoadService, times(2))
                .updateUnpublishedExecutable(
                        anyString(),
                        Mockito.argThat(executable -> executable.getRunBehaviour() == RunBehaviourEnum.AUTOMATIC));
    }

    @Test
    public void testUpdateExecutablesRunBehaviour_WhenFeatureFlagDisabled_SetsRunBehaviourToOnPageLoad() {
        // Setup
        String creatorId = "testCreatorId";
        CreatorContextType creatorType = CreatorContextType.PAGE;
        List<LayoutExecutableUpdateDTO> executableUpdatesRef = new ArrayList<>();
        List<String> messagesRef = new ArrayList<>();

        // Create test executables
        List<Executable> onLoadExecutables = createTestExecutables("newOnLoad1", "newOnLoad2");
        List<Executable> existingOnLoadExecutables = createTestExecutables("existingOnLoad1");
        List<Executable> allExecutables = new ArrayList<>();
        allExecutables.addAll(onLoadExecutables);
        allExecutables.addAll(existingOnLoadExecutables);
        allExecutables.add(createTestExecutable("turnedOff1", RunBehaviourEnum.ON_PAGE_LOAD));

        // Mock behavior
        when(featureFlagService.check(FeatureFlagEnum.release_reactive_actions_enabled))
                .thenReturn(Mono.just(FALSE));

        when(executableOnLoadService.getAllExecutablesByCreatorIdFlux(anyString()))
                .thenReturn(Flux.fromIterable(allExecutables));

        when(executableOnLoadService.updateUnpublishedExecutable(anyString(), any(ActionDTO.class)))
                .thenAnswer(invocation -> Mono.just(invocation.getArgument(1)));

        // mock runBehaviourAnalyticsUtils to return mono of void
        doAnswer(invocation -> Mono.empty()).when(runBehaviourAnalyticsUtils).sendRunBehaviourChangedAnalytics(any());

        // Execute
        Mono<Boolean> result = onLoadExecutablesUtilCE.updateExecutablesRunBehaviour(
                onLoadExecutables, creatorId, executableUpdatesRef, messagesRef, creatorType);

        // Verify
        StepVerifier.create(result).expectNext(TRUE).verifyComplete();

        // Verify that executables were updated with ON_PAGE_LOAD run behavior
        verify(executableOnLoadService, times(2))
                .updateUnpublishedExecutable(
                        anyString(),
                        Mockito.argThat(executable -> executable.getRunBehaviour() == RunBehaviourEnum.ON_PAGE_LOAD));
    }

    @Test
    public void testUpdateExecutablesRunBehaviour_WhenUserSetOnLoadIsTrue_DoesNotUpdateExecutable() {
        // Setup
        String creatorId = "testCreatorId";
        CreatorContextType creatorType = CreatorContextType.PAGE;
        List<LayoutExecutableUpdateDTO> executableUpdatesRef = new ArrayList<>();
        List<String> messagesRef = new ArrayList<>();

        // Create test executables
        List<Executable> onLoadExecutables = createTestExecutables("newOnLoad1", "userSetOnLoad1");

        // Create an executable with userSetOnLoad = true
        ActionDTO userSetExecutable = createTestExecutable("userSetOnLoad1", RunBehaviourEnum.MANUAL);
        userSetExecutable.setUserSetOnLoad(TRUE);

        List<Executable> allExecutables = new ArrayList<>();
        allExecutables.add(createTestExecutable("newOnLoad1", RunBehaviourEnum.MANUAL));
        allExecutables.add(userSetExecutable);

        // Mock behavior
        when(featureFlagService.check(FeatureFlagEnum.release_reactive_actions_enabled))
                .thenReturn(Mono.just(TRUE));

        when(executableOnLoadService.getAllExecutablesByCreatorIdFlux(anyString()))
                .thenReturn(Flux.fromIterable(allExecutables));

        when(executableOnLoadService.updateUnpublishedExecutable(anyString(), any(ActionDTO.class)))
                .thenAnswer(invocation -> Mono.just(invocation.getArgument(1)));

        // mock runBehaviourAnalyticsUtils to return mono of void
        doAnswer(invocation -> Mono.empty()).when(runBehaviourAnalyticsUtils).sendRunBehaviourChangedAnalytics(any());

        // Execute
        Mono<Boolean> result = onLoadExecutablesUtilCE.updateExecutablesRunBehaviour(
                onLoadExecutables, creatorId, executableUpdatesRef, messagesRef, creatorType);

        // Verify
        StepVerifier.create(result).expectNext(TRUE).verifyComplete();

        // Verify that only one executable was updated (the one with userSetOnLoad = false)
        verify(executableOnLoadService, times(1)).updateUnpublishedExecutable(anyString(), any(ActionDTO.class));

        // Verify that the executable with userSetOnLoad = true was not updated
        verify(executableOnLoadService, times(0))
                .updateUnpublishedExecutable(eq(userSetExecutable.getId()), any(ActionDTO.class));
    }

    @Test
    public void testUpdateExecutablesRunBehaviour_WhenNoExecutablesToUpdate_ReturnsFalse() {
        // Setup
        String creatorId = "testCreatorId";
        CreatorContextType creatorType = CreatorContextType.PAGE;
        List<LayoutExecutableUpdateDTO> executableUpdatesRef = new ArrayList<>();
        List<String> messagesRef = new ArrayList<>();

        // Create empty lists
        List<Executable> onLoadExecutables = new ArrayList<>();
        List<Executable> existingOnLoadExecutables = new ArrayList<>();
        List<Executable> allExecutables = new ArrayList<>();

        // Mock behavior
        when(executableOnLoadService.getAllExecutablesByCreatorIdFlux(anyString()))
                .thenReturn(Flux.fromIterable(allExecutables));

        when(featureFlagService.check(FeatureFlagEnum.release_reactive_actions_enabled))
                .thenReturn(Mono.just(TRUE));

        // Execute
        Mono<Boolean> result = onLoadExecutablesUtilCE.updateExecutablesRunBehaviour(
                onLoadExecutables, creatorId, executableUpdatesRef, messagesRef, creatorType);

        // Verify
        StepVerifier.create(result).expectNext(FALSE).verifyComplete();

        // Verify that no executables were updated
        verify(executableOnLoadService, times(0)).updateUnpublishedExecutable(anyString(), any(ActionDTO.class));
    }

    @Test
    public void whenFeatureFlagOn_andExecutableTurnedOn_shouldShowReactiveMessage() {
        // Setup
        ActionDTO existingAction = new ActionDTO();
        existingAction.setName("TestApi");
        existingAction.setUserSetOnLoad(false);
        existingAction.setRunBehaviour(RunBehaviourEnum.MANUAL);
        existingAction.setId("1");

        ActionDTO updatedAction = new ActionDTO();
        updatedAction.setName("TestApi");
        updatedAction.setUserSetOnLoad(false);
        updatedAction.setRunBehaviour(RunBehaviourEnum.AUTOMATIC);
        updatedAction.setId("1");

        List<Executable> onLoadExecutables = List.of(updatedAction);
        List<LayoutExecutableUpdateDTO> executableUpdates = new ArrayList<>();
        List<String> messages = new ArrayList<>();

        when(executableOnLoadService.getAllExecutablesByCreatorIdFlux(any())).thenReturn(Flux.just(existingAction));
        when(featureFlagService.check(any())).thenReturn(Mono.just(true));
        when(executableOnLoadService.updateUnpublishedExecutable(eq("1"), any()))
                .thenReturn(Mono.just(updatedAction));

        // mock runBehaviourAnalyticsUtils to return mono of void
        doAnswer(invocation -> Mono.empty()).when(runBehaviourAnalyticsUtils).sendRunBehaviourChangedAnalytics(any());

        // Execute and verify
        StepVerifier.create(onLoadExecutablesUtilCE.updateExecutablesRunBehaviour(
                        onLoadExecutables, "creatorId", executableUpdates, messages, CreatorContextType.PAGE))
                .expectNext(true)
                .verifyComplete();

        // Assert
        assert messages.size() == 1;
        assert messages.get(0).contains("TestApi");
        assert messages.get(0).contains("will run automatically on page load or when a variable it depends on changes");
    }

    @Test
    public void whenFeatureFlagOff_andExecutableTurnedOn_shouldShowPageLoadMessage() {
        // Setup
        ActionDTO existingAction = new ActionDTO();
        existingAction.setName("TestApi");
        existingAction.setUserSetOnLoad(false);
        existingAction.setRunBehaviour(RunBehaviourEnum.MANUAL);
        existingAction.setId("1");

        ActionDTO updatedAction = new ActionDTO();
        updatedAction.setName("TestApi");
        updatedAction.setUserSetOnLoad(false);
        updatedAction.setRunBehaviour(RunBehaviourEnum.ON_PAGE_LOAD);
        updatedAction.setId("1");

        List<Executable> onLoadExecutables = List.of(updatedAction);
        List<LayoutExecutableUpdateDTO> executableUpdates = new ArrayList<>();
        List<String> messages = new ArrayList<>();

        when(executableOnLoadService.getAllExecutablesByCreatorIdFlux(any())).thenReturn(Flux.just(existingAction));
        when(featureFlagService.check(any())).thenReturn(Mono.just(false));
        when(executableOnLoadService.updateUnpublishedExecutable(eq("1"), any()))
                .thenReturn(Mono.just(updatedAction));

        // mock runBehaviourAnalyticsUtils to return mono of void
        doAnswer(invocation -> Mono.empty()).when(runBehaviourAnalyticsUtils).sendRunBehaviourChangedAnalytics(any());

        // Execute and verify
        StepVerifier.create(onLoadExecutablesUtilCE.updateExecutablesRunBehaviour(
                        onLoadExecutables, "creatorId", executableUpdates, messages, CreatorContextType.PAGE))
                .expectNext(true)
                .verifyComplete();

        // Assert
        assert messages.size() == 1;
        assert messages.get(0).contains("TestApi");
        assert messages.get(0).contains("will be executed automatically on page load");
    }

    @Test
    public void whenFeatureFlagOn_andExecutableTurnedOff_shouldShowManualMessage() {
        // Setup
        ActionDTO existingAction = new ActionDTO();
        existingAction.setName("TestApi");
        existingAction.setUserSetOnLoad(false);
        existingAction.setRunBehaviour(RunBehaviourEnum.AUTOMATIC);
        existingAction.setId("1");

        ActionDTO updatedAction = new ActionDTO();
        updatedAction.setName("TestApi");
        updatedAction.setUserSetOnLoad(false);
        updatedAction.setRunBehaviour(RunBehaviourEnum.MANUAL);
        updatedAction.setId("1");

        List<Executable> onLoadExecutables = new ArrayList<>(); // Empty list means turning off
        List<LayoutExecutableUpdateDTO> executableUpdates = new ArrayList<>();
        List<String> messages = new ArrayList<>();

        when(executableOnLoadService.getAllExecutablesByCreatorIdFlux(any())).thenReturn(Flux.just(existingAction));
        when(featureFlagService.check(any())).thenReturn(Mono.just(true));
        when(executableOnLoadService.updateUnpublishedExecutable(eq("1"), any()))
                .thenReturn(Mono.just(updatedAction));

        // mock runBehaviourAnalyticsUtils to return mono of void
        doAnswer(invocation -> Mono.empty()).when(runBehaviourAnalyticsUtils).sendRunBehaviourChangedAnalytics(any());

        // Execute and verify
        StepVerifier.create(onLoadExecutablesUtilCE.updateExecutablesRunBehaviour(
                        onLoadExecutables, "creatorId", executableUpdates, messages, CreatorContextType.PAGE))
                .expectNext(true)
                .verifyComplete();

        // Assert
        assert messages.size() == 1;
        assert messages.get(0).contains("TestApi");
        assert messages.get(0).contains("will no longer run automatically");
    }

    @Test
    public void whenOnlyOneActionChange_shouldShowOnlyThatEntityInToastMessage() {
        // Setup
        ActionDTO existingAction1 = new ActionDTO();
        existingAction1.setName("Api1");
        existingAction1.setUserSetOnLoad(false);
        existingAction1.setRunBehaviour(RunBehaviourEnum.AUTOMATIC);
        existingAction1.setId("1");

        ActionDTO existingAction2 = new ActionDTO();
        existingAction2.setName("Api2");
        existingAction2.setUserSetOnLoad(false);
        existingAction2.setRunBehaviour(RunBehaviourEnum.MANUAL);
        existingAction2.setId("2");

        ActionDTO unchangedAction1 = new ActionDTO();
        unchangedAction1.setName("Api1");
        unchangedAction1.setUserSetOnLoad(false);
        unchangedAction1.setRunBehaviour(RunBehaviourEnum.AUTOMATIC);
        unchangedAction1.setId("1");

        ActionDTO updatedAction2 = new ActionDTO();
        updatedAction2.setName("Api2");
        updatedAction2.setUserSetOnLoad(false);
        updatedAction2.setRunBehaviour(RunBehaviourEnum.AUTOMATIC);
        updatedAction2.setId("2");

        List<Executable> onLoadExecutables =
                List.of(updatedAction2, unchangedAction1); // Only Api2 is in the onLoad list
        List<LayoutExecutableUpdateDTO> executableUpdates = new ArrayList<>();
        List<String> messages = new ArrayList<>();

        when(executableOnLoadService.getAllExecutablesByCreatorIdFlux(any()))
                .thenReturn(Flux.just(existingAction1, existingAction2));
        when(featureFlagService.check(any())).thenReturn(Mono.just(true));

        // Mock different behaviors for different executable IDs
        when(executableOnLoadService.updateUnpublishedExecutable(eq("2"), any()))
                .thenReturn(Mono.just(updatedAction2));

        // mock runBehaviourAnalyticsUtils to return mono of void
        doAnswer(invocation -> Mono.empty()).when(runBehaviourAnalyticsUtils).sendRunBehaviourChangedAnalytics(any());

        // Execute and verify
        StepVerifier.create(onLoadExecutablesUtilCE.updateExecutablesRunBehaviour(
                        onLoadExecutables, "creatorId", executableUpdates, messages, CreatorContextType.PAGE))
                .expectNext(true)
                .verifyComplete();

        // Assert
        assert messages.size() == 1;
        assert messages.stream()
                .anyMatch(msg -> msg.contains("Api2")
                        && msg.contains("will run automatically on page load or when a variable it depends on changes")
                        && !msg.contains("Api1"));
    }

    @Test
    public void whenMultipleExecutablesChange_shouldShowAllMessages() {
        // Setup
        ActionDTO existingAction1 = new ActionDTO();
        existingAction1.setName("Api1");
        existingAction1.setUserSetOnLoad(false);
        existingAction1.setRunBehaviour(RunBehaviourEnum.AUTOMATIC);
        existingAction1.setId("1");

        ActionDTO existingAction2 = new ActionDTO();
        existingAction2.setName("Api2");
        existingAction2.setUserSetOnLoad(false);
        existingAction2.setRunBehaviour(RunBehaviourEnum.MANUAL);
        existingAction2.setId("2");

        ActionDTO updatedAction1 = new ActionDTO();
        updatedAction1.setName("Api1");
        updatedAction1.setUserSetOnLoad(false);
        updatedAction1.setRunBehaviour(RunBehaviourEnum.MANUAL);
        updatedAction1.setId("1");

        ActionDTO updatedAction2 = new ActionDTO();
        updatedAction2.setName("Api2");
        updatedAction2.setUserSetOnLoad(false);
        updatedAction2.setRunBehaviour(RunBehaviourEnum.AUTOMATIC);
        updatedAction2.setId("2");

        List<Executable> onLoadExecutables = List.of(updatedAction2); // Only Api2 is in the onLoad list
        List<LayoutExecutableUpdateDTO> executableUpdates = new ArrayList<>();
        List<String> messages = new ArrayList<>();

        when(executableOnLoadService.getAllExecutablesByCreatorIdFlux(any()))
                .thenReturn(Flux.just(existingAction1, existingAction2));
        when(featureFlagService.check(any())).thenReturn(Mono.just(true));

        // Mock different behaviors for different executable IDs
        when(executableOnLoadService.updateUnpublishedExecutable(eq("1"), any()))
                .thenReturn(Mono.just(updatedAction1));
        when(executableOnLoadService.updateUnpublishedExecutable(eq("2"), any()))
                .thenReturn(Mono.just(updatedAction2));

        // mock runBehaviourAnalyticsUtils to return mono of void
        doAnswer(invocation -> Mono.empty()).when(runBehaviourAnalyticsUtils).sendRunBehaviourChangedAnalytics(any());

        // Execute and verify
        StepVerifier.create(onLoadExecutablesUtilCE.updateExecutablesRunBehaviour(
                        onLoadExecutables, "creatorId", executableUpdates, messages, CreatorContextType.PAGE))
                .expectNext(true)
                .verifyComplete();

        // Assert
        assert messages.size() == 2;
        assert messages.stream()
                .anyMatch(msg -> msg.contains("Api1") && msg.contains("will no longer run automatically"));
        assert messages.stream()
                .anyMatch(msg -> msg.contains("Api2")
                        && msg.contains(
                                "will run automatically on page load or when a variable it depends on changes"));
    }

    @Test
    public void whenNoExecutables_shouldReturnFalse() {
        // Setup
        List<Executable> onLoadExecutables = new ArrayList<>();
        List<LayoutExecutableUpdateDTO> executableUpdates = new ArrayList<>();
        List<String> messages = new ArrayList<>();

        when(executableOnLoadService.getAllExecutablesByCreatorIdFlux(any())).thenReturn(Flux.empty());
        when(featureFlagService.check(any())).thenReturn(Mono.just(true));

        // Execute and verify
        StepVerifier.create(onLoadExecutablesUtilCE.updateExecutablesRunBehaviour(
                        onLoadExecutables, "creatorId", executableUpdates, messages, CreatorContextType.PAGE))
                .expectNext(false)
                .verifyComplete();

        // Assert
        assert messages.isEmpty();
        assert executableUpdates.isEmpty();
    }

    @Test
    public void testUpdateExecutablesRunBehaviour_WhenExistingIsOnPageLoadAndFlagEnabled_ShouldNotUpdateToAutomatic() {
        // Setup
        String creatorId = "testCreatorId";
        CreatorContextType creatorType = CreatorContextType.PAGE;
        List<LayoutExecutableUpdateDTO> executableUpdatesRef = new ArrayList<>();
        List<String> messagesRef = new ArrayList<>();

        // Existing action is ON_PAGE_LOAD
        ActionDTO existingAction = createTestExecutable("Api1", RunBehaviourEnum.ON_PAGE_LOAD);
        existingAction.setId("api1Id");
        existingAction.setUserSetOnLoad(FALSE);

        // Updated action comes in onLoadExecutables (should not trigger AUTOMATIC)
        ActionDTO updatedAction = createTestExecutable("Api1", RunBehaviourEnum.ON_PAGE_LOAD);
        updatedAction.setId("api1Id");
        updatedAction.setUserSetOnLoad(FALSE);

        List<Executable> onLoadExecutables = List.of(updatedAction);
        List<Executable> allExecutables = List.of(existingAction);

        // Mock behavior
        when(featureFlagService.check(FeatureFlagEnum.release_reactive_actions_enabled))
                .thenReturn(Mono.just(TRUE));
        when(executableOnLoadService.getAllExecutablesByCreatorIdFlux(anyString()))
                .thenReturn(Flux.fromIterable(allExecutables));
        // Should not call updateUnpublishedExecutable at all

        // Execute
        Mono<Boolean> result = onLoadExecutablesUtilCE.updateExecutablesRunBehaviour(
                onLoadExecutables, creatorId, executableUpdatesRef, messagesRef, creatorType);

        // Verify
        StepVerifier.create(result).expectNext(true).verifyComplete();
        // Should not update run behaviour to AUTOMATIC
        verify(executableOnLoadService, times(0)).updateUnpublishedExecutable(anyString(), any(ActionDTO.class));
    }

    // Helper methods to create test executables
    private List<Executable> createTestExecutables(String... names) {
        List<Executable> executables = new ArrayList<>();
        for (String name : names) {
            executables.add(createTestExecutable(name, RunBehaviourEnum.MANUAL));
        }
        return executables;
    }

    private ActionDTO createTestExecutable(String name, RunBehaviourEnum runBehaviour) {
        ActionDTO actionDTO = new ActionDTO();
        actionDTO.setId(name + "Id");
        actionDTO.setName(name);
        actionDTO.setRunBehaviour(runBehaviour);
        actionDTO.setUserSetOnLoad(FALSE);
        return actionDTO;
    }
}
