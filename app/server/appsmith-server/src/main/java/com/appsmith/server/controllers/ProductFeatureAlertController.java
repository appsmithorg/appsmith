package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.ProductFeatureAlertControllerCE;
import com.appsmith.server.services.ProductAlertService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(Url.PRODUCT_ALERT)
public class ProductFeatureAlertController extends ProductFeatureAlertControllerCE {

    public ProductFeatureAlertController(ProductAlertService productAlertService) {
        super(productAlertService);
    }
}
