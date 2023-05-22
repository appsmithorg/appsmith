/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Notification;
import com.appsmith.server.repositories.AppsmithRepository;
import com.mongodb.client.result.UpdateResult;
import java.util.List;
import reactor.core.publisher.Mono;

public interface CustomNotificationRepositoryCE extends AppsmithRepository<Notification> {
Mono<UpdateResult> updateIsReadByForUsernameAndIdList(
	String forUsername, List<String> idList, boolean isRead);

Mono<UpdateResult> updateIsReadByForUsername(String forUsername, boolean isRead);
}
