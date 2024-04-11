package com.appsmith.external.helpers;

import io.micrometer.tracing.Span;

public interface ObservationHelper {
    ObservationHelper NOOP = name -> Span.NOOP;

    Span createSpan(String name);

    default Span startSpan(Span span, boolean isDetail) {
        return span;
    }

    default void endSpan(Span span, boolean isDetail) {}
}
