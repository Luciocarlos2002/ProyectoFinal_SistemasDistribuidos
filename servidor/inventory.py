from fastapi import APIRouter, HTTPException, Query

from services.inventory_service import (
    obtener_inventorys,
    InventoryException
)

router = APIRouter(
    prefix="/inventorys",
    tags=["Inventorys"]
)

@router.get("")
def listar_inventorys(
    store_id: int = Query(...)
):
    try:
        inventorys = obtener_inventorys(store_id)

        return {
            "total": len(inventorys),
            "items": inventorys
        }

    except InventoryException as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )