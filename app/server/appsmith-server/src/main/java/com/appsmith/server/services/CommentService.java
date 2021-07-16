package com.appsmith.server.services;

import com.appsmith.server.domains.Comment;
import com.appsmith.server.domains.CommentThread;
import reactor.core.publisher.Mono;

import java.util.List;

public interface CommentService extends CrudService<Comment, String> {

    Mono<Comment> create(String threadId, Comment organization, String originHeader);

    Mono<CommentThread> createThread(CommentThread commentThread, String originHeader);

    Mono<CommentThread> updateThread(String threadId, CommentThread commentThread, String originHeader);

    Mono<List<CommentThread>> getThreadsByApplicationId(String applicationId);

    Mono<Comment> deleteComment(String id);

    Mono<CommentThread> deleteThread(String threadId);

    Mono<Boolean> createReaction(String commentId, Comment.Reaction reaction);

    Mono<Boolean> deleteReaction(String commentId, Comment.Reaction reaction);

    Mono<Long> getUnreadCount(String applicationId);
}
