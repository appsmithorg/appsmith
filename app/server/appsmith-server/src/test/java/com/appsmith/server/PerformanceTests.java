package com.appsmith.server;

import org.junit.jupiter.api.Test;
import org.junit.platform.suite.api.IncludeTags;
import org.junit.platform.suite.api.Suite;
import org.springframework.boot.test.context.SpringBootTest;


//@SpringBootTest
//@Categories.IncludeCategory({PerformanceTest.class})
//@Suite.SuiteClasses({LayoutServiceTest.class})
@IncludeTags("performance")
@Suite
public class PerformanceTests {

    @Test
    public void contextLoads() {
        assert (true);
    }

}
