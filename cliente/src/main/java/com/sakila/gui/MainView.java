package com.sakila.gui;

import javafx.geometry.Pos;
import javafx.scene.control.Label;
import javafx.scene.control.Tab;
import javafx.scene.control.TabPane;
import javafx.scene.layout.BorderPane;
import javafx.scene.layout.HBox;
import javafx.scene.layout.StackPane;
import javafx.scene.layout.VBox;

public class MainView {

    private BorderPane view;

    public MainView() {
        view = new BorderPane();

        // ── App Header ────────────────────────────────────────────────────────
        HBox header = new HBox(14);
        header.getStyleClass().add("app-header");
        header.setAlignment(Pos.CENTER_LEFT);

        StackPane iconCircle = new StackPane();
        iconCircle.setMinSize(46, 46);
        iconCircle.setMaxSize(46, 46);
        iconCircle.setStyle(
            "-fx-background-color: #3b82f6;" +
            "-fx-background-radius: 23;" +
            "-fx-effect: dropshadow(gaussian, rgba(59,130,246,0.55), 10, 0, 0, 0);"
        );
        Label iconLabel = new Label("🎬");
        iconLabel.setStyle("-fx-font-size: 19px;");
        iconCircle.getChildren().add(iconLabel);

        VBox titleBox = new VBox(2);
        Label headerTitle = new Label("Sakila Rental POS");
        headerTitle.getStyleClass().add("header-title");
        Label headerSub = new Label("SISTEMA DE ALQUILERES Y DEVOLUCIONES");
        headerSub.getStyleClass().add("header-subtitle");
        titleBox.getChildren().addAll(headerTitle, headerSub);

        header.getChildren().addAll(iconCircle, titleBox);
        view.setTop(header);

        // ── Tab Pane ──────────────────────────────────────────────────────────
        TabPane tabPane = new TabPane();

        Tab rentalTab = new Tab("  Nueva Renta  ");
        rentalTab.setContent(new RentalTab().getView());
        rentalTab.setClosable(false);

        Tab returnTab = new Tab("  Devolución  ");
        returnTab.setContent(new ReturnTab().getView());
        returnTab.setClosable(false);

        Tab consultaTab = new Tab("  Consultas  ");
        consultaTab.setContent(new ConsultaTab().getView());
        consultaTab.setClosable(false);

        tabPane.getTabs().addAll(rentalTab, returnTab, consultaTab);
        view.setCenter(tabPane);
    }

    public BorderPane getView() {
        return view;
    }
}
