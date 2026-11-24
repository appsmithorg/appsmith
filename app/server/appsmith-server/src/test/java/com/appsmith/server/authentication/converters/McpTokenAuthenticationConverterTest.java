package com.appsmith.server.authentication.converters;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.appsmith.server.authentication.tokens.McpTokenAuthentication;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.constants.FieldName;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import reactor.test.StepVerifier;

import java.net.InetSocketAddress;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class McpTokenAuthenticationConverterTest {

    private static final String SECRET = "internal-marker-secret";

    @Mock
    private CommonConfig commonConfig;

    private McpTokenAuthenticationConverter converter;

    private Logger converterLogger;

    private ListAppender<ILoggingEvent> logAppender;

    @BeforeEach
    void setUp() {
        when(commonConfig.getMcpInternalSecret()).thenReturn(SECRET);
        converter = new McpTokenAuthenticationConverter(commonConfig);
    }

    @Test
    void convert_identifiesMcpBearerToken_whenValidInternalMarkerPresent() {
        MockServerWebExchange exchange = exchangeWithBearer("mcp_token", SECRET);
        StepVerifier.create(converter.convert(exchange))
                .assertNext(authentication -> {
                    assertThat(authentication).isInstanceOf(McpTokenAuthentication.class);
                    assertThat(authentication.getCredentials()).isEqualTo("mcp_token");
                    assertThat(((McpTokenAuthentication) authentication).getClientAddress())
                            .isEqualTo("192.0.2.1");
                })
                .verifyComplete();
    }

    @Test
    void convert_rejectsMcpBearer_whenInternalMarkerMissing() {
        // A raw `Authorization: Bearer mcp_...` sent straight to /api/v1 (bypassing the loopback MCP service) has
        // no marker -> not authenticated -> falls through to .anyExchange().authenticated() -> 401.
        StepVerifier.create(converter.convert(exchangeWithBearer("mcp_token", null)))
                .verifyComplete();
    }

    @Test
    void convert_rejectsMcpBearer_whenInternalMarkerWrong() {
        StepVerifier.create(converter.convert(exchangeWithBearer("mcp_token", "wrong-secret")))
                .verifyComplete();
    }

    @Test
    void convert_failsClosed_whenInternalSecretUnset() {
        // Empty/unset APPSMITH_MCP_INTERNAL_SECRET must not authenticate any mcp_ token, even if the caller sends a
        // matching empty marker (mirrors the APPSMITH_INTERNAL_PASSWORD empty-string guard, GHSA-xfc5-796c-7hr9).
        when(commonConfig.getMcpInternalSecret()).thenReturn("");

        StepVerifier.create(converter.convert(exchangeWithBearer("mcp_token", "")))
                .verifyComplete();
        StepVerifier.create(converter.convert(exchangeWithBearer("mcp_token", null)))
                .verifyComplete();
    }

    @Test
    void checkInternalMarker_namesTheReasonForEachRefusal() {
        // The warning log prints this reason, so support can tell which side lost or changed the secret.
        assertThat(McpTokenAuthenticationConverter.checkInternalMarker(SECRET, SECRET))
                .isEqualTo(McpTokenAuthenticationConverter.InternalMarkerCheck.VALID);
        assertThat(McpTokenAuthenticationConverter.checkInternalMarker("", SECRET))
                .isEqualTo(McpTokenAuthenticationConverter.InternalMarkerCheck.SERVER_SECRET_UNSET);
        assertThat(McpTokenAuthenticationConverter.checkInternalMarker(null, SECRET))
                .isEqualTo(McpTokenAuthenticationConverter.InternalMarkerCheck.SERVER_SECRET_UNSET);
        assertThat(McpTokenAuthenticationConverter.checkInternalMarker("", ""))
                .isEqualTo(McpTokenAuthenticationConverter.InternalMarkerCheck.SERVER_SECRET_UNSET);
        assertThat(McpTokenAuthenticationConverter.checkInternalMarker(SECRET, null))
                .isEqualTo(McpTokenAuthenticationConverter.InternalMarkerCheck.MARKER_HEADER_MISSING);
        assertThat(McpTokenAuthenticationConverter.checkInternalMarker(SECRET, ""))
                .isEqualTo(McpTokenAuthenticationConverter.InternalMarkerCheck.MARKER_HEADER_MISSING);
        assertThat(McpTokenAuthenticationConverter.checkInternalMarker(SECRET, "wrong-secret"))
                .isEqualTo(McpTokenAuthenticationConverter.InternalMarkerCheck.MARKER_MISMATCH);
    }

    @Test
    void convert_logsTheRejectionReasonWithoutTheSecretOrHeaderValue() {
        ListAppender<ILoggingEvent> logs = captureConverterLogs();

        StepVerifier.create(converter.convert(exchangeWithBearer("mcp_token", "wrong-secret")))
                .verifyComplete();

        assertThat(logs.list).hasSize(1);
        ILoggingEvent event = logs.list.get(0);
        assertThat(event.getLevel()).isEqualTo(Level.WARN);
        assertThat(event.getFormattedMessage())
                .contains("reason=MARKER_MISMATCH")
                .contains("GET /api/v1/users/me")
                .contains("from 192.0.2.1")
                .doesNotContain(SECRET)
                .doesNotContain("wrong-secret")
                .doesNotContain("mcp_token");
    }

    @Test
    void convert_logsNothing_whenInternalMarkerIsValid() {
        ListAppender<ILoggingEvent> logs = captureConverterLogs();

        StepVerifier.create(converter.convert(exchangeWithBearer("mcp_token", SECRET)))
                .expectNextCount(1)
                .verifyComplete();

        assertThat(logs.list).isEmpty();
    }

    // Detaches the log capture that captureConverterLogs attached, so it never leaks into another test.
    @AfterEach
    void tearDownLogCapture() {
        if (converterLogger != null && logAppender != null) {
            converterLogger.detachAppender(logAppender);
        }
    }

    private ListAppender<ILoggingEvent> captureConverterLogs() {
        converterLogger = (Logger) LoggerFactory.getLogger(McpTokenAuthenticationConverter.class);
        logAppender = new ListAppender<>();
        logAppender.start();
        converterLogger.addAppender(logAppender);
        return logAppender;
    }

    @Test
    void convert_preservesNonMcpBearerForOtherAuthenticationMechanisms() {
        StepVerifier.create(converter.convert(exchangeWithBearer("ordinary_bearer_token", SECRET)))
                .verifyComplete();
    }

    private MockServerWebExchange exchangeWithBearer(String token, String marker) {
        MockServerHttpRequest.BaseBuilder<?> builder = MockServerHttpRequest.get("/api/v1/users/me")
                .remoteAddress(new InetSocketAddress("192.0.2.1", 8080))
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token);
        if (marker != null) {
            builder = builder.header(FieldName.INTERNAL_MARKER, marker);
        }
        return MockServerWebExchange.from(builder);
    }
}
