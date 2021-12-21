package com.appsmith.server.services.ce;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.constants.AnalyticsEvents;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import reactor.core.publisher.Mono;

import java.util.Map;

public interface AnalyticsServiceCE {

    boolean isActive();

    Mono<User> identifyUser(User user, UserData userData);

    void identifyInstance(String instanceId, String role, String useCase);

    void sendEvent(String event, String userId, Map<String, Object> properties);

    void sendEvent(String event, String userId, Map<String, Object> properties, boolean hashUserId);

    <T extends BaseDomain> Mono<T> sendObjectEvent(AnalyticsEvents event, T object, Map<String, Object> extraProperties);

    <T extends BaseDomain> Mono<T> sendCreateEvent(T object, Map<String, Object> extraProperties);

    <T extends BaseDomain> Mono<T> sendCreateEvent(T object);

    <T extends BaseDomain> Mono<T> sendUpdateEvent(T object, Map<String, Object> extraProperties);

    <T extends BaseDomain> Mono<T> sendUpdateEvent(T object);

    <T extends BaseDomain> Mono<T> sendDeleteEvent(T object, Map<String, Object> extraProperties);

    <T extends BaseDomain> Mono<T> sendDeleteEvent(T object);

    <T extends BaseDomain> Mono<T> sendArchiveEvent(T object);
}
