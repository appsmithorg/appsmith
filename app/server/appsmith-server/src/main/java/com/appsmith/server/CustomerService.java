package com.appsmith.server;

import com.appsmith.server.domains.Customer;
import com.appsmith.server.repositories.ce.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.Assert;
import reactor.core.publisher.Flux;

@Service
@RequiredArgsConstructor
public class CustomerService {
    private final CustomerRepository customerRepository;

    @Transactional
    public Flux<Customer> saveAll(String... emails) {
        return Flux.just(emails)
                .map(email -> new Customer(null, email))
                .flatMap(customerRepository::save)
                .doOnNext(customer -> Assert.isTrue(customer.getEmail().contains("@"), "Email should contain @!"));
    }
}
