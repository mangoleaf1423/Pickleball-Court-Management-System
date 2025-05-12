package vn.pickleball.identityservice.client;

import feign.FeignException;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import vn.pickleball.identityservice.dto.payment.CreateQrRequest;
import vn.pickleball.identityservice.dto.payment.MbVietQrRefundWithAmountRequest;
import vn.pickleball.identityservice.dto.response.MbQrCodeResponse;

@FeignClient(name = "payment-client" , url = "${payment.url}")
public interface PaymentClient {
    @PostMapping("${payment.create_qr}")
    MbQrCodeResponse createQr(@RequestBody CreateQrRequest mbQrCodeCreateRequest ,
                              @RequestHeader("API_KEY") String apiKey,
                              @RequestHeader("CLIENT_ID") String clientId) throws FeignException;

    @PostMapping("${payment.refund}")
    void refund(@RequestBody MbVietQrRefundWithAmountRequest refundWithAmountRequest,
                @RequestHeader("API_KEY") String apiKey,
                @RequestHeader("CLIENT_ID") String clientId) throws FeignException;
}
