package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.CommentThread;
import com.appsmith.server.dtos.CommentThreadFilterDTO;
import com.mongodb.client.result.UpdateResult;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Set;

public interface CustomCommentThreadRepository extends AppsmithRepository<CommentThread> {
    Flux<CommentThread> findByApplicationId(String applicationId, AclPermission permission);
    Flux<CommentThread> find(CommentThreadFilterDTO commentThreadFilterDTO, AclPermission permission);
    Mono<UpdateResult> addToSubscribers(String threadId, Set<String> usernames);
    Mono<UpdateResult> removeSubscriber(String threadId, String username);
    Mono<CommentThread> findPrivateThread(String applicationId);
    Mono<Long> countUnreadThreads(String applicationId, String userEmail);
    Mono<UpdateResult> archiveByPageId(String pageId);
}
