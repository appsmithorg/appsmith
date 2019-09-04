package com.appsmith.server.controllers;

import com.appsmith.server.domains.BaseDomain;
import com.appsmith.server.dtos.ResponseDto;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.CrudService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import javax.validation.Valid;

@RequiredArgsConstructor
@Slf4j
public abstract class BaseController<S extends CrudService, T extends BaseDomain, ID> {

    protected final S service;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDto<T>> create(@Valid @RequestBody T resource) throws AppsmithException {
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
    public Mono<ResponseDto<T>> update(@PathVariable ID id, @RequestBody T resource) {
        log.debug("Going to update resource with id: {}", id);
        return service.update(id, resource)
                .map(updatedResource -> new ResponseDto<>(HttpStatus.OK.value(), updatedResource, null));
    }

}
