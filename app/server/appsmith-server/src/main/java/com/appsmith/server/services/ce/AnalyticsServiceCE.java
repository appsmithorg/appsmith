package com.appsmith.server.services.ce;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import reactor.core.publisher.Mono;

import java.util.Map;

public interface AnalyticsServiceCE {

    boolean isActive();

    Mono<User> identifyUser(User user, UserData userData);

    Mono<User> identifyUser(User user, UserData userData, String recentlyUsedWorkspaceId);

    void identifyInstance(
            String instanceId, String proficiency, String useCase, String adminEmail, String adminFullName, String ip);

    Mono<Void> sendEvent(String event, String userId, Map<String, ?> properties);

    Mono<Void> sendEvent(String event, String userId, Map<String, ?> properties, boolean hashUserId);

    <T> Mono<T> sendObjectEvent(AnalyticsEvents event, T object, Map<String, Object> extraProperties);

    <T extends BaseDomain> Mono<T> sendObjectEvent(AnalyticsEvents event, T object);

    <T extends BaseDomain> Mono<T> sendCreateEvent(T object, Map<String, Object> extraProperties);

    <T extends BaseDomain> Mono<T> sendCreateEvent(T object);

    <T extends BaseDomain> Mono<T> sendUpdateEvent(T object, Map<String, Object> extraProperties);

    <T extends BaseDomain> Mono<T> sendUpdateEvent(T object);

    <T extends BaseDomain> Mono<T> sendDeleteEvent(T object, Map<String, Object> extraProperties);

    <T extends BaseDomain> Mono<T> sendArchiveEvent(T object, Map<String, Object> extraProperties);

    <T extends BaseDomain> Mono<T> sendDeleteEvent(T object);
}
