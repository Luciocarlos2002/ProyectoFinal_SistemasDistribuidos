package com.sakila.services;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import com.sakila.models.*;

import java.lang.reflect.Type;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

public class RentalApiClient {
    private static final String BASE_URL = "http://34.176.33.216:8000/api/v1/rentals";
    private final HttpClient client;
    private final Gson gson;

    public RentalApiClient() {
        this.client = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        this.gson = new Gson();
    }

    public ApiResponse<Rental> createRental(CreateRentalRequest req) throws Exception {
        String json = gson.toJson(req);
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        checkError(response);
        Type type = new TypeToken<ApiResponse<Rental>>() {
        }.getType();
        return gson.fromJson(response.body(), type);
    }

    public ApiResponse<ReturnRentalData> returnRental(int rentalId, int staffId) throws Exception {
        StaffRequest req = new StaffRequest(staffId);
        String json = gson.toJson(req);
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/" + rentalId + "/return"))
                .header("Content-Type", "application/json")
                .PUT(HttpRequest.BodyPublishers.ofString(json))
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        checkError(response);
        Type type = new TypeToken<ApiResponse<ReturnRentalData>>() {
        }.getType();
        return gson.fromJson(response.body(), type);
    }

    public ApiResponse<PenaltyPreviewData> getPenaltyPreview(int rentalId) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/" + rentalId + "/penalty-preview"))
                .GET()
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        checkError(response);
        Type type = new TypeToken<ApiResponse<PenaltyPreviewData>>() {
        }.getType();
        return gson.fromJson(response.body(), type);
    }

    public ApiResponse<Rental> getRentalById(int rentalId) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/" + rentalId))
                .GET()
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        checkError(response);
        Type type = new TypeToken<ApiResponse<Rental>>() {
        }.getType();
        return gson.fromJson(response.body(), type);
    }

    private void checkError(HttpResponse<String> response) throws Exception {
        if (response.statusCode() >= 400) {
            String msg = "Error " + response.statusCode();
            try {
                java.util.Map map = gson.fromJson(response.body(), java.util.Map.class);
                if (map != null && map.containsKey("detail")) {
                    msg = String.valueOf(map.get("detail"));
                }
            } catch (Exception ignored) {
                msg += ": " + response.body();
            }
            throw new Exception(msg);
        }
    }
}
