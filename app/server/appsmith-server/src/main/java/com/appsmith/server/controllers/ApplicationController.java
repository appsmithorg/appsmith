package com.appsmith.server.controllers;

import com.appsmith.external.views.Views;
import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.ApplicationControllerCE;
import com.appsmith.server.dtos.InviteUsersToApplicationDTO;
import com.appsmith.server.dtos.MemberInfoDTO;
import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.dtos.UpdateApplicationRoleDTO;
import com.appsmith.server.fork.internal.ApplicationForkingService;
import com.appsmith.server.services.ApplicationMemberService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.ApplicationSnapshotService;
import com.appsmith.server.services.ThemeService;
import com.appsmith.server.solutions.ApplicationFetcher;
import com.appsmith.server.solutions.ImportExportApplicationService;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.List;

@Slf4j
@RestController
@RequestMapping(Url.APPLICATION_URL)
public class ApplicationController extends ApplicationControllerCE {

    private final ApplicationMemberService applicationMemberService;

    public ApplicationController(
            ApplicationService service,
            ApplicationPageService applicationPageService,
            ApplicationFetcher applicationFetcher,
            ApplicationForkingService applicationForkingService,
            ImportExportApplicationService importExportApplicationService,
            ThemeService themeService,
            ApplicationSnapshotService applicationSnapshotService,
            ApplicationMemberService applicationMemberService) {

        super(
                service,
                applicationPageService,
                applicationFetcher,
                applicationForkingService,
                importExportApplicationService,
                themeService,
                applicationSnapshotService);

        this.applicationMemberService = applicationMemberService;
    }

    @GetMapping("/{applicationId}/roles")
    public Mono<ResponseDTO<List<PermissionGroupInfoDTO>>> fetchAllDefaultRoles(@PathVariable String applicationId) {
        log.debug("Fetching all default accessible roles for application id: {}", applicationId);
        Mono<List<PermissionGroupInfoDTO>> roleDescriptionDTOsMono = service.fetchAllDefaultRoles(applicationId);
        return roleDescriptionDTOsMono.map(
                roleDescriptionDTOs -> new ResponseDTO<>(HttpStatus.OK.value(), roleDescriptionDTOs, null));
    }

    @PostMapping("/invite")
    public Mono<ResponseDTO<List<MemberInfoDTO>>> inviteToApplication(
            @RequestBody InviteUsersToApplicationDTO inviteToApplicationDTO) {
        log.debug("Inviting entities to application: {}", inviteToApplicationDTO.getApplicationId());
        Mono<List<MemberInfoDTO>> memberInfoDTOSMono = service.inviteToApplication(inviteToApplicationDTO);
        return memberInfoDTOSMono.map(
                invitedEntitiesDTO -> new ResponseDTO<>(HttpStatus.OK.value(), invitedEntitiesDTO, null));
    }

    @PutMapping("/{applicationId}/role")
    public Mono<ResponseDTO<MemberInfoDTO>> updateDefaultRoleForApplicationMember(
            @PathVariable String applicationId, @RequestBody UpdateApplicationRoleDTO updateApplicationRoleDTO) {
        Mono<MemberInfoDTO> memberInfoDTOMono = service.updateRoleForMember(applicationId, updateApplicationRoleDTO);
        return memberInfoDTOMono.map(memberInfoDTO -> new ResponseDTO<>(HttpStatus.OK.value(), memberInfoDTO, null));
    }

    @GetMapping("/{applicationId}/members")
    public Mono<ResponseDTO<List<MemberInfoDTO>>> getAllApplicationMembers(@PathVariable String applicationId) {
        log.debug("Fetching all members for application id: {}", applicationId);
        Mono<List<MemberInfoDTO>> applicationMemberInfoDTOListMono =
                applicationMemberService.getAllMembersForApplication(applicationId);
        return applicationMemberInfoDTOListMono.map(
                applicationMemberInfoDTOS -> new ResponseDTO<>(HttpStatus.OK.value(), applicationMemberInfoDTOS, null));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/defaultRoles")
    public Mono<ResponseDTO<List<PermissionGroupInfoDTO>>> fetchAllDefaultRolesWithoutPermission() {
        Mono<List<PermissionGroupInfoDTO>> staticApplicationRolesForWorkspaceMono =
                service.fetchAllDefaultRolesWithoutPermissions();
        return staticApplicationRolesForWorkspaceMono.map(staticApplicationRolesForWorkspace ->
                new ResponseDTO<>(HttpStatus.OK.value(), staticApplicationRolesForWorkspace, null));
    }
}
