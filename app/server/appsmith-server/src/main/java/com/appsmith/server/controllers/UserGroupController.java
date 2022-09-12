package com.appsmith.server.controllers;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.UserGroupService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.validation.Valid;
import java.util.List;

@Slf4j
@RestController
@RequestMapping(Url.USER_GROUP_URL)
public class UserGroupController {

    UserGroupService service;

    @Autowired
    public UserGroupController(UserGroupService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<UserGroup>> create(@Valid @RequestBody UserGroup resource) {
        log.debug("Going to create resource from user group controller {}", resource.getClass().getName());
        return service.create(resource)
                .map(created -> new ResponseDTO<>(HttpStatus.CREATED.value(), created, null));
    }

    @GetMapping("")
    public Mono<ResponseDTO<List<UserGroup>>> getAll(@RequestParam MultiValueMap<String, String> params) {
        log.debug("Going to get all resources from user group controller {}", params);
        MultiValueMap<String, String> modifiableParams = new LinkedMultiValueMap<>(params);

        return service.get(modifiableParams).collectList()
                .map(resources -> new ResponseDTO<>(HttpStatus.OK.value(), resources, null));
    }

    @GetMapping("/{id}")
    public Mono<ResponseDTO<UserGroup>> getById(@PathVariable String id) {
        log.debug("Going to get resource from user group controller for id: {}", id);
        return service.getById(id)
                .map(resources -> new ResponseDTO<>(HttpStatus.OK.value(), resources, null));
    }

    @PutMapping("/{id}")
    public Mono<ResponseDTO<UserGroup>> update(@PathVariable String id,
                                       @RequestBody UserGroup resource,
                                       @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        log.debug("Going to update resource from user group controller with id: {}", id);
        return service.update(id, resource)
                .map(updatedResource -> new ResponseDTO<>(HttpStatus.OK.value(), updatedResource, null));
    }

    @DeleteMapping("/{id}")
    public Mono<ResponseDTO<UserGroup>> delete(@PathVariable String id) {
        log.debug("Going to delete resource from user group controller with id: {}", id);
        return service.archiveById(id)
                .map(deletedResource -> new ResponseDTO<>(HttpStatus.OK.value(), deletedResource, null));
    }

}
