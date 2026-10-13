package com.appsmith.server.services.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.artifacts.base.ArtifactService;
import com.appsmith.server.artifacts.base.artifactbased.ArtifactBasedService;
import com.appsmith.server.artifacts.permissions.ArtifactPermission;
import com.appsmith.server.constants.ArtifactType;
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
import com.appsmith.server.solutions.DatasourceStructureSolution;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.EnumSet;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Pins how an Ask AI request is authorized against the editor it came from. The workflow editor carries no entity id
 * (its main code is a JS object), so before requests could name a workflow artifact every request from it was refused
 * with "Editor context must identify an entity or an application".
 */
class AIAssistantServiceCEImplTest {

    private static final String PROVIDER = "LOCAL_LLM";

    // Workflow permissions are EE-only. Any permission other than the application's shows that the gate checks
    // whatever edit permission the artifact's own service reports.
    private static final AclPermission WORKFLOW_EDIT_PERMISSION = AclPermission.MANAGE_PAGES;

    OrganizationService organizationService;
    NewActionService newActionService;
    ArtifactService artifactService;
    ArtifactBasedService<Application> artifactBasedService;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        organizationService = Mockito.mock(OrganizationService.class);
        newActionService = Mockito.mock(NewActionService.class);
        artifactService = Mockito.mock(ArtifactService.class);
        artifactBasedService = Mockito.mock(ArtifactBasedService.class);

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

    private AIAssistantServiceCEImpl service() {
        return wire(new AIAssistantServiceCEImpl(
                organizationService,
                Mockito.mock(AIReferenceService.class),
                newActionService,
                Mockito.mock(DatasourceStructureSolution.class),
                Mockito.mock(PluginService.class),
                Mockito.mock(ActionPermission.class)));
    }

    /** A subclass that adds workflows to the authorizable types, the way EE does. */
    private AIAssistantServiceCEImpl serviceWithWorkflows() {
        return wire(
                new AIAssistantServiceCEImpl(
                        organizationService,
                        Mockito.mock(AIReferenceService.class),
                        newActionService,
                        Mockito.mock(DatasourceStructureSolution.class),
                        Mockito.mock(PluginService.class),
                        Mockito.mock(ActionPermission.class)) {
                    @Override
                    protected Set<ArtifactType> getAuthorizableArtifactTypes() {
                        return EnumSet.of(ArtifactType.APPLICATION, ArtifactType.WORKFLOW);
                    }
                });
    }

    private AIAssistantServiceCEImpl wire(AIAssistantServiceCEImpl service) {
        User user = new User();
        user.setEmail("developer@example.com");
        SessionUserService sessionUserService = Mockito.mock(SessionUserService.class);
        when(sessionUserService.getCurrentUser()).thenReturn(Mono.just(user));
        RateLimitService rateLimitService = Mockito.mock(RateLimitService.class);
        when(rateLimitService.tryIncreaseCounter(anyString(), anyString())).thenReturn(Mono.just(true));

        service.setSessionUserService(sessionUserService);
        service.setRateLimitService(rateLimitService);
        service.setArtifactService(artifactService);
        return service;
    }

    /** Routes {@code artifactType} to a service whose edit permission is {@code editPermission}. */
    private void givenArtifactService(ArtifactType artifactType, AclPermission editPermission) {
        ArtifactPermission permission = Mockito.mock(ArtifactPermission.class);
        when(permission.getEditPermission()).thenReturn(editPermission);
        when(artifactBasedService.getPermissionService()).thenReturn(permission);
        doReturn(artifactBasedService).when(artifactService).getArtifactBasedService(artifactType);
    }

    private static AIEditorContextDTO context(String artifactId, ArtifactType artifactType) {
        AIEditorContextDTO context = new AIEditorContextDTO();
        context.setMode("javascript");
        context.setArtifactId(artifactId);
        context.setArtifactType(artifactType);
        return context;
    }

    private static boolean passedAuthorization(Throwable error) {
        return error instanceof AppsmithException
                && error.getMessage() != null
                && error.getMessage().contains("Local LLM URL not configured");
    }

    private static boolean isError(Throwable error, AppsmithError expected) {
        return error instanceof AppsmithException appsmithException && appsmithException.getError() == expected;
    }

    /**
     * EE adds workflows by overriding getAuthorizableArtifactTypes. An added type is checked with the edit permission
     * that its own artifact service reports.
     */
    @Test
    void typeAddedBySubclass_isAuthorizedWithThatTypesEditPermission() {
        givenArtifactService(ArtifactType.WORKFLOW, WORKFLOW_EDIT_PERMISSION);
        when(artifactBasedService.findById("workflow-1", WORKFLOW_EDIT_PERMISSION))
                .thenReturn(Mono.just(new Application()));

        StepVerifier.create(serviceWithWorkflows()
                        .getAIResponse(PROVIDER, "fix this", context(" workflow-1 ", ArtifactType.WORKFLOW)))
                .expectErrorMatches(AIAssistantServiceCEImplTest::passedAuthorization)
                .verify();

        verify(artifactBasedService).findById("workflow-1", WORKFLOW_EDIT_PERMISSION);
    }

