package com.appsmith.server.controllers;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.CrudService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import reactor.core.publisher.Mono;

import javax.validation.Valid;
import java.util.List;

@RequiredArgsConstructor
@Slf4j
public abstract class BaseController<S extends CrudService, T extends BaseDomain, ID> {

    protected final S service;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<T>> create(@Valid @RequestBody T resource) throws AppsmithException {
        log.debug("Going to create resource {}", resource.getClass().getName());
        return service.create(resource)
                .map(created -> new ResponseDTO<>(HttpStatus.CREATED.value(), created, null));
    }

    @GetMapping("")
    public Mono<ResponseDTO<List<T>>> getAll(@RequestParam MultiValueMap<String, String> params) {
        log.debug("Going to get all resources");
        return service.get(params).collectList()
                .map(resources -> new ResponseDTO<>(HttpStatus.OK.value(), resources, null));
    }

    @GetMapping("/{id}")
    public Mono<ResponseDTO<T>> getById(@PathVariable ID id) {
        log.debug("Going to get resource for id: {}", id);
        return service.getById(id)
                .map(resources -> new ResponseDTO<>(HttpStatus.OK.value(), resources, null));
    }

    @PutMapping("/{id}")
    public Mono<ResponseDTO<T>> update(@PathVariable ID id, @RequestBody T resource) {
        log.debug("Going to update resource with id: {}", id);
        return service.update(id, resource)
                .map(updatedResource -> new ResponseDTO<>(HttpStatus.OK.value(), updatedResource, null));
    }

    @DeleteMapping("/{id}")
    public Mono<ResponseDTO<T>> delete(@PathVariable ID id) {
        log.debug("Going to delete resource with id: {}", id);
        return service.delete(id)
                .map(deletedResource -> new ResponseDTO<>(HttpStatus.OK.value(), deletedResource, null));
    }

}
