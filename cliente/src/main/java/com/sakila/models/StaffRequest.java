package com.sakila.models;

public class StaffRequest {
    private int staff_id;

    public StaffRequest(int staff_id) {
        this.staff_id = staff_id;
    }
    public int getStaffId() { return staff_id; }
}
