package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Product;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;

public interface ProductRepository extends ReactiveMongoRepository<Product, String> {
}
