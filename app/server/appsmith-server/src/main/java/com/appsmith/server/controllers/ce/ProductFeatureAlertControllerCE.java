package com.appsmith.server.controllers.ce;

import com.appsmith.external.views.Views;
import com.appsmith.server.constants.Url;
import com.appsmith.server.dtos.ProductAlertResponseDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.ProductAlertService;
import com.fasterxml.jackson.annotation.JsonView;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import reactor.core.publisher.Mono;

@RequestMapping(Url.PRODUCT_ALERT)
public class ProductFeatureAlertControllerCE {

    private final ProductAlertService productAlertService;

    public ProductFeatureAlertControllerCE(ProductAlertService productAlertService) {
        this.productAlertService = productAlertService;
    }

    @JsonView(Views.Public.class)
    @GetMapping("/alert")
    public Mono<ResponseDTO<ProductAlertResponseDTO>> generateCode() {
        return productAlertService.getSingleApplicableMessage().map(messages -> {
            if (messages.size() > 0) {
                return new ResponseDTO<>(HttpStatus.OK, messages.get(0));
            } else {
                return new ResponseDTO<>(HttpStatus.OK, new ProductAlertResponseDTO());
            }
        });
    }
}
