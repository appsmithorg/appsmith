package com.appsmith.server.domains;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;

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

    @JsonView(Views.Public.class)
    Boolean isPrivate;

    @JsonView(Views.Public.class)
    String tabId;

    @JsonView(Views.Public.class)
    Position position;

    @JsonView(Views.Public.class)
    String refId;

    @JsonView(Views.Public.class)
    String widgetType;

    @JsonView(Views.Public.class)
    CommentThreadState pinnedState;

    @JsonView(Views.Public.class)
    CommentThreadState resolvedState;

    @JsonView(Views.Public.class)
    String sequenceId;

    @JsonView(Views.Internal.class)
    Set<String> viewedByUsers;

    /**
     * username i.e. email of users who are subscribed for notifications in this thread
     */
    @JsonView(Views.Internal.class)
    Set<String> subscribers;


    @Transient
    @JsonView(Views.Public.class)
    Boolean isViewed;

    // These comments are saved in a separate collection and loaded by the APIs separately.
    @Transient
    @JsonView(Views.Public.class)
    List<Comment> comments;

    @Data
    public static class Position {
        @JsonView(Views.Public.class)
        Integer top;
        @JsonView(Views.Public.class)
        Integer left;
        @JsonView(Views.Public.class)
        Float topPercent;
        @JsonView(Views.Public.class)
        Float leftPercent;
    }

    @Data
    public static class CommentThreadState {
        @JsonView(Views.Public.class)
        String authorName;
        @JsonView(Views.Public.class)
        String authorUsername;
        @JsonView(Views.Public.class)
        Instant updatedAt;
        @JsonView(Views.Public.class)
        Boolean active;
    }

    @JsonView(Views.Public.class)
    public String getCreationTime() {
        return ISO_FORMATTER.format(createdAt);
    }

    @JsonView(Views.Public.class)
    public String getUpdationTime() {
        return ISO_FORMATTER.format(updatedAt);
    }
}
