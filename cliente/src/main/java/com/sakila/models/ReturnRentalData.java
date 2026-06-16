package com.sakila.models;

public class ReturnRentalData {
    private Integer rental_id;
    private Integer inventory_id;
    private Integer days_late;
    private Double penalty;
    private String status;

    public Integer getRentalId() { return rental_id; }
    public Integer getInventoryId() { return inventory_id; }
    public Integer getDaysLate() { return days_late; }
    public Double getPenalty() { return penalty; }
    public String getStatus() { return status; }
}
