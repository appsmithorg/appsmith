package com.appsmith.server.repositories;

import com.appsmith.server.domains.Notification;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

@Repository
public interface NotificationRepository extends BaseRepository<Notification, String>, CustomNotificationRepository {

    Flux<Notification> findByForUsername(String userId);

}
