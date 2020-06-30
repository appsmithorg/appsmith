package com.appsmith.server.configurations.mongo;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * This annotation allows custom JPA repository function to override the default delete=true filtering and also show
 * deleted records.
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface CanSeeSoftDeletedRecords {
}