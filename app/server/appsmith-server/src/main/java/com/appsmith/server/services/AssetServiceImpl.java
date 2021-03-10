package com.appsmith.server.services;

import com.appsmith.server.domains.Asset;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.AssetRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.Part;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class AssetServiceImpl implements AssetService {

    private final AssetRepository repository;

    private final AnalyticsService analyticsService;

    private static final Set<MediaType> ALLOWED_CONTENT_TYPES = Set.of(MediaType.IMAGE_JPEG, MediaType.IMAGE_PNG);

    @Override
    public Mono<Asset> getById(String id) {
        return repository.findById(id);
    }

    @Override
    public Mono<Asset> upload(Part filePart, int maxFileSizeKB) {
        if (filePart == null) {
            return Mono.error(new AppsmithException(AppsmithError.VALIDATION_FAILURE, "Please upload a valid image."));
        }

        // The reason we restrict file types here is to avoid having to deal with dangerous image types such as SVG,
        // which can have arbitrary HTML/JS inside of them.
        final MediaType contentType = filePart.headers().getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            return Mono.error(new AppsmithException(
                    AppsmithError.VALIDATION_FAILURE,
                    "Please upload a valid image. Only JPEG and PNG are allowed."
            ));
        }

        final Flux<DataBuffer> contentCache = filePart.content().cache();

        return contentCache.count()
                .defaultIfEmpty(0L)
                .flatMap(count -> {
                    // Default implementation for the BufferFactory used breaks down the FilePart into chunks of 4KB.
                    // So we multiply the count of chunks with 4 to get an estimate on the file size in KB.
                    if (4 * count > maxFileSizeKB) {
                        return Mono.error(new AppsmithException(AppsmithError.PAYLOAD_TOO_LARGE, maxFileSizeKB));
                    }
                    return DataBufferUtils.join(contentCache);
                })
                .flatMap(dataBuffer -> {
                    byte[] data = new byte[dataBuffer.readableByteCount()];
                    dataBuffer.read(data);
                    DataBufferUtils.release(dataBuffer);
                    return repository.save(new Asset(contentType, data));
                })
                .flatMap(analyticsService::sendCreateEvent);
    }

    /**
     * This function hard-deletes (read: not archive) the asset given by the ID. It is intended to be used to delete an
     * old asset when a user uploads a new one. For example, when a new profile photo or an organization logo is,
     * uploaded, this method is used to completely delete the old one, if any.
     * @param assetId The ID string of the asset to delete.
     * @return empty Mono
     */
    @Override
    public Mono<Void> remove(String assetId) {
        final Asset tempAsset = new Asset();
        tempAsset.setId(assetId);
        return repository.deleteById(assetId)
                .then(analyticsService.sendDeleteEvent(tempAsset))
                .then();
    }

    @Override
    public Mono<Void> makeImageResponse(ServerWebExchange exchange, String assetId) {
        log.debug("Returning asset with ID '{}'.", assetId);
        return getById(assetId)
                .flatMap(asset -> {
                    final String contentType = asset.getContentType();
                    final ServerHttpResponse response = exchange.getResponse();

                    response.setStatusCode(HttpStatus.OK);

                    if (contentType != null) {
                        response.getHeaders().set(HttpHeaders.CONTENT_TYPE, contentType);
                    }

                    return response.writeWith(Mono.just(new DefaultDataBufferFactory().wrap(asset.getData())));
                });
    }

}
