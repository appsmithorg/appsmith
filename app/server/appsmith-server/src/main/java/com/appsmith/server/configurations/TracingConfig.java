package com.appsmith.server.configurations;

import io.micrometer.observation.Observation;
import io.micrometer.observation.ObservationPredicate;
import io.micrometer.observation.ObservationView;
import io.micrometer.tracing.exporter.SpanExportingPredicate;
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

    @Bean
    SpanExportingPredicate onlyAppsmithSpans() {
        return (finishedSpan) -> {
            //            if ((finishedSpan.getKind() != null && finishedSpan.getKind().equals(Span.Kind.SERVER))
            //                    || finishedSpan.getName().startsWith(APPSMITH_SPAN_PREFIX)
            //                    || finishedSpan.getName().startsWith(AUTHENTICATE)
            //                    || finishedSpan.getName().startsWith(AUTHORIZE)) {
            //                // A span is either an http server request root or Appsmith specific or login related or
            // signup related
            //                return true;
            //            } else {
            //                return false;
            //            }
            return true;
        };
    }
}
