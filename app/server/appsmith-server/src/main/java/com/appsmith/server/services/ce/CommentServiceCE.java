package com.appsmith.server.services.ce;

import com.appsmith.server.domains.Comment;
import com.appsmith.server.domains.CommentThread;
import com.appsmith.server.dtos.CommentThreadFilterDTO;
import com.appsmith.server.services.CrudService;
import reactor.core.publisher.Mono;

import java.util.List;

public interface CommentServiceCE extends CrudService<Comment, String> {

    Mono<Comment> create(String threadId, Comment comment, String originHeader, String branchName);

    Mono<CommentThread> createThread(CommentThread commentThread, String originHeader);

    Mono<CommentThread> createThread(CommentThread commentThread, String originHeader, String branchName);

    Mono<CommentThread> updateThread(String threadId, CommentThread commentThread, String originHeader);

    Mono<List<CommentThread>> getThreadsByApplicationId(CommentThreadFilterDTO commentThreadFilterDTO);

    Mono<List<CommentThread>> getThreadsByApplicationId(CommentThreadFilterDTO commentThreadFilterDTO, String branchName);

    Mono<Comment> deleteComment(String id);

    Mono<CommentThread> deleteThread(String threadId);

    Mono<Boolean> createReaction(String commentId, Comment.Reaction reaction);

    Mono<Boolean> deleteReaction(String commentId, Comment.Reaction reaction);

    Mono<Boolean> unsubscribeThread(String threadId);

    Mono<Long> getUnreadCount(String applicationId, String branchName);

}
