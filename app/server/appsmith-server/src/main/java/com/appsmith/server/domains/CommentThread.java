package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
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

    private static final DateTimeFormatter ISO_FORMATTER =
            DateTimeFormatter.ISO_INSTANT.withZone(ZoneId.from(ZoneOffset.UTC));

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
        String updatedAt;
        Boolean active;
    }

    public String getCreationTime() {
        return ISO_FORMATTER.format(createdAt);
    }

    public String getUpdationTime() {
        return ISO_FORMATTER.format(updatedAt);
    }

}
