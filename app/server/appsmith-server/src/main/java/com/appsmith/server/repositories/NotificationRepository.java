package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.NotificationRepositoryCE;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepository extends NotificationRepositoryCE, CustomNotificationRepository {

}
