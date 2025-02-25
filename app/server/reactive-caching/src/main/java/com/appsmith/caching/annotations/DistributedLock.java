package com.appsmith.caching.annotations;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface DistributedLock {
    String key();

    // Time-to-live for the lock in seconds.
    // - If the method execution takes longer than this TTL, the lock will be released automatically.
    // - If the locking is used for cron jobs, make sure the TTL is less than the delay between 2 runs to refresh the
    // status for every run.
    long ttl() default 5 * 60; // Default TTL: 5 minutes

    boolean shouldReleaseLock() default true;
}
