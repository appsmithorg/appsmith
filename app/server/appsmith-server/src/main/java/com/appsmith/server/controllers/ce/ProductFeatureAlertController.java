package com.appsmith.server.controllers.ce;

import com.appsmith.external.views.Views;
import com.appsmith.server.constants.Url;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.dtos.ce.ProductAlertResponseDTO;
import com.appsmith.server.services.ce.ProductAlertService;
import com.fasterxml.jackson.annotation.JsonView;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping(Url.PRODUCT_ALERT)
public class ProductFeatureAlertController {

    private final ProductAlertService productAlertService;

    public ProductFeatureAlertController(ProductAlertService productAlertService) {
        this.productAlertService = productAlertService;
    }

    @JsonView(Views.Public.class)
    @GetMapping("/alert")
    public Mono<ResponseDTO<ProductAlertResponseDTO>> generateCode() {
        return productAlertService.getSingleApplicableMessage()
                .map(message -> new ResponseDTO<>(HttpStatus.OK.value(), message, null));
    }
}
