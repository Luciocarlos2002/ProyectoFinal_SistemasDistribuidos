package com.sakila.gui;

import com.sakila.models.ApiResponse;
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

public class ConsultaTab {

    private static final String BG_DARK      = "-fx-background-color: #0f172a;";
    private static final String BADGE_SUFFIX = "-fx-font-weight: bold; -fx-font-size: 12px; -fx-background-radius: 4; -fx-padding: 3 10 3 10;";

    private VBox view;
    private RentalApiClient apiClient;

    // Result labels — updated in-place on each search
    private final Label resultIdLabel  = new Label();
    private final Label filmValue      = new Label("—");
    private final Label customerValue  = new Label("—");
    private final Label rentDateValue  = new Label("—");
    private final Label retDateValue   = new Label("—");
    private final Label statusLabel    = new Label("—");
    private final VBox  resultCard     = buildResultCard();

    public ConsultaTab() {
        apiClient = new RentalApiClient();

        // ── Title ─────────────────────────────────────────────────────────────
        VBox titleSection = new VBox(4);
        Label title = new Label("Consultas");
        title.getStyleClass().add("section-title");
        Label subtitle = new Label("Busca y visualiza los detalles de un alquiler");
        subtitle.getStyleClass().add("section-subtitle");
        titleSection.getChildren().addAll(title, subtitle);

        // ── Search Card ───────────────────────────────────────────────────────
        TextField rentalIdField = new TextField();
        rentalIdField.setPromptText("Ingresa el ID de la renta");
        HBox.setHgrow(rentalIdField, Priority.ALWAYS);

        Button searchBtn = new Button("Buscar");
        searchBtn.getStyleClass().add("btn-primary");
        searchBtn.setMinWidth(110);

        HBox searchRow = new HBox(10, rentalIdField, searchBtn);
        searchRow.setAlignment(Pos.CENTER_LEFT);

        Label searchFieldLabel = new Label("ID DE RENTA");
        searchFieldLabel.getStyleClass().add("field-label");

        VBox searchCard = new VBox(10);
        searchCard.getStyleClass().add("card");
        searchCard.getChildren().addAll(searchFieldLabel, searchRow);

        // ── Search Action ─────────────────────────────────────────────────────
        searchBtn.setOnAction(e -> {
            try {
                int rentalId = Integer.parseInt(rentalIdField.getText().trim());
                ApiResponse<Rental> response = apiClient.getRentalById(rentalId);

                if (response != null && response.getData() != null) {
                    populateResult(response.getData());
                    resultCard.setVisible(true);
                    resultCard.setManaged(true);
                } else {
                    resultCard.setVisible(false);
                    resultCard.setManaged(false);
                    showAlert(Alert.AlertType.INFORMATION, "Sin resultados",
                        "No se encontró la renta #" + rentalId + ".");
                }
            } catch (NumberFormatException ex) {
                showAlert(Alert.AlertType.WARNING, "Campo inválido", "Ingresa un Rental ID válido.");
            } catch (Exception ex) {
                showAlert(Alert.AlertType.ERROR, "Error de Conexión", ex.getMessage());
            }
        });

        // ── Layout ────────────────────────────────────────────────────────────
        VBox content = new VBox(20);
        content.setPadding(new Insets(36, 30, 30, 30));
        content.setStyle(BG_DARK);
        content.setMaxWidth(580);
        content.getChildren().addAll(titleSection, searchCard, resultCard);

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

    private VBox buildResultCard() {
        resultIdLabel.getStyleClass().add("result-id-label");

        Region divider = new Region();
        divider.getStyleClass().add("divider");
        divider.setMaxWidth(Double.MAX_VALUE);

        for (Label l : new Label[]{filmValue, customerValue, rentDateValue, retDateValue}) {
            l.getStyleClass().add("info-value");
            l.setWrapText(true);
        }

        VBox card = new VBox(0);
        card.getStyleClass().add("card");
        card.setVisible(false);
        card.setManaged(false);
        card.getChildren().addAll(
            resultIdLabel,
            spacer(10),
            divider,
            spacer(14),
            infoRow("PELÍCULA",    filmValue),
            infoRow("CLIENTE",     customerValue),
            infoRow("FECHA RENTA", rentDateValue),
            infoRow("DEVOLUCIÓN",  retDateValue),
            infoRow("ESTADO",      statusLabel)
        );
        return card;
    }

    private void populateResult(Rental r) {
        resultIdLabel.setText(
            "Rental  #" + r.getRentalId()
            + (r.getFilmTitle() != null ? "  ·  " + r.getFilmTitle() : "")
        );
        filmValue.setText(r.getFilmTitle()     != null ? r.getFilmTitle()    : "—");
        customerValue.setText(r.getCustomerName() != null ? r.getCustomerName() : "—");
        rentDateValue.setText(r.getRentalDate() != null ? r.getRentalDate()  : "—");
        retDateValue.setText(r.getReturnDate()  != null ? r.getReturnDate()  : "Pendiente");

        String status = r.getStatus() != null ? r.getStatus().toUpperCase() : "DESCONOCIDO";
        statusLabel.setText(status);
        statusLabel.setStyle(statusStyle(status));
    }

    private String statusStyle(String status) {
        return switch (status) {
            case "ACTIVE",   "ACTIVO"   -> "-fx-background-color: rgba(16,185,129,0.15); -fx-text-fill: #10b981;"  + BADGE_SUFFIX;
            case "RETURNED", "DEVUELTO" -> "-fx-background-color: rgba(100,116,139,0.15); -fx-text-fill: #64748b;" + BADGE_SUFFIX;
            case "OVERDUE",  "VENCIDO"  -> "-fx-background-color: rgba(239,68,68,0.15); -fx-text-fill: #ef4444;"   + BADGE_SUFFIX;
            default -> "-fx-text-fill: #94a3b8; -fx-font-size: 13px;";
        };
    }

    private HBox infoRow(String key, Label valueLabel) {
        Label keyLabel = new Label(key);
        keyLabel.getStyleClass().add("info-key");
        keyLabel.setMinWidth(140);

        HBox row = new HBox(keyLabel, valueLabel);
        row.setAlignment(Pos.CENTER_LEFT);
        row.setPadding(new Insets(9, 0, 9, 0));
        return row;
    }

    private Region spacer(int height) {
        Region r = new Region();
        r.setPrefHeight(height);
        r.setMinHeight(height);
        r.setMaxHeight(height);
        return r;
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
