package com.appsmith.server.repositories;

import com.appsmith.server.domains.Comment;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

import java.util.List;

@Repository
public interface CommentRepository extends BaseRepository<Comment, String>, CustomCommentRepository {

    Flux<Comment> findByThreadIdInOrderByCreatedAt(List<String> threadIds);

}
