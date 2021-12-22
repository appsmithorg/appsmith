package com.appsmith.server.controllers.ce;

import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.UserRole;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.UserOrganizationService;
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


@RequestMapping(Url.ORGANIZATION_URL)
public class OrganizationControllerCE extends BaseController<OrganizationService, Organization, String> {
    private final UserOrganizationService userOrganizationService;

    @Autowired
    public OrganizationControllerCE(OrganizationService organizationService, UserOrganizationService userOrganizationService) {
        super(organizationService);
        this.userOrganizationService = userOrganizationService;
    }

    /**
     * This function would be used to fetch all possible user roles at organization level.
     *
     * @return
     */
    @GetMapping("/roles")
    public Mono<ResponseDTO<Map<String, String>>> getUserRolesForOrganization(@RequestParam String organizationId) {
        return service.getUserRolesForOrganization(organizationId)
                .map(permissions -> new ResponseDTO<>(HttpStatus.OK.value(), permissions, null));
    }

    @GetMapping("/{orgId}/members")
    public Mono<ResponseDTO<List<UserRole>>> getUserMembersOfOrganization(@PathVariable String orgId) {
        return service.getOrganizationMembers(orgId)
                .map(users -> new ResponseDTO<>(HttpStatus.OK.value(), users, null));
    }

    @PutMapping("/{orgId}/role")
    public Mono<ResponseDTO<UserRole>> updateRoleForMember(@RequestBody UserRole updatedUserRole,
                                                           @PathVariable String orgId,
                                                           @RequestHeader(name = "Origin", required = false) String originHeader) {
        return userOrganizationService.updateRoleForMember(orgId, updatedUserRole, originHeader)
                .map(user -> new ResponseDTO<>(HttpStatus.OK.value(), user, null));
    }

    @PostMapping("/{organizationId}/logo")
    public Mono<ResponseDTO<Organization>> uploadLogo(@PathVariable String organizationId,
                                                      @RequestPart("file") Mono<Part> fileMono) {
        return fileMono
                .flatMap(filePart -> service.uploadLogo(organizationId, filePart))
                .map(url -> new ResponseDTO<>(HttpStatus.OK.value(), url, null));
    }

    @DeleteMapping("/{organizationId}/logo")
    public Mono<ResponseDTO<Organization>> deleteLogo(@PathVariable String organizationId) {
        return service.deleteLogo(organizationId)
                .map(organization -> new ResponseDTO<>(HttpStatus.OK.value(), organization, null));
    }

}
