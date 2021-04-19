package com.appsmith.server.services;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Comment;
import com.appsmith.server.domains.CommentThread;
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
    ApplicationService applicationService;

    @Test
    @WithUserDetails(value = "api_user")
    public void setup() {
        final Mono<CommentThread> resultMono = applicationService
                .findByName("TestApplications", AclPermission.READ_APPLICATIONS)
                .flatMap(application -> {
                    final CommentThread thread = new CommentThread();
                    thread.setApplicationId(application.getId());
                    thread.setComments(List.of(
                            makePlainTextComment("comment one")
                    ));
                    return commentService.createThread(thread);
                });

        StepVerifier.create(resultMono)
                .assertNext(thread -> {
                    assertThat(thread.getId()).isNotEmpty();
                    assertThat(thread.getResolved()).isNull();
                    assertThat(thread.getPolicies()).containsExactlyInAnyOrder(
                            Policy.builder().permission(AclPermission.READ_THREAD.getValue()).users(Set.of("api_user")).groups(Collections.emptySet()).build(),
                            Policy.builder().permission(AclPermission.MANAGE_THREAD.getValue()).users(Set.of("api_user")).groups(Collections.emptySet()).build(),
                            Policy.builder().permission(AclPermission.COMMENT_ON_THREAD.getValue()).users(Set.of("api_user")).groups(Collections.emptySet()).build()
                    );
                    assertThat(thread.getComments()).hasSize(1);
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

    @Test
    @WithUserDetails(value = "api_user")
    public void deleteValidComment() {
        final Mono<Comment> beforeDeletion = applicationService
                .findByName("TestApplications", AclPermission.READ_APPLICATIONS)
                .flatMap(application -> {
                    final CommentThread thread = new CommentThread();
                    thread.setApplicationId(application.getId());
                    thread.setComments(List.of(
                            makePlainTextComment("Test Comment")
                    ));
                    return commentService.createThread(thread);
                })
                .flatMap(commentThread -> Mono.just(commentThread.getComments().get(0)));

        Mono<Comment> afterDeletion = beforeDeletion
                .flatMap(comment -> commentService.deleteComment(comment.getId()));

        StepVerifier
                .create(Mono.zip(beforeDeletion, afterDeletion))
                .assertNext(object -> {
                    assertThat(object.getT1().isDeleted()).isFalse();
                    assertThat(object.getT2().isDeleted()).isTrue();
                })
                .verifyComplete();
    }
}
