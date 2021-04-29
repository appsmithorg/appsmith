package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;
import java.util.Set;

@Data
@EqualsAndHashCode(callSuper = false)
@Document
public class CommentThread extends BaseDomain {

    String tabId;

    Position position;

    String refId;

    CommentThreadState pinnedState;

    CommentThreadState resolvedState;

    String sequenceId;

    String applicationId;

    @JsonIgnore
    Set<String> viewedByUsers;

    @Transient
    Boolean isViewed;

    // These comments are saved in a separate collection and loaded by the APIs separately.
    @Transient
    List<Comment> comments;

    @Data
    public static class Position {
        Float top;
        Float left;
    }

    @Data
    public static class CommentThreadState {
        String authorName;
        String authorUsername;
        @LastModifiedDate
        Instant updatedAt;
        Boolean active;
    }

    public Instant getCreationTime() {
        return this.createdAt;
    }

    public Instant getUpdationTime() {
        return this.updatedAt;
    }
}
