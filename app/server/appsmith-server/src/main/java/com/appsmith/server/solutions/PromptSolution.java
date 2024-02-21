package com.appsmith.server.solutions;

import com.appsmith.server.dtos.ActionPerformanceDTO;
import reactor.core.publisher.Mono;

public interface PromptSolution {

    Mono<String> getQueryAnalysis(ActionPerformanceDTO actionPerformanceDTO);
}
