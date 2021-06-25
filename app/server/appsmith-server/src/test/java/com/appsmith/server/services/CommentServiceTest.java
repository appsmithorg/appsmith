package com.appsmith.server.services;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Comment;
import com.appsmith.server.domains.CommentThread;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.repositories.CommentRepository;
import com.appsmith.server.repositories.CommentThreadRepository;
import lombok.extern.slf4j.Slf4j;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.function.Tuple2;

import java.util.Collections;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

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

    @Test
    @WithUserDetails(value = "api_user")
    public void setup() {
        final Mono<Tuple2<CommentThread, List<CommentThread>>> resultMono = applicationService
                .findByName("TestApplications", AclPermission.READ_APPLICATIONS)
                .flatMap(application -> {
                    final CommentThread thread = new CommentThread();
                    thread.setApplicationId(application.getId());
                    thread.setComments(List.of(
                            makePlainTextComment("comment one")
                    ));
                    return commentService.createThread(thread, "https://app.appsmith.com");
                })
                .zipWhen(thread -> commentService.getThreadsByApplicationId(thread.getApplicationId()));

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
                    assertThat(thread.getComments()).hasSize(1);
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
        // first thread which is read by api_user
        CommentThread c1 = new CommentThread();
        c1.setApplicationId("test-application-1");
        c1.setViewedByUsers(Set.of("api_user", "user2"));

        // second thread which is not read by api_user
        CommentThread c2 = new CommentThread();
        c2.setApplicationId("test-application-1");
        c2.setViewedByUsers(Set.of("user2"));

        // third thread which is read by api_user but in another application
        CommentThread c3 = new CommentThread();
        c3.setApplicationId("test-application-2");
        c3.setViewedByUsers(Set.of("user2", "api_user"));

        Mono<Long> unreadCountMono = commentThreadRepository
                .saveAll(List.of(c1, c2, c3)) // save all the threads
                .collectList()
                .then(commentService.getUnreadCount("test-application-1")); // count unread in first app

        StepVerifier.create(unreadCountMono).assertNext(aLong -> {
            assertThat(aLong).isEqualTo(1);
        }).verifyComplete();
    }

}
