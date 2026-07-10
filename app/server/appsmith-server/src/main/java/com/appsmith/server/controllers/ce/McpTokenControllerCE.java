package com.appsmith.server.controllers.ce;

import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.McpTokenResponseDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.UserMcpTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
public class McpTokenControllerCE {

    private final UserMcpTokenService userMcpTokenService;

    @PostMapping
    public Mono<ResponseDTO<McpTokenResponseDTO>> create(@AuthenticationPrincipal User user) {
        return userMcpTokenService.create(user).map(token -> new ResponseDTO<>(HttpStatus.CREATED, token));
    }

    @GetMapping
    public Flux<ResponseDTO<McpTokenResponseDTO>> list(@AuthenticationPrincipal User user) {
        return userMcpTokenService.list(user).map(token -> new ResponseDTO<>(HttpStatus.OK, token));
    }

    @DeleteMapping("/{tokenId}")
    public Mono<ResponseDTO<Boolean>> revoke(@AuthenticationPrincipal User user, @PathVariable String tokenId) {
        return userMcpTokenService
                .revoke(user, tokenId)
                .map(revoked -> new ResponseDTO<>(revoked ? HttpStatus.OK : HttpStatus.NOT_FOUND, revoked));
    }
}
