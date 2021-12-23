package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.ThemeRepositoryCE;
import org.springframework.stereotype.Repository;

@Repository
public interface ThemeRepository extends ThemeRepositoryCE, CustomThemeRepository {
}
