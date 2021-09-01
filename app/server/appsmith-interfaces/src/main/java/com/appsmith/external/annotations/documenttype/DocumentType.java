package com.appsmith.external.annotations.documenttype;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * This annotation is meant to introduce polymorphic behaviour in persistent objects. Since we do not expect Spring to
 * be able to automatically detect such objects, objects marked with this annotation are specifically registered in the
 * type mapper for {@link org.springframework.data.mongodb.core.MongoTemplate}
 *
 * The value associated to this annotation functions as an alias for the entity.
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
public @interface DocumentType {

    public String value() default "";

}