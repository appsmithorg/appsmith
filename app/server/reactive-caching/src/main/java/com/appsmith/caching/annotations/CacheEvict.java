package com.appsmith.caching.annotations;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * This annotation is used to mark a method as a reactive cache evictor.
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface CacheEvict {

    /*
     * This is the name of the cache.
     */
    String cacheName();

    /**
     * SPEL expression used to generate the key for the method call
     * All method arguments can be used in the expression
     */
    String key() default "";

    /**
     * Array of keys for which cache entries should be evicted.
     * Can be used to specify multiple keys for bulk eviction.
     * If empty, a single key can be derived from the method arguments.
     */
    String[] keys() default {};

    /**
     * Whether to evict all keys for a given cache name.
     */
    boolean all() default false;
}
