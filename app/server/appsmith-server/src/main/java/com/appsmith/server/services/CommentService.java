package com.appsmith.server.services;

import com.appsmith.server.domains.Comment;
import com.appsmith.server.domains.CommentThread;
import reactor.core.publisher.Mono;

import java.util.List;

public interface CommentService extends CrudService<Comment, String> {

    Mono<Comment> create(String threadId, Comment organization);

    Mono<CommentThread> createThread(CommentThread commentThread);

    Mono<CommentThread> updateThread(String threadId, CommentThread commentThread);

    Mono<List<CommentThread>> getThreadsByApplicationId(String applicationId);

    Mono<Comment> deleteComment(String id);

    Mono<CommentThread> deleteThread(String threadId);

}
