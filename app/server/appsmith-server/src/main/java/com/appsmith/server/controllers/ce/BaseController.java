package com.appsmith.server.controllers.ce;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.CrudService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.validation.Valid;
import java.util.List;

@RequiredArgsConstructor
@Slf4j
public abstract class BaseController<S extends CrudService<T, ID>, T extends BaseDomain, ID> {

    protected final S service;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<T>> create(@Valid @RequestBody T resource,
                                       @RequestHeader(name = "Origin", required = false) String originHeader,
                                       ServerWebExchange exchange) {
        log.debug("Going to create resource from base controller {}", resource.getClass().getName());
        return service.create(resource)
                .map(created -> new ResponseDTO<>(HttpStatus.CREATED.value(), created, null));
    }

    /**
     * TODO : Remove this function completely if this is not being used.
     * If not, atleast remove it for :
     * 1. Page
     * 2. Datasources
     * @param params
     * @return
     */
    @GetMapping("")
    public Mono<ResponseDTO<List<T>>> getAll(@RequestParam MultiValueMap<String, String> params,
                                             @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        log.debug("Going to get all resources from base controller {}", params);
        MultiValueMap<String, String> modifiableParams = new LinkedMultiValueMap<>(params);
        if (!StringUtils.isEmpty(branchName)) {
            modifiableParams.add(FieldName.DEFAULT_RESOURCES + "." + FieldName.BRANCH_NAME, branchName);
        }
        return service.get(modifiableParams).collectList()
                .map(resources -> new ResponseDTO<>(HttpStatus.OK.value(), resources, null));
    }

    @GetMapping("/{id}")
    public Mono<ResponseDTO<T>> getByIdAndBranchName(@PathVariable ID id,
                                        @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        log.debug("Going to get resource from base controller for id: {}", id);
        return service.findByIdAndBranchName(id, branchName)
                .map(resources -> new ResponseDTO<>(HttpStatus.OK.value(), resources, null));
    }

    @PutMapping("/{id}")
    public Mono<ResponseDTO<T>> update(@PathVariable ID id,
                                       @RequestBody T resource,
                                       @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        log.debug("Going to update resource from base controller with id: {}", id);
        return service.update(id, resource)
                .map(updatedResource -> new ResponseDTO<>(HttpStatus.OK.value(), updatedResource, null));
    }

    @DeleteMapping("/{id}")
    public Mono<ResponseDTO<T>> delete(@PathVariable ID id,
                                       @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        log.debug("Going to delete resource from base controller with id: {}", id);
        return service.deleteByIdAndBranchName(id, branchName)
                .map(deletedResource -> new ResponseDTO<>(HttpStatus.OK.value(), deletedResource, null));
    }

}
