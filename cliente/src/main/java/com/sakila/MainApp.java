package com.sakila;

import com.sakila.gui.MainView;
import javafx.application.Application;
import javafx.scene.Scene;
import javafx.stage.Stage;

public class MainApp extends Application {

    @Override
    public void start(Stage primaryStage) {
        MainView mainView = new MainView();
        Scene scene = new Scene(mainView.getView(), 920, 700);

        String css = getClass().getResource("/styles.css").toExternalForm();
        scene.getStylesheets().add(css);

        primaryStage.setTitle("Sakila Rental POS");
        primaryStage.setScene(scene);
        primaryStage.setMinWidth(680);
        primaryStage.setMinHeight(520);
        primaryStage.show();
    }

    public static void main(String[] args) {
        launch(args);
    }
}
