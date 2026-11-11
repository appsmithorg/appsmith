package com.appsmith.server.services.ce;

import com.appsmith.server.domains.Asset;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.AssetRepository;
import com.appsmith.server.services.AnalyticsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.Part;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AssetServiceCEImplTest {

    private static final String INVALID_IMAGE_MESSAGE = AppsmithError.VALIDATION_FAILURE.getMessage(
            "Please upload a valid image. Only JPEG, PNG and ICO are allowed.");

    @Mock
    private AssetRepository repository;

    @Mock
    private AnalyticsService analyticsService;

    @Mock
    private Part part;

    private AssetServiceCEImpl assetService;

    @BeforeEach
    void setUp() {
        assetService = new AssetServiceCEImpl(repository, analyticsService);
    }

    @Test
    void should_listOnlyAcceptedFormats_when_contentTypeIsSvg() {
        // Given
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.valueOf("image/svg+xml"));
        when(part.headers()).thenReturn(headers);

        // When
        Mono<Asset> result = assetService.upload(List.of(part), 1024, false);

        // Then
        StepVerifier.create(result)
                .expectErrorSatisfies(error ->
                        assertThat(error).isInstanceOf(AppsmithException.class).hasMessage(INVALID_IMAGE_MESSAGE))
                .verify();
    }

    @Test
    void should_listOnlyAcceptedFormats_when_pngContentIsNotAnImage() {
        // Given
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.IMAGE_PNG);
        when(part.headers()).thenReturn(headers);
        byte[] notAnImage = "{\"not\": \"an image\"}".getBytes(StandardCharsets.UTF_8);
        when(part.content()).thenReturn(Flux.just(DefaultDataBufferFactory.sharedInstance.wrap(notAnImage)));

        // When
        Mono<Asset> result = assetService.upload(List.of(part), 1024, false);

        // Then
        StepVerifier.create(result)
                .expectErrorSatisfies(error ->
                        assertThat(error).isInstanceOf(AppsmithException.class).hasMessage(INVALID_IMAGE_MESSAGE))
                .verify();
    }
}
