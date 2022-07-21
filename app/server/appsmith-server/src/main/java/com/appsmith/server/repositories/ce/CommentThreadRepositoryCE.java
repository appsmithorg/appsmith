package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.CommentThread;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomCommentThreadRepository;

public interface CommentThreadRepositoryCE extends BaseRepository<CommentThread, String>, CustomCommentThreadRepository {

}
