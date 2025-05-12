package vn.pickleball.identityservice.service;


import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.pickleball.identityservice.entity.OrderDetail;
import vn.pickleball.identityservice.repository.OrderDetailRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class OrderDetailService {
    private final OrderDetailRepository orderDetailRepository;

    public void deleteByOrderId(String orderId){
        orderDetailRepository.deleteByOrderId(orderId);
    }

    public void saveAll(List<OrderDetail> orderDetails){
        orderDetailRepository.saveAll(orderDetails);
    }
}
