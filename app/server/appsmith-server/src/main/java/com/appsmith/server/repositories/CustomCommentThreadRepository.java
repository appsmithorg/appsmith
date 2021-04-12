package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.CommentThread;
import reactor.core.publisher.Flux;

public interface CustomCommentThreadRepository extends AppsmithRepository<CommentThread> {

    Flux<CommentThread> findByApplicationId(String applicationId, AclPermission permission);

}
