package com.appsmith.server.solutions.ce;

import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.EnvChangesResponseDTO;
import com.appsmith.server.dtos.TestEmailConfigRequestDTO;
import org.springframework.http.codec.multipart.Part;
import org.springframework.util.MultiValueMap;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;


public interface EnvManagerCE {

    List<String> transformEnvContent(String envContent, Map<String, String> changes);

    Mono<EnvChangesResponseDTO> applyChanges(Map<String, String> changes);

    Mono<EnvChangesResponseDTO> applyChangesFromMultipartFormData(MultiValueMap<String, Part> formData);

    void setAnalyticsEventAction(Map<String, Object> properties, String newVariable, String originalVariable, String authEnv);

    Mono<Map.Entry<String, String>> handleFileUpload(String key, List<Part> parts);

    Map<String, String> parseToMap(String content);

    Mono<Map<String, String>> getAll();

    Mono<Map<String, String>> getAllNonEmpty();

    Mono<User> verifyCurrentUserIsSuper();

    Mono<Void> restart();

    Mono<Boolean> sendTestEmail(TestEmailConfigRequestDTO requestDTO);

    Mono<Void> download(ServerWebExchange exchange);

}
