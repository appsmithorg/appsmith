package com.appsmith.external.annotations.encryption;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * We expect to use this annotation only at a field level.
 * Since we don't use DBRefs, all fields inside document objects are candidates for encryption
 * Our implementation of encryption means that ant field marked by this annotation will be encrypted in its entirety
 */
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.FIELD})
public @interface Encrypted {
}
