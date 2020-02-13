package com.appsmith.server.repositories;

import com.appsmith.server.domains.User;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface UserRepository extends BaseRepository<User, String> {

    Mono<User> findByEmail(String email);
//    {
//        System.out.println("In the custom findByEmail");
//        return Mono.empty();
//    }
}
