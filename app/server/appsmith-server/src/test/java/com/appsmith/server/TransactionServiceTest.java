package com.appsmith.server;

import com.appsmith.server.repositories.ce.CustomerRepository;
import com.appsmith.server.repositories.ce.ProductRepository;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.test.StepVerifier;

import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringRunner.class)
@SpringBootTest
@DirtiesContext
public class TransactionServiceTest {

    @Autowired
    private CustomerService customerService;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductService productService;

    @Before
    public void setup() {
        productRepository.deleteAll().block();
        customerRepository.deleteAll().block();
    }

    @Test
    public void saveAllCustomer() {

        StepVerifier
                .create(this.customerService.saveAll("a@a.com", "b@b.com", "c@c.com"))
                .expectNextCount(3)
                .verifyComplete();

        StepVerifier
                .create(this.customerService.saveAll("d@d.com", "e_c.com"))
                .expectNextCount(1)
                .expectError()
                .verify();

        StepVerifier.create(customerRepository.count())
                .expectNext(3L)
                .verifyComplete();
    }

    @Test
    public void integrationTest_saveCustomerAndProductsWithTX() {

        StepVerifier
                .create(this.customerService.saveCustomerAndProductsWithTX("a@a.com", "p1", "p2").collectList())
                .assertNext(productList -> {
                    assertThat(productList.size()).isEqualTo(2);
                })
                .verifyComplete();

        StepVerifier
                .create(this.customerRepository.count())
                .expectNext(1L)
                .verifyComplete();

        StepVerifier
                .create(this.productRepository.count())
                .expectNext(2L)
                .verifyComplete();

        // Invalid user email
        StepVerifier
                .create(this.customerService.saveCustomerAndProductsWithTX("b_b.com", "p3").collectList())
                .expectError()
                .verify();

        StepVerifier
                .create(this.customerRepository.count())
                .expectNext(1L)
                .verifyComplete();

        StepVerifier
                .create(this.productRepository.count())
                .expectNext(2L)
                .verifyComplete();

        // Invalid product name
        StepVerifier
                .create(this.customerService.saveCustomerAndProductsWithTX("c@c.com", "p4", "").collectList())
                .expectError()
                .verify();

        StepVerifier
                .create(this.customerRepository.count())
                .expectNext(1L)
                .verifyComplete();

        StepVerifier
                .create(this.productRepository.count())
                .expectNext(2L)
                .verifyComplete();

        // Create valid entries
        StepVerifier
                .create(this.customerService.saveCustomerAndProductsWithTX("z@z.com", "p100", "p101").collectList())
                .assertNext(productList -> {
                    assertThat(productList.size()).isEqualTo(2);
                })
                .verifyComplete();

        StepVerifier
                .create(this.customerRepository.count())
                .expectNext(2L)
                .verifyComplete();

        StepVerifier
                .create(this.productRepository.count())
                .expectNext(4L)
                .verifyComplete();
    }

    @Test
    public void integrationTest_saveCustomerAndProductsWithoutTX() {

        StepVerifier
                .create(this.customerService.saveCustomerAndProductsWithoutTX("a@a.com", "p1", "p2").collectList())
                .assertNext(productList -> {
                    assertThat(productList.size()).isEqualTo(2);
                })
                .verifyComplete();

        StepVerifier
                .create(this.customerRepository.count())
                .expectNext(1L)
                .verifyComplete();

        StepVerifier
                .create(this.productRepository.count())
                .expectNext(2L)
                .verifyComplete();

        // Invalid user email
        StepVerifier
                .create(this.customerService.saveCustomerAndProductsWithoutTX("b_b.com", "p3"))
                .expectError()
                .verify();

        StepVerifier
                .create(this.customerRepository.count())
                .expectNext(1L)
                .verifyComplete();

        StepVerifier
                .create(this.productRepository.count())
                .expectNext(2L)
                .verifyComplete();

        // Invalid product name
        StepVerifier
                .create(this.customerService.saveCustomerAndProductsWithoutTX("c@c.com", "p4", "").collectList())
                .expectError()
                .verify();

        StepVerifier
                .create(this.customerRepository.count())
                .expectNext(2L)
                .verifyComplete();

        StepVerifier
                .create(this.productRepository.count())
                .expectNext(3L)
                .verifyComplete();
    }
}