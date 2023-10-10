package com.appsmith.server.helpers;

import com.appsmith.server.domains.User;
import com.appsmith.server.helpers.ce.UserServiceHelperCE;
import reactor.core.publisher.Mono;

public interface UserServiceHelper extends UserServiceHelperCE {
    Mono<User> assignDefaultRoleToUser(User user);
}
