package com.appsmith.server.services.ce;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.PluginType;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.newactions.base.NewActionServiceCEImpl;
import com.appsmith.server.newactions.helpers.NewActionHelper;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ActionPermissionImpl;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.PagePermission;
import com.appsmith.server.solutions.PolicySolution;
import com.appsmith.server.validations.EntityValidationService;
import io.micrometer.observation.ObservationRegistry;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyString;

@ExtendWith(SpringExtension.class)
@Slf4j
public class NewActionServiceUnitTest {

    NewActionServiceCEImpl newActionService;

    @MockBean
    Validator validator;

    @MockBean
    AnalyticsService analyticsService;

    @MockBean
    DatasourceService datasourceService;

    @MockBean
    PluginService pluginService;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    @MockBean
    PolicyGenerator policyGenerator;

    @MockBean
    NewPageService newPageService;

    @MockBean
    ApplicationService applicationService;

    @MockBean
    PolicySolution policySolution;

    @MockBean
    ConfigService configService;

    @MockBean
    PermissionGroupService permissionGroupService;

    @MockBean
    NewActionRepository newActionRepository;

    @MockBean
    DatasourcePermission datasourcePermission;

    @MockBean
    ApplicationPermission applicationPermission;

    @MockBean
    PagePermission pagePermission;

    @MockBean
    NewActionHelper newActionHelper;

    @MockBean
    EntityValidationService entityValidationService;

    ActionPermission actionPermission = new ActionPermissionImpl();

    @MockBean
    ObservationRegistry observationRegistry;

    @BeforeEach
    public void setup() {
        newActionService = new NewActionServiceCEImpl(
                validator,
                newActionRepository,
                analyticsService,
                datasourceService,
                pluginService,
                pluginExecutorHelper,
                policyGenerator,
                newPageService,
                applicationService,
                policySolution,
                configService,
                permissionGroupService,
                newActionHelper,
                datasourcePermission,
                applicationPermission,
                pagePermission,
                actionPermission,
                entityValidationService,
                observationRegistry);

        ObservationRegistry.ObservationConfig mockObservationConfig =
                Mockito.mock(ObservationRegistry.ObservationConfig.class);
        Mockito.when(observationRegistry.observationConfig()).thenReturn(mockObservationConfig);
        Mockito.doReturn(true).when(entityValidationService).validateName(Mockito.anyString());
    }

    @Test
    public void testMissingPluginIdAndTypeFixForNonJSPluginType() {
        /* Mock `findById` method of pluginService to return `testPlugin` */
        Plugin testPlugin = new Plugin();
        testPlugin.setId("testId");
        testPlugin.setType(PluginType.DB);
        Mockito.when(pluginService.findById(anyString())).thenReturn(Mono.just(testPlugin));

        NewAction action = new NewAction();
        action.setPluginId(null);
        action.setPluginType(null);
        ActionDTO actionDTO = new ActionDTO();
        Datasource datasource = new Datasource();
        /* Datasource has correct plugin id */
        datasource.setPluginId(testPlugin.getId());
        actionDTO.setDatasource(datasource);
        action.setUnpublishedAction(actionDTO);

        Mono<NewAction> updatedActionFlux = newActionService.sanitizeAction(action);
        StepVerifier.create(updatedActionFlux)
                .assertNext(updatedAction -> {
                    assertEquals("testId", updatedAction.getPluginId());
                    assertEquals(PluginType.DB, updatedAction.getPluginType());
                })
                .verifyComplete();
    }

    @Test
    public void testMissingPluginIdAndTypeFixForJSPluginType() {
        /* Mock `findByPackageName` method of pluginService to return `testPlugin` */
        Plugin testPlugin = new Plugin();
        testPlugin.setId("testId");
        testPlugin.setType(PluginType.JS);
        Mockito.when(pluginService.findByPackageName(anyString())).thenReturn(Mono.just(testPlugin));

        NewAction action = new NewAction();
        action.setPluginId(null);
        action.setPluginType(null);
        ActionDTO actionDTO = new ActionDTO();
        /* Non-null collection id to indicate a JS action */
        actionDTO.setCollectionId("testId");
        action.setUnpublishedAction(actionDTO);

        Mono<NewAction> updatedActionFlux = newActionService.sanitizeAction(action);
        StepVerifier.create(updatedActionFlux)
                .assertNext(updatedAction -> {
                    assertEquals("testId", updatedAction.getPluginId());
                    assertEquals(PluginType.JS, updatedAction.getPluginType());
                })
                .verifyComplete();
    }
}
