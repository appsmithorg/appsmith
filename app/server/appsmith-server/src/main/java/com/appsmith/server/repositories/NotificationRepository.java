package com.appsmith.server.repositories;

import com.appsmith.server.domains.Notification;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;

@Repository
public interface NotificationRepository extends BaseRepository<Notification, String>, CustomNotificationRepository {
    Flux<Notification> findByForUsername(String userId, Pageable pageable);
    Flux<Notification> findByForUsernameAndCreatedAtBefore(String userId, Instant instant, Pageable pageable);
    Mono<Long> countByForUsername(String userId);
    Mono<Long> countByForUsernameAndIsReadIsFalse(String userId);
}
