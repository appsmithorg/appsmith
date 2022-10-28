package com.appsmith.server.controllers.ce;

import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.UpdatePermissionGroupDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.dtos.WorkspaceMemberInfoDTO;
import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.services.UserWorkspaceService;
import org.springframework.beans.factory.annotation.Autowired;
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
import reactor.core.publisher.Mono;

import java.util.List;


@RequestMapping(Url.WORKSPACE_URL)
public class WorkspaceControllerCE extends BaseController<WorkspaceService, Workspace, String> {
    private final UserWorkspaceService userWorkspaceService;

    @Autowired
    public WorkspaceControllerCE(WorkspaceService workspaceService, UserWorkspaceService userWorkspaceService) {
        super(workspaceService);
        this.userWorkspaceService = userWorkspaceService;
    }

    /**
     * This function would be used to fetch default permission groups of workspace, for which user has access to invite users.
     *
     * @return
     */
    @GetMapping("/{workspaceId}/permissionGroups")
    public Mono<ResponseDTO<List<PermissionGroupInfoDTO>>> getPermissionGroupsForWorkspace(@PathVariable String workspaceId) {
        return service.getPermissionGroupsForWorkspace(workspaceId)
                .map(groupInfoList -> new ResponseDTO<>(HttpStatus.OK.value(), groupInfoList, null));
    }

    @GetMapping("/{workspaceId}/members")
    public Mono<ResponseDTO<List<WorkspaceMemberInfoDTO>>> getUserMembersOfWorkspace(@PathVariable String workspaceId) {
        return userWorkspaceService.getWorkspaceMembers(workspaceId)
                .map(users -> new ResponseDTO<>(HttpStatus.OK.value(), users, null));
    }

    @PutMapping("/{workspaceId}/permissionGroup")
    public Mono<ResponseDTO<WorkspaceMemberInfoDTO>> updatePermissionGroupForMember(@RequestBody UpdatePermissionGroupDTO updatePermissionGroupDTO,
                                                                                    @PathVariable String workspaceId,
                                                                                    @RequestHeader(name = "Origin", required = false) String originHeader) {
        return userWorkspaceService.updatePermissionGroupForMember(workspaceId, updatePermissionGroupDTO, originHeader)
                .map(user -> new ResponseDTO<>(HttpStatus.OK.value(), user, null));
    }

    @PostMapping("/{workspaceId}/logo")
    public Mono<ResponseDTO<Workspace>> uploadLogo(@PathVariable String workspaceId,
                                                      @RequestPart("file") Mono<Part> fileMono) {
        return fileMono
                .flatMap(filePart -> service.uploadLogo(workspaceId, filePart))
                .map(url -> new ResponseDTO<>(HttpStatus.OK.value(), url, null));
    }

    @DeleteMapping("/{workspaceId}/logo")
    public Mono<ResponseDTO<Workspace>> deleteLogo(@PathVariable String workspaceId) {
        return service.deleteLogo(workspaceId)
                .map(workspace -> new ResponseDTO<>(HttpStatus.OK.value(), workspace, null));
    }

}
