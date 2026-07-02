from fastapi import APIRouter, HTTPException, Query

from services.inventory_service import (
    obtener_inventorys,
    obtener_estado_inventory,
    InventoryException
)

router = APIRouter(
    prefix="/inventorys",
    tags=["Inventorys"]
)

# Obtiene la lista de peliculas disponibles por tienda
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


# Obtiene la lista de inventarios disponibles
@router.get("/status/{film_id}")
def estado_inventory(
    film_id: int,
    store_id: int = Query(...)
):
    try:
        result = obtener_estado_inventory(film_id, store_id)

        return result

    except InventoryException as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )