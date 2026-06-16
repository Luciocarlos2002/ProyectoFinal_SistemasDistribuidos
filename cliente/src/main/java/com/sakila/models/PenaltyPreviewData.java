package com.sakila.models;

public class PenaltyPreviewData {
    private Integer rental_id;
    private Integer days_elapsed;
    private Integer days_late;
    private Double penalty_per_day;
    private Double penalty_amount;

    public Integer getRentalId() { return rental_id; }
    public Integer getDaysElapsed() { return days_elapsed; }
    public Integer getDaysLate() { return days_late; }
    public Double getPenaltyPerDay() { return penalty_per_day; }
    public Double getPenaltyAmount() { return penalty_amount; }
}
