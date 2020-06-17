package com.appsmith.server.services;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.domains.User;
import com.segment.analytics.Analytics;
import com.segment.analytics.messages.IdentifyMessage;
import com.segment.analytics.messages.TrackMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class AnalyticsService<T extends BaseDomain> {

    private final Analytics analytics;
    private final SessionUserService sessionUserService;

    @Autowired
    public AnalyticsService(Analytics analytics, SessionUserService sessionUserService) {
        this.analytics = analytics;
        this.sessionUserService = sessionUserService;
    }

    public Mono<User> trackNewUser(User user) {
        return Mono.just(user)
                .map(savedUser -> {
                    Map<String, String> traitsMap = new HashMap<>();
                    if (savedUser.getName() != null) {
                        traitsMap.put("name", savedUser.getName());
                    }
                    traitsMap.put("email", savedUser.getEmail());
                    analytics.enqueue(IdentifyMessage.builder()
                            .userId(savedUser.getId())
                            .traits(traitsMap)
                    );
                    analytics.flush();
                    return savedUser;
                });
    }

    private User createAnonymousUser() {
        User user = new User();
        user.setId("anonymousUser");
        return user;
    }

    public Mono<T> sendEvent(String eventTag, T object) {
        // We will create an anonymous user object for event tracking if no user is present
        // Without this, a lot of flows meant for anonymous users will error out
        Mono<User> userMono = sessionUserService.getCurrentUser()
                .defaultIfEmpty(createAnonymousUser());
        return userMono
                .map(user -> {

                    // In case the user is anonymous, return as is without raising the event.
                    if (user.getIsAnonymous()) {
                        return (T) object;
                    }

                    HashMap<String, String> analyticsProperties = new HashMap<>();
                    analyticsProperties.put("id", ((BaseDomain) object).getId());
                    analyticsProperties.put("object", object.toString());

                    analytics.enqueue(
                            TrackMessage.builder(eventTag)
                                    .userId(user.getId())
                                    .properties(analyticsProperties)
                    );
                    return (T) object;
                });
    }
}
