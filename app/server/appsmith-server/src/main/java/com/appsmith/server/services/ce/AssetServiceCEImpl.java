package com.appsmith.server.services.ce;

import com.appsmith.server.domains.Asset;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.AssetRepository;
import com.appsmith.server.services.AnalyticsService;
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
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.constants.Constraint.THUMBNAIL_PHOTO_DIMENSION;

@Slf4j
@RequiredArgsConstructor
public class AssetServiceCEImpl implements AssetServiceCE {

    private final AssetRepository repository;

    private final AnalyticsService analyticsService;

    private static final Set<MediaType> ALLOWED_CONTENT_TYPES = Set.of(
            MediaType.IMAGE_JPEG,
            MediaType.IMAGE_PNG,
            MediaType.valueOf("image/svg+xml"),
            MediaType.valueOf("image/x-icon"),
            MediaType.valueOf("image/vnd.microsoft.icon")
    );

    @Override
    public Mono<Asset> getById(String id) {
        return repository.findById(id);
    }

    @Override
    public Mono<Asset> upload(List<Part> fileParts, int maxFileSizeKB, boolean isThumbnail) {
        fileParts = fileParts.stream().filter(Objects::nonNull).collect(Collectors.toList());

        if (fileParts.isEmpty()) {
            return Mono.error(new AppsmithException(AppsmithError.VALIDATION_FAILURE, "Please upload a valid image."));
        }

        final Part firstPart = fileParts.get(0);

        // The reason we restrict file types here is to avoid having to deal with dangerous image types such as SVG,
        // which can have arbitrary HTML/JS inside them.
        final MediaType contentType = firstPart.headers().getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            return Mono.error(new AppsmithException(
                    AppsmithError.VALIDATION_FAILURE,
                    "Please upload a valid image. Only JPEG, PNG, SVG and ICO are allowed."
            ));
        }

        final Flux<DataBuffer> contentCache = Flux.fromIterable(fileParts).flatMap(Part::content).cache();

        return contentCache
                .map(DataBuffer::readableByteCount)
                .reduce(Integer::sum)
                .flatMap(size -> {
                    if (size > maxFileSizeKB * 1024) {
                        return Mono.error(new AppsmithException(AppsmithError.PAYLOAD_TOO_LARGE, maxFileSizeKB));
                    }
                    return DataBufferUtils.join(contentCache);
                })
                .flatMap(dataBuffer -> {
                    try {
                        return repository.save(createAsset(dataBuffer, contentType, isThumbnail));
                    } catch (IOException e) {
                        log.error("failed to upload image", e);
                        return Mono.error(new AppsmithException(AppsmithError.GENERIC_BAD_REQUEST, "Upload image"));
                    }
                })
                .flatMap(analyticsService::sendCreateEvent);
    }

    /**
     * This function hard-deletes (read: not archive) the asset given by the ID. It is intended to be used to delete an
     * old asset when a user uploads a new one. For example, when a new profile photo or a workspace logo is,
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

    private Asset createAsset(DataBuffer dataBuffer, MediaType srcContentType, boolean createThumbnail) throws IOException {
        byte[] imageData = null;
        MediaType contentType = srcContentType;

        if (createThumbnail) {
            try {
                imageData = resizeImage(dataBuffer);
            } finally {
                // The `resizeImage` function, calls `ImageIO.read` which changes the read position of this `dataBuffer`.
                // This becomes a problem for us, since we attempt to read it ourselves, if the image is not resized.
                dataBuffer.readPosition(0);
            }
        }

        if (imageData != null) {
            // A JPEG thumbnail creation was successful.
            contentType = MediaType.IMAGE_JPEG;
        } else {
            imageData = new byte[dataBuffer.readableByteCount()];
            dataBuffer.read(imageData);
        }

        DataBufferUtils.release(dataBuffer);
        return new Asset(contentType, imageData);
    }

    private byte[] resizeImage(DataBuffer dataBuffer) throws IOException {
        int dimension = THUMBNAIL_PHOTO_DIMENSION;
        BufferedImage bufferedImage = ImageIO.read(dataBuffer.asInputStream());
        if (bufferedImage == null) {
            // This is true for SVG and ICO images.
            return null;
        }
        Image scaledImage = bufferedImage.getScaledInstance(dimension, dimension, Image.SCALE_SMOOTH);
        BufferedImage imageBuff = new BufferedImage(dimension, dimension, BufferedImage.TYPE_INT_RGB);
        imageBuff.getGraphics().drawImage(scaledImage, 0, 0, new Color(0,0,0), null);
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        ImageIO.write(imageBuff, "jpg", buffer);
        byte[] data = buffer.toByteArray();
        buffer.close();
        DataBufferUtils.release(dataBuffer);
        return data;
    }

    @Override
    public Mono<Void> makeImageResponse(ServerWebExchange exchange, String assetId) {
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
