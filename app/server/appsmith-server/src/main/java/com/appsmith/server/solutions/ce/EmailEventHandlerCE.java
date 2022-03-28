package com.appsmith.server.solutions.ce;

import com.appsmith.server.domains.Comment;
import com.appsmith.server.domains.CommentThread;
import com.appsmith.server.events.CommentAddedEvent;
import com.appsmith.server.events.CommentThreadClosedEvent;
import reactor.core.publisher.Mono;

import java.util.Set;

public interface EmailEventHandlerCE {

    Mono<Boolean> publish(String authorUserName, String applicationId, Comment comment, String originHeader, Set<String> subscribers);

    Mono<Boolean> publish(String authorUserName, String applicationId, CommentThread thread, String originHeader);

    void handle(CommentAddedEvent event);

    void handle(CommentThreadClosedEvent event);
}
