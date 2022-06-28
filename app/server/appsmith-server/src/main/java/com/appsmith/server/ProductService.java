package com.appsmith.server;

import com.appsmith.server.domains.Product;
import com.appsmith.server.repositories.ce.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.Assert;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class ProductService {
    private final ProductRepository productRepository;

    Mono<Product> save(Product product) {
        Assert.isTrue(StringUtils.hasLength(product.getName()), "Product name should not be empty");
        return this.productRepository.save(product);
    }
}
