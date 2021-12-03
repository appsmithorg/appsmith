package com.appsmith.server.services;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.User;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import org.ff4j.FF4j;
import org.ff4j.core.FlippingExecutionContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.util.Map;

@Component
public class FeatureFlagServiceImpl implements FeatureFlagService {

    private final SessionUserService sessionUserService;

    private final FF4j ff4j;

    @Autowired
    public FeatureFlagServiceImpl(SessionUserService sessionUserService,
                                  FF4j ff4j) {
        this.sessionUserService = sessionUserService;
        this.ff4j = ff4j;
    }

    @Override
    public Boolean check(FeatureFlagEnum featureEnum, User user) {
        if (featureEnum == null) {
            return false;
        }
        return check(featureEnum.toString(), user);
    }

    @Override
    public Mono<Boolean> check(FeatureFlagEnum featureEnum) {
        return sessionUserService.getCurrentUser()
                .map(user -> check(featureEnum, user));
    }

    private Boolean check(String featureName, User user) {
        return ff4j.check(featureName, new FlippingExecutionContext(Map.of(FieldName.USER, user)));
    }

    @Override
    public Mono<Map<String, Boolean>> getAllFeatureFlagsForUser() {
        Mono<User> currentUser = sessionUserService.getCurrentUser().cache();
        Flux<Tuple2<String, User>> featureUserTuple = Flux.fromIterable(ff4j.getFeatures().keySet())
                .flatMap(featureName -> Mono.just(featureName).zipWith(currentUser));

        return featureUserTuple
                .collectMap(tuple -> tuple.getT1(), tuple -> check(tuple.getT1(), tuple.getT2()));
    }
}
