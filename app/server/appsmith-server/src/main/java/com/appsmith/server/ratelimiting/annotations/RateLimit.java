package com.appsmith.server.ratelimiting.annotations;

import org.springframework.core.annotation.AliasFor;
import org.springframework.web.bind.annotation.RequestMapping;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target({ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@RequestMapping
public @interface RateLimit {

    @AliasFor(annotation = RequestMapping.class, attribute = "value")
    String[] value() default {};

    String api() default "";
}
