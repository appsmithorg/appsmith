package com.appsmith.server;

import com.appsmith.server.services.ApplicationServiceTest;
import com.appsmith.server.services.LayoutServiceTest;
import com.appsmith.server.services.OrganizationServiceTest;
import com.appsmith.server.services.PageServiceTest;
import com.appsmith.server.services.UserServiceTest;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.Suite;
import org.springframework.boot.test.context.SpringBootTest;

@RunWith(Suite.class)
@SpringBootTest
@Suite.SuiteClasses({
        OrganizationServiceTest.class,
        ApplicationServiceTest.class,
        LayoutServiceTest.class,
        UserServiceTest.class,
        PageServiceTest.class,
})
public class ServerApplicationTests {

    @Test
    public void contextLoads() {
        assert (true);
    }

}
