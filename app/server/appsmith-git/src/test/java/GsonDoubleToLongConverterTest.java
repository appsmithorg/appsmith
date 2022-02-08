import com.appsmith.git.converters.GsonDoubleToLongConverter;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import org.junit.Before;
import org.junit.Test;

import static org.assertj.core.api.Assertions.assertThat;

public class GsonDoubleToLongConverterTest {
    private Gson gson;

    @Before
    public void setUp() {
        gson = new GsonBuilder()
                .registerTypeAdapter(Double.class, new GsonDoubleToLongConverter())
                .create();
    }

    @Test
    public void convert_whenNull_returnsNullString() {
        String orderedData = gson.toJson((Object) null);
        assertThat(orderedData).isEqualTo("null");
    }

    @Test
    public void convert_withDoubleInput_returnsDoubleString() {
        Double[] data = {1.00, 0.50, 1.50};
        String orderedData = gson.toJson(data);
        assertThat(orderedData).isEqualTo("[1,0.5,1.5]");
    }

    @Test
    public void convert_withLongInput_returnsLongString() {
        Long[] data = {1L, 10L, 100L};
        String orderedData = gson.toJson(data);
        assertThat(orderedData).isEqualTo("[1,10,100]");
    }
}
