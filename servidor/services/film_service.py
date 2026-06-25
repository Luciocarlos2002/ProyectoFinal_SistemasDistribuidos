import requests

API_URL = "http://158.23.164.47:8000/films"

class FilmException(Exception):
    pass


def obtener_film(film_id: int):
    try:
        response = requests.get(
            f"{API_URL}/{film_id}",
            timeout=5
        )

        # Servicio respondió pero con error
        if response.status_code != 200:
            raise FilmException(
                "No se pudo obtener la información de la película."
            )

        film = response.json()

        return {
            "rental_rate": film["rental_rate"],
            "rental_duration": film["rental_duration"],
            "category_name": film["category_name"]
        }

    except requests.exceptions.ConnectionError:
        raise FilmException(
            "El servicio de películas no está disponible en este momento."
        )

    except requests.exceptions.Timeout:
        raise FilmException(
            "El servicio de películas tardó demasiado en responder."
        )

    except requests.exceptions.RequestException:
        raise FilmException(
            "Ocurrió un error al comunicarse con el servicio de películas."
        )