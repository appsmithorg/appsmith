package com.appsmith.server.services.ce;

import com.appsmith.server.domains.Notification;
import com.appsmith.server.dtos.UpdateIsReadNotificationByIdDTO;
import com.appsmith.server.dtos.UpdateIsReadNotificationDTO;
import com.appsmith.server.services.CrudService;
import reactor.core.publisher.Mono;

public interface NotificationServiceCE extends CrudService<Notification, String> {

    Mono<UpdateIsReadNotificationByIdDTO> updateIsRead(UpdateIsReadNotificationByIdDTO dto);

    Mono<UpdateIsReadNotificationDTO> updateIsRead(UpdateIsReadNotificationDTO dto);

    Mono<Long> getUnreadCount();
}
