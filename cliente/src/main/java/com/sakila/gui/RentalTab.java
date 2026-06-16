package com.sakila.gui;

import com.sakila.models.ApiResponse;
import com.sakila.models.CreateRentalRequest;
import com.sakila.models.Rental;
import com.sakila.services.RentalApiClient;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.Alert;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.ScrollPane;
import javafx.scene.control.TextField;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.Region;
import javafx.scene.layout.VBox;

public class RentalTab {

    private VBox view;
    private RentalApiClient apiClient;

    public RentalTab() {
        apiClient = new RentalApiClient();

        // ── Title ─────────────────────────────────────────────────────────────
        VBox titleSection = new VBox(4);
        Label title = new Label("Nueva Renta");
        title.getStyleClass().add("section-title");
        Label subtitle = new Label("Registra un nuevo alquiler en el sistema");
        subtitle.getStyleClass().add("section-subtitle");
        titleSection.getChildren().addAll(title, subtitle);

        // ── Fields ────────────────────────────────────────────────────────────
        TextField inventoryField = new TextField();
        inventoryField.setPromptText("Ej: 101");
        inventoryField.setMaxWidth(Double.MAX_VALUE);

        TextField customerField = new TextField();
        customerField.setPromptText("Ej: 5");
        customerField.setMaxWidth(Double.MAX_VALUE);

        TextField staffField = new TextField("1");
        staffField.setMaxWidth(Double.MAX_VALUE);

        // ── Form Card ─────────────────────────────────────────────────────────
        Button submitBtn = new Button("Registrar Renta");
        submitBtn.getStyleClass().add("btn-primary");
        submitBtn.setMaxWidth(Double.MAX_VALUE);

        Region divider = new Region();
        divider.getStyleClass().add("divider");
        divider.setMaxWidth(Double.MAX_VALUE);

        VBox formCard = new VBox(16);
        formCard.getStyleClass().add("card");
        formCard.getChildren().addAll(
            createFieldGroup("ID DE INVENTARIO", inventoryField),
            createFieldGroup("ID DE CLIENTE", customerField),
            createFieldGroup("ID DE STAFF", staffField),
            divider,
            submitBtn
        );

        // ── Success Panel (hidden initially) ──────────────────────────────────
        HBox successPanel = new HBox(12);
        successPanel.getStyleClass().add("success-panel");
        successPanel.setAlignment(Pos.CENTER_LEFT);

        Label successIcon = new Label("✓");
        successIcon.setStyle(
            "-fx-text-fill: #10b981; -fx-font-size: 22px; -fx-font-weight: bold;"
        );
        VBox successTexts = new VBox(3);
        Label successTitle = new Label("Renta registrada exitosamente");
        successTitle.getStyleClass().add("success-title");
        Label successInfo = new Label("");
        successInfo.getStyleClass().add("success-info");
        successTexts.getChildren().addAll(successTitle, successInfo);

        successPanel.getChildren().addAll(successIcon, successTexts);
        successPanel.setVisible(false);
        successPanel.setManaged(false);

        // ── Submit Action ─────────────────────────────────────────────────────
        submitBtn.setOnAction(e -> {
            try {
                int invId   = Integer.parseInt(inventoryField.getText().trim());
                int custId  = Integer.parseInt(customerField.getText().trim());
                int staffId = Integer.parseInt(staffField.getText().trim());

                ApiResponse<Rental> response = apiClient.createRental(
                    new CreateRentalRequest(invId, custId, staffId)
                );

                if (response != null && response.getData() != null) {
                    Rental rental = response.getData();
                    successInfo.setText(
                        "Rental ID: #" + rental.getRentalId()
                        + (response.getMessage() != null ? "  ·  " + response.getMessage() : "")
                    );
                    successPanel.setVisible(true);
                    successPanel.setManaged(true);
                    inventoryField.clear();
                    customerField.clear();
                } else {
                    showAlert(Alert.AlertType.ERROR, "Error", "No se pudo registrar la renta.");
                }
            } catch (NumberFormatException ex) {
                showAlert(Alert.AlertType.WARNING, "Campo inválido", "Por favor ingresa solo números válidos.");
            } catch (Exception ex) {
                showAlert(Alert.AlertType.ERROR, "Error de Conexión", ex.getMessage());
            }
        });

        // ── Layout ────────────────────────────────────────────────────────────
        VBox content = new VBox(20);
        content.setPadding(new Insets(36, 30, 30, 30));
        content.setStyle("-fx-background-color: #0f172a;");
        content.setMaxWidth(540);
        content.getChildren().addAll(titleSection, formCard, successPanel);

        HBox centerWrapper = new HBox();
        centerWrapper.setAlignment(Pos.TOP_CENTER);
        centerWrapper.setStyle("-fx-background-color: #0f172a;");
        centerWrapper.getChildren().add(content);

        ScrollPane scrollPane = new ScrollPane(centerWrapper);
        scrollPane.setFitToWidth(true);
        scrollPane.getStyleClass().add("scroll-pane");

        view = new VBox();
        view.setStyle("-fx-background-color: #0f172a;");
        VBox.setVgrow(scrollPane, Priority.ALWAYS);
        view.getChildren().add(scrollPane);
    }

    private VBox createFieldGroup(String labelText, TextField field) {
        VBox group = new VBox(6);
        Label label = new Label(labelText);
        label.getStyleClass().add("field-label");
        group.getChildren().addAll(label, field);
        return group;
    }

    private void showAlert(Alert.AlertType type, String title, String content) {
        Alert alert = new Alert(type);
        alert.setTitle(title);
        alert.setHeaderText(null);
        alert.setContentText(content);
        alert.showAndWait();
    }

    public VBox getView() {
        return view;
    }
}
