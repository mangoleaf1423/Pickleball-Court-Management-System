package vn.pickleball.apigateway.route;

import org.springframework.cloud.gateway.route.Route;
import org.springframework.cloud.gateway.route.builder.Buildable;
import org.springframework.cloud.gateway.route.builder.PredicateSpec;

import java.util.function.Function;

public interface ServiceRoute {

    public String getId();

    public Function<PredicateSpec, Buildable<Route>> route();

}

