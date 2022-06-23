package com.appsmith.server;

import com.appsmith.server.repositories.ce.CustomerRepository;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.test.StepVerifier;

@RunWith(SpringRunner.class)
@SpringBootTest
@DirtiesContext
public class CustomerServiceTest {

    @Autowired
    private CustomerService customerService;

    @Autowired
    private CustomerRepository customerRepository;

    @Test
    public void saveAllCustomer() {
        StepVerifier
                .create(customerRepository.deleteAll())
                .verifyComplete();

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
}