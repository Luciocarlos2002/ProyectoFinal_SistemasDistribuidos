import requests

# Ip invocada del servicio Clientes.
API_URL = "http://35.239.247.220:8001/clientes"
TIMEOUT_DEFAULT = 5

class CustomerException(Exception):
    pass

# Busca un cliente específico por su ID y valida que esté activo.
def obtener_cliente_por_id(customer_id):

    try:
        response = requests.get(
            f"{API_URL}/{customer_id}",
            timeout=TIMEOUT_DEFAULT
        )

        # Servicio respondió pero con error
        if response.status_code != 200:
            raise CustomerException(
                "No se pudo obtener la información del cliente."
            )

        # Encapsula el response y validar estado
        cliente = response.json()
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

# Obtiene la lista de los primeros 100 clientes activos.
def obtener_clientes_activos():
    
    try:
        # Usamos params para pasar los query parameters de forma limpia
        params = {
            "estado": "activo",
            "por_pagina": 100,
            "pagina": 1
        }
        
        response = requests.get(
            API_URL,
            params=params,
            timeout=TIMEOUT_DEFAULT
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