package com.appsmith.server.services;

import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.PagedDomain;
import com.appsmith.server.dtos.ProvisionResourceDto;
import com.appsmith.server.dtos.UserUpdateDTO;
import com.appsmith.server.services.ce_compatible.UserServiceCECompatible;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Set;

public interface UserService extends UserServiceCECompatible {

    Flux<User> findAllByIdsIn(Set<String> ids);

    Flux<User> findAllByUsernameIn(Set<String> usernames);

    Mono<ProvisionResourceDto> createProvisionUser(User user);

    Mono<ProvisionResourceDto> updateProvisionUser(String userId, UserUpdateDTO userUpdateDTO);

    Mono<ProvisionResourceDto> getProvisionUser(String userId);

    Mono<PagedDomain<ProvisionResourceDto>> getProvisionUsers(MultiValueMap<String, String> queryParams);
}
