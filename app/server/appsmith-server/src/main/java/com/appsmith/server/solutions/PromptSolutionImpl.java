package com.appsmith.server.solutions;

import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.dtos.ActionPerformanceDTO;
import com.appsmith.server.dtos.PromptGenerateDTO;
import com.appsmith.util.WebClientUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
public class PromptSolutionImpl implements PromptSolution {

    private final WebClientUtils webClientUtils;

    private final CloudServicesConfig cloudServicesConfig;

    private static final String PROMPT_TEMPLATE =
            "Improve the performance of the query %s by using the following schema: %s";

    @Override
    public Mono<String> getQueryAnalysis(ActionPerformanceDTO actionPerformanceDTO) {
        // call the CS end point to get the query analysis

        PromptGenerateDTO promptGenerateDTO = new PromptGenerateDTO();
        promptGenerateDTO.setInput(
                String.format(PROMPT_TEMPLATE, actionPerformanceDTO.getBody(), actionPerformanceDTO.getSchema()));

        return webClientUtils
                .create("https://cs.appsmith.com")
                .post()
                .uri("/api/v1/business-features")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .body(BodyInserters.fromValue(promptGenerateDTO))
                .retrieve()
                .bodyToMono(String.class);
    }
}
