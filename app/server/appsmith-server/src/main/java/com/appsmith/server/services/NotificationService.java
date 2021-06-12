package com.appsmith.server.services;

import com.appsmith.server.domains.Comment;
import com.appsmith.server.domains.CommentThread;
import com.appsmith.server.domains.Notification;
import com.appsmith.server.dtos.NotificationsResponseDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.dtos.UpdateIsReadNotificationByIdDTO;
import com.appsmith.server.dtos.UpdateIsReadNotificationDTO;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;

public interface NotificationService extends CrudService<Notification, String> {
    Mono<NotificationsResponseDTO> getAll(MultiValueMap<String, String> params);
    Mono<Notification> createNotification(Comment comment, String forUsername);
    Mono<Notification> createNotification(CommentThread commentThread, String forUsername);
    Mono<ResponseDTO<UpdateIsReadNotificationByIdDTO>> updateIsRead(UpdateIsReadNotificationByIdDTO dto);
    Mono<ResponseDTO<UpdateIsReadNotificationDTO>> updateIsRead(UpdateIsReadNotificationDTO dto);
}
