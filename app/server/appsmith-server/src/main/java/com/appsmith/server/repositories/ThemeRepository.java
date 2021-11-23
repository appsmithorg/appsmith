package com.appsmith.server.repositories;

import com.appsmith.server.domains.Theme;
import org.springframework.stereotype.Repository;

@Repository
public interface ThemeRepository extends BaseRepository<Theme, String>, CustomThemeRepository {

}
