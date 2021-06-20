package com.appsmith.server.events;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Comment;
import com.appsmith.server.domains.Organization;
import lombok.Getter;

@Getter
public class CommentAddedEvent extends AbstractCommentEvent {
    private final Comment comment;

    public CommentAddedEvent(String authorUserName, Organization organization, Application application, String originHeader, Comment comment) {
        super(authorUserName, organization, application, originHeader);
        this.comment = comment;
    }
}
