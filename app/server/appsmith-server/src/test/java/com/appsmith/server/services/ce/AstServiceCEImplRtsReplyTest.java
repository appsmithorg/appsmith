package com.appsmith.server.services.ce;

import com.appsmith.external.models.MustacheBindingToken;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.configurations.InstanceConfig;
import com.appsmith.server.helpers.RTSCallerImpl;
import io.micrometer.observation.ObservationRegistry;
import mockwebserver3.MockResponse;
import mockwebserver3.MockWebServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.entry;
import static org.mockito.Mockito.when;

/**
 * Drives the rename of a binding through the real RTS client. The JSON codecs must accept the replies RTS sends, so
 * this fails if Jackson 3 codecs replace the Jackson 2 ones on the classpath.
 */
@ExtendWith(MockitoExtension.class)
class AstServiceCEImplRtsReplyTest {

    @Mock
    private CommonConfig commonConfig;

    @Mock
    private InstanceConfig instanceConfig;

    private MockWebServer rtsServer;

    private AstServiceCEImpl astService;

    @BeforeEach
    void setUp() throws IOException {
        rtsServer = new MockWebServer();
        rtsServer.start();

        RTSCallerImpl rtsCaller = new RTSCallerImpl(ObservationRegistry.NOOP);
        ReflectionTestUtils.setField(rtsCaller, "rtsPort", String.valueOf(rtsServer.getPort()));
        ReflectionTestUtils.invokeMethod(rtsCaller, "makeWebClient");

        astService = new AstServiceCEImpl(commonConfig, instanceConfig, rtsCaller, ObservationRegistry.NOOP);
    }

    @AfterEach
    void tearDown() throws IOException {
        rtsServer.shutdown();
    }

    @Test
    void should_returnRefactoredBinding_when_rtsReplyOmitsReferenceCount() {
        // Given
        // RTS leaves referenceCount out of its entity-refactor reply, and the response class maps it to an int.
        rtsServer.enqueue(new MockResponse()
                .setBody("{\"success\":true,\"data\":{\"script\":\"Api123.data\",\"refactorCount\":1}}")
                .addHeader("Content-Type", "application/json"));
        when(instanceConfig.getIsRtsAccessible()).thenReturn(true);
        MustacheBindingToken binding = new MustacheBindingToken("Api1.data", 0, false);

        // When
        Mono<Map<MustacheBindingToken, String>> result = astService.replaceValueInMustacheKeys(
                Set.of(binding), "Api1", "Api123", 2, Pattern.compile("\\bApi1\\b"));

        // Then
        StepVerifier.create(result)
                .assertNext(replacements -> assertThat(replacements).containsOnly(entry(binding, "Api123.data")))
                .verifyComplete();
    }
}
