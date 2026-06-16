package com.sakila.models;

public class CancelRentalData {
    private Integer rental_id;
    private Integer inventory_id;
    private Double refund;
    private Integer staff_id;
    private String status;

    public Integer getRentalId() { return rental_id; }
    public Integer getInventoryId() { return inventory_id; }
    public Double getRefund() { return refund; }
    public Integer getStaffId() { return staff_id; }
    public String getStatus() { return status; }
}
