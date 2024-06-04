package com.appsmith.server.solutions.ce;

import com.appsmith.server.dtos.ReleaseItemsDTO;
import reactor.core.publisher.Mono;

public interface UserReleaseNotesCE {
    Mono<ReleaseItemsDTO> getReleaseItems();
}
