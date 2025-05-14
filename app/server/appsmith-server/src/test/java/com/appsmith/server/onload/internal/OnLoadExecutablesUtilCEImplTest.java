package com.appsmith.server.onload.internal;

import com.appsmith.external.dtos.LayoutExecutableUpdateDTO;
import com.appsmith.external.models.Executable;
import com.appsmith.external.models.RunBehaviourEnum;
import com.appsmith.server.onload.executables.ExecutableOnLoadService;
import com.appsmith.server.services.AstService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
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

    @InjectMocks
    private OnLoadExecutablesUtilCEImpl onLoadExecutablesUtilCEImpl;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        onLoadExecutablesUtilCEImpl = new OnLoadExecutablesUtilCEImpl(
                astService,
                objectMapper,
                executableOnLoadService,
                null, // ObservationRegistry
                null, // ObservationHelperImpl
                featureFlagService);
    }

    @Test
    void updateExecutablesRunBehaviour_shouldReturnFalseWhenNoExecutables() {
        List<Executable> onLoadExecutables = new ArrayList<>();
        List<LayoutExecutableUpdateDTO> executableUpdatesRef = new ArrayList<>();
        List<String> messagesRef = new ArrayList<>();

        when(executableOnLoadService.getAllExecutablesByCreatorIdFlux(any())).thenReturn(Flux.empty());

        StepVerifier.create(onLoadExecutablesUtilCEImpl.updateExecutablesRunBehaviour(
                        onLoadExecutables, "creatorId", executableUpdatesRef, messagesRef, null))
                .expectNext(false)
                .verifyComplete();
    }

    @Test
    void updateExecutablesRunBehaviour_shouldAddMessageWhenExecutableTurnedOn_FeatureFlagOff() {
        ActionDTO existing = new ActionDTO();
        existing.setName("Api1");
        existing.setUserSetOnLoad(false);
        existing.setRunBehaviour(RunBehaviourEnum.MANUAL);
        existing.setId("1");

        ActionDTO toTurnOn = new ActionDTO();
        toTurnOn.setName("Api1");
        toTurnOn.setUserSetOnLoad(false);
        toTurnOn.setRunBehaviour(RunBehaviourEnum.ON_PAGE_LOAD);
        toTurnOn.setId("1");

        List<Executable> onLoadExecutables = List.of(toTurnOn);
        List<LayoutExecutableUpdateDTO> executableUpdatesRef = new ArrayList<>();
        List<String> messagesRef = new ArrayList<>();

        when(executableOnLoadService.getAllExecutablesByCreatorIdFlux(any())).thenReturn(Flux.just(existing));
        when(featureFlagService.check(any())).thenReturn(Mono.just(false));

        StepVerifier.create(onLoadExecutablesUtilCEImpl.updateExecutablesRunBehaviour(
                        onLoadExecutables, "creatorId", executableUpdatesRef, messagesRef, null))
                .expectNext(true)
                .verifyComplete();

        // Should contain the old message
        assert messagesRef.stream()
                .anyMatch(msg -> msg.contains("Api1") && msg.contains("executed automatically on page load"));
    }

    @Test
    void updateExecutablesRunBehaviour_shouldAddMessageWhenExecutableTurnedOn_FeatureFlagOn() {
        ActionDTO existing = new ActionDTO();
        existing.setName("Api1");
        existing.setUserSetOnLoad(false);
        existing.setRunBehaviour(RunBehaviourEnum.MANUAL);
        existing.setId("1");

        ActionDTO toTurnOn = new ActionDTO();
        toTurnOn.setName("Api1");
        toTurnOn.setUserSetOnLoad(false);
        toTurnOn.setRunBehaviour(RunBehaviourEnum.AUTOMATIC);
        toTurnOn.setId("1");

        List<Executable> onLoadExecutables = List.of(toTurnOn);
        List<LayoutExecutableUpdateDTO> executableUpdatesRef = new ArrayList<>();
        List<String> messagesRef = new ArrayList<>();

        when(executableOnLoadService.getAllExecutablesByCreatorIdFlux(any())).thenReturn(Flux.just(existing));
        when(featureFlagService.check(any())).thenReturn(Mono.just(true));

        StepVerifier.create(onLoadExecutablesUtilCEImpl.updateExecutablesRunBehaviour(
                        onLoadExecutables, "creatorId", executableUpdatesRef, messagesRef, null))
                .expectNext(true)
                .verifyComplete();

        // Should contain the new message
        assert messagesRef.stream()
                .anyMatch(msg -> msg.contains("Api1")
                        && msg.contains(
                                "will run automatically on page load or when a variable it depends on changes"));
    }

    @Test
    void updateExecutablesRunBehaviour_shouldAddMessageWhenExecutableTurnedOff_FeatureFlagOff() {
        ActionDTO existing = new ActionDTO();
        existing.setName("Api2");
        existing.setUserSetOnLoad(false);
        existing.setRunBehaviour(RunBehaviourEnum.ON_PAGE_LOAD);
        existing.setId("2");

        List<Executable> onLoadExecutables = List.of(); // Now none should be on page load
        List<LayoutExecutableUpdateDTO> executableUpdatesRef = new ArrayList<>();
        List<String> messagesRef = new ArrayList<>();

        when(executableOnLoadService.getAllExecutablesByCreatorIdFlux(any())).thenReturn(Flux.just(existing));
        when(featureFlagService.check(any())).thenReturn(Mono.just(false));

        StepVerifier.create(onLoadExecutablesUtilCEImpl.updateExecutablesRunBehaviour(
                        onLoadExecutables, "creatorId", executableUpdatesRef, messagesRef, null))
                .expectNext(true)
                .verifyComplete();

        // Should contain the old message
        assert messagesRef.stream()
                .anyMatch(msg -> msg.contains("Api2") && msg.contains("no longer be executed on page load"));
    }

    @Test
    void updateExecutablesRunBehaviour_shouldAddMessageWhenExecutableTurnedOff_FeatureFlagOn() {
        ActionDTO existing = new ActionDTO();
        existing.setName("Api2");
        existing.setUserSetOnLoad(false);
        existing.setRunBehaviour(RunBehaviourEnum.AUTOMATIC);
        existing.setId("2");

        List<Executable> onLoadExecutables = List.of(); // Now none should be on page load
        List<LayoutExecutableUpdateDTO> executableUpdatesRef = new ArrayList<>();
        List<String> messagesRef = new ArrayList<>();

        when(executableOnLoadService.getAllExecutablesByCreatorIdFlux(any())).thenReturn(Flux.just(existing));
        when(featureFlagService.check(any())).thenReturn(Mono.just(true));

        StepVerifier.create(onLoadExecutablesUtilCEImpl.updateExecutablesRunBehaviour(
                        onLoadExecutables, "creatorId", executableUpdatesRef, messagesRef, null))
                .expectNext(true)
                .verifyComplete();

        // Should contain the new message
        assert messagesRef.stream()
                .anyMatch(msg -> msg.contains("Api2")
                        && msg.contains("will no longer run automatically. You can run it manually when needed."));
    }

    @Test
    void updateExecutablesRunBehaviour_shouldAddMessagesForBothOnAndOff_FeatureFlagOn() {
        ActionDTO existing1 = new ActionDTO();
        existing1.setName("Api1");
        existing1.setUserSetOnLoad(false);
        existing1.setRunBehaviour(RunBehaviourEnum.AUTOMATIC);
        existing1.setId("1");

        ActionDTO existing2 = new ActionDTO();
        existing2.setName("Api2");
        existing2.setUserSetOnLoad(false);
        existing2.setRunBehaviour(RunBehaviourEnum.MANUAL);
        existing2.setId("2");

        ActionDTO toTurnOn = new ActionDTO();
        toTurnOn.setName("Api2");
        toTurnOn.setUserSetOnLoad(false);
        toTurnOn.setRunBehaviour(RunBehaviourEnum.AUTOMATIC);
        toTurnOn.setId("2");

        List<Executable> onLoadExecutables = List.of(toTurnOn); // Api2 turned on, Api1 turned off
        List<LayoutExecutableUpdateDTO> executableUpdatesRef = new ArrayList<>();
        List<String> messagesRef = new ArrayList<>();

        when(executableOnLoadService.getAllExecutablesByCreatorIdFlux(any()))
                .thenReturn(Flux.just(existing1, existing2));
        when(featureFlagService.check(any())).thenReturn(Mono.just(true));

        StepVerifier.create(onLoadExecutablesUtilCEImpl.updateExecutablesRunBehaviour(
                        onLoadExecutables, "creatorId", executableUpdatesRef, messagesRef, null))
                .expectNext(true)
                .verifyComplete();

        assert messagesRef.stream()
                .anyMatch(msg -> msg.contains("Api1")
                        && msg.contains("will no longer run automatically. You can run it manually when needed."));
        assert messagesRef.stream()
                .anyMatch(msg -> msg.contains("Api2")
                        && msg.contains(
                                "will run automatically on page load or when a variable it depends on changes"));
    }

    @Test
    void updateExecutablesRunBehaviour_shouldNotAddMessageWhenNoChange_FeatureFlagOn() {
        ActionDTO existing = new ActionDTO();
        existing.setName("Api3");
        existing.setUserSetOnLoad(false);
        existing.setRunBehaviour(RunBehaviourEnum.AUTOMATIC);
        existing.setId("3");

        ActionDTO toStayOn = new ActionDTO();
        toStayOn.setName("Api3");
        toStayOn.setUserSetOnLoad(false);
        toStayOn.setRunBehaviour(RunBehaviourEnum.AUTOMATIC);
        toStayOn.setId("3");

        List<Executable> onLoadExecutables = List.of(toStayOn);
        List<LayoutExecutableUpdateDTO> executableUpdatesRef = new ArrayList<>();
        List<String> messagesRef = new ArrayList<>();

        when(executableOnLoadService.getAllExecutablesByCreatorIdFlux(any())).thenReturn(Flux.just(existing));
        when(featureFlagService.check(any())).thenReturn(Mono.just(true));

        StepVerifier.create(onLoadExecutablesUtilCEImpl.updateExecutablesRunBehaviour(
                        onLoadExecutables, "creatorId", executableUpdatesRef, messagesRef, null))
                .expectNext(false)
                .verifyComplete();

        assert messagesRef.isEmpty();
    }

    // Add more tests for other scenarios as needed
}
