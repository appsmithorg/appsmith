package com.appsmith.server.services;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Comment;
import com.appsmith.server.domains.Notification;
import com.appsmith.server.domains.Organization;
import reactor.core.publisher.Mono;

import java.util.List;

public interface NotificationService extends CrudService<Notification, String> {

}
