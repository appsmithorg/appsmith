package com.appsmith.server.services.ce;

import com.appsmith.server.domains.Comment;
import com.appsmith.server.domains.CommentThread;
import com.appsmith.server.domains.Notification;
import com.appsmith.server.dtos.UpdateIsReadNotificationByIdDTO;
import com.appsmith.server.dtos.UpdateIsReadNotificationDTO;
import com.appsmith.server.events.CommentNotificationEvent;
import com.appsmith.server.services.CrudService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface NotificationServiceCE extends CrudService<Notification, String> {

    Mono<Notification> createNotification(Comment comment, CommentNotificationEvent event, String forUsername);

    Flux<Notification> createNotification(CommentThread commentThread, CommentNotificationEvent event, String authorUserName);

    Mono<UpdateIsReadNotificationByIdDTO> updateIsRead(UpdateIsReadNotificationByIdDTO dto);

    Mono<UpdateIsReadNotificationDTO> updateIsRead(UpdateIsReadNotificationDTO dto);

    Mono<Long> getUnreadCount();
}
