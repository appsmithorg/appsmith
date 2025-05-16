package com.appsmith.server.onload.internal;

import com.appsmith.external.dtos.LayoutExecutableUpdateDTO;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.Executable;
import com.appsmith.external.models.RunBehaviourEnum;
import com.appsmith.server.helpers.ObservationHelperImpl;
import com.appsmith.server.onload.executables.ExecutableOnLoadService;
import com.appsmith.server.services.AstService;
import com.appsmith.server.services.FeatureFlagService;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.micrometer.observation.ObservationRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

class OnLoadExecutablesUtilCEImplTest {

    @Mock
    private AstService astService;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private ExecutableOnLoadService executableOnLoadService;

    @Mock
    private FeatureFlagService featureFlagService;

    @Mock
    private ObservationRegistry observationRegistry;

    @Mock
    private ObservationHelperImpl observationHelper;

    @InjectMocks
    private OnLoadExecutablesUtilCEImpl onLoadExecutablesUtilCEImpl;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        observationRegistry = ObservationRegistry.create(); // No-op registry
        observationHelper = Mockito.mock(ObservationHelperImpl.class);
        onLoadExecutablesUtilCEImpl = new OnLoadExecutablesUtilCEImpl(
                astService,
                objectMapper,
                executableOnLoadService,
                observationRegistry,
                observationHelper,
                featureFlagService);
    }

    @Test
    void whenNoExecutables_shouldReturnFalse() {
        // Setup
        List<Executable> onLoadExecutables = new ArrayList<>();
        List<LayoutExecutableUpdateDTO> executableUpdates = new ArrayList<>();
        List<String> messages = new ArrayList<>();

        when(executableOnLoadService.getAllExecutablesByCreatorIdFlux(any())).thenReturn(Flux.empty());
        when(featureFlagService.check(any())).thenReturn(Mono.just(true));

        // Execute and verify
        StepVerifier.create(onLoadExecutablesUtilCEImpl.updateExecutablesRunBehaviour(
                        onLoadExecutables, "creatorId", executableUpdates, messages, CreatorContextType.PAGE))
                .expectNext(false)
                .verifyComplete();

        // Assert
        assert messages.isEmpty();
        assert executableUpdates.isEmpty();
    }

    @Test
    void whenFeatureFlagOn_andExecutableTurnedOn_shouldShowReactiveMessage() {
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

        // Execute and verify
        StepVerifier.create(onLoadExecutablesUtilCEImpl.updateExecutablesRunBehaviour(
                        onLoadExecutables, "creatorId", executableUpdates, messages, CreatorContextType.PAGE))
                .expectNext(true)
                .verifyComplete();

        // Assert
        assert messages.size() == 1;
        assert messages.get(0).contains("TestApi");
        assert messages.get(0).contains("will run automatically on page load or when a variable it depends on changes");
    }

    @Test
    void whenFeatureFlagOff_andExecutableTurnedOn_shouldShowPageLoadMessage() {
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

        // Execute and verify
        StepVerifier.create(onLoadExecutablesUtilCEImpl.updateExecutablesRunBehaviour(
                        onLoadExecutables, "creatorId", executableUpdates, messages, CreatorContextType.PAGE))
                .expectNext(true)
                .verifyComplete();

        // Assert
        assert messages.size() == 1;
        assert messages.get(0).contains("TestApi");
        assert messages.get(0).contains("will be executed automatically on page load");
    }

    @Test
    void whenFeatureFlagOn_andExecutableTurnedOff_shouldShowManualMessage() {
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

        // Execute and verify
        StepVerifier.create(onLoadExecutablesUtilCEImpl.updateExecutablesRunBehaviour(
                        onLoadExecutables, "creatorId", executableUpdates, messages, CreatorContextType.PAGE))
                .expectNext(true)
                .verifyComplete();

        // Assert
        assert messages.size() == 1;
        assert messages.get(0).contains("TestApi");
        assert messages.get(0).contains("will no longer run automatically");
    }

    @Test
    void whenMultipleExecutablesChange_shouldShowAllMessages() {
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

        // Execute and verify
        StepVerifier.create(onLoadExecutablesUtilCEImpl.updateExecutablesRunBehaviour(
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
    void whenNoStateChange_shouldReturnFalse() {
        // Setup
        ActionDTO existingAction = new ActionDTO();
        existingAction.setName("TestApi");
        existingAction.setUserSetOnLoad(false);
        existingAction.setRunBehaviour(RunBehaviourEnum.AUTOMATIC);
        existingAction.setId("1");

        ActionDTO unchangedAction = new ActionDTO();
        unchangedAction.setName("TestApi");
        unchangedAction.setUserSetOnLoad(false);
        unchangedAction.setRunBehaviour(RunBehaviourEnum.AUTOMATIC);
        unchangedAction.setId("1");

        List<Executable> onLoadExecutables = List.of(unchangedAction);
        List<LayoutExecutableUpdateDTO> executableUpdates = new ArrayList<>();
        List<String> messages = new ArrayList<>();

        when(executableOnLoadService.getAllExecutablesByCreatorIdFlux(any())).thenReturn(Flux.just(existingAction));
        when(featureFlagService.check(any())).thenReturn(Mono.just(true));

        // No actual call to updateUnpublishedExecutable should occur since no state changes
        // Don't mock this method call as it shouldn't be invoked

        // Execute and verify
        StepVerifier.create(onLoadExecutablesUtilCEImpl.updateExecutablesRunBehaviour(
                        onLoadExecutables, "creatorId", executableUpdates, messages, CreatorContextType.PAGE))
                .expectNext(false)
                .verifyComplete();

        // Assert
        assert messages.isEmpty();
        assert executableUpdates.isEmpty();
    }

    @Test
    void whenUserSetOnLoadIsTrue_shouldNotUpdateExecutable() {
        // Setup
        ActionDTO existingAction = new ActionDTO();
        existingAction.setName("TestApi");
        existingAction.setUserSetOnLoad(true); // User explicitly set the behavior
        existingAction.setRunBehaviour(RunBehaviourEnum.MANUAL);
        existingAction.setId("1");

        ActionDTO updatedAction = new ActionDTO();
        updatedAction.setName("TestApi");
        updatedAction.setUserSetOnLoad(true);
        updatedAction.setRunBehaviour(RunBehaviourEnum.AUTOMATIC);
        updatedAction.setId("1");

        List<Executable> onLoadExecutables = List.of(updatedAction);
        List<LayoutExecutableUpdateDTO> executableUpdates = new ArrayList<>();
        List<String> messages = new ArrayList<>();

        when(executableOnLoadService.getAllExecutablesByCreatorIdFlux(any())).thenReturn(Flux.just(existingAction));
        when(featureFlagService.check(any())).thenReturn(Mono.just(true));

        // No actual call to updateUnpublishedExecutable should occur since userSetOnLoad is true
        // Don't mock this method call as it shouldn't be invoked

        // Execute and verify
        StepVerifier.create(onLoadExecutablesUtilCEImpl.updateExecutablesRunBehaviour(
                        onLoadExecutables, "creatorId", executableUpdates, messages, CreatorContextType.PAGE))
                .expectNext(false)
                .verifyComplete();

        // Assert
        assert messages.isEmpty();
        assert executableUpdates.isEmpty();
    }
}
