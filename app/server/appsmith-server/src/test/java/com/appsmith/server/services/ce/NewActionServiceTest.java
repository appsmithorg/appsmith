package com.appsmith.server.services.ce;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.extensions.AfterAllCleanUpExtension;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.repositories.cakes.NewActionRepositoryCake;
import com.appsmith.server.repositories.cakes.PermissionGroupRepositoryCake;
import com.appsmith.server.solutions.ActionPermission;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ExtendWith(AfterAllCleanUpExtension.class)
public class NewActionServiceTest {

    @Autowired
    NewActionService newActionService;

    @Autowired
    PolicyGenerator policyGenerator;

    @Autowired
    PermissionGroupRepositoryCake permissionGroupRepository;

    @Autowired
    NewActionRepositoryCake newActionRepository;

    @Autowired
    ActionPermission actionPermission;

    private NewAction createActionObject(String actionName, String applicationId, AclPermission permission) {
        Set<String> permissionGroupIds = permissionGroupRepository.findAll().collectList().block().stream()
                .map(PermissionGroup::getId)
                .collect(Collectors.toSet());

        Policy testPolicy = Policy.builder()
                .permissionGroups(permissionGroupIds)
                .permission(permission.getValue())
                .build();

        NewAction newAction = new NewAction();
        newAction.setPolicies(Set.of(testPolicy));
        newAction.setApplicationId(applicationId);

        ActionDTO actionDTO = new ActionDTO();
        actionDTO.setName(actionName);
        actionDTO.setPageId(UUID.randomUUID().toString());

        newAction.setUnpublishedAction(actionDTO);
        newAction.setPublishedAction(new ActionDTO());
        return newAction;
    }

    /**
     * This test is to check whether publish action method publishes the actions if
     * the user has required permission on that object.
     */
    @Test
    @WithUserDetails("api_user")
    public void testActionsPublishedWhenPermissionIsMatched() {
        String applicationId = UUID.randomUUID().toString();

        // create 3 actions with same application id but 2 with edit permission and 1 with read permission
        List<NewAction> actionWithEditPermission = List.of(
                createActionObject("Action1", applicationId, actionPermission.getEditPermission()),
                createActionObject("Action2", applicationId, actionPermission.getReadPermission()),
                createActionObject("Action3", applicationId, actionPermission.getEditPermission()));

        Mono<List<NewAction>> actionListMono = newActionRepository
                .saveAll(actionWithEditPermission)
                .then(newActionService.publishActions(applicationId, actionPermission.getEditPermission()))
                .thenMany(newActionRepository.findByApplicationId(applicationId))
                .collectList();

        StepVerifier.create(actionListMono)
                .assertNext(actions -> {
                    assertThat(actions).hasSize(3);
                    actions.forEach(action -> {
                        assertThat(action.getPublishedAction()).isNotNull();
                        // we've set name and pageId so these fields should not be null in edit mode
                        assertThat(action.getUnpublishedAction()).isNotNull();
                        assertThat(action.getUnpublishedAction().getName()).isNotNull();
                        assertThat(action.getUnpublishedAction().getPageId()).isNotNull();

                        if (action.getUnpublishedAction().getName().equals("Action2")) {
                            // this action should not be published as user has only read permission
                            assertThat(action.getPublishedAction().getName()).isNull();
                            assertThat(action.getPublishedAction().getPageId()).isNull();
                        } else {
                            // it should be published so published mode will contain the same name and pageId
                            assertThat(action.getUnpublishedAction().getName())
                                    .isEqualTo(action.getPublishedAction().getName());
                            assertThat(action.getUnpublishedAction().getPageId())
                                    .isEqualTo(action.getPublishedAction().getPageId());
                        }
                    });
                })
                .verifyComplete();
    }
}
