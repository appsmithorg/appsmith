package com.appsmith.server.configurations;

import com.segment.analytics.Analytics;
import com.segment.analytics.Log;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Slf4j
@Configuration
public class SegmentConfig {

    @Value("${segment.writeKey}")
    private String writeKey;

    @Value("${segment.ce.key}")
    private String ceKey;

    @Bean
    @ConditionalOnExpression(value = "!'${segment.writeKey:}'.isEmpty()")
    public Analytics analyticsRunner() {
        final Log logProcessor = new Log() {
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
                    log.error(message, error, args);
                }
            }
        };

        return Analytics.builder(writeKey).log(logProcessor).build();
    }

    public String getCeKey() {
        return ceKey;
    }

}
