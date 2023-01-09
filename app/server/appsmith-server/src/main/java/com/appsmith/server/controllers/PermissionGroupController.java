package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.dtos.UpdateRoleAssociationDTO;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.solutions.UserAndAccessManagementService;
import com.appsmith.server.solutions.roles.RoleConfigurationSolution;
import com.appsmith.server.solutions.roles.dtos.RoleViewDTO;
import com.appsmith.server.solutions.roles.dtos.UpdateRoleConfigDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import jakarta.validation.Valid;
import java.util.List;

@Slf4j
@RequestMapping(Url.PERMISSION_GROUP_URL)
@RestController
public class PermissionGroupController {

    private final PermissionGroupService service;
    private final RoleConfigurationSolution roleConfigurationSolution;
    private final UserAndAccessManagementService userAndAccessManagementService;

    public PermissionGroupController(PermissionGroupService service, RoleConfigurationSolution roleConfigurationSolution, UserAndAccessManagementService userAndAccessManagementService) {
        this.service = service;
        this.roleConfigurationSolution = roleConfigurationSolution;
        this.userAndAccessManagementService = userAndAccessManagementService;
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
    public Mono<ResponseDTO<RoleViewDTO>> create(@Valid @RequestBody PermissionGroup resource) {
        log.debug("Going to create new role");
        return service.createCustomPermissionGroup(resource)
                .map(created -> new ResponseDTO<>(HttpStatus.CREATED.value(), created, null));
    }

    @DeleteMapping("/{id}")
    public Mono<ResponseDTO<PermissionGroup>> deletePermissionGroup(@PathVariable String id) {
        log.debug("Going to delete permission group with id: {}", id);
        return service.archiveById(id)
                .map(deletedResource -> new ResponseDTO<>(HttpStatus.OK.value(), deletedResource, null));
    }

    @GetMapping("/configure/{permissionGroupId}")
    public Mono<ResponseDTO<RoleViewDTO>> getPermissionGroupConfiguration(@PathVariable String permissionGroupId) {
        return service.findConfigurableRoleById(permissionGroupId)
                .map(resources -> new ResponseDTO<>(HttpStatus.OK.value(), resources, null));
    }

    @PutMapping("/configure/{permissionGroupId}")
    public Mono<ResponseDTO<RoleViewDTO>> updatePermissionGroupConfiguration(@PathVariable String permissionGroupId,
                                                                          @RequestBody UpdateRoleConfigDTO updateRoleConfigDTO) {
        return roleConfigurationSolution.updateRoles(permissionGroupId, updateRoleConfigDTO)
                .map(resources -> new ResponseDTO<>(HttpStatus.OK.value(), resources, null));
    }

    @PutMapping("/associate")
    public Mono<ResponseDTO<Boolean>> updatePermissionGroupsAssociation(@RequestBody UpdateRoleAssociationDTO updateRoleAssociationDTO) {
        return userAndAccessManagementService.changeRoleAssociations(updateRoleAssociationDTO)
                .map(resources -> new ResponseDTO<>(HttpStatus.OK.value(), resources, null));
    }

    @PutMapping("/{id}")
    public Mono<ResponseDTO<PermissionGroupInfoDTO>> updatePermissionGroup(@PathVariable String id, @RequestBody PermissionGroup resource) {
        return service.updatePermissionGroup(id, resource)
                .map(updatedResource -> new ResponseDTO<>(HttpStatus.OK.value(), updatedResource, null));
    }
}
