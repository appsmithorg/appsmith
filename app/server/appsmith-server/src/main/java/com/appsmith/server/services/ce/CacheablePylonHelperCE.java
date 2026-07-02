package com.appsmith.server.services.ce;

import com.appsmith.server.domains.User;
import reactor.core.publisher.Mono;

public interface CacheablePylonHelperCE {

    Mono<String> getEmailHash(User user);
}
