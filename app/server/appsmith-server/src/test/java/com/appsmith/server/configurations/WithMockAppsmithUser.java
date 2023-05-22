/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.configurations;

import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import org.springframework.security.test.context.support.WithSecurityContext;

@Retention(RetentionPolicy.RUNTIME)
@WithSecurityContext(factory = WithMockAppsmithSecurityContextFactory.class)
public @interface WithMockAppsmithUser {
String username() default "anonymousUser";

String name() default "Anonymous User";
}
