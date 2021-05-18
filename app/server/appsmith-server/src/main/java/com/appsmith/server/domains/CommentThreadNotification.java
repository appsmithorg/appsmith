package com.appsmith.server.domains;

import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@EqualsAndHashCode(callSuper = true)
@Document
public class CommentThreadNotification extends Notification {

    CommentThread commentThread;

}
