package com.appsmith.server.controllers.ce;

import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.domains.UserRole;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.dtos.UserAndGroupDTO;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;


@RequestMapping(Url.WORKSPACE_URL)
public class WorkspaceControllerCE extends BaseController<WorkspaceService, Workspace, String> {
    private final UserWorkspaceService userWorkspaceService;

    @Autowired
    public WorkspaceControllerCE(WorkspaceService workspaceService, UserWorkspaceService userWorkspaceService) {
        super(workspaceService);
        this.userWorkspaceService = userWorkspaceService;
    }

    /**
     * This function would be used to fetch all possible user roles at workspace level.
     *
     * @return
     */
    @GetMapping("/roles")
    public Mono<ResponseDTO<Map<String, String>>> getUserRolesForWorkspace(@RequestParam String workspaceId) {
        return service.getUserRolesForWorkspace(workspaceId)
                .map(permissions -> new ResponseDTO<>(HttpStatus.OK.value(), permissions, null));
    }

    @GetMapping("/{workspaceId}/members")
    public Mono<ResponseDTO<List<UserAndGroupDTO>>> getUserMembersOfWorkspace(@PathVariable String workspaceId) {
        return userWorkspaceService.getWorkspaceMembers(workspaceId)
                .map(users -> new ResponseDTO<>(HttpStatus.OK.value(), users, null));
    }

    @PutMapping("/{workspaceId}/role")
    public Mono<ResponseDTO<UserRole>> updateRoleForMember(@RequestBody UserRole updatedUserRole,
                                                           @PathVariable String workspaceId,
                                                           @RequestHeader(name = "Origin", required = false) String originHeader) {
        return userWorkspaceService.updateRoleForMember(workspaceId, updatedUserRole, originHeader)
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
