package com.appsmith.external.helpers;

import io.micrometer.tracing.Span;

public interface ObservationHelper {
    ObservationHelper NOOP = name -> Span.NOOP;

    Span createSpan(String name);
}
