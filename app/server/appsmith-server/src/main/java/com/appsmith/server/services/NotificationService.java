package com.appsmith.server.services;

import com.appsmith.server.domains.Comment;
import com.appsmith.server.domains.CommentThread;
import com.appsmith.server.domains.Notification;
import com.appsmith.server.dtos.UpdateIsReadNotificationByIdDTO;
import com.appsmith.server.dtos.UpdateIsReadNotificationDTO;
import com.appsmith.server.events.CommentNotificationEvent;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface NotificationService extends CrudService<Notification, String> {
    Mono<Notification> createNotification(Comment comment, CommentNotificationEvent event, String forUsername);
    Flux<Notification> createNotification(CommentThread commentThread, CommentNotificationEvent event, String authorUserName);
    Mono<UpdateIsReadNotificationByIdDTO> updateIsRead(UpdateIsReadNotificationByIdDTO dto);
    Mono<UpdateIsReadNotificationDTO> updateIsRead(UpdateIsReadNotificationDTO dto);
    Mono<Long> getUnreadCount();
}
