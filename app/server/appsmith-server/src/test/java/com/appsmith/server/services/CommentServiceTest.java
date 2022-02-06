package com.appsmith.server.services;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.AppsmithRole;
import com.appsmith.server.constants.CommentOnboardingState;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Comment;
import com.appsmith.server.domains.CommentThread;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.domains.UserRole;
import com.appsmith.server.dtos.ApplicationAccessDTO;
import com.appsmith.server.dtos.CommentThreadFilterDTO;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.repositories.CommentRepository;
import com.appsmith.server.repositories.CommentThreadRepository;
import com.appsmith.server.repositories.NotificationRepository;
import com.appsmith.server.repositories.UserDataRepository;
import com.appsmith.server.solutions.EmailEventHandler;
import com.mongodb.client.result.UpdateResult;
import com.segment.analytics.Analytics;
import lombok.extern.slf4j.Slf4j;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.function.Tuple2;

import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;

@RunWith(SpringRunner.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class CommentServiceTest {

    @Autowired
    CommentService commentService;

    @Autowired
    CommentRepository commentRepository;

    @Autowired
    CommentThreadRepository commentThreadRepository;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    OrganizationService organizationService;

    @Autowired
    PolicyUtils policyUtils;

    @Autowired
    UserService userService;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserOrganizationService userOrganizationService;

    @MockBean
    private Analytics analytics;

    @MockBean
    private EmailEventHandler emailEventHandler;

    @MockBean
    private UserDataRepository userDataRepository;

    @Before
    public void setUp() {
        Mockito.doNothing().when(analytics).enqueue(any());
        Mockito.doNothing().when(analytics).flush();

        Mockito.when(emailEventHandler.publish(any(), any(), any(), any(), any())).thenReturn(Mono.just(Boolean.TRUE));
        Mockito.when(emailEventHandler.publish(any(), any(), any(), any())).thenReturn(Mono.just(Boolean.TRUE));

        UserData userData = new UserData();
        Mockito.when(userDataRepository.findByUserId(any(String.class))).thenReturn(Mono.just(userData));
        Mockito.when(userDataRepository.save(any(UserData.class))).thenReturn(Mono.just(userData));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void setup() {
        String randomId = UUID.randomUUID().toString();
        Organization organization = new Organization();
        organization.setName(randomId + "-test-org");

        final Mono<Tuple2<CommentThread, List<CommentThread>>> resultMono = organizationService
                .create(organization).flatMap(organization1 -> {
                    Application application = new Application();
                    application.setName(randomId + "-test-app");
                    application.setOrganizationId(organization1.getId());
                    return applicationPageService.createApplication(application);
                })
                .flatMap(application -> {
                    final CommentThread thread = new CommentThread();
                    thread.setApplicationId(application.getId());
                    thread.setComments(List.of(
                            makePlainTextComment("comment one")
                    ));
                    return commentService.createThread(thread, "https://app.appsmith.com");
                })
                .zipWhen(thread -> {
                    CommentThreadFilterDTO filterDTO = new CommentThreadFilterDTO();
                    filterDTO.setApplicationId(thread.getApplicationId());
                    return commentService.getThreadsByApplicationId(filterDTO);
                });

        StepVerifier.create(resultMono)
                .assertNext(tuple -> {
                    final CommentThread thread = tuple.getT1();
                    final List<CommentThread> threadsInApp = tuple.getT2();

                    assertThat(thread.getId()).isNotEmpty();
                    //assertThat(thread.getResolved()).isNull();
                    assertThat(thread.getPolicies()).containsExactlyInAnyOrder(
                            Policy.builder().permission(AclPermission.READ_THREAD.getValue()).users(Set.of("api_user")).groups(Collections.emptySet()).build(),
                            Policy.builder().permission(AclPermission.MANAGE_THREAD.getValue()).users(Set.of("api_user")).groups(Collections.emptySet()).build(),
                            Policy.builder().permission(AclPermission.COMMENT_ON_THREAD.getValue()).users(Set.of("api_user")).groups(Collections.emptySet()).build()
                    );
                    assertThat(thread.getComments()).hasSize(2);  // one comment is from bot
                    assertThat(thread.getComments().get(0).getBody()).isEqualTo(makePlainTextComment("comment one").getBody());
                    assertThat(thread.getComments().get(0).getPolicies()).containsExactlyInAnyOrder(
                            Policy.builder().permission(AclPermission.MANAGE_COMMENT.getValue()).users(Set.of("api_user")).groups(Collections.emptySet()).build(),
                            Policy.builder().permission(AclPermission.READ_COMMENT.getValue()).users(Set.of("api_user")).groups(Collections.emptySet()).build()
                    );

                    assertThat(threadsInApp).hasSize(1);
                })
                .verifyComplete();
    }

    private Comment makePlainTextComment(String content) {
        final Comment comment = new Comment();

        Comment.Body body = new Comment.Body();
        comment.setBody(body);

        Comment.Block block = new Comment.Block();
        body.setBlocks(List.of(block));

        block.setKey("key1");
        block.setText(content);
        block.setType("unstyled");
        block.setDepth(0);

        return comment;
    }

    private Comment.Reaction makeReaction(String emoji) {
        Comment.Reaction reaction = new Comment.Reaction();
        reaction.setEmoji(emoji);
        return reaction;
    }

    private void mentionUser(Comment comment, String username) {
        Comment.EntityData.Mention mention = new Comment.EntityData.Mention();
        mention.setName(username);

        Comment.EntityData entityData = new Comment.EntityData();
        entityData.setMention(mention);

        Comment.Entity commentEntity = new Comment.Entity();
        commentEntity.setType("mention");
        commentEntity.setData(entityData);

        Map<String, Comment.Entity> entityMap = comment.getBody().getEntityMap();
        if(entityMap == null) {
            entityMap = new HashMap<>();
        }
        String mentionMapKey = (entityMap.keySet().size() + 1) + "";

        entityMap.put(mentionMapKey, commentEntity);
        comment.getBody().setEntityMap(entityMap);
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void deleteValidComment() {
        Organization organization = new Organization();
        organization.setName("CommentDeleteTestOrg");
        Mono<Comment> beforeDeletionMono = organizationService
                .create(organization)
                .flatMap(org -> {
                    Application testApplication = new Application();
                    testApplication.setName("CommentDeleteApp");
                    return applicationPageService
                        .createApplication(testApplication, org.getId());
                })
                .flatMap(application -> {
                    final CommentThread thread = new CommentThread();
                    thread.setApplicationId(application.getId());
                    thread.setComments(List.of(
                            makePlainTextComment("Test Comment")
                    ));
                    return commentService.createThread(thread, "https://app.appsmith.com");
                })
                .flatMap(commentThread -> Mono.just(commentThread.getComments().get(0)))
                .cache();

        Mono<Comment> afterDeletionMono = beforeDeletionMono
                .flatMap(comment -> commentService.deleteComment(comment.getId()));

        StepVerifier
                .create(Mono.zip(beforeDeletionMono, afterDeletionMono))
                .assertNext(object -> {
                    assertThat(object.getT1().isDeleted()).isFalse();
                    assertThat(object.getT2().isDeleted()).isTrue();
                    assertThat(object.getT1().getId()).isEqualTo(object.getT2().getId());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testAddReaction() {
        Organization organization = new Organization();
        organization.setName("ReactionsOrg");
        Mono<Comment> reactionMono = organizationService
                .create(organization)
                .flatMap(org -> {
                    Application testApplication = new Application();
                    testApplication.setName("ReactionApp");
                    return applicationPageService
                            .createApplication(testApplication, org.getId());
                })
                .flatMap(application -> {
                    final CommentThread thread = new CommentThread();
                    thread.setApplicationId(application.getId());
                    thread.setComments(List.of(makePlainTextComment("Test Comment")));
                    return commentService.createThread(thread, "https://app.appsmith.com");
                })
                .flatMap(commentThread -> Mono.just(commentThread.getComments().get(0)))
                .flatMap(comment -> {
                    assert comment.getId() != null;
                    return commentService
                            .createReaction(comment.getId(), makeReaction("x"))
                            .then(commentRepository.findById(comment.getId()));
                })
                .cache();

        StepVerifier
                .create(reactionMono)
                .assertNext(comment -> {
                    assertThat(comment.getReactions()).hasSize(1);
                    Comment.Reaction r1 = comment.getReactions().get(0);
                    assertThat(r1.getEmoji()).isEqualTo("x");
                    assertThat(r1.getByName()).isEqualTo("api_user");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testAddAndRemoveReaction() {
        Organization organization = new Organization();
        organization.setName("ReactionsOrg");
        Mono<Comment> reactionMono = organizationService
                .create(organization)
                .flatMap(org -> {
                    Application testApplication = new Application();
                    testApplication.setName("ReactionApp");
                    return applicationPageService
                            .createApplication(testApplication, org.getId());
                })
                .flatMap(application -> {
                    final CommentThread thread = new CommentThread();
                    thread.setApplicationId(application.getId());
                    thread.setComments(List.of(makePlainTextComment("Test Comment")));
                    return commentService.createThread(thread, "https://app.appsmith.com");
                })
                .flatMap(commentThread -> Mono.just(commentThread.getComments().get(0)))
                .flatMap(comment -> {
                    assert comment.getId() != null;
                    return Mono.when(
                            commentService.createReaction(comment.getId(), makeReaction("x")),
                            commentService.createReaction(comment.getId(), makeReaction("y"))
                    )
                            .then(commentService.deleteReaction(comment.getId(), makeReaction("x")))
                            .then(commentRepository.findById(comment.getId()));
                })
                .cache();

        StepVerifier
                .create(reactionMono)
                .assertNext(comment -> {
                    assertThat(comment.getReactions()).hasSize(1);
                    Comment.Reaction r1 = comment.getReactions().get(0);
                    assertThat(r1.getEmoji()).isEqualTo("y");
                    assertThat(r1.getByName()).isEqualTo("api_user");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getUnreadCount() {
        User user = new User();
        user.setEmail("api_user");
        Map<String, Policy> stringPolicyMap = policyUtils.generatePolicyFromPermission(
                Set.of(AclPermission.READ_THREAD),
                user
        );
        Set<Policy> policies = Set.copyOf(stringPolicyMap.values());

        CommentThread.CommentThreadState resolvedState = new CommentThread.CommentThreadState();
        resolvedState.setActive(false);

        // first thread which is read by api_user
        CommentThread c1 = new CommentThread();
        c1.setApplicationId("test-application-1");
        c1.setViewedByUsers(Set.of("api_user", "user2"));
        c1.setPolicies(policies);
        c1.setResolvedState(resolvedState);

        // second thread which is not read by api_user
        CommentThread c2 = new CommentThread();
        c2.setApplicationId("test-application-1");
        c2.setViewedByUsers(Set.of("user2"));
        c2.setPolicies(policies);
        c2.setResolvedState(resolvedState);

        // third thread which is read by api_user but in another application
        CommentThread c3 = new CommentThread();
        c3.setApplicationId("test-application-2");
        c3.setViewedByUsers(Set.of("user2", "api_user"));
        c3.setPolicies(policies);
        c3.setResolvedState(resolvedState);

        Mono<Long> unreadCountMono = commentThreadRepository
                .saveAll(List.of(c1, c2, c3)) // save all the threads
                .collectList()
                .then(commentService.getUnreadCount("test-application-1", null)); // count unread in first app

        StepVerifier.create(unreadCountMono).assertNext(aLong -> {
            assertThat(aLong).isEqualTo(1);
        }).verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void create_WhenThreadIsResolvedAndAlreadyViewed_ThreadIsUnresolvedAndUnread() {
        // create a thread first with resolved=true
        Collection<Policy> threadPolicies = policyUtils.generatePolicyFromPermission(
                Set.of(AclPermission.COMMENT_ON_THREAD),
                "api_user"
        ).values();

        CommentThread commentThread = new CommentThread();
        CommentThread.CommentThreadState commentThreadState = new CommentThread.CommentThreadState();
        commentThreadState.setActive(true);
        commentThread.setResolvedState(commentThreadState);
        commentThread.setPolicies(Set.copyOf(threadPolicies));
        commentThread.setViewedByUsers(Set.of("api_user", "test_user"));

        Mono<CommentThread> commentThreadMono = commentThreadRepository.save(commentThread)
                .flatMap(savedThread -> {
                    Comment comment = makePlainTextComment("Test comment");
                    comment.setThreadId(savedThread.getId());
                    return commentService.create(savedThread.getId(), comment, null, null);
                })
                .flatMap(savedComment ->
                        commentThreadRepository.findById(savedComment.getThreadId())
                );

        StepVerifier.create(commentThreadMono).assertNext(thread -> {
            assertThat(thread.getResolvedState().getActive()).isFalse();
            assertThat(thread.getViewedByUsers().size()).isEqualTo(1);
            assertThat(thread.getViewedByUsers()).contains("api_user");
        }).verifyComplete();
    }

    private Mono<CommentThread> createAndFetchTestCommentThreadForBotTest(Set<AclPermission> applicationPermissions, Comment comment) {
        return userService.findByEmail("api_user")
                .flatMap(user -> {
                    // create an application
                    Application application = new Application();
                    Map<String, Policy> stringPolicyMap = policyUtils.generatePolicyFromPermission(
                            applicationPermissions, user
                    );
                    application.setPolicies(Set.copyOf(stringPolicyMap.values()));
                    application.setName(UUID.randomUUID().toString());
                    return applicationService.save(application);
                }).flatMap(application -> {
                    // create a thread
                    CommentThread commentThread = new CommentThread();
                    commentThread.setApplicationId(application.getId());

                    commentThread.setComments(List.of(comment));
                    return commentService.createThread(commentThread, null);
                }).flatMap(thread -> commentThreadRepository.findById(thread.getId())); // fetch the thread to check
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createThread_WhenFirstCommentFromUser_CreatesBotThreadAndComment() {
        Comment comment = makePlainTextComment("test comment here");
        Mono<CommentThread> commentThreadMono = createAndFetchTestCommentThreadForBotTest(
                Set.of(AclPermission.MANAGE_APPLICATIONS, AclPermission.COMMENT_ON_APPLICATIONS), comment
        );

        StepVerifier.create(commentThreadMono).assertNext(thread -> {
            assertThat(thread.getIsPrivate()).isTrue();
            assertThat(thread.getSequenceId()).isEqualTo("#0");
        }).verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createThread_WhenUserFinishedOnBoarding_CreatesBotThreadAndComment() {
        UserData userData = new UserData();
        userData.setCommentOnboardingState(CommentOnboardingState.ONBOARDED);
        Mockito.when(userDataRepository.findByUserId(any(String.class))).thenReturn(Mono.just(userData));

        Comment comment = makePlainTextComment("test comment here");
        Mono<CommentThread> commentThreadMono = createAndFetchTestCommentThreadForBotTest(
                Set.of(AclPermission.MANAGE_APPLICATIONS, AclPermission.COMMENT_ON_APPLICATIONS), comment
        );

        StepVerifier.create(commentThreadMono).assertNext(thread -> {
            assertThat(thread.getIsPrivate()).isTrue();
            assertThat(thread.getSequenceId()).isEqualTo("#0");
        }).verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createThread_WhenFirstCommentFromViewer_BotThreadNotCreated() {
        Comment comment = makePlainTextComment("test comment here");
        Mono<CommentThread> commentThreadMono = createAndFetchTestCommentThreadForBotTest(
                Set.of(AclPermission.READ_APPLICATIONS), comment
        );

        StepVerifier.create(commentThreadMono).assertNext(thread -> {
            assertThat(thread.getIsPrivate()).isNotEqualTo(Boolean.TRUE);
        }).verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createThread_WhenUserSkippedOnBoarding_BotThreadNotCreated() {
        UserData userData = new UserData();
        userData.setCommentOnboardingState(CommentOnboardingState.SKIPPED);
        Mockito.when(userDataRepository.findByUserId(any(String.class))).thenReturn(Mono.just(userData));

        Comment comment = makePlainTextComment("test comment here");
        Mono<CommentThread> commentThreadMono = createAndFetchTestCommentThreadForBotTest(
                Set.of(AclPermission.MANAGE_APPLICATIONS, AclPermission.COMMENT_ON_APPLICATIONS), comment
        );

        StepVerifier.create(commentThreadMono).assertNext(thread -> {
            assertThat(thread.getIsPrivate()).isNotEqualTo(Boolean.TRUE);
        }).verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createThread_WhenFirstTaggedCommentFromEditor_BotThreadNotCreated() {
        Comment comment = makePlainTextComment("test comment here");
        mentionUser(comment, "sample-user@example.com");
        Mono<CommentThread> commentThreadMono = createAndFetchTestCommentThreadForBotTest(
                Set.of(AclPermission.READ_APPLICATIONS), comment
        );

        StepVerifier.create(commentThreadMono).assertNext(thread -> {
            assertThat(thread.getIsPrivate()).isNotEqualTo(Boolean.TRUE);
        }).verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getThreadsByApplicationId_WhenThreadWithCommentExists_ReturnThreadWithComments() {
        // mock the user data so that bot comment is not created
        UserData userData = new UserData();
        userData.setCommentOnboardingState(CommentOnboardingState.COMMENTED);
        Mockito.when(userDataRepository.findByUserId(any(String.class))).thenReturn(Mono.just(userData));

        Organization organization = new Organization();
        organization.setName("GetThreadsTestOrg");

        Mono<List<CommentThread>> commentThreadListMono = organizationService
                .create(organization)
                .flatMap(org -> {
                    Application testApplication = new Application();
                    testApplication.setName("GetThreadsTestApplication");
                    return applicationPageService
                            .createApplication(testApplication, org.getId());
                })
                .flatMap(application -> {
                    final CommentThread thread = new CommentThread();
                    thread.setApplicationId(application.getId());
                    thread.setComments(List.of(
                            makePlainTextComment("Test Comment")
                    ));
                    return commentService.createThread(thread, "https://app.appsmith.com").thenReturn(application);
                })
                .flatMap(application -> {
                    CommentThreadFilterDTO commentThreadFilterDTO = new CommentThreadFilterDTO();
                    commentThreadFilterDTO.setApplicationId(application.getId());
                    return commentService.getThreadsByApplicationId(commentThreadFilterDTO);
                });

        StepVerifier
                .create(commentThreadListMono)
                .assertNext(commentThreadList -> {
                    assertThat(commentThreadList.size()).isEqualTo(1);
                    assertThat(commentThreadList.get(0).getComments().size()).isEqualTo(1);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createThread_WhenSomeoneTaggedInFirstComment_NotificationCreated() {
        // mock the user data so that bot comment is not created
        UserData userData = new UserData();
        userData.setCommentOnboardingState(CommentOnboardingState.COMMENTED);
        Mockito.when(userDataRepository.findByUserId(any(String.class))).thenReturn(Mono.just(userData));

        Organization organization = new Organization();
        organization.setName("CreateThreadTestOrg");

        String testUsernameForNotification = "test_username_for_notification";

        Mono<Long> notificationCount = organizationService
                .create(organization)
                .flatMap(org -> {
                    Application testApplication = new Application();
                    testApplication.setName("CreateThreadsTestApplication");
                    return applicationPageService
                            .createApplication(testApplication, org.getId());
                })
                .flatMap(application -> {
                    final CommentThread thread = new CommentThread();
                    thread.setApplicationId(application.getId());
                    Comment testComment = makePlainTextComment("Test Comment");
                    mentionUser(testComment, testUsernameForNotification);
                    thread.setComments(List.of(testComment));
                    return commentService.createThread(thread, "https://app.appsmith.com");
                })
                .flatMap(commentThread ->
                    notificationRepository.countByForUsername(testUsernameForNotification)
                );

        StepVerifier
                .create(notificationCount)
                .assertNext(aLong -> {
                    assertThat(aLong).isEqualTo(1);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void create_WhenUserHasProfilePhoto_PhotoIdIsSetToComment() {
        // mock the user data so that bot comment is not created
        UserData userData = new UserData();
        userData.setProfilePhotoAssetId("test-photo-id");
        Mockito.when(userDataRepository.findByUserId(any(String.class))).thenReturn(Mono.just(userData));

        // create a thread first with resolved=true
        Collection<Policy> threadPolicies = policyUtils.generatePolicyFromPermission(
                Set.of(AclPermission.COMMENT_ON_THREAD),
                "api_user"
        ).values();
        CommentThread commentThread = new CommentThread();
        commentThread.setPolicies(Set.copyOf(threadPolicies));

        Mono<Comment> commentMono = commentThreadRepository.save(commentThread)
                .flatMap(savedThread -> {
                    Comment comment = makePlainTextComment("Test comment");
                    comment.setThreadId(savedThread.getId());
                    return commentService.create(savedThread.getId(), comment, null, null);
                });

        StepVerifier.create(commentMono).assertNext(comment -> {
            assertThat(comment.getAuthorPhotoId()).isEqualTo("test-photo-id");
        }).verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createThread_WhenPublicAppAndOutsideUser_CommentIsCreated() {
        Mockito.when(
                userDataRepository.removeIdFromRecentlyUsedList(any(String.class), any(String.class), any(List.class))
        ).thenReturn(Mono.just(Mockito.mock(UpdateResult.class)));
        String randomId = UUID.randomUUID().toString();
        Organization organization = new Organization();
        organization.setName("Comment test " + randomId);

        Mono<CommentThread> commentThreadMono = organizationService.create(organization).flatMap(organization1 -> {
            Application application = new Application();
            application.setName("Comment test " + randomId);
            ApplicationAccessDTO applicationAccessDTO = new ApplicationAccessDTO();
            applicationAccessDTO.setPublicAccess(true);
            return applicationPageService.createApplication(application, organization1.getId()).flatMap(
                    createdApp -> applicationService.changeViewAccess(application.getId(), applicationAccessDTO)
            );
        }).flatMap(application -> {
            // add another admin to this org and remove api_user from this organization
            User user = new User();
            user.setEmail("some_other_user");
            user.setPassword("mypassword");

            UserRole userRole = new UserRole();
            userRole.setUsername(user.getUsername());
            userRole.setRoleName(AppsmithRole.ORGANIZATION_ADMIN.getName());
            userRole.setRole(AppsmithRole.ORGANIZATION_ADMIN);

            return userService.create(user)
                    .then(userOrganizationService.addUserRoleToOrganization(application.getOrganizationId(), userRole))
                    .then(userOrganizationService.leaveOrganization(application.getOrganizationId()))
                    .thenReturn(application);
        }).flatMap(application -> {
            String pageId = application.getPublishedPages().get(0).getId();
            // try to add a comment thread
            CommentThread commentThread = new CommentThread();
            commentThread.setApplicationId(application.getId());
            commentThread.setPageId(pageId);
            commentThread.setComments(List.of(makePlainTextComment("my test comment")));
            return commentService.createThread(commentThread, null, null);
        });

        StepVerifier.create(commentThreadMono)
                .assertNext(commentThread -> {
                    assertThat(commentThread.getId()).isNotEmpty();
                })
                .verifyComplete();
    }
}
