package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
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

    // TODO: Can we infer this from the widget/entity this comment is connected to?
    String applicationId;

    // These comments are saved in a separate collection and loaded by the APIs separately.
    @Transient
    List<Comment> comments;

    @Data
    public static class Position {
        Float top;
        Float left;
    }

}
