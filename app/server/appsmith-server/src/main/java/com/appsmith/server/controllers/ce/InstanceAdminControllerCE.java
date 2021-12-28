package com.appsmith.server.controllers.ce;

import com.appsmith.server.constants.Url;
import com.appsmith.server.dtos.EnvChangesResponseDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.dtos.TestEmailConfigRequestDTO;
import com.appsmith.server.solutions.EnvManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.validation.Valid;
import java.util.Map;

@RequestMapping(Url.INSTANCE_ADMIN_URL)
@RequiredArgsConstructor
@Slf4j
public class InstanceAdminControllerCE {

    private final EnvManager envManager;

    @GetMapping("/env")
    public Mono<ResponseDTO<Map<String, String>>> getAll() {
        log.debug("Getting all env configuration");
        return envManager.getAll()
                .map(data -> new ResponseDTO<>(HttpStatus.OK.value(), data, null));
    }

    @GetMapping("/env/download")
    public Mono<Void> download(ServerWebExchange exchange) {
        log.debug("Getting all env configuration");
        return envManager.download(exchange);
    }

    @PutMapping("/env")
    public Mono<ResponseDTO<EnvChangesResponseDTO>> saveEnvChanges(
            @Valid @RequestBody Map<String, String> changes
    ) {
        log.debug("Applying env updates {}", changes);
        return envManager.applyChanges(changes)
                .map(res -> new ResponseDTO<>(HttpStatus.OK.value(), res, null));
    }

    @PostMapping("/restart")
    public Mono<ResponseDTO<Boolean>> restart() {
        log.debug("Received restart request");
        return envManager.restart()
                .thenReturn(new ResponseDTO<>(HttpStatus.OK.value(), true, null));
    }

    @PostMapping("/send-test-email")
    public Mono<ResponseDTO<Boolean>> sendTestEmail(@RequestBody @Valid TestEmailConfigRequestDTO requestDTO) {
        log.debug("Sending test email");
        return envManager.sendTestEmail(requestDTO)
                .thenReturn(new ResponseDTO<>(HttpStatus.OK.value(), true, null));
    }

}
