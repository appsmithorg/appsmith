package com.appsmith.server.configurations;

import io.lettuce.core.codec.StringCodec;
import io.lettuce.core.output.StatusOutput;
import io.lettuce.core.protocol.AsyncCommand;
import io.lettuce.core.protocol.Command;
import io.lettuce.core.protocol.CommandType;
import io.lettuce.core.protocol.CommandWrapper;
import io.lettuce.core.protocol.RedisCommand;
import io.lettuce.core.resource.ClientResources;
import io.lettuce.core.tracing.Tracer;
import io.lettuce.core.tracing.Tracing;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import io.micrometer.observation.Observation;
import io.micrometer.observation.ObservationHandler;
import io.micrometer.observation.ObservationRegistry;
import io.micrometer.tracing.handler.DefaultTracingObservationHandler;
import io.micrometer.tracing.handler.PropagatingSenderTracingObservationHandler;
import io.micrometer.tracing.otel.bridge.OtelCurrentTraceContext;
import io.micrometer.tracing.otel.bridge.OtelPropagator;
import io.micrometer.tracing.otel.bridge.OtelTracer;
import io.opentelemetry.api.trace.StatusCode;
import io.opentelemetry.context.Context;
import io.opentelemetry.context.propagation.ContextPropagators;
import io.opentelemetry.sdk.trace.ReadWriteSpan;
import io.opentelemetry.sdk.trace.ReadableSpan;
import io.opentelemetry.sdk.trace.SdkTracerProvider;
import io.opentelemetry.sdk.trace.SpanProcessor;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.net.InetSocketAddress;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowable;

/**
 * Drives Redis command spans through the {@link ClientResources} that {@link RedisConfig} builds, with the same
 * Micrometer tracing handlers Spring Boot registers. A command cancelled while its span starts must not throw from
 * the cancel, and its span must end once.
 */
class RedisConfigTracingTest {

    private final List<ReadableSpan> endedSpans = new CopyOnWriteArrayList<>();

    private final AtomicReference<Runnable> beforeSpanStarts = new AtomicReference<>(() -> {});

    private SdkTracerProvider sdkTracerProvider;

    private ClientResources clientResources;

    @BeforeEach
    void setUp() {
        sdkTracerProvider = SdkTracerProvider.builder()
                .addSpanProcessor(new EndedSpanRecorder(endedSpans))
                .build();
        io.opentelemetry.api.trace.Tracer otelTracer = sdkTracerProvider.get("redis-config-tracing-test");
        OtelTracer tracer = new OtelTracer(otelTracer, new OtelCurrentTraceContext(), event -> {});
        OtelPropagator propagator = new OtelPropagator(ContextPropagators.noop(), otelTracer);

        ObservationRegistry observationRegistry = ObservationRegistry.create();
        observationRegistry
                .observationConfig()
                .observationHandler(new BeforeSpanStartHandler(beforeSpanStarts))
                .observationHandler(new ObservationHandler.FirstMatchingCompositeObservationHandler(
                        new PropagatingSenderTracingObservationHandler<>(tracer, propagator),
                        new DefaultTracingObservationHandler(tracer)));

        clientResources = new RedisConfig().clientResources(observationRegistry, new SimpleMeterRegistry());
    }

    @AfterEach
    void tearDown() {
        clientResources.shutdown();
        sdkTracerProvider.close();
    }

    @Test
    void should_endSpanOnceAndCancelNormally_when_commandIsCancelledWhileItsSpanStarts() {
        // Given
        CommandWrapper<String, String, String> command = new CommandWrapper<>(newGetCommand());
        AtomicReference<Throwable> cancelFailure = new AtomicReference<>();
        beforeSpanStarts.set(() -> cancelOnAnotherThread(command, cancelFailure));

        // When
        startSpan(command);

        // Then
        assertThat(cancelFailure.get()).isNull();
        assertThat(endedSpans).hasSize(1);
        assertThat(endedSpans.get(0).toSpanData().getStatus().getStatusCode()).isEqualTo(StatusCode.ERROR);
    }

    @Test
    void should_endSpanOnceAndStartNormally_when_commandIsCancelledBeforeItsSpanStarts() {
        // Given
        AsyncCommand<String, String, String> command = new AsyncCommand<>(newGetCommand());
        command.cancel(true);

        // When
        Throwable startFailure = catchThrowable(() -> startSpan(command));

        // Then
        assertThat(startFailure).isNull();
        assertThat(endedSpans).hasSize(1);
        assertThat(endedSpans.get(0).toSpanData().getStatus().getStatusCode()).isEqualTo(StatusCode.ERROR);
    }

    @Test
    void should_endSpanOnceWithoutError_when_commandCompletesAfterItsSpanStarts() {
        // Given
        CommandWrapper<String, String, String> command = new CommandWrapper<>(newGetCommand());
        startSpan(command);

        // When
        command.complete();

        // Then
        assertThat(endedSpans).hasSize(1);
        assertThat(endedSpans.get(0).toSpanData().getStatus().getStatusCode()).isNotEqualTo(StatusCode.ERROR);
    }

    /**
     * Starts a span the way Lettuce's {@code CommandHandler.attachTracing} does when it writes a command.
     */
    private void startSpan(RedisCommand<?, ?, ?> command) {
        Tracing tracing = clientResources.tracing();
        Tracer.Span span = tracing.getTracerProvider()
                .getTracer()
                .nextSpan(tracing.initialTraceContextProvider().getTraceContext());
        span.name(command.getType().toString());
        span.remoteEndpoint(tracing.createEndpoint(new InetSocketAddress("localhost", 6379)));
        span.start(command);
    }

    private static Command<String, String, String> newGetCommand() {
        return new Command<>(CommandType.GET, new StatusOutput<>(StringCodec.UTF8));
    }

    private static void cancelOnAnotherThread(CommandWrapper<?, ?, ?> command, AtomicReference<Throwable> failure) {
        Thread canceller = new Thread(() -> {
            try {
                command.cancel();
            } catch (Throwable e) {
                failure.set(e);
            }
        });
        canceller.start();
        try {
            canceller.join();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(e);
        }
    }

    /**
     * Registered before the tracing handlers, so it runs inside {@code Observation.start()} before the span exists.
     */
    private record BeforeSpanStartHandler(AtomicReference<Runnable> action)
            implements ObservationHandler<Observation.Context> {

        @Override
        public void onStart(Observation.Context context) {
            action.get().run();
        }

        @Override
        public boolean supportsContext(Observation.Context context) {
            return true;
        }
    }

    private record EndedSpanRecorder(List<ReadableSpan> endedSpans) implements SpanProcessor {

        @Override
        public void onStart(Context parentContext, ReadWriteSpan span) {}

        @Override
        public boolean isStartRequired() {
            return false;
        }

        @Override
        public void onEnd(ReadableSpan span) {
            endedSpans.add(span);
        }

        @Override
        public boolean isEndRequired() {
            return true;
        }
    }
}
