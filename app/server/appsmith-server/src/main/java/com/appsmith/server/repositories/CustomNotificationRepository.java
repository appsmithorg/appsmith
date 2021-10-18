package com.appsmith.server.repositories;

import com.appsmith.server.domains.Notification;
import com.mongodb.client.result.UpdateResult;
import reactor.core.publisher.Mono;

import java.util.List;

public interface CustomNotificationRepository extends AppsmithRepository<Notification> {
    Mono<UpdateResult> updateIsReadByForUsernameAndIdList(String forUsername, List<String> idList, boolean isRead);
    Mono<UpdateResult> updateIsReadByForUsername(String forUsername, boolean isRead);
    Mono<Void> updateCommentAuthorNames(String authorId, String authorName);
}
