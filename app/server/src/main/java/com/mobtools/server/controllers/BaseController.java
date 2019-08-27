package com.mobtools.server.controllers;

import com.mobtools.server.domains.BaseDomain;
import com.mobtools.server.dtos.ResponseDto;
import com.mobtools.server.exceptions.MobtoolsException;
import com.mobtools.server.services.CrudService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import javax.validation.Valid;

@RequiredArgsConstructor
@Slf4j
public abstract class BaseController<S extends CrudService, T extends BaseDomain, ID> {

    protected final S service;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDto<T>> create(@Valid @RequestBody T resource) throws MobtoolsException {
        log.debug("Going to create resource {}", resource.getClass().getName());
        return service.create(resource)
                .map(created -> new ResponseDto<>(HttpStatus.CREATED.value(), created, null));
    }

    @GetMapping("")
    public Flux<ResponseDto<T>> getAll() {
        log.debug("Going to get all resources");
        return service.get()
                .map(resources -> new ResponseDto<>(HttpStatus.OK.value(), resources, null));
    }

    @GetMapping("/{id}")
    public Mono<ResponseDto<T>> getById(@PathVariable ID id) {
        log.debug("Going to get resource for id: {}", id);
        return service.getById(id)
                .map(resources -> new ResponseDto<>(HttpStatus.OK.value(), resources, null));
    }

    @PutMapping("/{id}")
    public Mono<ResponseDto<T>> update(@PathVariable ID id, @RequestBody T resource) throws Exception {
        log.debug("Going to update resource with id: {}", id);
        return service.update(id, resource)
                .map(updatedResource -> new ResponseDto<>(HttpStatus.OK.value(), updatedResource, null));
    }

}
