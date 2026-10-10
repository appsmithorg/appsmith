package com.appsmith.server.services.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.domains.AIAssistantConfig;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.OrganizationConfiguration;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.AIEditorContextDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.ratelimiting.RateLimitService;
import com.appsmith.server.services.AIReferenceService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourceStructureSolution;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Pins how an Ask AI request is authorized against the editor it came from. The workflow editor carries neither an
 * entity id (its main code is a JS object) nor an application id (a workflow is not an application), so before the
 * workflow branch existed every request from it was refused with "Editor context must identify an entity or an
 * application".
 */
class AIAssistantServiceCEImplTest {

    private static final String PROVIDER = "LOCAL_LLM";

    OrganizationService organizationService;
    NewActionService newActionService;
    ApplicationService applicationService;
    ApplicationPermission applicationPermission;

    @BeforeEach
    void setUp() {
        organizationService = Mockito.mock(OrganizationService.class);
        newActionService = Mockito.mock(NewActionService.class);
        applicationService = Mockito.mock(ApplicationService.class);
        applicationPermission = Mockito.mock(ApplicationPermission.class);

        // An enabled assistant with no local LLM URL: a request that clears authorization fails at the provider step
        // with "Local LLM URL not configured", which proves it got past the gate without making a network call.
        AIAssistantConfig aiConfig = new AIAssistantConfig();
        aiConfig.setIsAIAssistantEnabled(true);
        OrganizationConfiguration configuration = new OrganizationConfiguration();
        configuration.setAiAssistantConfig(aiConfig);
        Organization organization = new Organization();
        organization.setOrganizationConfiguration(configuration);
        when(organizationService.getCurrentUserOrganization()).thenReturn(Mono.just(organization));
    }

    private <T extends AIAssistantServiceCEImpl> T wire(T service) {
        User user = new User();
        user.setEmail("developer@example.com");
        SessionUserService sessionUserService = Mockito.mock(SessionUserService.class);
        when(sessionUserService.getCurrentUser()).thenReturn(Mono.just(user));
        RateLimitService rateLimitService = Mockito.mock(RateLimitService.class);
        when(rateLimitService.tryIncreaseCounter(anyString(), anyString())).thenReturn(Mono.just(true));

        service.setSessionUserService(sessionUserService);
        service.setRateLimitService(rateLimitService);
        service.setApplicationService(applicationService);
        service.setApplicationPermission(applicationPermission);
        return service;
    }

    private AIAssistantServiceCEImpl ceService() {
        return wire(new AIAssistantServiceCEImpl(
                organizationService,
                Mockito.mock(AIReferenceService.class),
                newActionService,
                Mockito.mock(DatasourceStructureSolution.class),
                Mockito.mock(PluginService.class),
                Mockito.mock(ActionPermission.class)));
    }

    /** Stands in for EE: records the workflow ids it is asked about and allows them. */
    static class WorkflowAwareService extends AIAssistantServiceCEImpl {
        final List<String> authorizedWorkflowIds = new ArrayList<>();

        WorkflowAwareService(OrganizationService organizationService, NewActionService newActionService) {
            super(
                    organizationService,
                    Mockito.mock(AIReferenceService.class),
                    newActionService,
                    Mockito.mock(DatasourceStructureSolution.class),
                    Mockito.mock(PluginService.class),
                    Mockito.mock(ActionPermission.class));
        }

        @Override
        protected Mono<Void> authorizeWorkflowContext(String workflowId) {
            authorizedWorkflowIds.add(workflowId);
            return Mono.empty();
        }
    }

    private static AIEditorContextDTO context(String applicationId, String workflowId) {
        AIEditorContextDTO context = new AIEditorContextDTO();
        context.setMode("javascript");
        context.setApplicationId(applicationId);
        context.setWorkflowId(workflowId);
        return context;
    }

    private static boolean passedAuthorization(Throwable error) {
        return error instanceof AppsmithException
                && error.getMessage() != null
                && error.getMessage().contains("Local LLM URL not configured");
    }

