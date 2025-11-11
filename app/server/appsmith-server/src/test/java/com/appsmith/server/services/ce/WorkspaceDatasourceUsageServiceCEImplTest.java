package com.appsmith.server.services.ce;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.WorkspacePermission;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;

import static com.appsmith.server.acl.AclPermission.READ_ACTIONS;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.READ_WORKSPACES;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WorkspaceDatasourceUsageServiceCEImplTest {

    @Mock
    private WorkspaceService workspaceService;

    @Mock
    private DatasourceService datasourceService;

    @Mock
    private NewActionService newActionService;

    @Mock
    private ApplicationService applicationService;

    @Mock
    private WorkspacePermission workspacePermission;

    @Mock
    private DatasourcePermission datasourcePermission;

    @Mock
    private ActionPermission actionPermission;

    @Mock
    private ApplicationPermission applicationPermission;

    private WorkspaceDatasourceUsageServiceCEImpl workspaceDatasourceUsageService;

    @BeforeEach
    void setUp() {
        when(workspacePermission.getReadPermission()).thenReturn(READ_WORKSPACES);
        when(datasourcePermission.getReadPermission()).thenReturn(READ_DATASOURCES);
        when(actionPermission.getReadPermission()).thenReturn(READ_ACTIONS);
        when(applicationPermission.getReadPermission()).thenReturn(READ_APPLICATIONS);

        workspaceDatasourceUsageService = new WorkspaceDatasourceUsageServiceCEImpl(
                workspaceService,
                datasourceService,
                newActionService,
                applicationService,
                workspacePermission,
                datasourcePermission,
                actionPermission,
                applicationPermission);
    }

    @Test
    void getDatasourceUsage_whenActionsPresent_returnsGroupedUsage() {
        String workspaceId = "ws1";

        Workspace workspace = new Workspace();
        workspace.setId(workspaceId);

        Datasource datasource = new Datasource();
        datasource.setId("ds1");
        datasource.setName("Users DB");
        datasource.setPluginId("postgres");

        Datasource datasourceRef = new Datasource();
        datasourceRef.setId("ds1");

        ActionDTO actionDTO1 = new ActionDTO();
        actionDTO1.setId("action-1");
        actionDTO1.setName("GetUsers");
        actionDTO1.setApplicationId("app1");
        actionDTO1.setPageId("page1");
        actionDTO1.setDatasource(datasourceRef);

        ActionDTO actionDTO2 = new ActionDTO();
        actionDTO2.setId("action-2");
        actionDTO2.setName("GetOrders");
        actionDTO2.setApplicationId("app2");
        actionDTO2.setPageId("page2");
        actionDTO2.setDatasource(datasourceRef);

        NewAction newAction1 = new NewAction();
        newAction1.setId("na1");
        newAction1.setWorkspaceId(workspaceId);
        newAction1.setApplicationId("app1");
        newAction1.setUnpublishedAction(actionDTO1);

        NewAction newAction2 = new NewAction();
        newAction2.setId("na2");
        newAction2.setWorkspaceId(workspaceId);
        newAction2.setApplicationId("app2");
        newAction2.setUnpublishedAction(actionDTO2);

        Application application1 = new Application();
        application1.setId("app1");
        application1.setName("App One");

        Application application2 = new Application();
        application2.setId("app2");
        application2.setName("App Two");

        when(workspaceService.findById(workspaceId, READ_WORKSPACES)).thenReturn(Mono.just(workspace));
        when(datasourceService.getAllByWorkspaceIdWithStorages(workspaceId, READ_DATASOURCES))
                .thenReturn(Flux.just(datasource));
        when(newActionService.findByWorkspaceId(workspaceId, READ_ACTIONS))
                .thenReturn(Flux.just(newAction1, newAction2));
        when(applicationService.findByWorkspaceId(workspaceId, READ_APPLICATIONS))
                .thenReturn(Flux.just(application1, application2));

        StepVerifier.create(workspaceDatasourceUsageService.getDatasourceUsage(workspaceId))
                .assertNext(usages -> {
                    assertThat(usages).hasSize(1);
                    var usage = usages.get(0);
                    assertThat(usage.getDatasourceId()).isEqualTo("ds1");
                    assertThat(usage.getTotalQueryCount()).isEqualTo(2);
                    assertThat(usage.getApplications()).hasSize(2);
                    assertThat(usage.getApplications().get(0).getQueries()).hasSize(1);
                })
                .verifyComplete();
    }

    @Test
    void getDatasourceUsage_whenNoActions_returnsEmptyList() {
        String workspaceId = "ws2";

        when(workspaceService.findById(workspaceId, READ_WORKSPACES)).thenReturn(Mono.just(new Workspace()));
        when(datasourceService.getAllByWorkspaceIdWithStorages(workspaceId, READ_DATASOURCES))
                .thenReturn(Flux.fromIterable(List.of()));
        when(newActionService.findByWorkspaceId(workspaceId, READ_ACTIONS)).thenReturn(Flux.fromIterable(List.of()));
        when(applicationService.findByWorkspaceId(workspaceId, READ_APPLICATIONS))
                .thenReturn(Flux.fromIterable(List.of()));

        StepVerifier.create(workspaceDatasourceUsageService.getDatasourceUsage(workspaceId))
                .expectNext(List.of())
                .verifyComplete();
    }
}
