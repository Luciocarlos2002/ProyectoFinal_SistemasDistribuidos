import requests

API_URL = "http://34.41.245.41:8000/auth/login"

class AuthException(Exception):
    pass

def login(email: str, password: str):
    try:
        response = requests.post(
            API_URL,
            json={
                "email": email,
                "password": password
            },
            timeout=5
        )

        if response.status_code != 200:
            raise AuthException(
                "Correo o contraseña incorrectos."
            )

        data = response.json()

        user = data.get("user")

        if not user:
            raise AuthException(
                "No se pudo obtener la información del usuario."
            )

        return {
            "staff_id": user["staff_id"]
            }

    except requests.exceptions.ConnectionError:
        raise AuthException(
            "El servicio de autenticación no está disponible en este momento."
        )

    except requests.exceptions.Timeout:
        raise AuthException(
            "El servicio de autenticación tardó demasiado en responder."
        )

    except requests.exceptions.RequestException:
        raise AuthException(
            "Ocurrió un error al comunicarse con el servicio de autenticación."
        )