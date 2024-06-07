package com.appsmith.server.meta.validations;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Validate field as a valid file name. Nulls are treated as valid by default, but can be changed with
 * {@link FileName#isNullValid()}.
 */
@Documented
@Constraint(validatedBy = {FileNameValidator.class})
@Target({ElementType.FIELD, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
public @interface FileName {
    String message() default "Invalid file name";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};

    boolean isNullValid() default true;
}
