package vn.pickleball.identityservice.service;


import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.pickleball.identityservice.repository.BookingDateRepository;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class BookingDateService {
    protected final BookingDateRepository bookingDateRepository;

    public void deleteByOrderDetailId(String orderDetailId){
        bookingDateRepository.deleteByOrderDetailId(orderDetailId);
    }
}
