package com.mobtools.server.controllers;

import com.mobtools.server.domains.BaseDomain;
import com.mobtools.server.dtos.ResponseDto;
import com.mobtools.server.services.CrudService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import javax.validation.Valid;

@RequiredArgsConstructor
public abstract class BaseController<S extends CrudService, T extends BaseDomain, ID> {

    private final S service;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDto<T>> create(@Valid @RequestBody T resource) {
        return service.create(resource)
                .map(created -> new ResponseDto<>(HttpStatus.CREATED.value(), created, null));
    }

    @GetMapping("")
    public Flux<ResponseDto<T>> getAll() {
        return service.get()
                .map(resources -> new ResponseDto<>(HttpStatus.OK.value(), resources, null));
    }

    @GetMapping("/{id}")
    public Mono<ResponseDto<T>> getById(@PathVariable ID id) {
        return service.getById(id)
                .map(resources -> new ResponseDto<>(HttpStatus.OK.value(), resources, null));
    }

    @PutMapping("/{id}")
    public Mono<ResponseDto<T>> update(@PathVariable ID id, @RequestBody T resource) throws Exception {
        return service.update(id, resource)
                .map(updatedResource -> new ResponseDto<>(HttpStatus.OK.value(), updatedResource, null));
    }

}
