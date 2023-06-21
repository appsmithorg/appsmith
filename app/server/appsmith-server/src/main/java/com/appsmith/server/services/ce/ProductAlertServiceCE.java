package com.appsmith.server.services.ce;

import com.appsmith.server.dtos.ce.ProductAlertResponseDTO;
import reactor.core.publisher.Mono;

public interface ProductAlertServiceCE {
    Mono<ProductAlertResponseDTO> getSingleApplicableMessage();
}
