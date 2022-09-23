package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.PermissionGroupService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import javax.validation.Valid;
import java.util.List;

@Slf4j
@RequestMapping(Url.PERMISSION_GROUP_URL)
@RestController
public class PermissionGroupController {

    private final PermissionGroupService service;

    public PermissionGroupController(PermissionGroupService service) {
        this.service = service;
    }

    @GetMapping
    public Mono<ResponseDTO<List<PermissionGroupInfoDTO>>> listAllRoles() {
        log.debug("Going to get all roles");
        return service.getAll()
                .map(resources -> new ResponseDTO<>(HttpStatus.OK.value(), resources, null));
    }

    @GetMapping("/assign")
    public Mono<ResponseDTO<List<PermissionGroupInfoDTO>>> getAllRolesAssignable() {
        log.debug("Going to get all roles which the current user can assign");
        return service.getAllAssignableRoles()
                .map(resources -> new ResponseDTO<>(HttpStatus.OK.value(), resources, null));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<PermissionGroup>> create(@Valid @RequestBody PermissionGroup resource) {
        log.debug("Going to create new role");
        return service.create(resource)
                .map(created -> new ResponseDTO<>(HttpStatus.CREATED.value(), created, null));
    }

    @DeleteMapping("/{id}")
    public Mono<ResponseDTO<PermissionGroup>> deletePermissionGroup(@PathVariable String id) {
        log.debug("Going to delete permission group with id: {}", id);
        return service.archiveById(id)
                .map(deletedResource -> new ResponseDTO<>(HttpStatus.OK.value(), deletedResource, null));
    }
}
