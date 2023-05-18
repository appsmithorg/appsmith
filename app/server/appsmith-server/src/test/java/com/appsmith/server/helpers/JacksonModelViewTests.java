package com.appsmith.server.helpers;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonView;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.Data;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class JacksonModelViewTests {
    
    interface Views {
        interface Public {}
        interface Internal extends Public {}
    }

    @Data
    public static class TestModelJsonIgnore {
        private String name = "name";
        @JsonIgnore
        private String password = "password";
        private String email = "email";
        private String phone = "phone";
        @JsonIgnore
        private String address = "address";
        private String city = "city";
    }

    private String JSON_OUT = "{\"name\":\"name\",\"email\":\"email\",\"phone\":\"phone\",\"city\":\"city\"}";

    @Data
    public static class TestModelJsonView {
        @JsonView(Views.Public.class)
        private String name = "name";
        @JsonView(Views.Internal.class)
        private String password = "password";
        @JsonView(Views.Public.class)
        private String email = "email";
        @JsonView(Views.Public.class)
        private String phone = "phone";
        @JsonView(Views.Internal.class)
        private String address = "address";
        @JsonView(Views.Public.class)
        private String city = "city";
    }

    private ObjectMapper objectMapper = new ObjectMapper();

    @Test
    public void test_whenJsonViewIsUsed_thenCorrect() throws JsonProcessingException {
        TestModelJsonView testModalJsonView = new TestModelJsonView();
        String value = objectMapper.writerWithView(Views.Public.class).writeValueAsString(testModalJsonView);
        assertEquals(value, JSON_OUT);
    }

    @Test
    public void test_whenJsonIgnoreIsUsed_thenCorrect() throws JsonProcessingException {
        TestModelJsonIgnore testModalJsonIgnore = new TestModelJsonIgnore();
        String value = objectMapper.writeValueAsString(testModalJsonIgnore);
        assertEquals(value, JSON_OUT);
    }

    @Test
    public void test_withJsonView_measureSerializingPerformance() throws JsonProcessingException {
        TestModelJsonView testModelJsonView = new TestModelJsonView();
        // Warm up
        for (int i = 0; i < 1000000; i++) {
            objectMapper.writerWithView(Views.Public.class).writeValueAsString(testModelJsonView);
        }
        // Measure
        long start = System.currentTimeMillis();
        for (int i = 0; i < 1000000; i++) {
            objectMapper.writerWithView(Views.Public.class).writeValueAsString(testModelJsonView);
        }
        long end = System.currentTimeMillis();
        log.info("test_withJsonView_measureSerializingPerformance: {} ms for 1000000 iterations", end - start);
    }

    @Test
    public void test_withJsonView_measureDeserializingPerformance() throws JsonProcessingException {
        // Warm up
        for (int i = 0; i < 1000000; i++) {
            objectMapper.readerWithView(Views.Public.class).forType(TestModelJsonView.class).readValue(JSON_OUT);
        }
        // Measure
        long start = System.currentTimeMillis();
        for (int i = 0; i < 1000000; i++) {
            objectMapper.readerWithView(Views.Public.class).forType(TestModelJsonView.class).readValue(JSON_OUT);
        }
        long end = System.currentTimeMillis();
        log.info("test_withJsonView_measureDeserializingPerformance: {} ms for 1000000 iterations", end - start);
    }

    @Test
    public void test_withJsonIgnore_measurePerformance() throws JsonProcessingException {
        TestModelJsonIgnore testModelJsonIgnore = new TestModelJsonIgnore();
        // Warm up
        for (int i = 0; i < 1000000; i++) {
            objectMapper.writeValueAsString(testModelJsonIgnore);
        }
        // Measure
        long start = System.currentTimeMillis();
        for (int i = 0; i < 1000000; i++) {
            objectMapper.writeValueAsString(testModelJsonIgnore);
        }
        long end = System.currentTimeMillis();
        log.info("test_withJsonIgnore_measureSerializingPerformance: {} ms for 1000000 iterations", end - start);
    }

    @Test
    public void test_withJsonIgnore_measureDeserializingPerformance() throws JsonProcessingException {
        // Warm up
        for (int i = 0; i < 1000000; i++) {
            objectMapper.readValue(JSON_OUT, TestModelJsonIgnore.class);
        }
        // Measure
        long start = System.currentTimeMillis();
        for (int i = 0; i < 1000000; i++) {
            objectMapper.readValue(JSON_OUT, TestModelJsonIgnore.class);
        }
        long end = System.currentTimeMillis();
        log.info("test_withJsonIgnore_measureDeserializingPerformance: {} ms for 1000000 iterations", end - start);
    }
}
