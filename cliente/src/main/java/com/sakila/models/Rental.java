package com.sakila.models;

public class Rental {
    private Integer rental_id;
    private Integer customer_id;
    private Integer inventory_id;
    private String rental_date;
    private String return_date;
    private Integer film_id;
    private String film_title;
    private Double rental_rate;
    private String status;
    private String customer_name;

    public Integer getRentalId() { return rental_id; }
    public Integer getCustomerId() { return customer_id; }
    public Integer getInventoryId() { return inventory_id; }
    public String getRentalDate() { return rental_date; }
    public String getReturnDate() { return return_date; }
    public Integer getFilmId() { return film_id; }
    public String getFilmTitle() { return film_title; }
    public Double getRentalRate() { return rental_rate; }
    public String getStatus() { return status; }
    public String getCustomerName() { return customer_name; }

    @Override
    public String toString() {
        return "Rental #" + rental_id + (film_title != null ? " - " + film_title : "") + " (" + status + ")";
    }
}
