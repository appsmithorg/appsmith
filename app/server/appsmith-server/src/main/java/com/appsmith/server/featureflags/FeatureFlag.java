package com.appsmith.server.featureflags;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.User;
import com.appsmith.server.services.SessionUserService;
import org.apache.commons.lang3.StringUtils;
import org.ff4j.FF4j;
import org.ff4j.core.FeatureStore;
import org.ff4j.core.FlippingExecutionContext;
import org.ff4j.strategy.AbstractFlipStrategy;
import org.ff4j.strategy.PonderationStrategy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.util.Map;

@Component
public class FeatureFlag {

    @Autowired
    SessionUserService sessionUserService;

    @Autowired
    FF4j ff4j;

    public Boolean check(String featureName, User user) {
        return ff4j.check(featureName, new FlippingExecutionContext(Map.of(FieldName.USER, user)));
    }

    public Mono<Map<String, Boolean>> getFeatureFlagsForUser() {
        Mono<User> currentUser = sessionUserService.getCurrentUser().cache();
        Flux<Tuple2<String, User>> featureUserTuple = Flux.fromIterable(ff4j.getFeatures().keySet())
                .flatMap(featureName -> Mono.just(featureName).zipWith(currentUser));

        return featureUserTuple
                .collectMap(tuple -> tuple.getT1(), tuple -> check(tuple.getT1(), tuple.getT2()));
    }

    public class JSEditorFeature extends AbstractFlipStrategy {

        @Override
        public boolean evaluate(String featureName, FeatureStore store, FlippingExecutionContext executionContext) {
            System.out.println("In the awesomeFeature flipStrategy");
            User user = (User) executionContext.getValue(FieldName.USER, true);
            return StringUtils.endsWith(user.getEmail(), "@appsmith.com");
        }
    }

    public class WeightageFeature extends PonderationStrategy {
        public WeightageFeature() {
            super(0.5);
        }
    }
}
