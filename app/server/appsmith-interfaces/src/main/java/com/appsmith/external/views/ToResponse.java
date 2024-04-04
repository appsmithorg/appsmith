package com.appsmith.external.views;

/**
 * Intended to mark entity/DTO fields that should be included as part of HTTP responses, but should
 * be ignored as part of HTTP requests. For example, if a field is marked with this annotation, in
 * a class used with {@code @RequestBody}, it's value will NOT be deserialized.
 */
public interface ToResponse extends Views.Public {}
