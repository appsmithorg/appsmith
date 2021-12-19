package com.appsmith.server.solutions.ce;

import com.appsmith.server.dtos.UserHomepageDTO;
import reactor.core.publisher.Mono;

public interface ApplicationFetcherCE {

    Mono<UserHomepageDTO> getAllApplications();

}
