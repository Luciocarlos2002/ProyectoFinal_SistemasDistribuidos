package com.sakila.models;

public class PenaltyPaymentData {
    private Integer rental_id;
    private Double penalty_paid;
    private String status;

    public Integer getRentalId() { return rental_id; }
    public Double getPenaltyPaid() { return penalty_paid; }
    public String getStatus() { return status; }
}
