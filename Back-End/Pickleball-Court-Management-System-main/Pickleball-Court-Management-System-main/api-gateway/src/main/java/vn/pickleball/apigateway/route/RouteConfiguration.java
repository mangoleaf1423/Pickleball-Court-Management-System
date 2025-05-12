package vn.pickleball.apigateway.route;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.route.Route;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.Buildable;
import org.springframework.cloud.gateway.route.builder.PredicateSpec;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.function.Function;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class RouteConfiguration {

    private final List<ServiceRoute> serviceRoutes;

    @Bean
    public RouteLocator routeLocator(RouteLocatorBuilder routeLocatorBuilder) {
        RouteLocatorBuilder.Builder builder= routeLocatorBuilder.routes();

        serviceRoutes.sort((r1, r2) -> r1.getId().compareTo(r2.getId()));

        for(ServiceRoute serviceRoute : serviceRoutes) {
            String id = serviceRoute.getId();
            log.info("ADDING - {}", id);
            Function<PredicateSpec, Buildable<Route>> route = serviceRoute.route();
            builder = builder.route(id, route);
        }

        return builder.build();
    }

}

