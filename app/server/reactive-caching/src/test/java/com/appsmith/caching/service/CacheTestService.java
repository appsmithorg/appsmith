package com.appsmith.caching.service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.appsmith.caching.annotations.ReactiveCacheEvict;
import com.appsmith.caching.annotations.ReactiveCacheable;
import com.appsmith.caching.model.ArgumentModel;
import com.appsmith.caching.model.TestModel;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import uk.co.jemos.podam.api.PodamFactory;
import uk.co.jemos.podam.api.PodamFactoryImpl;

@Service
public class CacheTestService {

    PodamFactory factory = new PodamFactoryImpl();

    // This function will always generate a random object
    @ReactiveCacheable(cacheName = "objectcache")
    public Mono<TestModel> getObjectFor(String id) {
        TestModel model = factory.manufacturePojo(TestModel.class);
        model.setId(id);
        return Mono.just(model).delayElement(Duration.ofSeconds(2));
    }

    @ReactiveCacheEvict(cacheName = "objectcache")
    public Mono<Void> evictObjectFor(String id) {
        return Mono.empty();
    }

    @ReactiveCacheEvict(cacheName = "objectcache", all = true)
    public Mono<Void> evictAllObjects() {
        return Mono.empty();
    }

    // This function will always generate a random list
    @ReactiveCacheable(cacheName = "listcache")
    public Flux<TestModel> getListFor(String id) {
        List<TestModel> testModels = new ArrayList<>();
        for(int i = 0;i < 5;i++) {
            TestModel model = factory.manufacturePojo(TestModel.class);
            model.setId(id);
            testModels.add(model);
        }
        return Flux.fromIterable(testModels).delayElements(Duration.ofMillis(200));
    }

    @ReactiveCacheEvict(cacheName = "listcache")
    public Mono<Void> evictListFor(String id) {
        return Mono.empty();
    }

    @ReactiveCacheEvict(cacheName = "listcache", all = true)
    public Mono<Void> evictAllLists() {
        return Mono.empty();
    }
    

    //methods for testing key name generation
    @ReactiveCacheable(cacheName = "objectcache1", key = "#argumentModel.name")
    public Mono<TestModel> getObjectForWithKey(ArgumentModel argumentModel) {
        TestModel model = factory.manufacturePojo(TestModel.class);
        model.setId(argumentModel.getName());
        return Mono.just(model).delayElement(Duration.ofSeconds(2));
    }

    //This method uses sifferent expression but generates same key
    @ReactiveCacheEvict(cacheName = "objectcache1", key = "#id")
    public Mono<Void> evictObjectForWithKey(String id) {
        return Mono.empty();
    }
}
