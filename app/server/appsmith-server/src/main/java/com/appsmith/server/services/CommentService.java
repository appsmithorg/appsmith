package com.appsmith.server.services;

import com.appsmith.server.domains.Comment;
import com.appsmith.server.domains.CommentThread;
import reactor.core.publisher.Mono;

public interface CommentService extends CrudService<Comment, String> {

    Mono<Comment> create(Comment organization);

    Mono<CommentThread> createThread(CommentThread commentThread);
}
