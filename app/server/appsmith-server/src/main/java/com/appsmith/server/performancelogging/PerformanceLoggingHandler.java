package com.appsmith.server.performancelogging;

import io.micrometer.observation.Observation;
import io.micrometer.observation.Observation.Context;
import io.micrometer.observation.ObservationHandler;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Component;

import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.ThreadInfo;
import java.lang.management.ThreadMXBean;

@Component
@Slf4j
@ConditionalOnExpression("${logging.verbose.enabled}")
class PerformanceLoggingHandler implements ObservationHandler<Observation.Context> {
    /**
     * requestID isn't thread safe. TODO : Add thread safety for request ID.
     * Github Issue : https://github.com/appsmithorg/appsmith/issues/29581
     */
    int requestID = 0;

    @Override
    public void onStart(Context context) {
        context.put("executionTime", System.currentTimeMillis());

        requestID = (requestID + 1) % 10000;
        context.put("requestID", requestID);

        log.info(
                "\nRequest ID : {}\nExecution Started : {} \nContext : {}\n{}\n",
                requestID,
                context.getName(),
                context.toString(),
                memoryFootprint());
    }

    private String memoryFootprint() {
        MemoryMXBean memoryMXBean = ManagementFactory.getMemoryMXBean();
        String memoryString = String.format(
                "Initial memory: %.2f GB, Used heap memory: %.2f GB, Max heap memory: %.2f GB, Committed memory: %.2f GB",
                (double) memoryMXBean.getHeapMemoryUsage().getInit() / 1073741824,
                (double) memoryMXBean.getHeapMemoryUsage().getUsed() / 1073741824,
                (double) memoryMXBean.getHeapMemoryUsage().getMax() / 1073741824,
                (double) memoryMXBean.getHeapMemoryUsage().getCommitted() / 1073741824);

        ThreadMXBean threadMXBean = ManagementFactory.getThreadMXBean();
        StringBuilder cpuString = new StringBuilder();

        for (Long threadID : threadMXBean.getAllThreadIds()) {
            ThreadInfo info = threadMXBean.getThreadInfo(threadID);
            cpuString.append(String.format(
                    "{ %s, %s, %dms },",
                    info.getThreadName(), info.getThreadState(), threadMXBean.getThreadCpuTime(threadID) / 1000000));
        }

        return memoryString + "\n" + cpuString;
    }

    @Override
    public boolean supportsContext(Context context) {
        return true;
    }

    @Override
    public void onStop(Context context) {
        long startTime = context.getOrDefault("executionTime", 0L);
        long executionTime = System.currentTimeMillis() - startTime;

        int localRequestID = context.getOrDefault("requestID", 0);

        log.info(
                "\nRequest ID: {}\nExecution Complete: {}\nTotal Time Taken: {} ms\nContext: {}\n{}\n",
                localRequestID,
                context.getName(),
                executionTime,
                context.toString(),
                memoryFootprint());
    }

    @Override
    public void onError(Context context) {
        long startTime = context.getOrDefault("executionTime", 0L);
        long executionTime = System.currentTimeMillis() - startTime;
        long localRequestID = context.getOrDefault("requestID", 0);

        log.info(
                "\nRequest ID : {}\nError Encountered: {}\nTime Taken {} ms\nError: {}\nContext: {}\n{}\n",
                localRequestID,
                context.getName(),
                executionTime,
                (context.getError() != null ? context.getError().getMessage() : null),
                context.toString(),
                memoryFootprint());
    }
}
