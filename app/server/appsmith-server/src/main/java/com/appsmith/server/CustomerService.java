package com.appsmith.server;

import com.appsmith.server.domains.Customer;
import com.appsmith.server.domains.Product;
import com.appsmith.server.repositories.ce.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.Assert;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerService {
    private final CustomerRepository customerRepository;

    private final ProductService productService;

    @Transactional
    public Flux<Customer> saveAll(String... emails) {
        return Flux.just(emails)
                .map(email -> new Customer(null, email))
                .flatMap(customerRepository::save)
                .doOnNext(customer -> Assert.isTrue(customer.getEmail().contains("@"), "Email should contain @!"));
    }

    @Transactional
    public Flux<Product> saveCustomerAndProductsWithTX(String customerEmail, String... productNames) {
        Assert.isTrue(customerEmail.contains("@"), "Email should contain @!");
        Mono<Customer> customerMono = customerRepository.save(new Customer(null, customerEmail));
        return customerMono
                .flatMapMany(customer -> {
                    List<String> customerEmailList = List.of(customer.getEmail());
                    return Flux.just(productNames)
                            .flatMap(productName -> {
                                Product product = new Product();
                                product.setCustomerEmailIds(customerEmailList);
                                product.setName(productName);
                                return productService.save(product);
                            });
                });
    }

    public Flux<Product> saveCustomerAndProductsWithoutTX(String customerEmail, String... productNames) {

        if (!customerEmail.contains("@")) {
            return Flux.error(new Throwable("Email should contain @!"));
        }
        Mono<Customer> customerMono = customerRepository.save(new Customer(null, customerEmail));
        return customerMono
                .flatMapMany(customer -> {
                    List<String> customerEmailList = List.of(customer.getEmail());
                    return Flux.just(productNames)
                            .flatMap(productName -> {
                                Product product = new Product();
                                product.setCustomerEmailIds(customerEmailList);
                                product.setName(productName);
                                return productService.save(product);
                            });
                });
    }
}
