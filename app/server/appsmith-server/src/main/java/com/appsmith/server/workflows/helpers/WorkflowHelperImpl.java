package com.appsmith.server.workflows.helpers;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Workflow;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.UserRepository;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Component
public class WorkflowHelperImpl implements WorkflowHelper {
    private final PermissionGroupRepository permissionGroupRepository;
    private final UserRepository userRepository;

    public WorkflowHelperImpl(PermissionGroupRepository permissionGroupRepository, UserRepository userRepository) {
        this.permissionGroupRepository = permissionGroupRepository;
        this.userRepository = userRepository;
    }

    @Override
    public String generateWorkflowBotUserEmail(Workflow workflow) {
        return String.format(
                        "%s_%s_%s@appsmith.com",
                        workflow.getName(),
                        workflow.getId(),
                        workflow.getCreatedAt().toEpochMilli())
                .toLowerCase();
    }

    @Override
    public String generateWorkflowBotUserName(Workflow workflow) {
        return String.format("Workflow Bot User - %s", workflow.getName());
    }

    @Override
    public String generateWorkflowBotRoleName(Workflow workflow) {
        return String.format("%s - %s", FieldName.WORKFLOW_EXECUTOR, workflow.getName());
    }

    /**
     * <p>
     * Updates the workflow bot role, and workflow bot user details in a reactive manner, associated to the workflow.
     * </p>
     *
     * <p>
     * This method performs the following actions:
     * <ol>
     *   <li>Retrieves the workflow bot role associated with the provided workflow ID.</li>
     *   <li>Updates the name of the workflow bot role using the updated workflow information.</li>
     *   <li>Saves the updated workflow bot role to the repository.</li>
     *   <li>Retrieves the workflow bot user based on the email generated from the provided workflow.</li>
     *   <li>Updates the email and name of the workflow bot user using the updated workflow information.</li>
     *   <li>Saves the updated workflow bot user to the repository.</li>
     *   <li>Combines the results of updating the workflow bot role and the workflow bot user using Mono.zip.</li>
     * </ol>
     * </p>
     *
     * @param actualWorkflow The original workflow before the update.
     * @param updatedWorkflow The updated workflow containing the new information.
     * @return A Mono emitting a boolean value indicating the success of the update process. Mono returned is non-cancelable.
     * </p>
     */
    @Override
    public Mono<Boolean> updateWorkflowBotRoleAndUserDetails(Workflow actualWorkflow, Workflow updatedWorkflow) {
        Flux<PermissionGroup> workflowBotRoleFlux = permissionGroupRepository.findByDefaultDomainIdAndDefaultDomainType(
                actualWorkflow.getId(), Workflow.class.getSimpleName());
        Mono<Boolean> updateWorkflowBotRoleMono = workflowBotRoleFlux
                .flatMap(role -> {
                    role.setName(generateWorkflowBotRoleName(updatedWorkflow));
                    return permissionGroupRepository.save(role);
                })
                .collectList()
                .thenReturn(Boolean.TRUE);

        Mono<Boolean> updateWorkflowBotUserMono = userRepository
                .findByCaseInsensitiveEmail(generateWorkflowBotUserEmail(actualWorkflow))
                .flatMap(workflowBotUser -> {
                    workflowBotUser.setEmail(generateWorkflowBotUserEmail(updatedWorkflow));
                    workflowBotUser.setName(generateWorkflowBotUserName(updatedWorkflow));
                    return userRepository.save(workflowBotUser);
                })
                .thenReturn(Boolean.TRUE);

        Mono<Boolean> updateBotUserAndRoleMono =
                Mono.zip(updateWorkflowBotRoleMono, updateWorkflowBotUserMono).thenReturn(Boolean.TRUE);

        return Mono.create(
                sink -> updateBotUserAndRoleMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    /**
     * <p>
     * Archives the workflow bot role and user associated with the provided workflow in a reactive manner.
     * </p>
     *
     * <p>
     * This method performs the following actions:
     * <ol>
     *   <li>Retrieves the workflow bot role associated with the provided workflow ID.</li>
     *   <li>Archives the workflow bot role, setting it to an inactive state in the repository.</li>
     *   <li>Collects the results of archiving workflow bot roles using <code>collectList()</code>.</li>
     *   <li>Returns <code>true</code> if all workflow bot roles were successfully archived. (There is going to be just 1)</li>
     *   <li>Retrieves the workflow bot user based on the email generated from the provided workflow.</li>
     *   <li>Deletes the workflow bot user from the repository.</li>
     *   <li>Returns <code>true</code> if the workflow bot user was successfully deleted.</li>
     *   <li>Combines the results of archiving the workflow bot role and deleting the workflow bot user using Mono.zip.</li>
     * </ol>
     * </p>
     *
     * @param workflow The workflow for which the bot role and user are to be archived.
     * @return A Mono emitting a boolean value indicating the success of the archival process.
     * </p>
     */
    @Override
    public Mono<Boolean> archiveWorkflowBotRoleAndUser(Workflow workflow) {
        Flux<PermissionGroup> workflowBotRoleFlux = permissionGroupRepository.findByDefaultDomainIdAndDefaultDomainType(
                workflow.getId(), Workflow.class.getSimpleName());
        Mono<Boolean> archiveWorkflowBotRoleMono = workflowBotRoleFlux
                .flatMap(permissionGroupRepository::archive)
                .collectList()
                .thenReturn(Boolean.TRUE);

        Mono<Boolean> archiveWorkflowBotUserMono = userRepository
                .findByCaseInsensitiveEmail(generateWorkflowBotUserEmail(workflow))
                .flatMap(userRepository::delete)
                .thenReturn(Boolean.TRUE);

        return Mono.zip(archiveWorkflowBotRoleMono, archiveWorkflowBotUserMono).thenReturn(Boolean.TRUE);
    }
}
