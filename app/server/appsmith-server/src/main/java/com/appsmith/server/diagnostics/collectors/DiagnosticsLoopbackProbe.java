package com.appsmith.server.diagnostics.collectors;

import com.appsmith.external.services.RTSCaller;
import com.appsmith.server.diagnostics.DiagnosticsValues;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;
import reactor.netty.resources.ConnectionProvider;

import java.time.Duration;
import java.util.concurrent.TimeoutException;

/**
 * Probes the services that run next to the server on 127.0.0.1: RTS and MCP. A probe never follows a redirect, never
 * emits an error, and reads nothing from a response beyond its status code.
 */
@Component
public class DiagnosticsLoopbackProbe {

    static final Duration TIMEOUT = Duration.ofSeconds(3);

    /** The MCP port used when {@code appsmith.mcp.port} is blank, not an integer, or outside 1 to 65535. */
    static final int DEFAULT_MCP_PORT = 8092;

    private static final String RTS_HEALTH_PATH = "/rts-api/v1/health-check";
    private static final String MCP_HEALTH_PATH = "/health";

    private final RTSCaller rtsCaller;
    private final WebClient mcpClient;

    @Autowired
    public DiagnosticsLoopbackProbe(RTSCaller rtsCaller, @Value("${appsmith.mcp.port:}") String mcpPort) {
        this(rtsCaller, loopbackClient("http://127.0.0.1:" + mcpPort(mcpPort)));
    }

    DiagnosticsLoopbackProbe(RTSCaller rtsCaller, WebClient mcpClient) {
        this.rtsCaller = rtsCaller;
        this.mcpClient = mcpClient;
    }

    /** Builds a probe whose MCP client calls {@code mcpBaseUrl}. */
    static DiagnosticsLoopbackProbe withMcpBaseUrl(RTSCaller rtsCaller, String mcpBaseUrl) {
        return new DiagnosticsLoopbackProbe(rtsCaller, loopbackClient(mcpBaseUrl));
    }

    /** @return {@code value} as a port, or {@link #DEFAULT_MCP_PORT} when it is blank, not an integer, or out of range. */
    static int mcpPort(String value) {
        if (!StringUtils.hasText(value)) {
            return DEFAULT_MCP_PORT;
        }
        try {
            int port = Integer.parseInt(value.trim());
            return port >= 1 && port <= 65535 ? port : DEFAULT_MCP_PORT;
        } catch (NumberFormatException e) {
            return DEFAULT_MCP_PORT;
        }
    }

    /**
     * Builds the MCP client like {@code RTSCallerCEImpl} does. It does not use {@code WebClientUtils}, which denies
     * 127.0.0.1, the only host this client calls. Redirects and proxies are off.
     */
    private static WebClient loopbackClient(String baseUrl) {
        ConnectionProvider connectionProvider = ConnectionProvider.builder("diagnostics-mcp-provider")
                .maxConnections(2)
                .maxIdleTime(Duration.ofSeconds(30))
                .maxLifeTime(Duration.ofSeconds(40))
                .pendingAcquireTimeout(Duration.ofSeconds(10))
                .build();
        HttpClient httpClient =
                HttpClient.create(connectionProvider).followRedirect(false).noProxy();
        return WebClient.builder()
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .baseUrl(baseUrl)
                .build();
    }

    public Mono<String> rts() {
        return status(Mono.defer(() -> rtsCaller.get(RTS_HEALTH_PATH))
                .flatMap(spec -> spec.retrieve().toBodilessEntity()));
    }

    public Mono<String> mcp() {
        return status(
                Mono.defer(() -> mcpClient.get().uri(MCP_HEALTH_PATH).retrieve().toBodilessEntity()));
    }

    /** 2xx gives {@code UP}, a timeout gives {@code UNKNOWN}, and any other status or error gives {@code DOWN}. */
    private static Mono<String> status(Mono<? extends ResponseEntity<?>> response) {
        return response.map(entity ->
                        entity.getStatusCode().is2xxSuccessful() ? DiagnosticsValues.UP : DiagnosticsValues.DOWN)
                .timeout(TIMEOUT)
                .onErrorResume(error -> Mono.just(
                        error instanceof TimeoutException ? DiagnosticsValues.UNKNOWN : DiagnosticsValues.DOWN))
                .defaultIfEmpty(DiagnosticsValues.DOWN);
    }
}
