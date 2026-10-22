package com.appsmith.server.services.ce;

import com.appsmith.server.domains.Asset;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.AssetRepository;
import com.appsmith.server.services.AnalyticsService;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AssetServiceCEImplTest {

    private static final String SANDBOX_CSP =
            "sandbox; default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'";

    private static final String SVG_ATTACHMENT = "attachment; filename=\"asset.svg\"";

    @Mock
    private AssetRepository repository;

    @Mock
    private AnalyticsService analyticsService;

    @InjectMocks
    private AssetServiceCEImpl assetService;

    private HttpHeaders serveAsset(String contentType) {
        final Asset asset = new Asset(contentType, "asset-bytes".getBytes(StandardCharsets.UTF_8));
        when(repository.findById("asset-1")).thenReturn(Mono.just(asset));

        final MockServerWebExchange exchange =
                MockServerWebExchange.from(MockServerHttpRequest.get("/api/v1/assets/asset-1"));
        StepVerifier.create(assetService.makeImageResponse(exchange, "asset-1")).verifyComplete();
        return exchange.getResponse().getHeaders();
    }

    @ParameterizedTest
    @ValueSource(strings = {"image/png", "image/jpeg", "image/x-icon", "image/svg+xml"})
    void should_setNosniffAndSandboxCsp_when_servingAsset(String contentType) {
        // Given / When
        final HttpHeaders headers = serveAsset(contentType);

        // Then
        assertThat(headers.getFirst(HttpHeaders.CONTENT_TYPE)).isEqualTo(contentType);
        assertThat(headers.get("X-Content-Type-Options")).containsExactly("nosniff");
        assertThat(headers.get("Content-Security-Policy")).containsExactly(SANDBOX_CSP);
    }

    @ParameterizedTest
    @ValueSource(strings = {"image/svg+xml", "Image/SVG+XML; charset=utf-8", "not a media type"})
    void should_forceDownload_when_assetIsSvgOrHasUnparseableContentType(String contentType) {
        // Given / When
        final HttpHeaders headers = serveAsset(contentType);

        // Then
        assertThat(headers.get(HttpHeaders.CONTENT_DISPOSITION)).containsExactly(SVG_ATTACHMENT);
    }

    @ParameterizedTest
    @ValueSource(strings = {"image/png", "image/jpeg", "image/x-icon"})
    void should_notForceDownload_when_assetIsRasterImage(String contentType) {
        // Given / When
        final HttpHeaders headers = serveAsset(contentType);

        // Then
        assertThat(headers.containsKey(HttpHeaders.CONTENT_DISPOSITION)).isFalse();
    }

    static Stream<Arguments> rejectedUploads() {
        return Stream.of(
                Arguments.of(MediaType.valueOf("image/svg+xml"), "<svg xmlns=\"http://www.w3.org/2000/svg\"/>"),
                Arguments.of(MediaType.IMAGE_GIF, "GIF89a"),
                Arguments.of(MediaType.IMAGE_PNG, "{\"not\": \"an image\"}"));
    }

    @ParameterizedTest
    @MethodSource("rejectedUploads")
    void should_rejectWithAllowedFormatsMessage_when_uploadIsNotAnAllowedImage(MediaType contentType, String content) {
        // Given
        final FilePart filePart = Mockito.mock(FilePart.class, Mockito.RETURNS_DEEP_STUBS);
        when(filePart.headers().getContentType()).thenReturn(contentType);
        Mockito.lenient().when(filePart.content()).thenReturn(Flux.just((DataBuffer)
                new DefaultDataBufferFactory().wrap(content.getBytes(StandardCharsets.UTF_8))));
        final String expectedMessage = AppsmithError.VALIDATION_FAILURE.getMessage(
                "Please upload a valid image. Only JPEG, PNG and ICO are allowed.");

        // When
        final Mono<Asset> result = assetService.upload(List.of(filePart), 1024, false);

        // Then
        StepVerifier.create(result)
                .expectErrorSatisfies(error ->
                        assertThat(error).isInstanceOf(AppsmithException.class).hasMessage(expectedMessage))
                .verify();
        verify(repository, never()).save(any());
    }
}
