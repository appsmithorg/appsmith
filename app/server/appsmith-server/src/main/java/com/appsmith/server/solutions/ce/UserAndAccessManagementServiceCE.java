/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.solutions.ce;

import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.InviteUsersDTO;
import java.util.List;
import reactor.core.publisher.Mono;

public interface UserAndAccessManagementServiceCE {

  Mono<List<User>> inviteUsers(InviteUsersDTO inviteUsersDTO, String originHeader);
}
