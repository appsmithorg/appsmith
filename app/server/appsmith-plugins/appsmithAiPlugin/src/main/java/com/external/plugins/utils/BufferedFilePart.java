package com.external.plugins.utils;

import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferFactory;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.codec.multipart.FilePart;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.nio.file.Path;

/**
 * A {@link FilePart} backed by an in-memory byte array.
 *
 * <p>A streamed {@code FilePart}'s content is a single-use {@code Flux<DataBuffer>}: once it is read for
 * content-type inspection it cannot be read again to forward the file downstream. Buffering the bytes lets us
 * both inspect the file (via Tika) and replay it for the upstream AI server request. Its {@link #content()}
 * returns a fresh buffer on every subscription so it can be consumed more than once.
 */
public class BufferedFilePart implements FilePart {

    private static final DataBufferFactory DATA_BUFFER_FACTORY = DefaultDataBufferFactory.sharedInstance;

    private final String name;
    private final String filename;
    private final HttpHeaders headers;
    private final byte[] content;

    public BufferedFilePart(FilePart source, byte[] content) {
        this.name = source.name();
        this.filename = source.filename();
        this.headers = source.headers();
        this.content = content;
    }

    @Override
    public String name() {
        return name;
    }

    @Override
    public String filename() {
        return filename;
    }

    @Override
    public HttpHeaders headers() {
        return headers;
    }

    @Override
    public Flux<DataBuffer> content() {
        // Wrap in a fresh DataBuffer per subscription so the part can be forwarded after inspection.
        return Flux.just(DATA_BUFFER_FACTORY.wrap(content));
    }

    @Override
    public Mono<Void> transferTo(Path dest) {
        return DataBufferUtils.write(content(), dest);
    }
}
