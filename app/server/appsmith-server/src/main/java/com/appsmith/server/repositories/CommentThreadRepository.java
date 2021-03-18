package com.appsmith.server.repositories;

import com.appsmith.server.domains.CommentThread;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

@Repository
public interface CommentThreadRepository extends BaseRepository<CommentThread, String>, CustomCommentThreadRepository {

    public Flux<CommentThread> findByApplicationId(String applicationId);

}
