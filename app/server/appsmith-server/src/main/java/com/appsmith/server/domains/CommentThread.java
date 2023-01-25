package com.appsmith.server.domains;

import com.appsmith.external.models.Views;
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

    @JsonView(Views.Api.class)
    Boolean isPrivate;

    @JsonView(Views.Api.class)
    String tabId;

    @JsonView(Views.Api.class)
    Position position;

    @JsonView(Views.Api.class)
    String refId;

    @JsonView(Views.Api.class)
    String widgetType;

    @JsonView(Views.Api.class)
    CommentThreadState pinnedState;

    @JsonView(Views.Api.class)
    CommentThreadState resolvedState;

    @JsonView(Views.Api.class)
    String sequenceId;

    @JsonView(Views.Internal.class)
    Set<String> viewedByUsers;

    /**
     * username i.e. email of users who are subscribed for notifications in this thread
     */
    @JsonView(Views.Internal.class)
    Set<String> subscribers;


    @Transient
    @JsonView(Views.Api.class)
    Boolean isViewed;

    // These comments are saved in a separate collection and loaded by the APIs separately.
    @Transient
    @JsonView(Views.Api.class)
    List<Comment> comments;

    @Data
    public static class Position {
        @JsonView(Views.Api.class)
        Integer top;
        @JsonView(Views.Api.class)
        Integer left;
        @JsonView(Views.Api.class)
        Float topPercent;
        @JsonView(Views.Api.class)
        Float leftPercent;
    }

    @Data
    public static class CommentThreadState {
        @JsonView(Views.Api.class)
        String authorName;
        @JsonView(Views.Api.class)
        String authorUsername;
        @JsonView(Views.Api.class)
        Instant updatedAt;
        @JsonView(Views.Api.class)
        Boolean active;
    }

    @JsonView(Views.Api.class)
    public String getCreationTime() {
        return ISO_FORMATTER.format(createdAt);
    }

    @JsonView(Views.Api.class)
    public String getUpdationTime() {
        return ISO_FORMATTER.format(updatedAt);
    }
}
