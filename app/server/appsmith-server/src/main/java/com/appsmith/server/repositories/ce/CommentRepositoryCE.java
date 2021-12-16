package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Comment;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomCommentRepository;
import reactor.core.publisher.Flux;

import java.util.List;

public interface CommentRepositoryCE extends BaseRepository<Comment, String>, CustomCommentRepository {

    Flux<Comment> findByThreadIdInOrderByCreatedAt(List<String> threadIds);

}
