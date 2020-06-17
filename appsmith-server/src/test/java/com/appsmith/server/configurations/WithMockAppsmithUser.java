package com.appsmith.server.configurations;

import org.springframework.security.test.context.support.WithSecurityContext;

import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;

@Retention(RetentionPolicy.RUNTIME)
@WithSecurityContext(factory = WithMockAppsmithSecurityContextFactory.class)
public @interface WithMockAppsmithUser {
    String username() default "anonymousUser";

    String name() default "Anonymous User";
}
