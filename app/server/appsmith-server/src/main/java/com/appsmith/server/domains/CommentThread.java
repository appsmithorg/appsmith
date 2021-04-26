package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;

import com.appsmith.external.models.CommentThreadAction;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Data
@EqualsAndHashCode(callSuper = false)
@Document
public class CommentThread extends BaseDomain {

    String tabId;

    Position position;

    String refId;

//    Boolean resolved;
    Actions threadActions;

    String applicationId;

    // These comments are saved in a separate collection and loaded by the APIs separately.
    @Transient
    List<Comment> comments;

    @Data
    public static class Position {
        Float top;
        Float left;
    }

    @Data
    public static class Actions {
        CommentThreadAction pin;
        CommentThreadAction resolve;
    }

}
