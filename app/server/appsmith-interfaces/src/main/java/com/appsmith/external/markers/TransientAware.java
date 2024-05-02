package com.appsmith.external.markers;

import com.appsmith.external.converters.CustomTransientSerializer;

/**
 * This is a marker interface to indicate that the implementing class contains transient field and should not be
 * persisted in the database.
 * Please refer to {@link CustomTransientSerializer} for more details.
 */
public interface TransientAware {}
