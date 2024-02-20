package com.appsmith.server.annotations;

import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * It creates an annotation @ConditionalOnNewRelicLicenseKey which checks if the NewRelic license key has been
 * provided or not via appsmith.newrelic.licensekey property in application.properties file. It is used along
 * with @Bean annotation so that the bean is created only when NewRelic license key is provided.
 */
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@ConditionalOnExpression("!T(org.apache.commons.lang3.StringUtils).isBlank('${appsmith.newrelic.licensekey:}')")
public @interface ConditionalOnNewRelicLicenseKey {}
