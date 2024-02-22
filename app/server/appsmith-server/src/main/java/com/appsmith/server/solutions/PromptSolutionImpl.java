package com.appsmith.server.solutions;

import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.dtos.ActionPerformanceDTO;
import com.appsmith.server.dtos.PromptGenerateDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
public class PromptSolutionImpl implements PromptSolution {

    private final CloudServicesConfig cloudServicesConfig;

    private static final String PROMPT_TEMPLATE =
            "Improve the performance of the query %s by using the following schema: %s";

    @Override
    public Mono<String> getQueryAnalysis(ActionPerformanceDTO actionPerformanceDTO) {
        // call the CS end point to get the query analysis

        PromptGenerateDTO promptGenerateDTO = new PromptGenerateDTO();
        promptGenerateDTO.setInput(
                String.format(PROMPT_TEMPLATE, actionPerformanceDTO.getBody(), actionPerformanceDTO.getSchema()));

        /*return WebClientUtils
            .create("https://release-cs.appsmith.com")
            .post()
            .uri("/api/v1/proxy/assistant/query")
            .headers()
            .contentType(MediaType.APPLICATION_JSON)
            .body(BodyInserters.fromValue(promptGenerateDTO))
            .retrieve()
            .bodyToMono(String.class)
        .onErrorResume(throwable -> {
            // log the error and return a default message
            return Mono.just("Unable to connect to the cloud service");
        });*/
        return Mono.just("");
    }

    public Mono<String> getQueryPerf(ActionPerformanceDTO actionPerformanceDTO) {

        String url = "https://api.openai.com/v1/chat/completions";
        String apiKey = "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\n";
        String model = "gpt-3.5-turbo";
        String prompt = "Improve the performance of the query " + actionPerformanceDTO.getBody()
                + " by using the following schema: " + actionPerformanceDTO.getSchema();

        return Mono.just("");
    }
}
