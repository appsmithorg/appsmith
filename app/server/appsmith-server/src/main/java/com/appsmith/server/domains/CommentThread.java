package com.appsmith.server.domains;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;
import java.util.Set;

import static com.appsmith.server.helpers.DateUtils.ISO_FORMATTER;

@Data
@EqualsAndHashCode(callSuper = false)
@Document
public class CommentThread extends AbstractCommentDomain {

    Boolean isPrivate;

    String tabId;

    Position position;

    String refId;

    String widgetType;

    CommentThreadState pinnedState;

    CommentThreadState resolvedState;

    String sequenceId;

    @JsonIgnore
    Set<String> viewedByUsers;

    /**
     * username i.e. email of users who are subscribed for notifications in this thread
     */
    @JsonIgnore
    Set<String> subscribers;


    @Transient
    Boolean isViewed;

    // These comments are saved in a separate collection and loaded by the APIs separately.
    @Transient
    List<Comment> comments;

    @Data
    public static class Position {
        Integer top;
        Integer left;
        Float topPercent;
        Float leftPercent;
    }

    @Data
    public static class CommentThreadState {
        String authorName;
        String authorUsername;
        Instant updatedAt;
        Boolean active;
    }

    public String getCreationTime() {
        return ISO_FORMATTER.format(createdAt);
    }

    public String getUpdationTime() {
        return ISO_FORMATTER.format(updatedAt);
    }
}
