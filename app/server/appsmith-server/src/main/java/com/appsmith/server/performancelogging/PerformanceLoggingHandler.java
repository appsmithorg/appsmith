package com.appsmith.server.performancelogging;

import io.micrometer.observation.Observation;
import io.micrometer.observation.Observation.Context;
import io.micrometer.observation.ObservationHandler;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@ConditionalOnExpression("${logging.verbose.enabled}")
class PerformanceLoggingHandler implements ObservationHandler<Observation.Context> {
    @Override
    public void onStart(Context context) {
        context.put("executionTime", System.currentTimeMillis());
    }

    @Override
    public boolean supportsContext(Context context) {
        return true;
    }

    @Override
    public void onStop(Context context) {
        long startTime = context.getOrDefault("executionTime", 0L);
        long executionTime = System.currentTimeMillis() - startTime;
        log.info(
                "Execution Complete: {} | Total Time Taken: {} ms | Context: {}",
                context.getName(),
                executionTime,
                context.toString());
    }

    @Override
    public void onError(Context context) {
        long startTime = context.getOrDefault("executionTime", 0L);
        long executionTime = System.currentTimeMillis() - startTime;

        log.info(
                "Error Encountered: {} | Time Taken {} ms | Error: {} | Context: {}",
                context.toString(),
                executionTime,
                context.getName(),
                (context.getError() != null ? context.getError().getMessage() : null));
    }
}
