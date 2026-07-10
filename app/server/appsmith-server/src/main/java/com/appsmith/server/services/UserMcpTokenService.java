package com.appsmith.server.services;

import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.McpTokenResponseDTO;
import com.appsmith.server.services.ce.UserMcpTokenServiceCE;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface UserMcpTokenService extends UserMcpTokenServiceCE {

    Mono<McpTokenResponseDTO> create(User user);

    Flux<McpTokenResponseDTO> list(User user);

    Mono<Boolean> revoke(User user, String tokenId);

    Mono<User> authenticate(String token);
}
