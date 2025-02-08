package com.appsmith.server.helpers;

import com.appsmith.external.services.RTSCaller;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.dtos.ce.DslVersionDTO;
import lombok.RequiredArgsConstructor;
import net.minidev.json.JSONObject;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
public class DSLMigrationUtils {

    private final RTSCaller rtsCaller;

    public Mono<Integer> getLatestDslVersion() {
        ParameterizedTypeReference<ResponseDTO<DslVersionDTO>> parameterizedTypeReference =
                new ParameterizedTypeReference<>() {};
        return rtsCaller
                .get("/rts-api/v1/dsl/version")
                .flatMap(spec -> spec.retrieve().bodyToMono(parameterizedTypeReference))
                .map(responseDTO -> responseDTO.getData().getVersion());
    }

    /**
     * This method will be used to migrate the page dsl from the older version to the latest version
     * @param pageDsl List of dsl from the git file system
     * @return List of page dsl after migration
     */
    public Mono<JSONObject> migratePageDsl(JSONObject pageDsl) {
        ParameterizedTypeReference<ResponseDTO<JSONObject>> parameterizedTypeReference =
                new ParameterizedTypeReference<>() {};

        return rtsCaller
                .post("/rts-api/v1/dsl/migrate", pageDsl)
                .flatMap(spec -> spec.retrieve().bodyToMono(parameterizedTypeReference))
                .map(responseDTO -> responseDTO.getData());
    }
}
