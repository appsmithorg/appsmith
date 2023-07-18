package com.appsmith.server.services.ce;

import com.appsmith.server.dtos.ce.ProductAlertResponseDTO;
import java.util.List;
import reactor.core.publisher.Mono;

public interface ProductAlertServiceCE {
    Mono<List<ProductAlertResponseDTO>> getSingleApplicableMessage();
}
