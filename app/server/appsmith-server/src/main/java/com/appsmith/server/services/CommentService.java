package com.appsmith.server.services;

import com.appsmith.server.domains.Comment;
import reactor.core.publisher.Mono;

public interface CommentService extends CrudService<Comment, String> {

    Mono<Comment> create(Comment organization);

}
