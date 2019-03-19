package com.mobtools.server.repositories;

import com.mobtools.server.domains.User;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends BaseRepository<User, String> {
}
