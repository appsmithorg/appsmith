package com.appsmith.server.repositories;

import com.appsmith.server.domains.CommentThread;
import org.springframework.stereotype.Repository;

@Repository
public interface CommentThreadRepository extends BaseRepository<CommentThread, String>, CustomCommentThreadRepository {

}