    @Test
    void applicationRequest_isAuthorizedWithTheApplicationsEditPermission() {
        givenArtifactService(ArtifactType.APPLICATION, AclPermission.MANAGE_APPLICATIONS);
        when(artifactBasedService.findById("app-1", AclPermission.MANAGE_APPLICATIONS))
                .thenReturn(Mono.just(new Application()));

        StepVerifier.create(service().getAIResponse(PROVIDER, "fix this", context("app-1", ArtifactType.APPLICATION)))
                .expectErrorMatches(AIAssistantServiceCEImplTest::passedAuthorization)
                .verify();

        verify(artifactBasedService).findById("app-1", AclPermission.MANAGE_APPLICATIONS);
    }

    @Test
    void requestForAnArtifactTheCallerCannotEdit_isRefused() {
        givenArtifactService(ArtifactType.APPLICATION, AclPermission.MANAGE_APPLICATIONS);
        when(artifactBasedService.findById("app-1", AclPermission.MANAGE_APPLICATIONS))
                .thenReturn(Mono.empty());

        StepVerifier.create(service().getAIResponse(PROVIDER, "fix this", context("app-1", ArtifactType.APPLICATION)))
                .expectErrorMatches(error -> isError(error, AppsmithError.ACL_NO_RESOURCE_FOUND))
                .verify();
    }

    /** CE has Ask AI only in the application editor, so a workflow is refused before the lookup. */
    @Test
    void workflowRequest_isRefusedInCommunityEdition() {
        StepVerifier.create(service().getAIResponse(PROVIDER, "fix this", context("workflow-1", ArtifactType.WORKFLOW)))
                .expectErrorMatches(error -> isError(error, AppsmithError.INVALID_PARAMETER)
                        && error.getMessage().contains("artifactType"))
                .verify();

        verifyNoInteractions(artifactService);
    }

    /** An artifact id alone does not say which permission to check, so it is refused rather than guessed at. */
    @Test
    void requestWithArtifactIdButNoType_isRefused() {
        StepVerifier.create(service().getAIResponse(PROVIDER, "fix this", context("workflow-1", null)))
                .expectErrorMatches(error -> isError(error, AppsmithError.INVALID_PARAMETER)
                        && error.getMessage().contains("artifactType"))
                .verify();

        verifyNoInteractions(artifactService);
    }

    /**
     * A type the subclass did not add is still refused before the lookup, because not every artifact service enforces
     * the permission it is given (EE's package service ignores it).
     */
    @Test
    void requestForAnArtifactTypeWithoutAskAI_isRefusedBeforeTheLookup() {
        StepVerifier.create(serviceWithWorkflows()
                        .getAIResponse(PROVIDER, "fix this", context("package-1", ArtifactType.PACKAGE)))
                .expectErrorMatches(error -> isError(error, AppsmithError.INVALID_PARAMETER)
                        && error.getMessage().contains("artifactType"))
                .verify();

        verifyNoInteractions(artifactService);
    }

    /**
     * The entity id is looked up as an action. A widget id (what the client used to send for a property binding) or
     * an action the caller cannot edit is refused — and the entity branch is decided before the artifact, so sending
     * an editable artifact alongside does not rescue it.
     */
    @Test
    void requestWithEntityThatIsNotAnEditableAction_isRefusedBeforeTheArtifactIsConsidered() {
        when(newActionService.findActionDTObyIdAndViewMode(eq("widget-1"), eq(false), any()))
                .thenReturn(Mono.empty());
        AIEditorContextDTO context = context("app-1", ArtifactType.APPLICATION);
        context.setEntityId("widget-1");

        StepVerifier.create(service().getAIResponse(PROVIDER, "fix this", context))
                .expectErrorMatches(error -> isError(error, AppsmithError.ACL_NO_RESOURCE_FOUND))
                .verify();

        verify(artifactService, never()).getArtifactBasedService(any());
    }

    @Test
    void requestWithNoEntityOrArtifact_isRefused() {
        StepVerifier.create(service().getAIResponse(PROVIDER, "fix this", context(null, null)))
                .expectErrorMatches(error -> isError(error, AppsmithError.INVALID_PARAMETER)
                        && error.getMessage().contains("an entity or an artifact"))
                .verify();
    }
}
