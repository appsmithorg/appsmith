package com.external.helpers;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import org.reactivestreams.Publisher;
import org.reactivestreams.Subscriber;
import org.reactivestreams.Subscription;
import org.springframework.core.ResolvableType;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferFactory;
import org.springframework.http.HttpCookie;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ReactiveHttpOutputMessage;
import org.springframework.http.client.reactive.ClientHttpRequest;
import org.springframework.http.codec.HttpMessageWriter;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserter;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Consumer;
import java.util.function.Supplier;

/**
 * This receiver essentially instantiates a custom ClientHttpRequest that stores the request body via a subscriber
 * The BodyInserter instance from our original request inserts into this subscriber that we can then retrieve
 * using receiveValue.
 *
 * We do this so that the received value that we display to the user is exactly the same as
 * the body tht is sent over the wire
 */
public class BodyReceiver {
    private static final Object DUMMY = new Object();

    private final AtomicReference<Object> reference = new AtomicReference<>(DUMMY);

    public Object receiveValue(BodyInserter<?, ? extends ReactiveHttpOutputMessage> bodyInserter) {
        demandValueFrom(bodyInserter);

        return receivedValue();
    }

    private void demandValueFrom(BodyInserter<?, ? extends ReactiveHttpOutputMessage> bodyInserter) {
        final BodyInserter<Object, MinimalHttpOutputMessage> inserter =
                (BodyInserter<Object, MinimalHttpOutputMessage>) bodyInserter;

        inserter.insert(
                MinimalHttpOutputMessage.INSTANCE,
                new SingleWriterContext(new WriteToConsumer<>(reference::set))
        );
    }

    private Object receivedValue() {
        Object value = reference.get();
        reference.set(DUMMY);

        Object validatedValue;

        if (value == DUMMY) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_ERROR,
                    "Value was not received, check if your inserter worked properly");
        } else {
            validatedValue = value;
        }

        return validatedValue;
    }

    static class WriteToConsumer<T> implements HttpMessageWriter<T> {

        private final Consumer<T> consumer;
        private final List<MediaType> mediaTypes;

        WriteToConsumer(Consumer<T> consumer) {
            this.consumer = consumer;
            this.mediaTypes = Collections.singletonList(MediaType.ALL);
        }

        @Override
        public List<MediaType> getWritableMediaTypes() {
            return mediaTypes;
        }

        @Override
        public boolean canWrite(ResolvableType elementType, MediaType mediaType) {
            return true;
        }

        @Override
        public Mono<Void> write(
                Publisher<? extends T> inputStream,
                ResolvableType elementType,
                MediaType mediaType,
                ReactiveHttpOutputMessage message,
                Map<String, Object> hints
        ) {
            inputStream.subscribe(new OneValueConsumption<>(consumer));
            return Mono.empty();
        }
    }

    static class MinimalHttpOutputMessage implements ClientHttpRequest {

        public static MinimalHttpOutputMessage INSTANCE = new MinimalHttpOutputMessage();

        private MinimalHttpOutputMessage() {
        }

        @Override
        public HttpHeaders getHeaders() {
            return HttpHeaders.EMPTY;
        }

        @Override
        public DataBufferFactory bufferFactory() {
            return null;
        }

        @Override
        public void beforeCommit(Supplier<? extends Mono<Void>> action) {
        }

        @Override
        public boolean isCommitted() {
            return false;
        }

        @Override
        public Mono<Void> writeWith(Publisher<? extends DataBuffer> body) {
            return null;
        }

        @Override
        public Mono<Void> writeAndFlushWith(Publisher<? extends Publisher<? extends DataBuffer>> body) {
            return null;
        }

        @Override
        public Mono<Void> setComplete() {
            return null;
        }

        @Override
        public HttpMethod getMethod() {
            return null;
        }

        @Override
        public URI getURI() {
            return null;
        }

        @Override
        public MultiValueMap<String, HttpCookie> getCookies() {
            return null;
        }
    }

    static class OneValueConsumption<T> implements Subscriber<T> {

        private final Consumer<T> consumer;
        private int remainedAccepts;

        public OneValueConsumption(Consumer<T> consumer) {
            this.consumer = Objects.requireNonNull(consumer);
            this.remainedAccepts = 1;
        }

        @Override
        public void onSubscribe(Subscription s) {
            s.request(1);
        }

        @Override
        public void onNext(T o) {
            if (remainedAccepts > 0) {
                consumer.accept(o);
                remainedAccepts -= 1;
            } else {
                throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "No more values can be consumed");
            }
        }

        @Override
        public void onError(Throwable t) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Single value was not consumed", t);
        }

        @Override
        public void onComplete() {
            // nothing
        }
    }

    static class SingleWriterContext implements BodyInserter.Context {

        private final List<HttpMessageWriter<?>> singleWriterList;

        SingleWriterContext(HttpMessageWriter<?> writer) {
            this.singleWriterList = List.of(writer);
        }

        @Override
        public List<HttpMessageWriter<?>> messageWriters() {
            return singleWriterList;
        }

        @Override
        public Optional<ServerHttpRequest> serverRequest() {
            return Optional.empty();
        }

        @Override
        public Map<String, Object> hints() {
            return null;
        }
    }
}
