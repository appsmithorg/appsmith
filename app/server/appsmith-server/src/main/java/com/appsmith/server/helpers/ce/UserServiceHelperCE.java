package com.appsmith.server.helpers.ce;

import com.appsmith.server.domains.User;
import reactor.core.publisher.Mono;

public interface UserServiceHelperCE {
    Mono<User> addPoliciesToUser(User user);
}
