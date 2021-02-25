package com.appsmith.server.services;

import com.appsmith.server.domains.Asset;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.AssetRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.codec.multipart.Part;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Slf4j
@Service
@RequiredArgsConstructor
public class AssetServiceImpl implements AssetService {

    private final AssetRepository repository;

    private final AnalyticsService analyticsService;

    @Override
    public Mono<Asset> getById(String id) {
        return repository.findById(id);
    }

    @Override
    public Mono<Asset> upload(Part filePart, int maxFileSizeKB) {
        if (filePart == null || filePart.headers().getContentType() == null) {
            return Mono.error(new AppsmithException(AppsmithError.VALIDATION_FAILURE, "Please upload a valid image."));
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
                    return repository.save(new Asset(filePart.headers().getContentType(), data));
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

}
