package com.appsmith.server.services;

import com.appsmith.server.domains.Comment;
import com.appsmith.server.domains.CommentThread;
import com.appsmith.server.domains.Notification;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.UpdateIsReadNotificationByIdDTO;
import com.appsmith.server.dtos.UpdateIsReadNotificationDTO;
import reactor.core.publisher.Mono;

public interface NotificationService extends CrudService<Notification, String> {
    Mono<Notification> createNotification(Comment comment, String forUsername);
    Mono<Notification> createNotification(CommentThread commentThread, String forUsername, User authorUser);
    Mono<UpdateIsReadNotificationByIdDTO> updateIsRead(UpdateIsReadNotificationByIdDTO dto);
    Mono<UpdateIsReadNotificationDTO> updateIsRead(UpdateIsReadNotificationDTO dto);
    Mono<Long> getUnreadCount();
}
