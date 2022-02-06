package com.appsmith.server.services.ce;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.constants.AnalyticsEvents;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.SessionUserService;
import com.segment.analytics.Analytics;
import com.segment.analytics.messages.IdentifyMessage;
import com.segment.analytics.messages.TrackMessage;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.codec.digest.DigestUtils;
import org.apache.commons.lang3.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.HashMap;
import java.util.Map;

@Slf4j
public class AnalyticsServiceCEImpl implements AnalyticsServiceCE {

    private final Analytics analytics;
    private final SessionUserService sessionUserService;
    private final CommonConfig commonConfig;
    private final ConfigService configService;
    private final PolicyUtils policyUtils;

    @Autowired
    public AnalyticsServiceCEImpl(@Autowired(required = false) Analytics analytics,
                                  SessionUserService sessionUserService,
                                  CommonConfig commonConfig,
                                  ConfigService configService,
                                  PolicyUtils policyUtils) {
        this.analytics = analytics;
        this.sessionUserService = sessionUserService;
        this.commonConfig = commonConfig;
        this.configService = configService;
        this.policyUtils = policyUtils;
    }

    public boolean isActive() {
        return analytics != null;
    }

    private String hash(String value) {
        return value == null ? "" : DigestUtils.sha256Hex(value);
    }

    public Mono<User> identifyUser(User user, UserData userData) {
        if (!isActive()) {
            return Mono.just(user);
        }

        return Mono.just(user)
                .map(savedUser -> {
                    final Boolean isSuperUser = policyUtils.isPermissionPresentForUser(
                            savedUser.getPolicies(),
                            AclPermission.MANAGE_INSTANCE_ENV.getValue(),
                            savedUser.getUsername()
                    );

                    String username = savedUser.getUsername();
                    String name = savedUser.getName();
                    String email = savedUser.getEmail();
                    if (!commonConfig.isCloudHosting()) {
                        username = hash(username);
                        name = hash(name);
                        email = hash(email);
                    }

                    analytics.enqueue(IdentifyMessage.builder()
                            .userId(ObjectUtils.defaultIfNull(username, ""))
                            .traits(Map.of(
                                    "name", ObjectUtils.defaultIfNull(name, ""),
                                    "email", ObjectUtils.defaultIfNull(email, ""),
                                    "isSuperUser", isSuperUser != null && isSuperUser,
                                    "role", ObjectUtils.defaultIfNull(userData.getRole(), ""),
                                    "goal", ObjectUtils.defaultIfNull(userData.getUseCase(), "")
                            ))
                    );
                    analytics.flush();
                    return savedUser;
                });
    }

    public void identifyInstance(String instanceId, String role, String useCase) {
        analytics.enqueue(IdentifyMessage.builder()
                .userId(instanceId)
                .traits(Map.of(
                        "isInstance", true,  // Is this "identify" data-point for a user or an instance?
                        "role", ObjectUtils.defaultIfNull(role, ""),
                        "goal", ObjectUtils.defaultIfNull(useCase, "")
                ))
        );
        analytics.flush();
    }

    public void sendEvent(String event, String userId, Map<String, Object> properties) {
        sendEvent(event, userId, properties, true);
    }

    public void sendEvent(String event, String userId, Map<String, Object> properties, boolean hashUserId) {
        if (!isActive()) {
            return;
        }

        // Can't update the properties directly as it's throwing ImmutableCollection error
        // java.lang.UnsupportedOperationException: null
        // at java.base/java.util.ImmutableCollections.uoe(ImmutableCollections.java)
        // at java.base/java.util.ImmutableCollections$AbstractImmutableMap.put(ImmutableCollections.java)
        Map<String, Object> analyticsProperties = properties == null ? new HashMap<>() : new HashMap<>(properties);

        // Hash usernames at all places for self-hosted instance
        if (userId != null
                && hashUserId
                && !commonConfig.isCloudHosting()
                // But send the email intact for the subscribe event, which is sent only if the user has explicitly agreed to it.
                && !AnalyticsEvents.SUBSCRIBE_MARKETING_EMAILS.name().equals(event)) {
            final String hashedUserId = hash(userId);
            analyticsProperties.remove("request");
            for (final Map.Entry<String, Object> entry : analyticsProperties.entrySet()) {
                if (userId.equals(entry.getValue())) {
                    analyticsProperties.put(entry.getKey(), hashedUserId);
                }
            }
            userId = hashedUserId;
        }

        // Segment throws an NPE if any value in `properties` is null.
        for (final Map.Entry<String, Object> entry : analyticsProperties.entrySet()) {
            if (entry.getValue() == null) {
                analyticsProperties.put(entry.getKey(), "");
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

    public <T extends BaseDomain> Mono<T> sendArchiveEvent(T object) {
        return sendArchiveEvent(object, null);
    }

    private <T extends BaseDomain> Mono<T> sendArchiveEvent(T object, Map<String, Object> extraProperties) {
        return sendObjectEvent(AnalyticsEvents.ARCHIVE, object, extraProperties);
    }
}
