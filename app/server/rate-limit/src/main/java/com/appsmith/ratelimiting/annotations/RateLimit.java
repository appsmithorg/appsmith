package com.appsmith.ratelimiting.annotations;

import org.springframework.core.annotation.AliasFor;
import org.springframework.web.bind.annotation.RequestMapping;

import java.lang.annotation.*;

@Target({ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@RequestMapping
public @interface RateLimit {

    @AliasFor(annotation = RequestMapping.class, attribute = "value")
    String[] value() default {};

    String api() default "";

    String userIdentifier() default "";
}
