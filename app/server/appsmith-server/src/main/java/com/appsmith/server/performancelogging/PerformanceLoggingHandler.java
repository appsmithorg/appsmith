package com.appsmith.server.performancelogging;

import io.micrometer.common.KeyValue;
import io.micrometer.observation.Observation;
import io.micrometer.observation.Observation.Context;
import io.micrometer.observation.ObservationHandler;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Component;

import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;

@Component
@Slf4j
@ConditionalOnExpression("${logging.verbose.enabled}")
class PerformanceLoggingHandler implements ObservationHandler<Observation.Context> {
    @Override
    public void onStart(Context context) {
        if (needsLogStatement(context)) {
            context.put("executionTime", System.currentTimeMillis());

            KeyValue url = context.getHighCardinalityKeyValue("http.url");
            String urlName = url == null ? "null" : url.getValue();
            log.info("Execution Started : {}, Context : {}, {}", context.getName(), urlName, memoryFootprint());
        }
    }

    private String memoryFootprint() {
        MemoryMXBean memoryMXBean = ManagementFactory.getMemoryMXBean();

        return String.format(
                "Initial memory: %.2f GB, Used heap memory: %.2f GB, Max heap memory: %.2f GB, Committed memory: %.2f GB",
                (double) memoryMXBean.getHeapMemoryUsage().getInit() / 1073741824,
                (double) memoryMXBean.getHeapMemoryUsage().getUsed() / 1073741824,
                (double) memoryMXBean.getHeapMemoryUsage().getMax() / 1073741824,
                (double) memoryMXBean.getHeapMemoryUsage().getCommitted() / 1073741824);
    }

    private Boolean needsLogStatement(Context context) {
        String name = context.getName();
        if (name.equals("spring.security.authorizations")
                || name.equals("spring.security.filterchains")
                || name.equals("spring.security.http.secured.requests")) {
            return false;
        } else {
            return true;
        }
    }

    @Override
    public boolean supportsContext(Context context) {
        return true;
    }

    @Override
    public void onStop(Context context) {
        if (needsLogStatement(context)) {
            long startTime = context.getOrDefault("executionTime", 0L);
            long executionTime = System.currentTimeMillis() - startTime;

            KeyValue url = context.getHighCardinalityKeyValue("http.url");
            String urlName = url == null ? "null" : url.getValue();

            log.info(
                    "Execution Complete: {} | Total Time Taken: {} ms | Context: {}, {}",
                    context.getName(),
                    executionTime,
                    urlName,
                    memoryFootprint());
        }
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
