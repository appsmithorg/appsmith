package com.appsmith.server.solutions;

import com.appsmith.server.dtos.UserForManagementDTO;
import reactor.core.publisher.Mono;

import java.util.List;

public interface UserManagementService {
    Mono<List<UserForManagementDTO>> getAllUsers();

    Mono<UserForManagementDTO> getUserById(String userId);

    Mono<Boolean> deleteUser(String userId);
}
