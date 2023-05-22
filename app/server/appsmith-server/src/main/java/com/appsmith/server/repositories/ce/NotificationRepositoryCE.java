/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Notification;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomNotificationRepository;
import java.time.Instant;
import org.springframework.data.domain.Pageable;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface NotificationRepositoryCE
	extends BaseRepository<Notification, String>, CustomNotificationRepository {

Flux<Notification> findByForUsernameAndCreatedAtBefore(
	String userId, Instant instant, Pageable pageable);

Mono<Long> countByForUsername(String userId);

Mono<Long> countByForUsernameAndIsReadIsFalse(String userId);
}
