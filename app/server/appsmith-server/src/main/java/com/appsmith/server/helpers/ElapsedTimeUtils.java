package com.appsmith.server.helpers;

import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import reactor.core.publisher.Timed;

@Slf4j
public class ElapsedTimeUtils {
    public static String EXECUTION_PARTS_PARSED = "EXECUTION_PARTS_PARSED";
    public static String EXECUTION_PRE_REQUEST = "EXECUTION_PRE_REQUEST";
    public static String EXECUTION_RESULT = "EXECUTION_RESULT";
    public static String EXECUTION_POST_REQUEST = "EXECUTION_POST_REQUEST";
    public static String EXECUTION_WIDGET_SUGGESTION = "EXECUTION_WIDGET_SUGGESTION";

    public static <T> T addElapsedTimeToContext(Timed<T> timedInput, String contextKey) {
        String elapsedValue = timedInput.timestamp() + " ___ " + timedInput.elapsed().toMillis();
        log.debug("Elapsed value: {} {}", contextKey, elapsedValue);
        MDC.put(contextKey, elapsedValue);
        return timedInput.get();
    }
}
