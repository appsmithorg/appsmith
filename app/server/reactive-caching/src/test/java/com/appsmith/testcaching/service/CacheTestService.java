package com.appsmith.testcaching.service;

import com.appsmith.caching.annotations.Cache;
import com.appsmith.caching.annotations.CacheEvict;
import com.appsmith.testcaching.model.ArgumentModel;
import com.appsmith.testcaching.model.TestModel;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import uk.co.jemos.podam.api.PodamFactory;
import uk.co.jemos.podam.api.PodamFactoryImpl;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@Service
public class CacheTestService {

    PodamFactory factory = new PodamFactoryImpl();

    /**
     * This method is used to test the caching functionality for Mono<T>.
     * @param id The id
     * @return The Mono<TestModel> object, random every time
     */
    @Cache(cacheName = "objectcache")
    public Mono<TestModel> getObjectFor(String id) {
        TestModel model = factory.manufacturePojo(TestModel.class);
        model.setId(id);
        return Mono.just(model).delayElement(Duration.ofSeconds(2));
    }

    /**
     * This method is used to test the eviction functionality for Mono<T>.
     * @param id The id
     * @return Mono<Void> that completes after eviction
     */
    @CacheEvict(cacheName = "objectcache")
    public Mono<Void> evictObjectFor(String id) {
        return Mono.empty();
    }

    /**
     * This method is used to test eviction functionality for Mono<T>, complete cache.
     * @return Mono<Void> that completes after eviction
     */
    @CacheEvict(cacheName = "objectcache", all = true)
    public Mono<Void> evictAllObjects() {
        return Mono.empty();
    }

    /**
     * This method is used to test the caching functionality for Flux<T>.
     * @param id The id
     * @return The Flux<TestModel>, random every time
     */
    @Cache(cacheName = "listcache")
    public Flux<TestModel> getListFor(String id) {
        List<TestModel> testModels = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            TestModel model = factory.manufacturePojo(TestModel.class);
            model.setId(id);
            testModels.add(model);
        }
        return Flux.fromIterable(testModels).delayElements(Duration.ofMillis(200));
    }

    /**
     * This method is used to test the eviction functionality for Flux<T>.
     * @param id The id
     * @return Mono<Void> that completes after eviction
     */
    @CacheEvict(cacheName = "listcache")
    public Mono<Void> evictListFor(String id) {
        return Mono.empty();
    }

    /**
     * This method is used to test eviction functionality for Flux<T>, complete cache.
     * @return Mono<Void> that completes after eviction
     */
    @CacheEvict(cacheName = "listcache", all = true)
    public Mono<Void> evictAllLists() {
        return Mono.empty();
    }

    /**
     * This method is used to test SPEL expression in the caching annotation.
     * @param ArgumentModel The argument model
     * @return The Mono<TestModel> object, random every time
     */
    @Cache(cacheName = "objectcache1", key = "#argumentModel.name")
    public Mono<TestModel> getObjectForWithKey(ArgumentModel argumentModel) {
        TestModel model = factory.manufacturePojo(TestModel.class);
        model.setId(argumentModel.getName());
        return Mono.just(model).delayElement(Duration.ofSeconds(2));
    }

    /**
     * This method is used to test SPEL expression in the caching annotation.
     * Key generated will be same as getObjectForWithKey but with different expression
     * @param id The id
     * @return The Mono<Boolean> that will complete after the item is removed.
     */
    @CacheEvict(cacheName = "objectcache1", key = "#id")
    public Mono<Void> evictObjectForWithKey(String id) {
        return Mono.empty();
    }
}
