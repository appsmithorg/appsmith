package com.appsmith.server.repositories;

import com.appsmith.server.domains.CommentThread;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface CommentThreadRepository extends BaseRepository<CommentThread, String>, CustomCommentThreadRepository {
    Mono<Long> countByApplicationIdAndViewedByUsersNot(String applicationId, String username);
}
