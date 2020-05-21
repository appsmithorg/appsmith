package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.UserRole;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.OrganizationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping(Url.ORGANIZATION_URL)
public class OrganizationController extends BaseController<OrganizationService, Organization, String> {


    @Autowired
    public OrganizationController(OrganizationService organizationService) {
        super(organizationService);
    }

    /**
     * This function would be used to fetch all possible user roles at organization level.
     * @return
     */
    @GetMapping("/roles")
    public Mono<ResponseDTO<Map<String, String>>> getUserRolesForOrganization() {
        return service.getUserRolesForOrganization()
                .map(permissions -> new ResponseDTO<>(HttpStatus.OK.value(), permissions, null));
    }

    @GetMapping("/{orgId}/members")
    public Mono<ResponseDTO<List<UserRole>>> getUserMembersOfOrganization(@PathVariable String orgId) {
        return service.getOrganizationMembers(orgId)
                .map(users -> new ResponseDTO<>(HttpStatus.OK.value(), users, null));
    }
}
