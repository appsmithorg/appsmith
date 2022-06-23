package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Customer;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;

public interface CustomerRepository extends ReactiveMongoRepository<Customer, String> {
}
