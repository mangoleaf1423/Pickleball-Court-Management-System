package vn.pickleball.apigateway.filter;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import vn.pickleball.apigateway.service.OAuth2Service;


import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;


@Slf4j
@Component
@RequiredArgsConstructor
public class AuthorizationFilter implements GlobalFilter {

    @Value("${permit.white_list}")
    private String white_list;

    private final OAuth2Service oAuth2Service;


    private List<String> getPermitPathList() {
        return Arrays.asList(white_list.split("\\|"));
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getPath().toString();

        if (isPermitPath(path)) {
            log.info("Path {} is permit", path);
            return chain.filter(exchange);
        }

        String token = Optional.of(exchange.getRequest())
                .map(ServerHttpRequest::getHeaders)
                .map(headers -> headers.get(HttpHeaders.AUTHORIZATION))
                .map(headers -> headers.get(0))
                .map(bearerToken -> bearerToken.split(" ")[1])
                .orElse(null);

        if (token == null || !oAuth2Service.checkValid(token)) {
            String errorJson = generateErrorJson(exchange.getRequest().getPath().toString());

            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);

            return exchange.getResponse()
                    .writeWith(Mono.just(
                            exchange.getResponse().bufferFactory().wrap(errorJson.getBytes(StandardCharsets.UTF_8))
                    ));
        }
        return chain.filter(exchange);
    }

    private boolean isPermitPath(String path) {
        List<String> PERMIT_PATHS = getPermitPathList();
        return PERMIT_PATHS.stream().anyMatch(path::startsWith);
    }

    private String generateErrorJson(String path) {
        String timestamp = LocalDateTime.now().toString();
        return String.format(
                "{\"timestamp\": \"%s\", \"path\": \"%s\", \"status\": 401, \"error\": \"Unauthorized\", \"message\": \"%s\"}",
                timestamp, path, "fail on introspect");
    }
}
