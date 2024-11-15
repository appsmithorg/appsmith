package com.appsmith.server.configurations;

import io.micrometer.observation.Observation;
import io.micrometer.observation.ObservationPredicate;
import io.micrometer.observation.ObservationView;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.reactive.observation.ServerRequestObservationContext;

/**
 * This configuration file creates beans that are required to filter just Appsmith specific spans
 */
@Configuration
public class TracingConfig {

    private Observation.Context getRoot(Observation.Context current) {
        ObservationView parent = current.getParentObservation();
        if (parent == null) {
            return current;
        } else {
            return getRoot((Observation.Context) parent.getContextView());
        }
    }

    @Bean
    ObservationPredicate noActuatorServerObservations() {
        return (name, context) -> {
            Observation.Context root = getRoot(context);
            if (root instanceof ServerRequestObservationContext serverContext) {
                // For endpoint spans, which would be the parent for the trace,
                // ignore actuator endpoints
                // This gets rid of the prometheus calls as well as the health check
                return !serverContext.getCarrier().getPath().value().startsWith("/actuator");
            } else {
                return true;
            }
        };
    }
}
