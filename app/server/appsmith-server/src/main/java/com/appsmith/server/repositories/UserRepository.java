package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.UserRepositoryCE;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends UserRepositoryCE, CustomUserRepository {

}
