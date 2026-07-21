package com.appsmith.server.services.ce;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.PluginType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.exceptions.AppsmithException;
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
import static org.mockito.ArgumentMatchers.eq;

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

    /**
     * Security test for GHSA-fhgw-q2jf-8fq7:
     *
     * validateAction() must use the ACL-scoped datasourceService.findById(id, AclPermission)
     * overload — NOT the unchecked findById(id) — when resolving a client-supplied datasource ID.
     * The unchecked overload bypasses all workspace and ACL filtering, allowing any authenticated
     * user to resolve a datasource belonging to another workspace and trigger
     * updateDatasourcePolicyForPublicAction against it, granting the anonymous permission group
     * EXECUTE_DATASOURCES rights on a foreign datasource.
     *
     * RED (pre-fix) behaviour:
     *   findById(String) is called → returns a stub → pipeline proceeds → SecurityViolationException
     *   (injected as a sentinel to detect the wrong overload) surfaces rather than AppsmithException.
     *
     * GREEN (post-fix) behaviour:
     *   findById(String, AclPermission.MANAGE_DATASOURCES) is called → returns Mono.empty() →
     *   switchIfEmpty emits AppsmithException → StepVerifier.expectError(AppsmithException.class) passes.
     */
    @Test
    public void testValidateAction_withForeignDatasourceId_shouldUseScopedFindById_GHSA_fhgw_q2jf_8fq7() {
        String foreignDatasourceId = "foreign-workspace-datasource-id";

        // Mock the edit permission returned by datasourcePermission
        AclPermission editPermission = AclPermission.MANAGE_DATASOURCES;
        Mockito.when(datasourcePermission.getEditPermission()).thenReturn(editPermission);

        // Sentinel exception: if the unchecked overload is called, surface this distinct error.
        // In pre-fix code this overload is called; in post-fix code it must never be called.
        RuntimeException securityViolation =
                new RuntimeException("SECURITY_VIOLATION: unchecked datasourceService.findById(String) was called "
                        + "during action create/update — cross-workspace datasource bypass possible "
                        + "(GHSA-fhgw-q2jf-8fq7)");
        Mockito.when(datasourceService.findById(eq(foreignDatasourceId))).thenReturn(Mono.error(securityViolation));

        // The ACL-scoped overload returns empty — datasource not accessible to this user/workspace.
        // After the fix, the switchIfEmpty must raise an AppsmithException (not continue with a stub).
        Mockito.when(datasourceService.findById(eq(foreignDatasourceId), eq(editPermission)))
                .thenReturn(Mono.empty());

        NewAction action = new NewAction();
        action.setApplicationId("attacker-app-id");

        ActionDTO actionDTO = new ActionDTO();
        actionDTO.setName("poisonedAction");
        // Datasource with a non-null ID → triggers the findById resolution branch
        Datasource datasourceRef = new Datasource();
        datasourceRef.setId(foreignDatasourceId);
        actionDTO.setDatasource(datasourceRef);
        // Non-JS plugin type to enter the datasource resolution path
        actionDTO.setPluginType(PluginType.DB);
        action.setUnpublishedAction(actionDTO);

        // After the fix the pipeline must terminate with AppsmithException (datasource not found /
        // not accessible), NOT with RuntimeException (which signals the wrong overload was called).
        Mono<NewAction> result = newActionService.validateAction(action, false);
        StepVerifier.create(result).expectError(AppsmithException.class).verify();

        // Post-fix assertions: the ACL-scoped overload was called; the unchecked overload was not.
        Mockito.verify(datasourceService).findById(eq(foreignDatasourceId), eq(editPermission));
        Mockito.verify(datasourceService, Mockito.never()).findById(eq(foreignDatasourceId));
    }
}
