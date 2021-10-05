package com.appsmith.server.domains;

import com.appsmith.server.events.CommentNotificationEvent;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@EqualsAndHashCode(callSuper = true)
@Document
public class CommentNotification extends Notification {
    CommentNotificationEvent event;
    Comment comment;
}
