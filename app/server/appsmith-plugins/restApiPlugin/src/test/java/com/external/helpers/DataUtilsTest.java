package com.external.helpers;

import com.appsmith.external.models.Property;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.springframework.core.codec.ByteBufferEncoder;
import org.springframework.core.codec.CharSequenceEncoder;
import org.springframework.core.codec.DataBufferEncoder;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.HttpMethod;
import org.springframework.http.codec.EncoderHttpMessageWriter;
import org.springframework.http.codec.FormHttpMessageWriter;
import org.springframework.http.codec.HttpMessageWriter;
import org.springframework.http.codec.ResourceHttpMessageWriter;
import org.springframework.http.codec.ServerSentEventHttpMessageWriter;
import org.springframework.http.codec.json.Jackson2JsonEncoder;
import org.springframework.http.codec.multipart.MultipartHttpMessageWriter;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.mock.http.client.reactive.MockClientHttpRequest;
import org.springframework.web.reactive.function.BodyInserter;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.UnsupportedEncodingException;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotEquals;

public class DataUtilsTest {

    private DataUtils dataUtils;

    private BodyInserter.Context context;

    private Map<String, Object> hints;


    @Before
    public void createContext() {
        final List<HttpMessageWriter<?>> messageWriters = new ArrayList<>();
        messageWriters.add(new EncoderHttpMessageWriter<>(new ByteBufferEncoder()));
        messageWriters.add(new EncoderHttpMessageWriter<>(CharSequenceEncoder.textPlainOnly()));
        messageWriters.add(new ResourceHttpMessageWriter());
        Jackson2JsonEncoder jsonEncoder = new Jackson2JsonEncoder();
        messageWriters.add(new EncoderHttpMessageWriter<>(jsonEncoder));
        messageWriters.add(new EncoderHttpMessageWriter<>(new DataBufferEncoder()));
        messageWriters.add(new ServerSentEventHttpMessageWriter(jsonEncoder));
        messageWriters.add(new FormHttpMessageWriter());
        messageWriters.add(new EncoderHttpMessageWriter<>(CharSequenceEncoder.allMimeTypes()));
        messageWriters.add(new MultipartHttpMessageWriter(messageWriters));

        this.context = new BodyInserter.Context() {
            @Override
            public List<HttpMessageWriter<?>> messageWriters() {
                return messageWriters;
            }

            @Override
            public Optional<ServerHttpRequest> serverRequest() {
                return Optional.empty();
            }

            @Override
            public Map<String, Object> hints() {
                return hints;
            }
        };
        this.hints = new HashMap<>();
    }

    @Before
    public void setUp() {
        dataUtils = DataUtils.getInstance();
    }

    @Test
    public void testParseMultipartFileData_withEmptyList_returnsEmptyByteArray() {
        final BodyInserter<Object, MockClientHttpRequest> bodyInserter =
                (BodyInserter<Object, MockClientHttpRequest>) dataUtils.parseMultipartFileData(List.of());

        MockClientHttpRequest request = new MockClientHttpRequest(HttpMethod.GET, URI.create("https://example.com"));
        Mono<Void> result = bodyInserter.insert(request, this.context);
        StepVerifier.create(result).expectComplete().verify();
        StepVerifier.create(request.getBodyAsString())
                .expectNext("\"\"")
                .expectComplete()
                .verify();
    }

    @Test
    public void testParseMultipartFileData_withValidTextList_returnsExpectedBody() {
        List<Property> properties = new ArrayList<>();
        final Property p1 = new Property("nullType", "textData");
        properties.add(p1);
        final Property p2 = new Property("textType", "textData");
        p2.setType("text");
        properties.add(p2);

        final BodyInserter<Object, MockClientHttpRequest> bodyInserter =
                (BodyInserter<Object, MockClientHttpRequest>) dataUtils.parseMultipartFileData(properties);
        MockClientHttpRequest request = new MockClientHttpRequest(HttpMethod.GET, URI.create("https://example.com"));

        Mono<Void> result = bodyInserter.insert(request, this.context);
        StepVerifier.create(result).expectComplete().verify();
        StepVerifier.create(DataBufferUtils.join(request.getBody()))
                .consumeNextWith(dataBuffer -> {
                    byte[] resultBytes = new byte[dataBuffer.readableByteCount()];
                    dataBuffer.read(resultBytes);
                    DataBufferUtils.release(dataBuffer);
                    String content = new String(resultBytes, StandardCharsets.UTF_8);
                    Assert.assertTrue(content.contains(
                            "Content-Disposition: form-data; name=\"nullType\"\r\n" +
                                    "Content-Type: text/plain;charset=UTF-8\r\n" +
                                    "Content-Length: 8\r\n" +
                                    "\r\n" +
                                    "textData"));
                    Assert.assertTrue(content.contains(
                            "Content-Disposition: form-data; name=\"textType\"\r\n" +
                                    "Content-Type: text/plain;charset=UTF-8\r\n" +
                                    "Content-Length: 8\r\n" +
                                    "\r\n" +
                                    "textData"));
                })
                .expectComplete()
                .verify();
    }

