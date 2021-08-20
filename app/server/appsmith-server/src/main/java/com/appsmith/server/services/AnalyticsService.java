package com.appsmith.server.services;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.constants.AnalyticsEvents;
import com.appsmith.server.domains.User;
import com.segment.analytics.Analytics;
import com.segment.analytics.messages.IdentifyMessage;
import com.segment.analytics.messages.TrackMessage;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class AnalyticsService {

    private final Analytics analytics;
    private final SessionUserService sessionUserService;
    private final CommonConfig commonConfig;
    private final ConfigService configService;

    @Autowired
    public AnalyticsService(@Autowired(required = false) Analytics analytics,
                            SessionUserService sessionUserService,
                            CommonConfig commonConfig,
                            ConfigService configService) {
        this.analytics = analytics;
        this.sessionUserService = sessionUserService;
        this.commonConfig = commonConfig;
        this.configService = configService;
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

    public void sendEvent(String event, String userId, Map<String, Object> properties) {
        if (!isActive()) {
            return;
        }

        // Can't update the properties directly as it's throwing ImmutableCollection error
        // java.lang.UnsupportedOperationException: null
        // at java.base/java.util.ImmutableCollections.uoe(ImmutableCollections.java)
        // at java.base/java.util.ImmutableCollections$AbstractImmutableMap.put(ImmutableCollections.java)
        Map<String, Object> analyticsProperties = properties == null ? new HashMap<>() : new HashMap<>(properties);

        // Hash usernames at all places for self-hosted instance
        if (!commonConfig.isCloudHosting()
                // But send the email intact for the subscribe event, which is sent only if the user has explicitly agreed to it.
                && !AnalyticsEvents.SUBSCRIBE_MARKETING_EMAILS.name().equals(event)) {
            final String hashedUserId = DigestUtils.sha256Hex(userId);
            analyticsProperties.remove("request");
            if (!CollectionUtils.isEmpty(analyticsProperties)) {
                for (final Map.Entry<String, Object> entry : analyticsProperties.entrySet()) {
                    if (entry.getValue() == null) {
                        analyticsProperties.put(entry.getKey(), "");
                    } else if (entry.getValue().equals(userId)) {
                        analyticsProperties.put(entry.getKey(), hashedUserId);
                    }
                }
            }
            userId = hashedUserId;
        }

        if (!CollectionUtils.isEmpty(analyticsProperties) && commonConfig.isCloudHosting()) {
            // Segment throws an NPE if any value in `properties` is null.
            for (final Map.Entry<String, Object> entry : analyticsProperties.entrySet()) {
                if (entry.getValue() == null) {
                    analyticsProperties.put(entry.getKey(), "");
                }
            }
        }

        final String finalUserId = userId;
        configService.getInstanceId().map(instanceId -> {
            TrackMessage.Builder messageBuilder = TrackMessage.builder(event).userId(finalUserId);
            analyticsProperties.put("originService", "appsmith-server");
            analyticsProperties.put("instanceId", instanceId);
            messageBuilder = messageBuilder.properties(analyticsProperties);
            analytics.enqueue(messageBuilder);
            return instanceId;
        }).subscribeOn(Schedulers.boundedElastic()).subscribe();
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
