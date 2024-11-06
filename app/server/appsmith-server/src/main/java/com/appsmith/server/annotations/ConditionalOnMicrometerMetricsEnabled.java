package com.appsmith.server.annotations;

import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * It creates an annotation @ConditionalOnMicrometerMetricsEnabled which checks if the Micrometer metrics have been
 * explicitly enabled via env variable.
 */
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@ConditionalOnExpression("${appsmith.observability.metrics.enabled}")
public @interface ConditionalOnMicrometerMetricsEnabled {}
