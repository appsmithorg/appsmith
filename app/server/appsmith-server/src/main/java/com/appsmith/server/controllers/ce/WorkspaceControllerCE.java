package com.appsmith.server.controllers.ce;

import com.appsmith.external.views.Views;
import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.MemberInfoDTO;
import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.dtos.UpdatePermissionGroupDTO;
import com.appsmith.server.services.UserWorkspaceService;
import com.appsmith.server.services.WorkspaceService;
import com.fasterxml.jackson.annotation.JsonView;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.codec.multipart.Part;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import reactor.core.publisher.Mono;

import java.util.List;

@RequestMapping(Url.WORKSPACE_URL)
@RequiredArgsConstructor
public class WorkspaceControllerCE {
    private final WorkspaceService service;
    private final UserWorkspaceService userWorkspaceService;

    @JsonView(Views.Public.class)
    @GetMapping("/{id}")
    public Mono<ResponseDTO<Workspace>> getById(@PathVariable String id) {
        return service.getById(id).map(workspace -> new ResponseDTO<>(HttpStatus.OK.value(), workspace, null));
    }

    @JsonView(Views.Public.class)
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<Workspace>> create(@Valid @RequestBody Workspace resource) {
        return service.create(resource).map(created -> new ResponseDTO<>(HttpStatus.CREATED.value(), created, null));
    }

    @JsonView(Views.Public.class)
    @PutMapping("/{id}")
    public Mono<ResponseDTO<Workspace>> update(@PathVariable String id, @RequestBody Workspace resource) {
        return service.update(id, resource)
                .map(updatedResource -> new ResponseDTO<>(HttpStatus.OK.value(), updatedResource, null));
    }

    @JsonView(Views.Public.class)
    @DeleteMapping("/{id}")
    public Mono<ResponseDTO<Workspace>> delete(@PathVariable String id) {
        return service.archiveById(id)
                .map(deletedResource -> new ResponseDTO<>(HttpStatus.OK.value(), deletedResource, null));
    }

    /**
     * This function would be used to fetch default permission groups of workspace, for which user has access to invite users.
     */
    @JsonView(Views.Public.class)
    @GetMapping("/{workspaceId}/permissionGroups")
    public Mono<ResponseDTO<List<PermissionGroupInfoDTO>>> getPermissionGroupsForWorkspace(
            @PathVariable String workspaceId) {
        return service.getPermissionGroupsForWorkspace(workspaceId)
                .map(groupInfoList -> new ResponseDTO<>(HttpStatus.OK.value(), groupInfoList, null));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/{workspaceId}/members")
    public Mono<ResponseDTO<List<MemberInfoDTO>>> getUserMembersOfWorkspace(@PathVariable String workspaceId) {
        return userWorkspaceService
                .getWorkspaceMembers(workspaceId)
                .map(users -> new ResponseDTO<>(HttpStatus.OK.value(), users, null));
    }

    @JsonView(Views.Public.class)
    @PutMapping("/{workspaceId}/permissionGroup")
    public Mono<ResponseDTO<MemberInfoDTO>> updatePermissionGroupForMember(
            @RequestBody UpdatePermissionGroupDTO updatePermissionGroupDTO,
            @PathVariable String workspaceId,
            @RequestHeader(name = "Origin", required = false) String originHeader) {
        return userWorkspaceService
                .updatePermissionGroupForMember(workspaceId, updatePermissionGroupDTO, originHeader)
                .map(user -> new ResponseDTO<>(HttpStatus.OK.value(), user, null));
    }

    @JsonView(Views.Public.class)
    @PostMapping("/{workspaceId}/logo")
    public Mono<ResponseDTO<Workspace>> uploadLogo(
            @PathVariable String workspaceId, @RequestPart("file") Mono<Part> fileMono) {
        return fileMono.flatMap(filePart -> service.uploadLogo(workspaceId, filePart))
                .map(url -> new ResponseDTO<>(HttpStatus.OK.value(), url, null));
    }

    @JsonView(Views.Public.class)
    @DeleteMapping("/{workspaceId}/logo")
    public Mono<ResponseDTO<Workspace>> deleteLogo(@PathVariable String workspaceId) {
        return service.deleteLogo(workspaceId)
                .map(workspace -> new ResponseDTO<>(HttpStatus.OK.value(), workspace, null));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/home")
    public Mono<ResponseDTO<List<Workspace>>> workspacesForHome() {
        return userWorkspaceService
                .getUserWorkspacesByRecentlyUsedOrder()
                .map(workspaces -> new ResponseDTO<>(HttpStatus.OK.value(), workspaces, null));
    }
}
