package com.appsmith.caching.test;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

import java.util.List;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.appsmith.caching.components.CacheManager;
import com.appsmith.caching.model.ArgumentModel;
import com.appsmith.caching.model.TestModel;
import com.appsmith.caching.service.CacheTestService;

import lombok.extern.slf4j.Slf4j;

@SpringBootTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@Slf4j
public class TestCachingMethods {

    @Autowired
    private CacheTestService cacheTestService;

    @Autowired
    private CacheManager cacheManager;

    /**
     * This Test is used to test the caching of a method that returns a Mono<T>
     */
    @Test
    public void testCacheAndEvictMono() {
        TestModel model = cacheTestService.getObjectFor("test1").block();
        TestModel model2 = cacheTestService.getObjectFor("test1").block();
        assertEquals(model, model2);

        cacheTestService.evictObjectFor("test1").block();

        // If not evicted with above call, this will return the same object
        model2 = cacheTestService.getObjectFor("test1").block();
        assertNotEquals(model, model2);
    }

    /**
     * This Test is used to test the caching of a method that returns a Flux<T>
     */
    @Test
    public void testCacheAndEvictFlux() {
        List<TestModel> model = cacheTestService.getListFor("test1").collectList().block();
        List<TestModel> model2 = cacheTestService.getListFor("test1").collectList().block();
        assertArrayEquals(model.toArray(), model2.toArray());

        cacheTestService.evictListFor("test1").block();

        // If not evicted with above call, this will return the same object
        model2 = cacheTestService.getListFor("test1").collectList().block();
        for(int i = model.size() - 1; i >= 0; i--) {
            assertNotEquals(model.get(i), model2.get(i));
        }
    }

    /**
     * This Test is used to test evict all
     */
    @Test
    public void testEvictAll() {
        TestModel model1 = cacheTestService.getObjectFor("test1").block();
        TestModel model2 = cacheTestService.getObjectFor("test2").block();

        cacheTestService.evictAllObjects().block();

        TestModel model1_2 = cacheTestService.getObjectFor("test1").block();
        TestModel model2_2 = cacheTestService.getObjectFor("test2").block();

        assertNotEquals(model1, model1_2);
        assertNotEquals(model2, model2_2);
    }

    /**
     * This Test is used to test SPEL expression in key field.
     */
    @Test
    public void testExpression() {
        TestModel model = cacheTestService.getObjectForWithKey(ArgumentModel.of("test1")).block();
        TestModel model2 = cacheTestService.getObjectForWithKey(ArgumentModel.of("test1")).block();
        assertEquals(model, model2);

        cacheTestService.evictObjectForWithKey("test1").block();

        // If not evicted with above call, this will return the same object
        model2 = cacheTestService.getObjectForWithKey(ArgumentModel.of("test1")).block();
        assertNotEquals(model, model2);
    }

    /**
     * Test to measure performance of caching
     */
    @Test
    public void measurePerformance() {
        // Cache first
        TestModel model1 = cacheTestService.getObjectFor("test1").block();
        long initialTime = System.nanoTime();
        int count = 100;
        for(int i = 0; i < count; i++) {
            cacheTestService.getObjectFor("test1").block();
        }
        long finalTime = System.nanoTime();
        long timeTaken = finalTime - initialTime;
        log.info("Time taken for cache operation " + (timeTaken / count) + " nanos");
    }

    /**
     * Log stats in the end
     */
    @AfterAll
    public void tearDown() {
        cacheManager.logStats();
    }
}
