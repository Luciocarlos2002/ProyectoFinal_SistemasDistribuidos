import requests

API_URL = "http://35.239.247.220:8001/clientes"

class CustomerException(Exception):
    pass

def obtener_cliente_por_id(customer_id):
    try:
        response = requests.get(
            f"{API_URL}/{customer_id}",
            timeout=5
        )

        # Servicio respondió pero con error
        if response.status_code != 200:
            raise CustomerException(
                "No se pudo obtener la información del cliente."
            )

        cliente = response.json()

        # Validar estado
        estado = cliente.get("estado", "").lower()

        if estado == "inactivo":
            raise CustomerException(
                "El cliente se encuentra inactivo y no puede realizar alquileres."
            )

        return {
            "customer_id": cliente["customer_id"],
            "fullName": f"{cliente['nombre']} {cliente['apellido']}",
            "data": cliente
        }

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