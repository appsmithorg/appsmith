package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.UserDataRepositoryCE;
import org.springframework.stereotype.Repository;

@Repository
public interface UserDataRepository extends UserDataRepositoryCE, CustomUserDataRepository {

}
