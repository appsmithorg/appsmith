package com.appsmith.server.services;

import com.appsmith.server.domains.BaseDomain;
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
                    traitsMap.put("name", savedUser.getName());
                    traitsMap.put("email", savedUser.getEmail());
                    analytics.enqueue(IdentifyMessage.builder()
                            .userId(savedUser.getId())
                            .traits(traitsMap)
                    );
                    analytics.flush();
                    return savedUser;
                });
    }

    public Mono<T> sendEvent(String eventTag, T object) {
        Mono<User> userMono = sessionUserService.getCurrentUser();
        return userMono
                .map(user -> {
                    HashMap<String, String> analyticsProperties = new HashMap<>();
                    analyticsProperties.put("id", ((BaseDomain) object).getId());
                    analyticsProperties.put("object", object.toString());
                    if(user.getOrganizationId() != null) {
                        analyticsProperties.put("organizationId", user.getOrganizationId());
                    }

                    analytics.enqueue(
                            TrackMessage.builder(eventTag)
                                    .userId(user.getId())
                                    .properties(analyticsProperties)
                    );
                    return (T) object;
                });
    }
}
