package com.appsmith.server.controllers.ce;

import com.appsmith.external.views.Views;
import com.appsmith.server.constants.Url;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.dtos.TestEmailConfigRequestDTO;
import com.appsmith.server.solutions.EnvManager;
import com.fasterxml.jackson.annotation.JsonView;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.Map;

@RequestMapping(Url.INSTANCE_ADMIN_URL)
@RequiredArgsConstructor
@Slf4j
public class InstanceAdminControllerCE {

    private final EnvManager envManager;

    @JsonView(Views.Public.class)
    @GetMapping("/env")
    public Mono<ResponseDTO<Map<String, String>>> getAll() {
        log.debug("Getting all env configuration");
        return envManager.getAllNonEmpty().map(data -> new ResponseDTO<>(HttpStatus.OK.value(), data, null));
    }

    @Deprecated
    @JsonView(Views.Public.class)
    @PutMapping(
            value = "/env",
            consumes = {MediaType.APPLICATION_JSON_VALUE})
    public Mono<ResponseDTO<Map<String, ?>>> saveEnvChangesJSON(
            @Valid @RequestBody Map<String, String> changes, @RequestHeader("Origin") String originHeader) {
        log.debug("Applying env updates {}", changes.keySet());
        return envManager
                .applyChanges(changes, originHeader)
                .map(isRestarting ->
                        new ResponseDTO<>(HttpStatus.OK.value(), Map.of("isRestarting", isRestarting), null));
    }

    @JsonView(Views.Public.class)
    @PutMapping(
            value = "/env",
            consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
    public Mono<ResponseDTO<Map<String, ?>>> saveEnvChangesMultipartFormData(
            @RequestHeader("Origin") String originHeader, ServerWebExchange exchange) {
        log.debug("Applying env updates from form data");
        return exchange.getMultipartData()
                .flatMap(formData -> envManager.applyChangesFromMultipartFormData(formData, originHeader))
                .map(isRestarting ->
                        new ResponseDTO<>(HttpStatus.OK.value(), Map.of("isRestarting", isRestarting), null));
    }

    @JsonView(Views.Public.class)
    @PostMapping("/send-test-email")
    public Mono<ResponseDTO<Boolean>> sendTestEmail(@RequestBody @Valid TestEmailConfigRequestDTO requestDTO) {
        log.debug("Sending test email");
        return envManager.sendTestEmail(requestDTO).thenReturn(new ResponseDTO<>(HttpStatus.OK.value(), true, null));
    }
}
