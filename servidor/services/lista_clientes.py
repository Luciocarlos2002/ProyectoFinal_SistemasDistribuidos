import requests

API_URL = "http://35.239.247.220:8001/clientes?estado=activo&por_pagina=100&pagina=1"

class CustomerException(Exception):
    pass

def obtener_clientes_activos():
    try:
        response = requests.get(
            API_URL,
            timeout=5
        )

        if response.status_code != 200:
            raise CustomerException(
                "No se pudo obtener la lista de clientes."
            )

        data = response.json()

        clientes = []

        for cliente in data.get("items", []):
            clientes.append({
                "customer_id": cliente["customer_id"],
                "nombre": cliente["nombre"],
                "apellido": cliente["apellido"]
            })

        return clientes

    except requests.exceptions.ConnectionError:
        raise CustomerException(
            "El servicio de clientes no está disponible en este momento."
        )

    except requests.exceptions.Timeout:
        raise CustomerException(
            "El servicio de clientes tardó demasiado en responder."
        )

    except requests.exceptions.RequestException:
        raise CustomerException(
            "Ocurrió un error al comunicarse con el servicio de clientes."
        )