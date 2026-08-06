package com.appsmith.server.services.ce;

import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.McpTokenResponseDTO;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface UserMcpTokenServiceCE {

    // name is optional (the user-facing token label); a blank/null name is defaulted to "Token created <date>".
    Mono<McpTokenResponseDTO> create(User user, String name);

    Flux<McpTokenResponseDTO> list(User user);

    Mono<McpTokenResponseDTO> rotate(User user, String tokenId);

    Mono<Boolean> revoke(User user, String tokenId);

    Mono<User> authenticate(String token);
}
