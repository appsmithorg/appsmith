package com.appsmith.server.repositories.ce;

import com.appsmith.server.repositories.CustomUserRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends UserRepositoryCE, CustomUserRepository {

}
