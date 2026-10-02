package com.appsmith.server.fork.internal;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ForkingMetaDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.EnvironmentPermission;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.UUID;
import java.util.function.UnaryOperator;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.verify;

@SpringBootTest
class ForkedActionTransformerTest {

    private static final String FORKED_BODY = "rewritten-by-forked-action-transformer";

    @MockitoSpyBean
    ApplicationForkingServiceImpl applicationForkingService;

    @MockitoBean
    PluginExecutorHelper pluginExecutorHelper;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    LayoutActionService layoutActionService;

    @Autowired
    PluginRepository pluginRepository;

    @Autowired
    ApplicationRepository applicationRepository;

    @Autowired
    NewActionRepository newActionRepository;

    @Autowired
    EnvironmentPermission environmentPermission;

    @BeforeEach
    void setUp() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(new MockPluginExecutor()));
    }

    @Test
    @WithUserDetails("api_user")
    void fork_appliesTransformerToEveryForkedAction() {
        Workspace source = createWorkspace("transformer-source");
        Workspace destination = createWorkspace("transformer-destination");
        Application application = createApplicationWithActions(source, "firstAction", "secondAction");
        UnaryOperator<ActionDTO> rewriteBody = actionDTO -> {
            actionDTO.getActionConfiguration().setBody(FORKED_BODY);
            return actionDTO;
        };
        doReturn(Mono.just(rewriteBody)).when(applicationForkingService).getForkedActionTransformer(any(), anyString());

        Application forked = fork(application, destination).block();

        List<NewAction> forkedActions = newActionRepository
                .findByApplicationId(forked.getId())
                .collectList()
                .block();
        assertThat(forkedActions).hasSize(2).allSatisfy(action -> assertThat(
                        action.getUnpublishedAction().getActionConfiguration().getBody())
                .isEqualTo(FORKED_BODY));
        ArgumentCaptor<ForkingMetaDTO> sourceMeta = ArgumentCaptor.forClass(ForkingMetaDTO.class);
        verify(applicationForkingService).getForkedActionTransformer(sourceMeta.capture(), eq(destination.getId()));
        assertThat(sourceMeta.getValue().getWorkspaceId()).isEqualTo(source.getId());
        assertThat(sourceMeta.getValue().getApplicationId()).isEqualTo(application.getId());
    }

    @Test
    @WithUserDetails("api_user")
    void fork_whenTransformerFails_writesNothingToDestination() {
        Workspace source = createWorkspace("transformer-failure-source");
        Workspace destination = createWorkspace("transformer-failure-destination");
        Application application = createApplicationWithActions(source, "onlyAction");
        AppsmithException failure = new AppsmithException(AppsmithError.INVALID_PARAMETER, "action reference");
        doReturn(Mono.error(failure)).when(applicationForkingService).getForkedActionTransformer(any(), anyString());

        StepVerifier.create(fork(application, destination))
                .expectErrorSatisfies(error -> assertThat(error).isSameAs(failure))
                .verify();

        assertThat(applicationRepository
                        .findByWorkspaceId(destination.getId())
                        .collectList()
                        .block())
                .isEmpty();
    }

    @Test
    @WithUserDetails("api_user")
    void fork_whenTransformerIsEmpty_writesNothingToDestination() {
        Workspace source = createWorkspace("transformer-empty-source");
        Workspace destination = createWorkspace("transformer-empty-destination");
        Application application = createApplicationWithActions(source, "onlyAction");
        doReturn(Mono.empty()).when(applicationForkingService).getForkedActionTransformer(any(), anyString());

        StepVerifier.create(fork(application, destination))
                .expectErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(AppsmithException.class);
                    assertThat(((AppsmithException) error).getError()).isEqualTo(AppsmithError.INTERNAL_SERVER_ERROR);
                })
                .verify();

        assertThat(applicationRepository
                        .findByWorkspaceId(destination.getId())
                        .collectList()
                        .block())
                .isEmpty();
    }

    private Mono<Application> fork(Application application, Workspace destination) {
        String sourceEnvironmentId = workspaceService
                .getDefaultEnvironmentId(application.getWorkspaceId(), environmentPermission.getExecutePermission())
                .block();
        return applicationForkingService.forkApplicationToWorkspaceWithEnvironment(
                application.getId(), destination.getId(), sourceEnvironmentId);
    }

    private Workspace createWorkspace(String prefix) {
        Workspace workspace = new Workspace();
        workspace.setName(prefix + "-" + UUID.randomUUID());
        return workspaceService.create(workspace).block();
    }

    private Application createApplicationWithActions(Workspace workspace, String... actionNames) {
        Application application = new Application();
        application.setName("transformer-app-" + UUID.randomUUID());
        Application created = applicationPageService
                .createApplication(application, workspace.getId())
                .block();
        Plugin plugin = pluginRepository.findByPackageName("installed-plugin").block();
        for (String actionName : actionNames) {
            ActionConfiguration configuration = new ActionConfiguration();
            configuration.setBody("original-body");
            Datasource datasource = new Datasource();
            datasource.setName("transformer-datasource");
            datasource.setWorkspaceId(workspace.getId());
            datasource.setPluginId(plugin.getId());
            datasource.setDatasourceConfiguration(new DatasourceConfiguration());
            ActionDTO action = new ActionDTO();
            action.setName(actionName);
            action.setPageId(created.getPages().get(0).getId());
            action.setActionConfiguration(configuration);
            action.setDatasource(datasource);
            layoutActionService.createSingleAction(action, Boolean.FALSE).block();
        }
        return created;
    }
}
