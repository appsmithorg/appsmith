package com.appsmith.server.events;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Comment;
import com.appsmith.server.domains.Organization;
import lombok.Getter;

import java.util.Set;

@Getter
public class CommentAddedEvent extends AbstractCommentEvent {
    private final Comment comment;
    private final Set<String> subscribers;

    public CommentAddedEvent(String authorUserName, Organization organization, Application application,
                             String originHeader, Comment comment, Set<String> subscribers) {
        super(authorUserName, organization, application, originHeader);
        this.comment = comment;
        this.subscribers = subscribers;
    }
}
