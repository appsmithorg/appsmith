package com.appsmith.server.services.ce_compatible;

import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.PagedDomain;
import com.appsmith.server.dtos.ProvisionResourceDto;
import com.appsmith.server.dtos.UserUpdateDTO;
import com.appsmith.server.services.ce.UserServiceCE;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;

public interface UserServiceCECompatible extends UserServiceCE {
    Mono<ProvisionResourceDto> createProvisionUser(User user);

    Mono<ProvisionResourceDto> updateProvisionUser(String userId, UserUpdateDTO userUpdateDTO);

    Mono<ProvisionResourceDto> getProvisionUser(String userId);

    Mono<PagedDomain<ProvisionResourceDto>> getProvisionUsers(MultiValueMap<String, String> queryParams);
}
