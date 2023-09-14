package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.dtos.PagedDomain;
import com.appsmith.server.dtos.ProvisionResourceDto;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.dtos.UserGroupDTO;
import com.appsmith.server.dtos.UserGroupUpdateDTO;
import com.appsmith.server.dtos.UsersForGroupDTO;
import com.appsmith.server.services.UserGroupService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.List;

@Slf4j
@RestController
@RequestMapping(Url.PROVISION_GROUP_URL)
public class UserGroupProvisionController {

    private final UserGroupService userGroupService;

    public UserGroupProvisionController(UserGroupService userGroupService) {
        this.userGroupService = userGroupService;
    }

    @GetMapping
    public Mono<ResponseDTO<PagedDomain<ProvisionResourceDto>>> getAllGroups(
            @RequestParam MultiValueMap<String, String> queryParams) {
        return userGroupService
                .getProvisionGroups(queryParams)
                .map(groups -> new ResponseDTO<>(HttpStatus.OK.value(), groups, null));
    }

    @GetMapping("/{id}")
    public Mono<ResponseDTO<ProvisionResourceDto>> getGroup(@PathVariable String id) {
        return userGroupService
                .getProvisionGroup(id)
                .map(group -> new ResponseDTO<>(HttpStatus.OK.value(), group, null));
    }

    @PostMapping
    public Mono<ResponseDTO<ProvisionResourceDto>> createGroup(@RequestBody UserGroup userGroup) {
        return userGroupService
                .createProvisionGroup(userGroup)
                .map(group -> new ResponseDTO<>(HttpStatus.CREATED.value(), group, null));
    }

    @DeleteMapping("/{id}")
    public Mono<ResponseDTO<UserGroup>> deleteGroup(@PathVariable String id) {
        return userGroupService
                .archiveProvisionGroupById(id)
                .map(group -> new ResponseDTO<>(HttpStatus.OK.value(), group, null));
    }

    @PutMapping("/{id}")
    public Mono<ResponseDTO<ProvisionResourceDto>> updateGroup(
            @PathVariable String id, @RequestBody UserGroupUpdateDTO userGroup) {
        return userGroupService
                .updateProvisionGroup(id, userGroup)
                .map(group -> new ResponseDTO<>(HttpStatus.OK.value(), group, null));
    }

    @PostMapping("/removeUsers")
    public Mono<ResponseDTO<List<UserGroupDTO>>> removeUsersFromGroup(
            @RequestBody UsersForGroupDTO removeUsersForGroupDTO) {
        return userGroupService
                .removeUsersFromProvisionGroup(removeUsersForGroupDTO)
                .map(group -> new ResponseDTO<>(HttpStatus.OK.value(), group, null));
    }

    @PostMapping("/invite")
    public Mono<ResponseDTO<List<UserGroupDTO>>> addUsersToGroup(@RequestBody UsersForGroupDTO inviteUsersForGroupDTO) {
        return userGroupService
                .addUsersToProvisionGroup(inviteUsersForGroupDTO)
                .map(group -> new ResponseDTO<>(HttpStatus.OK.value(), group, null));
    }
}
