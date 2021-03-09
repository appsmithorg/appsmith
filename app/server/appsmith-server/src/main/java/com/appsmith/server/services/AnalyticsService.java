package com.appsmith.server.services;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.constants.AnalyticsEvents;
import com.appsmith.server.domains.User;
import com.segment.analytics.Analytics;
import com.segment.analytics.messages.IdentifyMessage;
import com.segment.analytics.messages.TrackMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class AnalyticsService {

    private final Analytics analytics;
    private final SessionUserService sessionUserService;

    @Autowired
    public AnalyticsService(@Autowired(required = false) Analytics analytics, SessionUserService sessionUserService) {
        this.analytics = analytics;
        this.sessionUserService = sessionUserService;
    }

    public boolean isActive() {
        return analytics != null;
    }

    public Mono<User> trackNewUser(User user) {
        if (!isActive()) {
            return Mono.just(user);
        }

        return Mono.just(user)
                .map(savedUser -> {
                    Map<String, String> traitsMap = new HashMap<>();
                    if (savedUser.getName() != null) {
                        traitsMap.put("name", savedUser.getName());
                    }
                    traitsMap.put("email", savedUser.getEmail());
                    if (savedUser.getSource() != null) {
                        traitsMap.put("source", savedUser.getSource().toString());
                    }
                    analytics.enqueue(IdentifyMessage.builder()
                            .userId(savedUser.getUsername())
                            .traits(traitsMap)
                    );
                    analytics.flush();
                    return savedUser;
                });
    }

    public void sendEvent(String event, String userId) {
        sendEvent(event, userId, null);
    }

    public void sendEvent(String event, String userId, Map<String, Object> properties) {
        if (!isActive()) {
            return;
        }

        TrackMessage.Builder messageBuilder = TrackMessage.builder(event).userId(userId);

        if (!CollectionUtils.isEmpty(properties)) {
            // Segment throws an NPE if any value in `properties` is null.
            for (final Map.Entry<String, Object> entry : properties.entrySet()) {
                if (entry.getValue() == null) {
                    properties.put(entry.getKey(), "");
                }
            }
            messageBuilder = messageBuilder.properties(properties);
        }

        analytics.enqueue(messageBuilder);
    }

    public <T extends BaseDomain> Mono<T> sendObjectEvent(AnalyticsEvents event, T object, Map<String, Object> extraProperties) {
        if (!isActive()) {
            return Mono.just(object);
        }

        final String eventTag = event.getEventName() + "_" + object.getClass().getSimpleName().toUpperCase();

        // We will create an anonymous user object for event tracking if no user is present
        // Without this, a lot of flows meant for anonymous users will error out
        Mono<User> userMono = sessionUserService.getCurrentUser();

        return userMono
                .map(user -> {

                    // In case the user is anonymous, don't raise an event, unless it's a signup event.
                    if (user.isAnonymous() && !(object instanceof User && event == AnalyticsEvents.CREATE)) {
                        return object;
                    }

                    final String username = (object instanceof User ? (User) object : user).getUsername();

                    HashMap<String, Object> analyticsProperties = new HashMap<>();
                    analyticsProperties.put("id", username);
                    analyticsProperties.put("oid", object.getId());
                    analyticsProperties.put("originService", "appsmith-server");
                    if (extraProperties != null) {
                        analyticsProperties.putAll(extraProperties);
                    }

                    sendEvent(eventTag, username, analyticsProperties);
                    return object;
                });
    }

    public <T extends BaseDomain> Mono<T> sendCreateEvent(T object, Map<String, Object> extraProperties) {
        return sendObjectEvent(AnalyticsEvents.CREATE, object, extraProperties);
    }

    public <T extends BaseDomain> Mono<T> sendCreateEvent(T object) {
        return sendCreateEvent(object, null);
    }

    public <T extends BaseDomain> Mono<T> sendUpdateEvent(T object, Map<String, Object> extraProperties) {
        return sendObjectEvent(AnalyticsEvents.UPDATE, object, extraProperties);
    }

    public <T extends BaseDomain> Mono<T> sendUpdateEvent(T object) {
        return sendUpdateEvent(object, null);
    }

    public <T extends BaseDomain> Mono<T> sendDeleteEvent(T object, Map<String, Object> extraProperties) {
        return sendObjectEvent(AnalyticsEvents.DELETE, object, extraProperties);
    }

    public <T extends BaseDomain> Mono<T> sendDeleteEvent(T object) {
        return sendDeleteEvent(object, null);
    }

}
