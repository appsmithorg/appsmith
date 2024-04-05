package com.appsmith.server.helpers;

import com.appsmith.external.helpers.ObservationHelper;
import io.micrometer.tracing.Span;
import io.micrometer.tracing.TraceContext;
import io.micrometer.tracing.Tracer;
import lombok.RequiredArgsConstructor;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;

import static com.appsmith.external.constants.MDCConstants.SPAN_ID;
import static com.appsmith.external.constants.MDCConstants.TRACE_ID;

@RequiredArgsConstructor
@Component
public class ObservationHelperImpl implements ObservationHelper {

    private final Tracer tracer;

    public Span createSpan(String name) {
        TraceContext traceContext = tracer.traceContextBuilder()
                .traceId(MDC.getCopyOfContextMap().get(TRACE_ID))
                .spanId(MDC.get(SPAN_ID))
                .build();

        Span span = tracer.spanBuilder().setParent(traceContext).name(name).start();

        return span;
    }
}
