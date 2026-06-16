package com.sakila.gui;

import com.sakila.models.ApiResponse;
import com.sakila.models.PenaltyPreviewData;
import com.sakila.models.ReturnRentalData;
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

public class ReturnTab {

    private static final String BG_DARK = "-fx-background-color: #0f172a;";

    private VBox view;
    private RentalApiClient apiClient;

    public ReturnTab() {
        apiClient = new RentalApiClient();

        // ── Title ─────────────────────────────────────────────────────────────
        VBox titleSection = new VBox(4);
        Label title = new Label("Devolución");
        title.getStyleClass().add("section-title");
        Label subtitle = new Label("Procesa la devolución de un ejemplar alquilado");
        subtitle.getStyleClass().add("section-subtitle");
        titleSection.getChildren().addAll(title, subtitle);

        // ── Fields ────────────────────────────────────────────────────────────
        TextField rentalIdField = new TextField();
        rentalIdField.setPromptText("Ej: 123");
        rentalIdField.setMaxWidth(Double.MAX_VALUE);

        TextField staffField = new TextField("1");
        staffField.setMaxWidth(Double.MAX_VALUE);

        // ── Buttons ───────────────────────────────────────────────────────────
        Button previewBtn = new Button("Calcular Penalidad");
        previewBtn.getStyleClass().add("btn-warning");
        previewBtn.setMaxWidth(Double.MAX_VALUE);

        Button returnBtn = new Button("Confirmar Devolución");
        returnBtn.getStyleClass().add("btn-success");
        returnBtn.setMaxWidth(Double.MAX_VALUE);
        returnBtn.setDisable(true);

        // ── Input Card ────────────────────────────────────────────────────────
        Region divider = new Region();
        divider.getStyleClass().add("divider");
        divider.setMaxWidth(Double.MAX_VALUE);

        VBox inputCard = new VBox(16);
        inputCard.getStyleClass().add("card");
        inputCard.getChildren().addAll(
            createFieldGroup("ID DE RENTA", rentalIdField),
            createFieldGroup("ID DE STAFF", staffField),
            divider,
            previewBtn,
            returnBtn
        );

        // ── Penalty Card (hidden initially) ───────────────────────────────────
        VBox penaltyCard = new VBox(10);
        penaltyCard.getStyleClass().add("penalty-card");
        penaltyCard.setVisible(false);
        penaltyCard.setManaged(false);

        HBox penaltyHeaderRow = new HBox(8);
        penaltyHeaderRow.setAlignment(Pos.CENTER_LEFT);
        Label penaltyWarningIcon = new Label("⚠");
        penaltyWarningIcon.setStyle("-fx-text-fill: #ef4444; -fx-font-size: 14px;");
        Label penaltyHeaderLabel = new Label("PENALIDAD DETECTADA");
        penaltyHeaderLabel.setStyle(
            "-fx-text-fill: #fca5a5; -fx-font-size: 11px; -fx-font-weight: bold;"
        );
        penaltyHeaderRow.getChildren().addAll(penaltyWarningIcon, penaltyHeaderLabel);

        Label penaltyAmountLabel = new Label("$0.00");
        penaltyAmountLabel.getStyleClass().add("penalty-amount-label");

        Label penaltySublabel = new Label("MONTO TOTAL A COBRAR");
        penaltySublabel.getStyleClass().add("penalty-sublabel");

        VBox penaltyStats = new VBox(5);
        Label daysElapsedLabel = new Label("—");
        daysElapsedLabel.setStyle("-fx-text-fill: #94a3b8; -fx-font-size: 13px;");
        Label daysLateLabel = new Label("—");
        daysLateLabel.setStyle("-fx-text-fill: #94a3b8; -fx-font-size: 13px;");
        Label rateLabel = new Label("—");
        rateLabel.setStyle("-fx-text-fill: #94a3b8; -fx-font-size: 13px;");
        penaltyStats.getChildren().addAll(daysElapsedLabel, daysLateLabel, rateLabel);

        penaltyCard.getChildren().addAll(
            penaltyHeaderRow, penaltyAmountLabel, penaltySublabel, penaltyStats
        );

        // ── No-Penalty Card (hidden initially) ────────────────────────────────
        VBox noPenaltyCard = new VBox(6);
        noPenaltyCard.getStyleClass().add("no-penalty-card");
        noPenaltyCard.setVisible(false);
        noPenaltyCard.setManaged(false);

        HBox noPenaltyHeader = new HBox(8);
        noPenaltyHeader.setAlignment(Pos.CENTER_LEFT);
        Label noPenaltyIcon = new Label("✓");
        noPenaltyIcon.setStyle(
            "-fx-text-fill: #10b981; -fx-font-size: 16px; -fx-font-weight: bold;"
        );
        Label noPenaltyTitle = new Label("Sin Penalidad");
        noPenaltyTitle.getStyleClass().add("no-penalty-label");
        noPenaltyHeader.getChildren().addAll(noPenaltyIcon, noPenaltyTitle);

        Label noPenaltyInfo = new Label("La devolución es a tiempo — sin cargos adicionales.");
        noPenaltyInfo.setStyle("-fx-text-fill: #475569; -fx-font-size: 13px;");
        noPenaltyCard.getChildren().addAll(noPenaltyHeader, noPenaltyInfo);

        // ── Preview Action ────────────────────────────────────────────────────
        previewBtn.setOnAction(e -> {
            try {
                int rentalId = Integer.parseInt(rentalIdField.getText().trim());
                ApiResponse<PenaltyPreviewData> response = apiClient.getPenaltyPreview(rentalId);

                if (response != null && response.getData() != null) {
                    PenaltyPreviewData data = response.getData();
                    int daysLate = data.getDaysLate() != null ? data.getDaysLate() : 0;
                    double penalty = data.getPenaltyAmount() != null ? data.getPenaltyAmount() : 0.0;

                    if (daysLate > 0) {
                        penaltyAmountLabel.setText(String.format("$%.2f", penalty));
                        daysElapsedLabel.setText("Días transcurridos:  " + data.getDaysElapsed());
                        daysLateLabel.setText("Días de retraso:       " + daysLate);
                        rateLabel.setText(String.format("Tarifa por día:         $%.2f", data.getPenaltyPerDay()));
                        penaltyCard.setVisible(true);
                        penaltyCard.setManaged(true);
                        noPenaltyCard.setVisible(false);
                        noPenaltyCard.setManaged(false);
                    } else {
                        noPenaltyCard.setVisible(true);
                        noPenaltyCard.setManaged(true);
                        penaltyCard.setVisible(false);
                        penaltyCard.setManaged(false);
                    }
                    returnBtn.setDisable(false);
                } else {
                    showAlert(Alert.AlertType.ERROR, "Error", "No se encontró la renta o hubo un error del servidor.");
                }
            } catch (NumberFormatException ex) {
                showAlert(Alert.AlertType.WARNING, "Campo inválido", "Rental ID inválido.");
            } catch (Exception ex) {
                showAlert(Alert.AlertType.ERROR, "Error", ex.getMessage());
            }
        });

        // ── Return Action ─────────────────────────────────────────────────────
        returnBtn.setOnAction(e -> {
            try {
                int rentalId = Integer.parseInt(rentalIdField.getText().trim());
                int staffId  = Integer.parseInt(staffField.getText().trim());

                ApiResponse<ReturnRentalData> response = apiClient.returnRental(rentalId, staffId);
                if (response != null && response.getData() != null) {
                    ReturnRentalData data = response.getData();
                    double penalty = data.getPenalty() != null ? data.getPenalty() : 0.0;
                    showAlert(Alert.AlertType.INFORMATION, "Devolución Registrada",
                        "Renta #" + data.getRentalId() + " devuelta correctamente.\n"
                        + "Penalidad aplicada: $" + String.format("%.2f", penalty));
                    rentalIdField.clear();
                    penaltyCard.setVisible(false);
                    penaltyCard.setManaged(false);
                    noPenaltyCard.setVisible(false);
                    noPenaltyCard.setManaged(false);
                    returnBtn.setDisable(true);
                } else {
                    showAlert(Alert.AlertType.ERROR, "Error", "No se pudo registrar la devolución.");
                }
            } catch (Exception ex) {
                showAlert(Alert.AlertType.ERROR, "Error", ex.getMessage());
            }
        });

        // ── Layout ────────────────────────────────────────────────────────────
        VBox content = new VBox(20);
        content.setPadding(new Insets(36, 30, 30, 30));
        content.setStyle(BG_DARK);
        content.setMaxWidth(540);
        content.getChildren().addAll(titleSection, inputCard, penaltyCard, noPenaltyCard);

        HBox centerWrapper = new HBox();
        centerWrapper.setAlignment(Pos.TOP_CENTER);
        centerWrapper.setStyle(BG_DARK);
        centerWrapper.getChildren().add(content);

        ScrollPane scrollPane = new ScrollPane(centerWrapper);
        scrollPane.setFitToWidth(true);
        scrollPane.getStyleClass().add("scroll-pane");

        view = new VBox();
        view.setStyle(BG_DARK);
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
