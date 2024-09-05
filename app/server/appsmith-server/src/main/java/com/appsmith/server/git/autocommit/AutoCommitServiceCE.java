package com.appsmith.server.git.autocommit;

import com.appsmith.server.dtos.AutoCommitResponseDTO;
import reactor.core.publisher.Mono;

public interface AutoCommitServiceCE {

    Mono<AutoCommitResponseDTO> autoCommitApplication(String defaultApplicationId);
}
