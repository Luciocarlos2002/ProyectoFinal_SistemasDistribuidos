import requests

BASE_URL = "http://4.248.144.14:8000/api/v1/inventory"
TIMEOUT_DEFAULT = 5


class InventoryException(Exception):
    pass

# Consume el endpoint /inventory/stock?store_id=&status=available
# Valida cuantas copias tiene cada pelicula
def obtener_inventorys(store_id: int):

    try:
        response = requests.get(
            f"{BASE_URL}/stock",
            params={
                "store_id": store_id,
                "status": "available"
            },
            timeout=TIMEOUT_DEFAULT
        )

        if response.status_code != 200:
            raise InventoryException(
                "No se pudo obtener la información del inventario."
            )

        data = response.json()

        if not data.get("data"):
            raise InventoryException(
                "No existen películas disponibles para la tienda seleccionada."
            )

        return [
            {
                "film_id": item["film_id"],
                "title": item["title"],
                "available_copies": item["available_copies"]
            }
            for item in data["data"]
            if item.get("available_copies", 0) > 0
        ]

    except requests.exceptions.ConnectionError:
        raise InventoryException(
            "El servicio de inventario no está disponible en este momento."
        )

    except requests.exceptions.Timeout:
        raise InventoryException(
            "El servicio de inventario tardó demasiado en responder."
        )

    except requests.exceptions.RequestException:
        raise InventoryException(
            "Ocurrió un error al comunicarse con el servicio de inventario."
        )


# Consume el endpoint /inventory/status/{film_id}?store_id=
# Obtiene el estado de las peliculas
def obtener_estado_inventory(film_id: int, store_id: int):

    try:
        response = requests.get(
            f"{BASE_URL}/status/{film_id}",
            params={
                "store_id": store_id
            },
            timeout=5
        )

        if response.status_code != 200:
            raise InventoryException(
                "No se pudo obtener el estado del inventario."
            )

        data = response.json()

        copies = data.get("copies", [])

        return {
            "film_id": data.get("film_id"),
            "title": data.get("title"),
            "store_id": data.get("store_id"),
            "items": [
                {
                    "inventory_id": copy.get("inventory_id"),
                    "status": copy.get("status")
                }
                for copy in copies
                if copy.get("status") == "available"
            ]
        }

    except requests.exceptions.ConnectionError:
        raise InventoryException(
            "El servicio de inventario no está disponible en este momento."
        )

    except requests.exceptions.Timeout:
        raise InventoryException(
            "El servicio de inventario tardó demasiado en responder."
        )

    except requests.exceptions.RequestException:
        raise InventoryException(
            "Ocurrió un error al comunicarse con el servicio de inventario."
        )