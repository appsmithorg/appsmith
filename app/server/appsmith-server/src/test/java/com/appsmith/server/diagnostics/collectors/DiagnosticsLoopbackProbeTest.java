package com.appsmith.server.diagnostics.collectors;

import com.appsmith.external.services.RTSCaller;
import com.appsmith.server.diagnostics.DiagnosticsValues;
import mockwebserver3.MockResponse;
import mockwebserver3.MockWebServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpMethod;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.IOException;
import java.net.InetAddress;
import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DiagnosticsLoopbackProbeTest {

    private static final String RTS_HEALTH_PATH = "/rts-api/v1/health-check";

    private static final WebClient HANGING_CLIENT =
            WebClient.builder().exchangeFunction(request -> Mono.never()).build();

    /** The loopback probes that report a status. */
    enum Probe {
        RTS,
        MCP
    }

    @Mock
    private RTSCaller rtsCaller;

    private MockWebServer server;

    @BeforeEach
    void setUp() throws IOException {
        server = new MockWebServer();
        server.start();
    }

    @AfterEach
    void tearDown() throws IOException {
        server.shutdown();
    }

    private static String baseUrl(MockWebServer webServer) {
        return "http://" + webServer.getHostName() + ":" + webServer.getPort();
    }

    /** Routes the RTS caller to {@code baseUrl}, as {@code RTSCallerCEImpl} does for 127.0.0.1. */
    private void givenRtsAt(String baseUrl, String path) {
        when(rtsCaller.get(path))
                .thenReturn(Mono.fromSupplier(
                        () -> WebClient.create(baseUrl).method(HttpMethod.GET).uri(path)));
    }

    /** Calls {@code probe} against an HTTP server at {@code baseUrl}. */
    private Mono<String> call(Probe probe, String baseUrl) {
        DiagnosticsLoopbackProbe loopbackProbe = DiagnosticsLoopbackProbe.withMcpBaseUrl(rtsCaller, baseUrl);
        if (probe == Probe.RTS) {
            givenRtsAt(baseUrl, RTS_HEALTH_PATH);
            return loopbackProbe.rts();
        }
        return loopbackProbe.mcp();
    }

    @ParameterizedTest
    @EnumSource(Probe.class)
    void should_returnUp_when_endpointReturns200(Probe probe) throws InterruptedException {
        // Given
        server.enqueue(new MockResponse().setResponseCode(200).setBody("ok"));

        // When
        Mono<String> result = call(probe, baseUrl(server));

        // Then
        StepVerifier.create(result).expectNext(DiagnosticsValues.UP).verifyComplete();
        String expectedPath = probe == Probe.RTS ? RTS_HEALTH_PATH : "/health";
        assertThat(server.takeRequest().getPath()).isEqualTo(expectedPath);
    }

    @ParameterizedTest
    @EnumSource(Probe.class)
    void should_returnDown_when_endpointReturns500(Probe probe) {
        // Given
        server.enqueue(new MockResponse().setResponseCode(500).setBody("mongodb://admin:hunter2@db.internal"));

        // When
        Mono<String> result = call(probe, baseUrl(server));

        // Then
        StepVerifier.create(result).expectNext(DiagnosticsValues.DOWN).verifyComplete();
    }

    @ParameterizedTest
    @EnumSource(Probe.class)
    void should_returnDown_when_endpointRedirects(Probe probe) throws IOException {
        // Given
        MockWebServer target = new MockWebServer();
        target.start();
        try {
            target.enqueue(new MockResponse().setResponseCode(200));
            server.enqueue(new MockResponse().setResponseCode(302).setHeader("Location", target.url("/health")));

            // When
            Mono<String> result = call(probe, baseUrl(server));

            // Then
            StepVerifier.create(result).expectNext(DiagnosticsValues.DOWN).verifyComplete();
            assertThat(target.getRequestCount()).isZero();
        } finally {
            target.shutdown();
        }
    }

    @ParameterizedTest
    @EnumSource(Probe.class)
    void should_returnDown_when_connectionRefused(Probe probe) throws IOException {
        // Given
        MockWebServer closed = new MockWebServer();
        closed.start();
        String closedUrl = baseUrl(closed);
        closed.shutdown();

        // When
        Mono<String> result = call(probe, closedUrl);

        // Then
        StepVerifier.create(result).expectNext(DiagnosticsValues.DOWN).verifyComplete();
    }

    @ParameterizedTest
    @EnumSource(Probe.class)
    void should_returnUnknown_when_endpointHangs(Probe probe) {
        // Given
        DiagnosticsLoopbackProbe loopbackProbe = new DiagnosticsLoopbackProbe(rtsCaller, HANGING_CLIENT);
        if (probe == Probe.RTS) {
            when(rtsCaller.get(RTS_HEALTH_PATH))
                    .thenReturn(Mono.fromSupplier(
                            () -> HANGING_CLIENT.method(HttpMethod.GET).uri(RTS_HEALTH_PATH)));
        }

        // When
        StepVerifier.withVirtualTime(() -> probe == Probe.RTS ? loopbackProbe.rts() : loopbackProbe.mcp())

                // Then
                .expectSubscription()
                .expectNoEvent(Duration.ofMillis(2999))
                .thenAwait(Duration.ofMillis(1))
                .expectNext(DiagnosticsValues.UNKNOWN)
                .expectComplete()
                .verify(Duration.ofSeconds(5));
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"   ", "abc", "80.5", "0", "-1", "65536", "99999999999"})
    void should_fallBackToDefaultMcpPort_when_portIsBlankNonNumericOrOutOfRange(String value) {
        // When
        int port = DiagnosticsLoopbackProbe.mcpPort(value);

        // Then
        assertThat(port).isEqualTo(DiagnosticsLoopbackProbe.DEFAULT_MCP_PORT);
    }

    @ParameterizedTest
    @ValueSource(strings = {"1", "8093", " 8093 ", "65535"})
    void should_useConfiguredMcpPort_when_portIsValid(String value) {
        // When
        int port = DiagnosticsLoopbackProbe.mcpPort(value);

        // Then
        assertThat(port).isEqualTo(Integer.parseInt(value.trim()));
    }

    @Test
    void should_probeConfiguredMcpPort_when_constructedWithPortString() throws IOException, InterruptedException {
        // Given
        MockWebServer loopback = new MockWebServer();
        loopback.start(InetAddress.getByName("127.0.0.1"), 0);
        try {
            loopback.enqueue(new MockResponse().setResponseCode(200));
            DiagnosticsLoopbackProbe loopbackProbe =
                    new DiagnosticsLoopbackProbe(rtsCaller, String.valueOf(loopback.getPort()));

            // When
            Mono<String> result = loopbackProbe.mcp();

            // Then
            StepVerifier.create(result).expectNext(DiagnosticsValues.UP).verifyComplete();
            assertThat(loopback.takeRequest().getPath()).isEqualTo("/health");
        } finally {
            loopback.shutdown();
        }
    }
}
