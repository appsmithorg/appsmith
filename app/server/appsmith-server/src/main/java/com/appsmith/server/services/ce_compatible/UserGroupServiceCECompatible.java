package com.appsmith.server.services.ce_compatible;

import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.dtos.PagedDomain;
import com.appsmith.server.dtos.ProvisionResourceDto;
import com.appsmith.server.dtos.UserGroupDTO;
import com.appsmith.server.dtos.UserGroupUpdateDTO;
import com.appsmith.server.dtos.UsersForGroupDTO;
import com.appsmith.server.services.CrudService;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;

import java.util.List;

public interface UserGroupServiceCECompatible extends CrudService<UserGroup, String> {
    Mono<ProvisionResourceDto> updateProvisionGroup(String id, UserGroupUpdateDTO resource);

    Mono<ProvisionResourceDto> getProvisionGroup(String groupId);

    Mono<PagedDomain<ProvisionResourceDto>> getProvisionGroups(MultiValueMap<String, String> queryParams);

    Mono<ProvisionResourceDto> createProvisionGroup(UserGroup userGroup);

    Mono<List<UserGroupDTO>> removeUsersFromProvisionGroup(UsersForGroupDTO removeUsersFromGroupDTO);

    Mono<List<UserGroupDTO>> addUsersToProvisionGroup(UsersForGroupDTO addUsersFromGroupDTO);

    Mono<UserGroup> archiveProvisionGroupById(String id);
}
