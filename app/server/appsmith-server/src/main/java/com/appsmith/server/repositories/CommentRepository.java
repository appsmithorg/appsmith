package com.appsmith.server.repositories;

import com.appsmith.server.domains.Comment;
import org.springframework.stereotype.Repository;

@Repository
public interface CommentRepository extends BaseRepository<Comment, String>, CustomCommentRepository {

}
