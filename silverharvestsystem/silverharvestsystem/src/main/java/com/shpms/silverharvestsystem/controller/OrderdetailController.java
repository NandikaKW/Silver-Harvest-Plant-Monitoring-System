package com.shpms.silverharvestsystem.controller;

import com.shpms.silverharvestsystem.dto.OrderDetailDto;
import com.shpms.silverharvestsystem.service.OrderdetailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin
@RestController
@RequestMapping("api/v1/orderdetail")
@RequiredArgsConstructor
@Slf4j
public class OrderdetailController {
    private final OrderdetailService orderdetailService;

    // CREATE
    @PostMapping
    public ResponseEntity<OrderDetailDto> createOrderDetail(@RequestBody OrderDetailDto dto) {
        return ResponseEntity.ok(orderdetailService.createOrderDetail(dto));
    }

    // READ ALL
    @GetMapping
    public ResponseEntity<List<OrderDetailDto>> getAllOrderDetails() {
        return ResponseEntity.ok(orderdetailService.getAllOrderDetails());
    }

    // READ ONE
    @GetMapping("/{id}")
    public ResponseEntity<OrderDetailDto> getOrderDetailById(@PathVariable String id) {
        return orderdetailService.getOrderDetailById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