    @Test
    void workflowOnlyRequest_isAuthorizedAgainstTheWorkflow() {
        WorkflowAwareService service = wire(new WorkflowAwareService(organizationService, newActionService));

        StepVerifier.create(service.getAIResponse(PROVIDER, "fix this", context(null, " workflow-1 ")))
                .expectErrorMatches(AIAssistantServiceCEImplTest::passedAuthorization)
                .verify();

        assertThat(service.authorizedWorkflowIds).containsExactly("workflow-1");
        verify(applicationService, never()).findById(anyString(), Mockito.<AclPermission>any());
    }

    @Test
    void workflowOnlyRequest_isRefusedInCommunityEdition() {
        StepVerifier.create(ceService().getAIResponse(PROVIDER, "fix this", context(null, "workflow-1")))
                .expectErrorMatches(error -> error instanceof AppsmithException appsmithException
                        && appsmithException.getError() == AppsmithError.ACL_NO_RESOURCE_FOUND)
                .verify();
    }

    @Test
    void requestWithApplication_isAuthorizedAgainstTheApplicationNotTheWorkflow() {
        WorkflowAwareService service = wire(new WorkflowAwareService(organizationService, newActionService));
        when(applicationPermission.getEditPermission()).thenReturn(AclPermission.MANAGE_APPLICATIONS);
        when(applicationService.findById("app-1", AclPermission.MANAGE_APPLICATIONS))
                .thenReturn(Mono.just(new Application()));

        StepVerifier.create(service.getAIResponse(PROVIDER, "fix this", context("app-1", "workflow-1")))
                .expectErrorMatches(AIAssistantServiceCEImplTest::passedAuthorization)
                .verify();

        assertThat(service.authorizedWorkflowIds).isEmpty();
    }

    @Test
    void requestWithApplicationTheCallerCannotEdit_isRefused() {
        when(applicationPermission.getEditPermission()).thenReturn(AclPermission.MANAGE_APPLICATIONS);
        when(applicationService.findById("app-1", AclPermission.MANAGE_APPLICATIONS))
                .thenReturn(Mono.empty());

        StepVerifier.create(ceService().getAIResponse(PROVIDER, "fix this", context("app-1", null)))
                .expectErrorMatches(error -> error instanceof AppsmithException appsmithException
                        && appsmithException.getError() == AppsmithError.ACL_NO_RESOURCE_FOUND)
                .verify();
    }

    /**
     * The entity id is looked up as an action. A widget id (what the client used to send for a property binding) or
     * an action the caller cannot edit is refused — and the entity branch is decided before the application or
     * workflow, so sending an editable workflow alongside does not rescue it.
     */
    @Test
    void requestWithEntityThatIsNotAnEditableAction_isRefusedBeforeWorkflowIsConsidered() {
        WorkflowAwareService service = wire(new WorkflowAwareService(organizationService, newActionService));
        when(newActionService.findActionDTObyIdAndViewMode(eq("widget-1"), eq(false), any()))
                .thenReturn(Mono.empty());
        AIEditorContextDTO context = context(null, "workflow-1");
        context.setEntityId("widget-1");

        StepVerifier.create(service.getAIResponse(PROVIDER, "fix this", context))
                .expectErrorMatches(error -> error instanceof AppsmithException appsmithException
                        && appsmithException.getError() == AppsmithError.ACL_NO_RESOURCE_FOUND)
                .verify();

        assertThat(service.authorizedWorkflowIds).isEmpty();
    }

    @Test
    void requestWithNoEntityApplicationOrWorkflow_isRefused() {
        StepVerifier.create(ceService().getAIResponse(PROVIDER, "fix this", context(null, null)))
                .expectErrorMatches(error -> error instanceof AppsmithException appsmithException
                        && appsmithException.getError() == AppsmithError.INVALID_PARAMETER
                        && appsmithException.getMessage().contains("a workflow"))
                .verify();
    }
}
