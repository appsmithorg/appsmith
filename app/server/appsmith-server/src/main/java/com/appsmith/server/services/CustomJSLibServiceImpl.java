package com.appsmith.server.services;

import com.appsmith.external.models.Policy;
import com.appsmith.server.domains.JSLib;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Set;

@Slf4j
@Service
public class CustomJSLibServiceImpl implements CustomJSLibService {
    @Override
    public Flux<JSLib> get(MultiValueMap<String, String> params) {
        return null;
    }

    @Override
    public Mono<JSLib> create(JSLib resource) {
        return null;
    }

    @Override
    public Mono<JSLib> update(String s, JSLib resource) {
        return null;
    }

    @Override
    public Mono<JSLib> getById(String s) {
        return null;
    }

    @Override
    public Mono<JSLib> delete(String s) {
        return null;
    }

    @Override
    public Mono<JSLib> addPolicies(String s, Set<Policy> policies) {
        return null;
    }

    @Override
    public Mono<JSLib> removePolicies(String s, Set<Policy> policies) {
        return null;
    }
}
