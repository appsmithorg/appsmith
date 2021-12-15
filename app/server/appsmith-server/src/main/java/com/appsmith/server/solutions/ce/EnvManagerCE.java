package com.appsmith.server.solutions.ce;

import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.EnvChangesResponseDTO;
import com.appsmith.server.dtos.TestEmailConfigRequestDTO;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;


public interface EnvManagerCE {

    List<String> transformEnvContent(String envContent, Map<String, String> changes);

    Mono<EnvChangesResponseDTO> applyChanges(Map<String, String> changes);

    Map<String, String> parseToMap(String content);

    Mono<Map<String, String>> getAll();

    Mono<User> verifyCurrentUserIsSuper();

    Mono<Void> restart();

    Mono<Boolean> sendTestEmail(TestEmailConfigRequestDTO requestDTO);

    Mono<Void> download(ServerWebExchange exchange);
}