    @Test
    public void testParseMultipartFileData_withValidFileList_returnsExpectedBody() {
        List<Property> properties = new ArrayList<>();
        final Property p1 = new Property("fileType", "{\"name\": \"test.json\", \"type\": \"application/json\", \"data\" : {}}");
        p1.setType("file");
        properties.add(p1);

        final BodyInserter<Object, MockClientHttpRequest> bodyInserter =
                (BodyInserter<Object, MockClientHttpRequest>) dataUtils.parseMultipartFileData(properties);
        MockClientHttpRequest request = new MockClientHttpRequest(HttpMethod.POST, URI.create("https://example.com"));

        Mono<Void> result = bodyInserter.insert(request, this.context);
        StepVerifier.create(result).expectComplete().verify();
        StepVerifier.create(DataBufferUtils.join(request.getBody()))
                .consumeNextWith(dataBuffer -> {
                    byte[] resultBytes = new byte[dataBuffer.readableByteCount()];
                    dataBuffer.read(resultBytes);
                    DataBufferUtils.release(dataBuffer);
                    String content = new String(resultBytes, StandardCharsets.UTF_8);
                    Assert.assertTrue(content.contains(
                            "Content-Disposition: form-data; name=\"fileType\"; filename=\"test.json\"\r\n" +
                                    "Content-Type: application/json\r\n" +
                                    "\r\n" +
                                    "{}"));
                })
                .expectComplete()
                .verify();
    }

    @Test
    public void testParseMultipartFileData_withValidMultipleFileList_returnsExpectedBody() {
        List<Property> properties = new ArrayList<>();
        final Property p1 = new Property("fileType", "[{\"name\": \"test1.json\", \"type\": \"application/json\", \"data\" : {}}, {\"name\": \"test2.json\", \"type\": \"application/json\", \"data\" : {}}]");
        p1.setType("file");
        properties.add(p1);

        final BodyInserter<Object, MockClientHttpRequest> bodyInserter =
                (BodyInserter<Object, MockClientHttpRequest>) dataUtils.parseMultipartFileData(properties);
        MockClientHttpRequest request = new MockClientHttpRequest(HttpMethod.POST, URI.create("https://example.com"));

        Mono<Void> result = bodyInserter.insert(request, this.context);
        StepVerifier.create(result).expectComplete().verify();
        StepVerifier.create(DataBufferUtils.join(request.getBody()))
                .consumeNextWith(dataBuffer -> {
                    byte[] resultBytes = new byte[dataBuffer.readableByteCount()];
                    dataBuffer.read(resultBytes);
                    DataBufferUtils.release(dataBuffer);
                    String content = new String(resultBytes, StandardCharsets.UTF_8);
                    Assert.assertTrue(content.contains(
                            "Content-Disposition: form-data; name=\"fileType\"; filename=\"test1.json\"\r\n" +
                                    "Content-Type: application/json\r\n" +
                                    "\r\n" +
                                    "{}"));

                    Assert.assertTrue(content.contains(
                            "Content-Disposition: form-data; name=\"fileType\"; filename=\"test2.json\"\r\n" +
                                    "Content-Type: application/json\r\n" +
                                    "\r\n" +
                                    "{}"));
                })
                .expectComplete()
                .verify();
    }

    @Test
    public void testParseFormData_withEncodingParamsToggleTrue_returnsEncodedString() throws UnsupportedEncodingException {
        final String encoded_value = dataUtils.parseFormData(List.of(new Property("key", "valüe")),
                true);
        String expected_value = null;
        try {
            expected_value = "key=" + URLEncoder.encode("valüe", StandardCharsets.UTF_8.toString());
        } catch (UnsupportedEncodingException e) {
            throw e;
        }
        assertEquals(expected_value, encoded_value);
    }

    @Test
    public void testParseFormData_withoutEncodingParamsToggleTrue_returnsEncodedString() throws UnsupportedEncodingException {
        final String encoded_value = dataUtils.parseFormData(List.of(new Property("key", "valüe")),
                false);
        String expected_value;
        try {
            expected_value = "key=" + URLEncoder.encode("valüe", StandardCharsets.UTF_8.toString());
        } catch (UnsupportedEncodingException e) {
            throw e;
        }
        assertNotEquals(expected_value, encoded_value);
    }

    @Test
    public void testParseFormData_withNullKeys_skipsNullProperty() {
        final String encoded_value = dataUtils.parseFormData(List.of(new Property(null, "v1"), new Property("k2", "v2")),
                false);
        assertEquals("k2=v2", encoded_value);
    }

    @Test
    public void testParseMultipartFileData_withNullKeys_skipsNullProperty() {
        List<Property> properties = new ArrayList<>();
        final Property p1 = new Property(null, "irrelevantValue");
        properties.add(p1);

        final BodyInserter<Object, MockClientHttpRequest> bodyInserter =
                (BodyInserter<Object, MockClientHttpRequest>) dataUtils.parseMultipartFileData(properties);
        MockClientHttpRequest request = new MockClientHttpRequest(HttpMethod.POST, URI.create("https://example.com"));

        Mono<Void> result = bodyInserter.insert(request, this.context);
        StepVerifier.create(result).expectComplete().verify();
        StepVerifier.create(DataBufferUtils.join(request.getBody()))
                .consumeNextWith(dataBuffer -> {
                    byte[] resultBytes = new byte[dataBuffer.readableByteCount()];
                    dataBuffer.read(resultBytes);
                    DataBufferUtils.release(dataBuffer);
                    String content = new String(resultBytes, StandardCharsets.UTF_8);
                    // Expect to not have any part
                    Assert.assertFalse(content.contains("Content-Disposition: form-data"));
                })
                .expectComplete()
                .verify();
    }
}