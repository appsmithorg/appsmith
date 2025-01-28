package com.appsmith.server.helpers;

import com.appsmith.external.helpers.ObservationHelper;
import com.appsmith.server.configurations.CommonConfig;
import io.micrometer.tracing.Span;
import io.micrometer.tracing.TraceContext;
import io.micrometer.tracing.Tracer;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Optional;

import static com.appsmith.external.constants.MDCConstants.SPAN_ID;
import static com.appsmith.external.constants.MDCConstants.TRACE_ID;

@Component
public class ObservationHelperImpl implements ObservationHelper {

    private final Tracer tracer;
    private final CommonConfig commonConfig;

    public ObservationHelperImpl(Optional<Tracer> tracer, CommonConfig commonConfig) {
        this.commonConfig = commonConfig;
        this.tracer = tracer.orElse(Tracer.NOOP);
    }

    @Override
    public Span createSpan(String name) {
        Map<String, String> contextMap = MDC.getCopyOfContextMap();
        if (contextMap == null || !contextMap.containsKey(TRACE_ID) || !contextMap.containsKey(SPAN_ID)) {
            return Span.NOOP;
        } else {
            TraceContext traceContext = tracer.traceContextBuilder()
                    .sampled(true)
                    .traceId(contextMap.get(TRACE_ID))
                    .spanId(contextMap.get(SPAN_ID))
                    .build();

            Span span = tracer.spanBuilder().setParent(traceContext).name(name).start();

            return span;
        }
    }

    @Override
    public Span startSpan(Span span, boolean isDetail) {
        if (!isDetail || commonConfig.isTracingDetail()) {
            return span.start();
        } else {
            return span;
        }
    }

    @Override
    public void endSpan(Span span, boolean isDetail) {
        if (!isDetail || commonConfig.isTracingDetail()) {
            span.end();
        }
    }
}
