package com.appsmith.server.onload.internal;

import com.appsmith.external.dtos.LayoutExecutableUpdateDTO;
import com.appsmith.external.enums.FeatureFlagEnum;
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
import static org.mockito.Mockito.doReturn;
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

    @BeforeEach
    public void setUp() {
        onLoadExecutablesUtilCE = new OnLoadExecutablesUtilCEImpl(
                astService,
                objectMapper,
                executableOnLoadService,
                observationRegistry,
                observationHelper,
                featureFlagService);

        onLoadExecutablesUtilCE = spy(new OnLoadExecutablesUtilCEImpl(
                astService,
                objectMapper,
                executableOnLoadService,
                observationRegistry,
                observationHelper,
                featureFlagService));
        doReturn(executableOnLoadService)
                .when(onLoadExecutablesUtilCE)
                .getExecutableOnLoadService(any(CreatorContextType.class));

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
