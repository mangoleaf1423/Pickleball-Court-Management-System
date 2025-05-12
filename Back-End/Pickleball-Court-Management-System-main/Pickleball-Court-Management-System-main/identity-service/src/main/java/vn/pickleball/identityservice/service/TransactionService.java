package vn.pickleball.identityservice.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.pickleball.identityservice.dto.response.TransactionDto;
import vn.pickleball.identityservice.entity.Order;
import vn.pickleball.identityservice.entity.Transaction;
import vn.pickleball.identityservice.repository.TransactionRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class TransactionService {
    private final TransactionRepository transactionRepository;

    public void saveTransaction(Transaction transaction){
        transactionRepository.save(transaction);
    }

    public List<Transaction> findByOrderId(String orderId){
        return transactionRepository.findByOrderId(orderId);
    }


    public Page<Transaction> getTransactions(
            String paymentStatus,
            List<String> courts,
            String orderId,
            LocalDateTime startDate,
            LocalDateTime endDate,
            int page,
            int size
    ) {
        PageRequest pageable = PageRequest.of(page - 1, size);
        return transactionRepository.findTransactions(
                paymentStatus, courts, orderId, startDate, endDate, pageable
        );
    }

    public BigDecimal getTotalAmountExcludingRefund(
            List<String> courts,
            String orderId,
            LocalDateTime startDate,
            LocalDateTime endDate
    ) {
        return transactionRepository.getTotalAmountExcludingRefund(courts, orderId, startDate, endDate);
    }

    public BigDecimal getTotalRefundAmount(
            List<String> courts,
            String orderId,
            LocalDateTime startDate,
            LocalDateTime endDate
    ) {
        return transactionRepository.getTotalRefundAmount(courts, orderId, startDate, endDate);
    }

    public List<Transaction> getTransactionByOrderId(String orderId) {
        return transactionRepository.findByOrderId(orderId);
    }

    public BigDecimal calculateTotalRefund(List<String> orderIds) {
        return transactionRepository.sumRefundAmountByOrderIds(orderIds);
    }

    public List<Transaction> findTransactionsByFilters(
            String paymentStatus,
            List<String> courtIds,
            String orderId,
            LocalDateTime startDate,
            LocalDateTime endDate
    ) {
        return transactionRepository.findTransactionsByFilters(
                paymentStatus,
                (courtIds != null && !courtIds.isEmpty()) ? courtIds : null,
                orderId,
                startDate,
                endDate
        );
    }
}
