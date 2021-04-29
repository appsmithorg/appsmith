package com.appsmith.server.domains;

import lombok.Data;
import org.springframework.data.mongodb.core.mapping.Document;

@Document
@Data
public class CommentNotification extends Notification {

    Comment comment;

}
