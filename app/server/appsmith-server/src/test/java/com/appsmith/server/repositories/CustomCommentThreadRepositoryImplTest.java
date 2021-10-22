package com.appsmith.server.repositories;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.CommentMode;
import com.appsmith.server.domains.CommentThread;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.CommentThreadFilterDTO;
import com.appsmith.server.helpers.PolicyUtils;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringRunner.class)
@SpringBootTest
public class CustomCommentThreadRepositoryImplTest {

    @Autowired
    CommentThreadRepository commentThreadRepository;

    @Autowired
    PolicyUtils policyUtils;

    private CommentThread createThreadWithPolicies(String userEmail) {
        CommentThread thread = new CommentThread();
        User user = new User();
        user.setEmail(userEmail);

        Map<String, Policy> policyMap = policyUtils.generatePolicyFromPermission(Set.of(AclPermission.READ_THREAD), user);
        thread.setPolicies(Set.copyOf(policyMap.values()));
        return thread;
    }

    private CommentThread createThreadWithManagePermission(String userEmail, String applicationId, String pageId) {
        CommentThread thread = new CommentThread();
        thread.setPageId(pageId);
        thread.setApplicationId(applicationId);
        thread.setMode(CommentMode.EDIT);
        User user = new User();
        user.setEmail(userEmail);

        Map<String, Policy> policyMap = policyUtils.generatePolicyFromPermission(
                Set.of(AclPermission.MANAGE_THREAD, AclPermission.READ_THREAD), user);
        HashSet<Policy> policySet = new HashSet<>();

        // not using Set.of here because the caller function may need to add more policies
        policySet.addAll(policyMap.values());
        thread.setPolicies(policySet);
        return thread;
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void addToSubscribers_WhenNoSubscriber_NewOnesAdded() {
        CommentThread thread = createThreadWithPolicies("api_user");

        Mono<CommentThread> commentThreadMono = commentThreadRepository.save(thread).flatMap(savedThread ->
                commentThreadRepository.addToSubscribers(savedThread.getId(), Set.of("a", "b", "c"))
                        .thenReturn(savedThread)
        ).flatMap(commentThread -> commentThreadRepository.findById(commentThread.getId()));

        StepVerifier.create(commentThreadMono).assertNext(commentThread -> {
            assertThat(commentThread.getSubscribers().size()).isEqualTo(3);
            assertThat(commentThread.getSubscribers()).contains("a", "b", "c");
        }).verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void addToSubscribers_WhenSubscriberExists_NewOnesAdded() {
        CommentThread thread = createThreadWithPolicies("api_user");

        Mono<CommentThread> commentThreadMono = commentThreadRepository.save(thread).flatMap(savedThread ->
                commentThreadRepository.addToSubscribers(savedThread.getId(), Set.of("a", "b", "c", "d"))
                        .thenReturn(savedThread)
        ).flatMap(commentThread -> commentThreadRepository.findById(commentThread.getId()));

        StepVerifier.create(commentThreadMono).assertNext(commentThread -> {
            assertThat(commentThread.getSubscribers().size()).isEqualTo(4);
            assertThat(commentThread.getSubscribers()).contains("a", "b", "c", "d");
        }).verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void findPrivateThread_WhenNoneExists_ReturnsEmpty() {
        CommentThread thread = createThreadWithPolicies("api_user");
        thread.setApplicationId("sample-application-id-1");
        thread.setIsPrivate(true);

        Mono<CommentThread> privateThreadMono = commentThreadRepository.save(thread)
                .then(commentThreadRepository.findPrivateThread("sample-application-id-2"));

        StepVerifier.create(privateThreadMono).verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void findPrivateThread_WhenOneExists_ReturnsOne() {
        CommentThread thread1 = createThreadWithPolicies("api_user");
        thread1.setApplicationId("sample-application-id-1");
        thread1.setAuthorUsername("author1");
        thread1.setIsPrivate(false);

        CommentThread thread2 = createThreadWithPolicies("api_user2");
        thread2.setApplicationId("sample-application-id-1");
        thread2.setAuthorUsername("author2");
        thread2.setIsPrivate(true);

        CommentThread thread3 = createThreadWithPolicies("api_user");
        thread3.setApplicationId("sample-application-id-1");
        thread3.setAuthorUsername("author3");
        thread3.setIsPrivate(true);

        Mono<CommentThread> privateThreadMono = commentThreadRepository.saveAll(List.of(thread1, thread2, thread3))
                .then(commentThreadRepository.findPrivateThread("sample-application-id-1"));

        StepVerifier.create(privateThreadMono).assertNext(commentThread -> {
            assertThat(commentThread.getAuthorUsername()).isEqualTo("author3");
        }).verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void findThread_WhenFilterExists_ReturnsFilteredResults() {
        CommentThread.CommentThreadState resolvedState = new CommentThread.CommentThreadState();
        resolvedState.setActive(true);

        CommentThread.CommentThreadState unresolvedState = new CommentThread.CommentThreadState();
        unresolvedState.setActive(false);

        CommentThread app1ResolvedThread = createThreadWithPolicies("api_user");
        app1ResolvedThread.setApplicationId("sample-application-id-1");
        app1ResolvedThread.setAuthorUsername("app1ResolvedThread");
        app1ResolvedThread.setResolvedState(resolvedState);

        CommentThread app1UnResolvedThread = createThreadWithPolicies("api_user");
        app1UnResolvedThread.setApplicationId("sample-application-id-1");
        app1UnResolvedThread.setAuthorUsername("app1UnResolvedThread");
        app1UnResolvedThread.setResolvedState(unresolvedState);

        CommentThread app2UnResolvedThread = createThreadWithPolicies("api_user");
        app2UnResolvedThread.setApplicationId("sample-application-id-2");
        app2UnResolvedThread.setAuthorUsername("app2UnResolvedThread");
        app2UnResolvedThread.setResolvedState(unresolvedState);

        List<CommentThread> threadList = List.of(app1ResolvedThread, app1UnResolvedThread, app2UnResolvedThread);

        Mono<List<CommentThread>> listMono = commentThreadRepository
                .saveAll(threadList)
                .collectList()
                .flatMap(commentThreads -> {
                    CommentThreadFilterDTO filterDTO = new CommentThreadFilterDTO();
                    filterDTO.setApplicationId("sample-application-id-1");
                    filterDTO.setResolved(false);
                    return commentThreadRepository.find(filterDTO, AclPermission.READ_THREAD).collectList();
                });

        StepVerifier.create(listMono).assertNext(
                commentThreads -> {
                    assertThat(commentThreads.size()).isEqualTo(1);
                    assertThat(commentThreads.get(0).getAuthorUsername()).isEqualTo("app1UnResolvedThread");
                }
        ).verifyComplete();
    }

    private CommentThread createThreadToTestUnreadCountByResolvedState(
            String username, String applicationId, boolean isResolved, Boolean isRead) {
        CommentThread.CommentThreadState resolvedState = new CommentThread.CommentThreadState();
        resolvedState.setActive(isResolved);

        Set<String> viewedByUsers = new HashSet<>();
        if(isRead) {
            viewedByUsers.add(username);
        }

        CommentThread commentThread = createThreadWithPolicies(username);
        commentThread.setApplicationId(applicationId);
        commentThread.setResolvedState(resolvedState);
        commentThread.setViewedByUsers(viewedByUsers);
        return commentThread;
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void countUnreadThreads_WhenResolvedAndUnread_ResolvedNotCounted() {
        String testApplicationId = UUID.randomUUID().toString();
        CommentThread.CommentThreadState resolvedState = new CommentThread.CommentThreadState();
        resolvedState.setActive(true);

        CommentThread.CommentThreadState unresolvedState = new CommentThread.CommentThreadState();
        unresolvedState.setActive(false);

        CommentThread unresolvedUnread = createThreadToTestUnreadCountByResolvedState(
                "api_user", testApplicationId, false, false
        );
        CommentThread unresolvedRead = createThreadToTestUnreadCountByResolvedState(
                "api_user", testApplicationId, false, true
        );
        CommentThread resolvedUnread = createThreadToTestUnreadCountByResolvedState(
                "api_user", testApplicationId, true, false
        );

        List<CommentThread> threadList = List.of(unresolvedUnread, unresolvedRead, resolvedUnread);

        Mono<Long> unreadCountMono = commentThreadRepository
                .saveAll(threadList)
                .collectList()
                .flatMap(commentThreads -> {
                    CommentThreadFilterDTO filterDTO = new CommentThreadFilterDTO();
                    filterDTO.setApplicationId("sample-application-id-1");
                    filterDTO.setResolved(false);
                    return commentThreadRepository.countUnreadThreads(testApplicationId, "api_user");
                });

        StepVerifier.create(unreadCountMono).assertNext(
                unreadCount -> {
                    assertThat(unreadCount).isEqualTo(1);
                }
        ).verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void archiveByPageId_WhenCriteriaMatches_ThreadsDeleted() {
        String uniqueRandomString = UUID.randomUUID().toString();

        String pageOneId = "test-page1-"+uniqueRandomString, // we'll delete by this id
                pageTwoId = "test-page2-" + uniqueRandomString, // this page id will not be deleted
                applicationId = "test-app-" + uniqueRandomString; // same for all three so that we can fetch by application id

        // create few comment threads with pageId and permission that'll be deleted
        CommentThread threadOne = createThreadWithManagePermission("api_user", applicationId, pageOneId);
        CommentThread threadTwo = createThreadWithManagePermission("api_user", applicationId, pageOneId);

        // we'll not delete this
        CommentThread threadThree = createThreadWithManagePermission("api_user", applicationId, pageTwoId);

        List<CommentThread> threads = List.of(threadOne, threadTwo, threadThree);

        Mono<Map<String, Collection<CommentThread>>> pageIdThreadMono = commentThreadRepository.saveAll(threads)
                .collectList()
                .then(commentThreadRepository.archiveByPageId(pageOneId, CommentMode.EDIT))
                .thenMany(commentThreadRepository.findByApplicationId(applicationId, AclPermission.READ_THREAD))
                .collectMultimap(CommentThread::getPageId);

        StepVerifier.create(pageIdThreadMono)
                .assertNext(pageIdThreadMap -> {
                    // check that page one has no comment
                    assertThat(pageIdThreadMap.get(pageOneId)).isNull();
                    // check that page two has one comment
                    assertThat(pageIdThreadMap.get(pageTwoId).size()).isEqualTo(1);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void archiveByPageId_PermissionDoesNotMatch_ThreadsNotDeleted() {
        String uniqueRandomString = UUID.randomUUID().toString();
        String testPageId = "test-page-" + uniqueRandomString, // we'll delete by this id
                threadUser = "test_user_" + uniqueRandomString,
                applicationId = "test-app-" + uniqueRandomString;

        // create few comment threads with pageId and permission that'll be deleted
        CommentThread thread = createThreadWithManagePermission(threadUser, applicationId, testPageId);

        // add policy so that the current user can read the thread but can not manage
        Policy policyForCurrentUser = policyUtils.generatePolicyFromPermission(
                Set.of(AclPermission.READ_THREAD), "api_user"
        ).get(AclPermission.READ_THREAD.getValue());

        thread.getPolicies().add(policyForCurrentUser);

        Mono<Map<String, Collection<CommentThread>>> pageIdThreadMono = commentThreadRepository.save(thread)
                .then(commentThreadRepository.archiveByPageId(testPageId, CommentMode.EDIT))
                .thenMany(commentThreadRepository.findByApplicationId(applicationId, AclPermission.READ_THREAD))
                .collectMultimap(CommentThread::getPageId);

        StepVerifier.create(pageIdThreadMono)
                .assertNext(pageIdThreadMap -> {
                    // current user has no manage permission on this thread so threads will not be deleted
                    assertThat(pageIdThreadMap.get(testPageId).size()).isEqualTo(1);
                })
                .verifyComplete();
    }
}
