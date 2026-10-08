package com.appsmith.server.configurations;

import com.segment.analytics.Analytics;
import com.segment.analytics.Log;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

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
        if (commonConfig.getIsTelemetryDisabled()) {
            return null;
        }

        final String analyticsWriteKey = commonConfig.getIsCloudHosting() ? writeKey : ceKey;
        if (StringUtils.isEmpty(analyticsWriteKey)) {
            // We don't have the Segment Key, returning `null` here will disable analytics calls from AnalyticsService.
            return null;
        }

        return Analytics.builder(analyticsWriteKey).log(new LogProcessor()).build();
    }

    public String getCeKey() {
        return ceKey;
    }

    private static class LogProcessor implements Log {
        @Override
        public void print(Level level, String format, Object... args) {
            print(level, null, format, args);
        }

        @Override
        public void print(Level level, Throwable error, String format, Object... args) {
            final String message = "SEGMENT: " + format;
            if (level == Level.VERBOSE) {
                log.trace(String.format(message, args), error);
            } else if (level == Level.DEBUG) {
                log.debug(String.format(message, args), error);
            } else if (level == Level.ERROR) {
                log.error(String.format(message, args), error);
            }
        }
    }
}
