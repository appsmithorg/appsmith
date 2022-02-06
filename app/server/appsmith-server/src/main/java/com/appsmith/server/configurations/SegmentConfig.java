package com.appsmith.server.configurations;

import com.segment.analytics.Analytics;
import com.segment.analytics.Log;
import com.segment.analytics.messages.TrackMessage;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.ObjectUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Collections;
import java.util.Map;
import java.util.function.Consumer;

@Slf4j
@Configuration
public class SegmentConfig {

    @Value("${segment.writeKey}")
    private String writeKey;

    @Value("${segment.ce.key}")
    private String ceKey;

    private final CommonConfig commonConfig;

    @Autowired
    public SegmentConfig(CommonConfig commonConfig) {
        this.commonConfig = commonConfig;
    }

    @Bean
    public Analytics analyticsRunner() {
        if (commonConfig.isTelemetryDisabled()) {
            return null;
        }

        final String analyticsWriteKey = commonConfig.isCloudHosting() ? writeKey : ceKey;
        if (StringUtils.isEmpty(analyticsWriteKey)) {
            // We don't have the Segment Key, returning `null` here will disable analytics calls from AnalyticsService.
            return null;
        }

        final LogProcessor logProcessor = new LogProcessor();

        Analytics analyticsOnAnalytics = Analytics.builder(analyticsWriteKey).log(logProcessor).build();

        // We use a different analytics instance for sending events about the analytics system itself so we don't end up
        // in a recursive state.
        final LogProcessor logProcessorWithErrorHandler = new LogProcessor();
        final Analytics analytics = Analytics.builder(analyticsWriteKey).log(logProcessorWithErrorHandler).build();
        logProcessorWithErrorHandler.onError(logData -> {
            analyticsOnAnalytics.enqueue(TrackMessage.builder("segment_error")
                    .properties(Map.of(
                            "message", logData.getMessage(),
                            "error", logData.getError().getMessage(),
                            "args", ObjectUtils.defaultIfNull(logData.getArgs(), Collections.emptyList())
                    ))
            );
        });

        return analytics;
    }

    public String getCeKey() {
        return ceKey;
    }

    private static class LogProcessor implements Log {
        private Consumer<LogData> errorHandler = null;

        @Override
        public void print(Level level, String format, Object... args) {
            print(level, null, format, args);
        }

        @Override
        public void print(Level level, Throwable error, String format, Object... args) {
            final String message = "SEGMENT: " + format;
            if (level == Level.VERBOSE) {
                log.trace(message, error, args);
            } else if (level == Level.DEBUG) {
                log.debug(message, error, args);
            } else if (level == Level.ERROR) {
                if (errorHandler != null) {
                    errorHandler.accept(new LogData(error, format, args));
                }
                log.error(message, error, args);
            }
        }

        public void onError(Consumer<LogData> handler) {
            errorHandler = handler;
        }
    }

    @Data
    @RequiredArgsConstructor
    private static class LogData {
        final Throwable error;
        final String message;
        final Object[] args;
    }

}
