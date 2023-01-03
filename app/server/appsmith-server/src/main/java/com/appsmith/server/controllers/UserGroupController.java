package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.dtos.UpdateGroupMembershipDTO;
import com.appsmith.server.dtos.UserGroupCompactDTO;
import com.appsmith.server.dtos.UserGroupDTO;
import com.appsmith.server.dtos.UsersForGroupDTO;
import com.appsmith.server.services.UserGroupService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

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
    public Mono<ResponseDTO<UserGroupDTO>> create(@Valid @RequestBody UserGroup resource) {
        log.debug("Going to create resource from user group controller {}", resource.getClass().getName());
        return service.createGroup(resource)
                .map(created -> new ResponseDTO<>(HttpStatus.CREATED.value(), created, null));
    }

    @GetMapping("")
    public Mono<ResponseDTO<List<UserGroup>>> getAll() {
        log.debug("Going to get all resources from user group controller");
        return service.get(new LinkedMultiValueMap<>()).collectList()
                .map(resources -> new ResponseDTO<>(HttpStatus.OK.value(), resources, null));
    }

    @GetMapping("/{id}")
    public Mono<ResponseDTO<UserGroupDTO>> getById(@PathVariable String id) {
        log.debug("Going to get resource from user group controller for id: {}", id);
        return service.getGroupById(id)
                .map(resources -> new ResponseDTO<>(HttpStatus.OK.value(), resources, null));
    }

    @GetMapping("/for-invite")
    public Mono<ResponseDTO<List<UserGroupCompactDTO>>> getAllWithAddUserPermission() {
        log.debug("Going to get all resources  with Add User Permission from user group controller");
        return service.getAllWithAddUserPermission().collectList()
                .map(resources -> new ResponseDTO<>(HttpStatus.OK.value(), resources, null));
    }

    @PutMapping("/{id}")
    public Mono<ResponseDTO<UserGroupDTO>> update(@PathVariable String id,
                                                  @RequestBody UserGroup resource) {
        log.debug("Going to update resource from user group controller with id: {}", id);
        return service.updateGroup(id, resource)
                .map(updatedResource -> new ResponseDTO<>(HttpStatus.OK.value(), updatedResource, null));
    }

    @DeleteMapping("/{id}")
    public Mono<ResponseDTO<UserGroup>> delete(@PathVariable String id) {
        log.debug("Going to delete resource from user group controller with id: {}", id);
        return service.archiveById(id)
                .map(deletedResource -> new ResponseDTO<>(HttpStatus.OK.value(), deletedResource, null));
    }

    @PostMapping("/invite")
    public Mono<ResponseDTO<List<UserGroupDTO>>> inviteUsers(@RequestBody UsersForGroupDTO inviteUsersToGroupDTO,
                                                             @RequestHeader("Origin") String originHeader) {
        return service.inviteUsers(inviteUsersToGroupDTO, originHeader)
                .map(users -> new ResponseDTO<>(HttpStatus.OK.value(), users, null));
    }

    @PostMapping("/removeUsers")
    public Mono<ResponseDTO<List<UserGroupDTO>>> removeUsers(@RequestBody UsersForGroupDTO inviteUsersToGroupDTO) {
        return service.removeUsers(inviteUsersToGroupDTO)
                .map(users -> new ResponseDTO<>(HttpStatus.OK.value(), users, null));
    }

    @PutMapping("/users")
    public Mono<ResponseDTO<List<UserGroupDTO>>> bulkChangeMembership(@RequestBody UpdateGroupMembershipDTO updateGroupMembershipDTO,
                                                                      @RequestHeader("Origin") String originHeader) {
        return service.changeGroupsForUser(updateGroupMembershipDTO, originHeader)
                .map(users -> new ResponseDTO<>(HttpStatus.OK.value(), users, null));
    }

}
