package com.appsmith.server.annotations;

import com.appsmith.server.constants.ArtifactType;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface GitRoute {
    String fieldName();

    ArtifactType artifactType();
}
