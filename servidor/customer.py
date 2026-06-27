from fastapi import APIRouter, HTTPException
from services.customer_service import (
    obtener_clientes_activos,
    CustomerException
)

router = APIRouter(prefix="/customers", tags=["Customers"])

@router.get("")
def listar_clientes():
    try:
        clientes = obtener_clientes_activos()

        return {
            "total": len(clientes),
            "items": clientes
        }

    except CustomerException as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )