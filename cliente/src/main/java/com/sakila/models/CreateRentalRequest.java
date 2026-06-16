package com.sakila.models;

public class CreateRentalRequest {
    private int inventory_id;
    private int customer_id;
    private int staff_id;

    public CreateRentalRequest(int inventory_id, int customer_id, int staff_id) {
        this.inventory_id = inventory_id;
        this.customer_id = customer_id;
        this.staff_id = staff_id;
    }
}
