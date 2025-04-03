package com.appsmith.server.helpers.ce;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.WorkspacePermission;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import reactor.core.publisher.Mono;

@Slf4j
public class UserSignupHelperCE {
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceService workspaceService;
    private final ApplicationPageService applicationPageService;
    private final UserRepository userRepository;
    private final OrganizationService organizationService;
    private final WorkspacePermission workspacePermission;

    public UserSignupHelperCE(
            WorkspaceRepository workspaceRepository,
            WorkspaceService workspaceService,
            ApplicationPageService applicationPageService,
            UserRepository userRepository,
            OrganizationService organizationService,
            WorkspacePermission workspacePermission) {
        this.workspaceRepository = workspaceRepository;
        this.workspaceService = workspaceService;
        this.applicationPageService = applicationPageService;
        this.userRepository = userRepository;
        this.organizationService = organizationService;
        this.workspacePermission = workspacePermission;
    }

    /**
     * Creates a default workspace and application for a user.
     * Basic CE implementation that creates a simple workspace and application.
     *
     * @param user The user for whom to create the workspace and application
     * @return A Mono that completes when the workspace and application are created
     */
    public Mono<Void> createDefaultWorkspaceAndApplication(User user) {
        log.debug("Creating default workspace and application for user: {}", user.getEmail());

        // Create a default workspace
        Workspace workspace = new Workspace();
        workspace.setName(user.getName() != null ? user.getName() + "'s workspace" : "Default workspace");

        return workspaceService
                .create(workspace, user, Boolean.FALSE)
                .flatMap(createdWorkspace ->
                        createDefaultApplication(createdWorkspace.getId()).then())
                .doOnError(error -> log.error("Error creating workspace or application: {}", error.getMessage()))
                .then();
    }

    /**
     * Creates a default application in the specified workspace.
     *
     * @param workspaceId ID of the workspace to create the application in
     * @return A Mono containing the created Application
     */
    public Mono<Application> createDefaultApplication(String workspaceId) {
        log.debug("Creating default application in workspace: {}", workspaceId);
        Application application = new Application();
        application.setWorkspaceId(workspaceId);
        application.setName("My first application");
        return applicationPageService.createApplication(application);
    }

    /**
     * Gets an existing workspace ID or creates a new workspace if needed.
     *
     * @param defaultWorkspaceId The workspace ID to use if provided
     * @param authentication The authentication object containing the user principal
     * @return A Mono containing the workspace ID to use
     */
    public Mono<String> createWorkspaceIfNotExistsAndGetId(String defaultWorkspaceId, Authentication authentication) {
        if (defaultWorkspaceId != null) {
            return Mono.just(defaultWorkspaceId);
        }

        return workspaceRepository
                .findAll(workspacePermission.getEditPermission())
                .take(1, true)
                .collectList()
                .flatMap(workspaces -> {
                    // Since this is the first application creation, the first workspace would be the only
                    // workspace user has access to, and would be user's default workspace. Hence, we use this
                    // workspace to create the application.
                    if (workspaces.size() == 1) {
                        return Mono.just(workspaces.get(0));
                    }

                    // In case no workspaces are found for the user, create a new default workspace
                    User user = (User) authentication.getPrincipal();

                    // Use the protected method that can be overridden in EE version
                    return createDefaultWorkspaceForUser(user);
                })
                .map(Workspace::getId);
    }

    /**
     * Creates a default workspace for a user. This method can be overridden in the EE version
     * to add additional checks like multi-org feature flag.
     *
     * @param user User for whom to create the workspace
     * @return Mono containing the created workspace
     */
    public Mono<Workspace> createDefaultWorkspaceForUser(User user) {
        return organizationService
                .getCurrentUserOrganizationId()
                .flatMap(orgId -> userRepository.findByEmailAndOrganizationId(user.getEmail(), orgId))
                .flatMap(user1 -> workspaceService.createDefault(new Workspace(), user1));
    }
}
