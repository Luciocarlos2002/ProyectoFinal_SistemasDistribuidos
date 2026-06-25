import requests

API_URL = "http://4.248.144.14:8000/api/v1/inventory/stock"

class InventoryException(Exception):
    pass


def obtener_inventorys(store_id: int):
    try:
        response = requests.get(
            API_URL,
            params={
                "store_id": store_id,
                "status": "available"
            },
            timeout=5
        )
        
        if response.status_code != 200:
            raise InventoryException(
                "No se pudo obtener la información del inventario."
            )

        inventorys = response.json()

        if not inventorys:
            raise InventoryException(
                "No existen películas disponibles para la tienda seleccionada."
            )

        return [
            {
                "inventory_id": item["inventory_id"],
                "title": item["title"]
            }
            for item in inventorys["data"]
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