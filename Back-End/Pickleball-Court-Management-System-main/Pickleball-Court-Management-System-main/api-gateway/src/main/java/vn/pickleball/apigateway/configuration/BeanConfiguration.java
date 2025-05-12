package vn.pickleball.apigateway.configuration;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
import reactor.core.publisher.Mono;
import vn.pickleball.apigateway.service.JwtService;
import vn.pickleball.apigateway.util.WebExchangeUtils;

import java.util.Optional;

@Configuration
@RequiredArgsConstructor
public class BeanConfiguration {

    private final JwtService jwtService;

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplateBuilder()
            .build();
    }

    @Bean
    public KeyResolver userIdKeyResolver() {
        return exchange -> Mono.just(Optional.ofNullable(WebExchangeUtils.getUserIdFromWebExchange(exchange))
                .map(jwtService::getUserIdFromAccessToken)
                .orElse(""));
    }

}
