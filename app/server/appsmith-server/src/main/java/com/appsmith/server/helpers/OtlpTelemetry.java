package com.appsmith.server.helpers;

import io.opentelemetry.api.OpenTelemetry;
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.api.trace.SpanKind;
import io.opentelemetry.api.trace.Tracer;
import io.opentelemetry.api.trace.propagation.W3CTraceContextPropagator;
import io.opentelemetry.context.Context;
import io.opentelemetry.context.propagation.TextMapGetter;
import jakarta.annotation.Nullable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

import static org.apache.commons.lang3.StringUtils.isBlank;

class ExtractModel {

    private Map<String, String> headers;

    public void addHeader(String key, String value) {
        if (this.headers == null) {
            headers = new HashMap<>();
        }
        headers.put(key, value);
    }

    public Map<String, String> getHeaders() {
        return headers;
    }

    public void setHeaders(Map<String, String> headers) {
        this.headers = headers;
    }
}

@Component
public class OtlpTelemetry {
    private Tracer tracer = null;
    public static final String OTLP_HEADER_KEY = "traceparent-otlp";

    @Autowired
    public OtlpTelemetry(@Nullable OpenTelemetry openTelemetry) {

        if (openTelemetry != null) {
            this.tracer = openTelemetry.getTracer("Server");
        }
    }

    // when traces are initiated from the client side, its context is embedded in the traceparent request header
    // we use the function below to build the client's trace context
    private Context generateContextFromTraceHeader(String traceparent) {
        TextMapGetter<ExtractModel> getter = new TextMapGetter<>() {
            @Override
            public String get(ExtractModel carrier, String key) {
                if (carrier.getHeaders().containsKey(key)) {
                    return carrier.getHeaders().get(key);
                }
                return null;
            }

            @Override
            public Iterable<String> keys(ExtractModel carrier) {
                return carrier.getHeaders().keySet();
            }
        };
        ExtractModel model = new ExtractModel();
        model.addHeader("traceparent", traceparent);

        return W3CTraceContextPropagator.getInstance().extract(Context.current(), model, getter);
    }

    private Span startOTLPSpan(String spanName, Context context) {
        return tracer.spanBuilder(spanName)
                .setSpanKind(SpanKind.SERVER)
                .setParent(context)
                .startSpan();
    }
    // we build traces using the client's trace context as the parent context, So that any other spans generated
    // from the server appear as a subspan of the client
    public Span startOtlpSpanFromTraceparent(String spanName, String traceparent) {
        if (this.tracer == null) {
            return null;
        }
        if (isBlank(spanName) || isBlank(traceparent)) {
            return null;
        }
        Context context = generateContextFromTraceHeader(traceparent);
        return startOTLPSpan(spanName, context);
    }

    public void endOtlpSpanSafely(Span span) {
        if (span != null) {
            span.end();
        }
    }
}
