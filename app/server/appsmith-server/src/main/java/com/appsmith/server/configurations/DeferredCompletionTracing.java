package com.appsmith.server.configurations;

import io.lettuce.core.output.CommandOutput;
import io.lettuce.core.protocol.CommandArgs;
import io.lettuce.core.protocol.CompleteableCommand;
import io.lettuce.core.protocol.ProtocolKeyword;
import io.lettuce.core.protocol.RedisCommand;
import io.lettuce.core.tracing.TraceContext;
import io.lettuce.core.tracing.TraceContextProvider;
import io.lettuce.core.tracing.Tracer;
import io.lettuce.core.tracing.TracerProvider;
import io.lettuce.core.tracing.Tracing;
import io.netty.buffer.ByteBuf;

import java.net.SocketAddress;
import java.util.ArrayList;
import java.util.List;
import java.util.function.BiConsumer;
import java.util.function.Consumer;

/**
 * Wraps a Lettuce {@link Tracing} so that a span handles its command's completion only after
 * {@link Tracer.Span#start} has returned.
 *
 * <p>Lettuce starts a span on the event loop, but a reactive command can be cancelled from any thread. The Micrometer
 * span implementations register their completion callback before they start their observation. A cancel that lands in
 * between runs the callback against an observation that has not started, and Micrometer Tracing throws
 * {@code IllegalStateException: Span wasn't started} out of {@code Subscription.cancel()}. The request whose pipeline
 * cancelled the command then fails. Same race upstream: https://github.com/redis/lettuce/issues/3987.
 */
final class DeferredCompletionTracing implements Tracing {

    private final Tracing delegate;

    DeferredCompletionTracing(Tracing delegate) {
        this.delegate = delegate;
    }

    @Override
    public TracerProvider getTracerProvider() {
        TracerProvider tracerProvider = delegate.getTracerProvider();
        return () -> new DeferredCompletionTracer(tracerProvider.getTracer());
    }

    @Override
    public TraceContextProvider initialTraceContextProvider() {
        return delegate.initialTraceContextProvider();
    }

    @Override
    public boolean isEnabled() {
        return delegate.isEnabled();
    }

    @Override
    public boolean includeCommandArgsInSpanTags() {
        return delegate.includeCommandArgsInSpanTags();
    }

    @Override
    public Endpoint createEndpoint(SocketAddress socketAddress) {
        return delegate.createEndpoint(socketAddress);
    }

    private static final class DeferredCompletionTracer extends Tracer {

        private final Tracer delegate;

        private DeferredCompletionTracer(Tracer delegate) {
            this.delegate = delegate;
        }

        @Override
        public Span nextSpan() {
            return new DeferredCompletionSpan(delegate.nextSpan());
        }

        @Override
        public Span nextSpan(TraceContext traceContext) {
            return new DeferredCompletionSpan(delegate.nextSpan(traceContext));
        }
    }

    private static final class DeferredCompletionSpan extends Tracer.Span {

        private final Tracer.Span delegate;

        private DeferredCompletionSpan(Tracer.Span delegate) {
            this.delegate = delegate;
        }

        @Override
        public Tracer.Span start(RedisCommand<?, ?, ?> command) {
            if (!(command instanceof CompleteableCommand<?>)) {
                delegate.start(command);
                return this;
            }
            DeferredCompletionCommand<?, ?, ?> deferredCommand = new DeferredCompletionCommand<>(command);
            delegate.start(deferredCommand);
            deferredCommand.release();
            return this;
        }

        @Override
        public Tracer.Span name(String name) {
            delegate.name(name);
            return this;
        }

        @Override
        public Tracer.Span annotate(String value) {
            delegate.annotate(value);
            return this;
        }

        @Override
        public Tracer.Span tag(String key, String value) {
            delegate.tag(key, value);
            return this;
        }

        @Override
        public Tracer.Span error(Throwable throwable) {
            delegate.error(throwable);
            return this;
        }

        @Override
        public Tracer.Span remoteEndpoint(Endpoint endpoint) {
            delegate.remoteEndpoint(endpoint);
            return this;
        }

        @Override
        public void finish() {
            delegate.finish();
        }
    }

    /**
     * Stands in for the real command while the span starts. It forwards every call, but holds the completion callbacks
     * the span registers until {@link #release()}. Each callback still registers on the real command before the span
     * starts its observation, because Lettuce does not run a callback added after the command has completed.
     */
    private static final class DeferredCompletionCommand<K, V, T>
            implements RedisCommand<K, V, T>, CompleteableCommand<T> {

        private final RedisCommand<K, V, T> command;

        private final List<Runnable> heldCallbacks = new ArrayList<>();

        private boolean released;

        private DeferredCompletionCommand(RedisCommand<K, V, T> command) {
            this.command = command;
        }

        void release() {
            List<Runnable> callbacks;
            synchronized (this) {
                released = true;
                callbacks = List.copyOf(heldCallbacks);
                heldCallbacks.clear();
            }
            callbacks.forEach(Runnable::run);
        }

        private void runWhenReleased(Runnable callback) {
            synchronized (this) {
                if (!released) {
                    heldCallbacks.add(callback);
                    return;
                }
            }
            callback.run();
        }

        @SuppressWarnings("unchecked")
        private CompleteableCommand<T> completeableCommand() {
            return (CompleteableCommand<T>) command;
        }

        @Override
        public void onComplete(Consumer<? super T> action) {
            completeableCommand().onComplete(value -> runWhenReleased(() -> action.accept(value)));
        }

        @Override
        public void onComplete(BiConsumer<? super T, Throwable> action) {
            completeableCommand().onComplete((value, error) -> runWhenReleased(() -> action.accept(value, error)));
        }

        @Override
        public CommandOutput<K, V, T> getOutput() {
            return command.getOutput();
        }

        @Override
        public void complete() {
            command.complete();
        }

        @Override
        public boolean completeExceptionally(Throwable throwable) {
            return command.completeExceptionally(throwable);
        }

        @Override
        public void cancel() {
            command.cancel();
        }

        @Override
        public CommandArgs<K, V> getArgs() {
            return command.getArgs();
        }

        @Override
        public ProtocolKeyword getType() {
            return command.getType();
        }

        @Override
        public void encode(ByteBuf buf) {
            command.encode(buf);
        }

        @Override
        public boolean isCancelled() {
            return command.isCancelled();
        }

        @Override
        public boolean isDone() {
            return command.isDone();
        }

        @Override
        public void setOutput(CommandOutput<K, V, T> output) {
            command.setOutput(output);
        }

        @Override
        public String toString() {
            return command.toString();
        }
    }
}
