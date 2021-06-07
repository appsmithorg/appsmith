package com.appsmith.server.services;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Comment;
import com.appsmith.server.domains.Notification;
import com.appsmith.server.domains.Organization;
import reactor.core.publisher.Mono;

import java.util.List;

public interface NotificationService extends CrudService<Notification, String> {
//    Mono<Void> sendEmailForComment(Comment comment, String originHeader, String applicationId);
//    <E>Mono<Void> sendEmailForComment(String authorUserName, String applicationId, E commentDomain, String originHeader);
}
