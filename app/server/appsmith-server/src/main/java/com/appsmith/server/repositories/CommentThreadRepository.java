package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CommentThreadRepositoryCE;
import org.springframework.stereotype.Repository;

@Repository
public interface CommentThreadRepository extends CommentThreadRepositoryCE, CustomCommentThreadRepository {

}
