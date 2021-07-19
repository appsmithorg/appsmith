package com.appsmith.server.helpers;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.CommentThread;
import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.CommentThreadRepository;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@RunWith(SpringRunner.class)
public class PolicyUtilsTest {

    @Autowired
    private PolicyUtils policyUtils;

    @Autowired
    private CommentThreadRepository commentThreadRepository;

    @Before
    public void cleanUp() {
        commentThreadRepository.deleteAll().block();
    }

    @Test
    @WithUserDetails("api_user")
    public void updateWithApplicationPermissionsToAllItsCommentThreads_AddPermissions_PermissionsAdded() {
        // create a thread
        String testApplicationId = "test-application-id";
        CommentThread commentThread = new CommentThread();
        commentThread.setApplicationId(testApplicationId);
        Map<String, Policy> commentThreadPolicies = policyUtils.generatePolicyFromPermission(
                Set.of(AclPermission.MANAGE_THREAD, AclPermission.COMMENT_ON_THREAD), "api_user"
        );
        commentThread.setPolicies(Set.copyOf(commentThreadPolicies.values()));
        Mono<CommentThread> saveThreadMono = commentThreadRepository.save(commentThread);

        // add a new user and update the policies of the new user
        String newUserName = "new_test_user";
        Map<String, Policy> commentThreadPoliciesForNewUser = policyUtils.generatePolicyFromPermission(
                Set.of(AclPermission.COMMENT_ON_THREAD), newUserName
        );
        Flux<CommentThread> updateCommentThreads = policyUtils.updateCommentThreadPermissions(
                testApplicationId, commentThreadPoliciesForNewUser, newUserName, true
        );

        // check if new policies updated
        Mono<List<CommentThread>> applicationCommentList = saveThreadMono
                .thenMany(updateCommentThreads)
                .collectList()
                .thenMany(commentThreadRepository.findByApplicationId(testApplicationId, AclPermission.READ_THREAD))
                .collectList();

        StepVerifier.create(applicationCommentList)
                .assertNext(commentThreads -> {
                    assertThat(commentThreads.size()).isEqualTo(1);
                    CommentThread commentThread1 = commentThreads.get(0);
                    Set<Policy> policies = commentThread1.getPolicies();
                    assertThat(policyUtils.isPermissionPresentForUser(policies, AclPermission.MANAGE_THREAD.getValue(), "api_user")).isTrue();
                    assertThat(policyUtils.isPermissionPresentForUser(policies, AclPermission.MANAGE_THREAD.getValue(), newUserName)).isFalse();
                    assertThat(policyUtils.isPermissionPresentForUser(policies, AclPermission.READ_THREAD.getValue(), "api_user")).isTrue();
                    assertThat(policyUtils.isPermissionPresentForUser(policies, AclPermission.READ_THREAD.getValue(), newUserName)).isTrue();
                    assertThat(policyUtils.isPermissionPresentForUser(policies, AclPermission.COMMENT_ON_THREAD.getValue(), "api_user")).isTrue();
                    assertThat(policyUtils.isPermissionPresentForUser(policies, AclPermission.COMMENT_ON_THREAD.getValue(), newUserName)).isTrue();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void updateWithApplicationPermissionsToAllItsCommentThreads_RemovePermissions_PermissionsRemoved() {
        String newUserName = "new_test_user";

        // create a thread with two users having permission on it
        String testApplicationId = "test-application-id";
        CommentThread commentThread = new CommentThread();
        commentThread.setApplicationId(testApplicationId);
        commentThread.setPolicies(new HashSet<>());

        User user1 = new User();
        user1.setEmail("api_user");

        User user2 = new User();
        user2.setEmail(newUserName);

        Map<String, Policy> commentThreadPolicies = policyUtils.generatePolicyFromPermissionForMultipleUsers(
                Set.of(AclPermission.MANAGE_THREAD, AclPermission.COMMENT_ON_THREAD), List.of(user1, user2)
        );

        commentThread.setPolicies(Set.copyOf(commentThreadPolicies.values()));
        Mono<CommentThread> saveThreadMono = commentThreadRepository.save(commentThread);

        // remove an user and update the policies of the user
        Map<String, Policy> commentThreadPoliciesForNewUser = policyUtils.generatePolicyFromPermission(
                Set.of(AclPermission.MANAGE_THREAD, AclPermission.COMMENT_ON_THREAD), newUserName
        );
        Flux<CommentThread> updateCommentThreads = policyUtils.updateCommentThreadPermissions(
                testApplicationId, commentThreadPoliciesForNewUser, newUserName, false
        );

        // check if new policies updated
        Mono<List<CommentThread>> applicationCommentList = saveThreadMono
                .thenMany(updateCommentThreads)
                .collectList()
                .thenMany(commentThreadRepository.findByApplicationId(testApplicationId, AclPermission.READ_THREAD))
                .collectList();

        StepVerifier.create(applicationCommentList)
                .assertNext(commentThreads -> {
                    assertThat(commentThreads.size()).isEqualTo(1);
                    CommentThread commentThread1 = commentThreads.get(0);
                    Set<Policy> policies = commentThread1.getPolicies();
                    assertThat(policyUtils.isPermissionPresentForUser(policies, AclPermission.MANAGE_THREAD.getValue(), "api_user")).isTrue();
                    assertThat(policyUtils.isPermissionPresentForUser(policies, AclPermission.MANAGE_THREAD.getValue(), newUserName)).isFalse();
                    assertThat(policyUtils.isPermissionPresentForUser(policies, AclPermission.READ_THREAD.getValue(), "api_user")).isTrue();
                    assertThat(policyUtils.isPermissionPresentForUser(policies, AclPermission.READ_THREAD.getValue(), newUserName)).isFalse();
                    assertThat(policyUtils.isPermissionPresentForUser(policies, AclPermission.COMMENT_ON_THREAD.getValue(), "api_user")).isTrue();
                    assertThat(policyUtils.isPermissionPresentForUser(policies, AclPermission.COMMENT_ON_THREAD.getValue(), newUserName)).isFalse();
                })
                .verifyComplete();
    }
}