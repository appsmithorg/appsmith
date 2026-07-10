package com.appsmith.server.services.ce;

import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.McpTokenResponseDTO;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface UserMcpTokenServiceCE {

    Mono<McpTokenResponseDTO> create(User user);

    Flux<McpTokenResponseDTO> list(User user);

    Mono<Boolean> revoke(User user, String tokenId);

    Mono<User> authenticate(String token);
}
