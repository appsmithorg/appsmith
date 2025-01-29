package com.appsmith.server.configurations;

import com.appsmith.server.exceptions.AppsmithException;
import io.micrometer.common.KeyValue;
import io.micrometer.common.KeyValues;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.reactive.observation.DefaultServerRequestObservationConvention;
import org.springframework.http.server.reactive.observation.ServerRequestObservationContext;
import org.springframework.http.server.reactive.observation.ServerRequestObservationConvention;

@Configuration
public class ObservationConfig {

    @Bean
    public ServerRequestObservationConvention customObservationConvention() {
        return new DefaultServerRequestObservationConvention() {
            @Override
            public KeyValues getLowCardinalityKeyValues(ServerRequestObservationContext context) {
                KeyValues keyValues = super.getLowCardinalityKeyValues(context);

                // Extract error code safely
                String errorCode = context.getError() != null && context.getError() instanceof AppsmithException
                        ? (((AppsmithException) context.getError()).getAppErrorCode())
                        : "none";

                String errorTitle = context.getError() != null && context.getError() instanceof AppsmithException
                        ? (((AppsmithException) context.getError()).getTitle())
                        : "none";

                return keyValues.and(KeyValue.of("errorCode", errorCode)).and(KeyValue.of("exception", errorTitle));
            }
        };
    }
}
