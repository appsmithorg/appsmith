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

    public CommentAddedEvent(Organization organization, Application application,
                             String originHeader, Comment comment, Set<String> subscribers, String pageName) {
        super(comment.getAuthorUsername(), organization, application, originHeader, pageName);
        this.comment = comment;
        this.subscribers = subscribers;
    }
}
