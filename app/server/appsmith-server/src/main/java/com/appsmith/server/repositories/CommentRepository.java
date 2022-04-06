package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CommentRepositoryCE;
import org.springframework.stereotype.Repository;

@Repository
public interface CommentRepository extends CommentRepositoryCE, CustomCommentRepository {

}
