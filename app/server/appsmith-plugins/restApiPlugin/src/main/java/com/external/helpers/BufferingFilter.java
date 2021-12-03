package com.external.helpers;

import org.reactivestreams.Publisher;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.client.reactive.ClientHttpRequest;
import org.springframework.http.client.reactive.ClientHttpRequestDecorator;
import org.springframework.lang.NonNull;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import org.springframework.web.reactive.function.client.ExchangeFunction;
import reactor.core.publisher.Mono;

/**
 * This filter loads the request body in memory and calculates the content length of the body
 * It then adds this content length as a header to the original request
 */
public class BufferingFilter implements ExchangeFilterFunction {

    @Override
    @NonNull
    public Mono<ClientResponse> filter(@NonNull ClientRequest request, ExchangeFunction next) {
        return next.exchange(
                ClientRequest
                        .from(request)
                        .body((message, context) -> request
                                .body()
                                .insert(new BufferingRequestDecorator(message), context))
                        .build());
    }

    private static class BufferingRequestDecorator extends ClientHttpRequestDecorator {

        public BufferingRequestDecorator(ClientHttpRequest delegate) {
            super(delegate);
        }

        @Override
        @NonNull
        public Mono<Void> writeWith(@NonNull Publisher<? extends DataBuffer> body) {
            return DataBufferUtils
                    .join(body)
                    .flatMap(dataBuffer -> {
                        int length = dataBuffer.readableByteCount();
                        this.getDelegate().getHeaders().setContentLength(length);
                        return super.writeWith(body);
                    });
        }
    }
}
