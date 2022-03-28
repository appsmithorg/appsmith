package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Theme;
import com.appsmith.server.repositories.BaseRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ThemeRepositoryCE extends BaseRepository<Theme, String>, CustomThemeRepositoryCE {

}
