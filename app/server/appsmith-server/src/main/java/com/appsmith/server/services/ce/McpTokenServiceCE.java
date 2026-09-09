package com.appsmith.server.services.ce;

import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.McpTokenResponseDTO;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface McpTokenServiceCE {

    // name is optional (the user-facing key label); a blank/null name is defaulted to "Token created <date>".
    // keySpanDays should be one of 30, 60, 90, 180, 365. It defaults to 30, if absent.
    Mono<McpTokenResponseDTO> create(User user, String name, Integer keySpanDays);

    default Mono<McpTokenResponseDTO> create(User user, String name) {
        return create(user, name, null);
    }

    Flux<McpTokenResponseDTO> list(User user);

    Mono<McpTokenResponseDTO> rotate(User user, String keyId);

    Mono<Boolean> revoke(User user, String keyId);

    Mono<User> authenticate(String userKey);
}
