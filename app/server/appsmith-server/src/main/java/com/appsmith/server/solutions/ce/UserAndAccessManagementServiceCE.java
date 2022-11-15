package com.appsmith.server.solutions.ce;

import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.InviteUsersDTO;
import reactor.core.publisher.Mono;

import java.util.List;

public interface UserAndAccessManagementServiceCE {

    Mono<List<User>> inviteUsers(InviteUsersDTO inviteUsersDTO, String originHeader);
}
