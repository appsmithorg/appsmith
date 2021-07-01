package com.appsmith.server.helpers;

import com.bazaarvoice.jolt.Shiftr;

import java.util.Map;

public class JoltTransformer {

    /**
     * @param input The object to be transformed
     * @param spec  The specification to be used for transformation
     * @return
     */
    public static Map<?, ?> transform(Map<?, ?> input, Map<?, ?> spec) {
        final Shiftr shiftr = new Shiftr(spec);

        return (Map<?, ?>) shiftr.transform(input);
    }

}