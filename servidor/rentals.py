from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional
from database import get_db_connection
import requests
import logging

# =============================
# consume la configuracion del .env
# =============================
from config import WEBHOOK_SECRET_KEY, INVENTORY_SYNC_URL


# =============================
# consume el servicio cliente
# =============================
from services.customer_service import (
    obtener_cliente_por_id,
    CustomerException
)


# =============================
# consume el servicio login
# =============================
from services.auth_service import (
    login,
    AuthException
)

# =============================
# consume el servicio login
# =============================
from services.film_service import (
    obtener_film,
    FilmException
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/rentals", tags=["Rentals"])
PENALTY_PER_DAY = 2.00


# =========================
# DTOs
# =========================

class CreateRentalRequest(BaseModel):
    inventory_id: int
    film_id: int
    title: str
    customer_id: int
    full_name: str


# Funcion para calcular la penalizacion
def calcular_penalidad(rental_date, rental_duration):

    current_date = datetime.utcnow()

    due_date = rental_date + timedelta(days=rental_duration)

    days_elapsed = (
        current_date.date() -
        rental_date.date()
    ).days

    days_late = max(
        0,
        (current_date.date() - due_date.date()).days
    )

    penalty_amount = round(
        days_late * PENALTY_PER_DAY,
        2
    )
    
    has_penalty = penalty_amount > 0

    return {
        "due_date": due_date,
        "current_date": current_date,
        "days_elapsed": days_elapsed,
        "days_late": days_late,
        "penalty_per_day": PENALTY_PER_DAY,
        "penalty_amount": penalty_amount,
        "has_penalty": has_penalty
    }


# Funcion para sincronizar con el servicio inventory
def sync_inventory(inventory_id: int, status: str) -> bool:
    headers = {
        "X-API-KEY": WEBHOOK_SECRET_KEY,
        "Content-Type": "application/json"
    }

    payload = {
        "inventory_id": inventory_id,
        "status": status
    }

    try:
        response = requests.patch(
            INVENTORY_SYNC_URL,
            headers=headers,
            json=payload,
            timeout=10
        )

        response.raise_for_status()

        logger.info(
            f"Inventario {inventory_id} sincronizado correctamente ({status})"
        )
        return True

    except requests.RequestException as e:
        logger.error(
            f"No se pudo sincronizar el inventario {inventory_id}: {e}"
        )
        return False


# =========================
# 1. Registra un alquiler y el pago del alquiler en la BD
# =========================

@router.post("")
def create_rental(request: CreateRentalRequest):
    
    # Consumiendo servicio Login
    try:
        
        usuario = login(
            "manager@sakila.com",
            "manager123"
            )
        
    except AuthException as ex:

        raise HTTPException(
            status_code=400,
            detail=str(ex)
        )
        
    staff_id = usuario["staff_id"]

    # Consumiendo servicio film
    try:
        
        film = obtener_film(
            request.film_id
        )
        
    except FilmException as ex:

        raise HTTPException(
            status_code=400,
            detail=str(ex)
        )
        
    rental_rate = film["rental_rate"]
    rental_duration = film["rental_duration"]
    category_name = film["category_name"]
        
    # Conexion a la BD y registrar alquiler y pagos
    with get_db_connection() as (_, cursor):

        # Registrar alquiler
        cursor.execute("""
            INSERT INTO rental (
                inventory_id,
                title,
                customer_id,
                fullname,
                staff_id,
                category_name,
                status,
                rental_date,
                last_update,
                rental_duration,
                penalty_status,
                fee
            )
            VALUES (
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s
            )
            RETURNING
                rental_id,
                status,
                rental_date,
                last_update
        """, (
            request.inventory_id,
            request.title,
            request.customer_id,
            request.full_name,
            staff_id,
            category_name,
            "ALQUILADO",
            datetime.now(),
            datetime.now(),
            rental_duration,
            "LIMPIO",
            rental_rate
        ))

        rental_id, status, rental_date, last_update = cursor.fetchone()

        # Registrar pago
        cursor.execute("""
            INSERT INTO payment (
                customer_id,
                fullname,
                staff_id,
                rental_id,
                amount,
                status,
                payment_date,
                last_update
            )
            VALUES (
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s
            )
        """, (
            request.customer_id,
            request.full_name,
            staff_id,
            rental_id,
            rental_rate,
            "PAGADO",
            datetime.now(),
            datetime.now()
        ))
        
        sync_inventory(
            inventory_id=request.inventory_id,
            status="rented"
        )

        return {
            "status_code": 200,
            "message": "Alquiler creado con éxito",
            "data": {
                "rental_id": rental_id,
                "inventory_id": request.inventory_id,
                "title": request.title,
                "customer_id": request.customer_id,
                "fullName": request.full_name,
                "staff_id": staff_id,
                "status": status,
                "rental_rate": rental_rate,
                "rental_date": rental_date.isoformat(),
                "last_update": last_update.isoformat(),
                "return_date": None
            }
        }


# =========================
# 2. Visualiza si existe penalizacion
# =========================

@router.get("/{rental_id}/penalty-preview")
def penalty_preview(rental_id: int):

    with get_db_connection() as (_, cursor):

        cursor.execute("""
            SELECT
                rental_date,
                rental_duration,
                status,
                penalty_status
            FROM rental
            WHERE rental_id = %s
        """, (rental_id,))

        rental = cursor.fetchone()

        if not rental:
            raise HTTPException(
                status_code=404,
                detail="Alquiler no encontrado."
            )

        rental_date, rental_duration, status, penalty_status = rental

        if status == "CANCELADO":
            raise HTTPException(
                status_code=400,
                detail="El alquiler fue cancelado."
            )

        if status == "RETORNADO":
            raise HTTPException(
                status_code=400,
                detail="El alquiler ya fue retornado."
            )

        penalty = calcular_penalidad(
            rental_date,
            rental_duration
        )

        # Si ya pagó la penalidad, no volver a mostrar deuda
        if penalty_status == "PAGADO":
            penalty["has_penalty"] = False
            penalty["penalty_status"] = "PAGADO"
            penalty["penalty_amount"] = 0
            penalty["days_late"] = 0

        else:

            if penalty["has_penalty"]:
                penalty["penalty_status"] = "PENDIENTE"
            else:
                penalty["penalty_status"] = "LIMPIO"

        return {
            "status_code": 200,
            "message": "Penalización calculada correctamente.",
            "data": {
                "rental_id": rental_id,
                **penalty
            }
        }


# =========================
# 3. Retornar Alquiler
# =========================

@router.put("/{rental_id}/return")
def return_rental(rental_id: int):

    with get_db_connection() as (_, cursor):

        cursor.execute("""
            SELECT
                inventory_id,
                rental_date,
                rental_duration,
                status,
                penalty_status
            FROM rental
            WHERE rental_id = %s
        """, (rental_id,))

        rental = cursor.fetchone()

        if not rental:
            raise HTTPException(
                status_code=404,
                detail="Alquiler no encontrado."
            )

        (
            inventory_id,
            rental_date,
            rental_duration,
            status,
            penalty_status
        ) = rental

        if status == "RETORNADO":
            raise HTTPException(
                status_code=400,
                detail="El alquiler ya fue retornado."
            )

        if status == "CANCELADO":
            raise HTTPException(
                status_code=400,
                detail="El alquiler fue cancelado."
            )

        # Calcular penalidad
        penalty = calcular_penalidad(
            rental_date,
            rental_duration
        )

        # Si existe penalidad y aún no fue pagada
        if penalty["has_penalty"] and penalty_status != "PAGADO":

            # Actualizar el estado para mantener sincronizada la BD
            cursor.execute("""
                UPDATE rental
                SET
                    penalty_status = 'PENDIENTE',
                    last_update = %s
                WHERE rental_id = %s
            """, (
                datetime.now(),
                rental_id
            ))

            return JSONResponse(
                status_code=400,
                content={
                    "message": "Debe pagar la penalidad antes de devolver la película.",
                    "data": {
                        "rental_id": rental_id,
                        "days_late": penalty["days_late"],
                        "penalty_amount": penalty["penalty_amount"],
                        "penalty_status": "PENDIENTE"
                    }
                }
            )

        # Registrar devolución
        cursor.execute("""
            UPDATE rental
            SET
                return_date = %s,
                status = %s,
                last_update = %s
            WHERE rental_id = %s
        """, (
            datetime.now(),
            "RETORNADO",
            datetime.now(),
            rental_id
        ))

        sync_inventory(
            inventory_id=inventory_id,
            status="available"
        )

        return {
            "status_code": 200,
            "message": "La película fue devuelta correctamente.",
            "data": {
                "rental_id": rental_id,
                "inventory_id": inventory_id,
                "status": "RETORNADO",
                "return_date": datetime.now()
            }
        }


# =========================
# 4. Realiza el pago de la penalizacion
# =========================

@router.post("/{rental_id}/penalty-payment")
def penalty_payment(
    rental_id: int
):
    
    # Consumiendo servicio Login
    try:
        
        usuario = login(
            "manager@sakila.com",
            "manager123"
            )
        
    except AuthException as ex:

        raise HTTPException(
            status_code=400,
            detail=str(ex)
        )
        
    staff_id = usuario["staff_id"]
    
    with get_db_connection() as (_, cursor):

        cursor.execute("""
            SELECT
                customer_id,
                fullname,
                rental_date,
                rental_duration,
                status,
                penalty_status
            FROM rental
            WHERE rental_id = %s
        """, (rental_id,))

        rental = cursor.fetchone()

        if not rental:
            raise HTTPException(
                status_code=404,
                detail="Alquiler no encontrado."
            )

        (
            customer_id,
            fullname,
            rental_date,
            rental_duration,
            rental_status,
            penalty_status
        ) = rental

        if rental_status == "RETORNADO":
            raise HTTPException(
                status_code=400,
                detail="El alquiler ya fue retornado."
            )

        if rental_status == "CANCELADO":
            raise HTTPException(
                status_code=400,
                detail="El alquiler fue cancelado."
            )

        if penalty_status == "PAGADO":
            raise HTTPException(
                status_code=400,
                detail="La penalidad ya fue pagada."
            )

        penalty = calcular_penalidad(
            rental_date,
            rental_duration
        )

        amount = penalty['penalty_amount']
        
        if not penalty["has_penalty"]:

            raise HTTPException(
                status_code=400,
                detail="El alquiler no tiene penalidad."
            )

        # Registrar el pago
        cursor.execute("""
            INSERT INTO payment(
                customer_id,
                fullname,
                staff_id,
                rental_id,
                amount,
                status,
                payment_date,
                last_update
            )
            VALUES(
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s
            )
        """,(
            customer_id,
            fullname,
            staff_id,
            rental_id,
            amount,
            "PAGADO",
            datetime.now(),
            datetime.now()
        ))

        # Actualizar estado de la penalidad
        cursor.execute("""
            UPDATE rental
            SET
                penalty_status='PAGADO',
                last_update=%s
            WHERE rental_id=%s
        """,(
            datetime.now(),
            rental_id
        ))

        return {
            "status_code":200,
            "message":"La penalidad fue pagada correctamente.",
            "data":{
                "rental_id":rental_id,
                "penalty_paid":amount,
                "penalty_status":"PAGADO"
            }
        }


# =========================
# 5. Obtener Renta por filtro(día, semana, customer_id, status)
# Opcionales (inventory_id, category_name)
# =========================

@router.get("")
def get_rentals(
    customer_id: Optional[int] = None,
    inventory_id: Optional[int] = None,
    category_name: Optional[str] = None,
    status: Optional[str] = None,
    day: bool = False,
    week: bool = False
):

    VALID_STATUS = {
        "ALQUILADO",
        "CANCELADO",
        "RETORNADO"
    }

    if customer_id:

        try:

            customer = obtener_cliente_por_id(
                customer_id
            )

            customer_id = customer["customer_id"]

        except CustomerException as ex:

            raise HTTPException(
                status_code=400,
                detail=str(ex)
            )

    if status:

        status = status.upper()

        if status not in VALID_STATUS:
            raise HTTPException(
                status_code=400,
                detail=(
                    "status debe ser "
                    "ALQUILADO, CANCELADO o RETORNADO"
                )
            )

    with get_db_connection() as (_, cursor):

        base_query = """
            SELECT
                rental_id,
                inventory_id,
                title,
                customer_id,
                fullName,
                staff_id,
                category_name,
                status,
                rental_date,
                return_date,
                fee
            FROM rental
            WHERE 1=1
        """

        params = []

        if customer_id:
            base_query += " AND customer_id = %s"
            params.append(customer_id)
            
        if inventory_id:
            base_query += " AND inventory_id = %s"
            params.append(inventory_id)
            
        if category_name:
            base_query += " AND category_name = %s"
            params.append(category_name)

        if status:
            base_query += " AND status = %s"
            params.append(status)

        if day:
            base_query += """
                AND rental_date >= NOW() - INTERVAL '1 day'
            """

        if week:
            base_query += """
                AND rental_date >= CURRENT_DATE - INTERVAL '7 days'
            """

        base_query += """
            ORDER BY rental_date DESC
        """

        cursor.execute(
            base_query,
            tuple(params)
        )

        rows = cursor.fetchall()


        return {
            "status_code": 200,
            "message": "Alquileres recuperados con éxito",
            "data": [
                {
                    "rental_id": r[0],
                    "inventory_id": r[1],
                    "title": r[2],
                    "customer_id": r[3],
                    "fullName": r[4],
                    "staff_id": r[5],
                    "category_name": r[6],
                    "status": r[7],
                    "rental_date": r[8],
                    "return_date": r[9],
                    "fee": r[10]
                }
                for r in rows
            ]
        }


# =========================
# 6. Obtener Renta por id
# =========================

@router.get("/{rental_id}")
def get_rental(rental_id: int):

    with get_db_connection() as (_, cursor):

        cursor.execute("""
            SELECT
                rental_id,
                inventory_id,
                title,
                customer_id,
                fullname,
                status,
                rental_date,
                return_date,
                fee
            FROM rental
            WHERE rental_id = %s
        """, (rental_id,))

        row = cursor.fetchone()
        print("ROW:", row)
        print("COLUMNAS:", len(row))

        if not row:
            raise HTTPException(
                status_code=404,
                detail="Rental not found"
            )

        return {
            "status_code": 200,
            "message": "Alquiler recuperado con éxito",
            "data": {
                "rental_id": row[0],
                "inventory_id": row[1],
                "title": row[2],
                "customer_id": row[3],
                "fullname": row[4],
                "status": row[5],
                "rental_date": row[6].isoformat() if row[6] else None,
                "return_date": row[7].isoformat() if row[7] else None,
                "fee": row[8]
            }
        }


# =========================
# 7. Cancelar una renta
# =========================

@router.put("/{rental_id}/cancel")
def cancel_rental(rental_id: int):
    
    # Consumiendo servicio Login
    try:
        
        usuario = login(
            "manager@sakila.com",
            "manager123"
            )
        
    except AuthException as ex:

        raise HTTPException(
            status_code=400,
            detail=str(ex)
        )
        
    staff_id = usuario["staff_id"]
    
    with get_db_connection() as (conn, cursor):

        cursor.execute("""
            SELECT
                customer_id,
                fullname,
                inventory_id,
                status
            FROM rental
            WHERE rental_id = %s
        """, (rental_id,))

        rental = cursor.fetchone()

        if not rental:
            raise HTTPException(
                status_code=404,
                detail="Alquiler no encontrado"
            )

        customer_id, fullname, inventory_id, status = rental

        if status == "CANCELADO":
            raise HTTPException(
                status_code=400,
                detail="El alquiler ya fue cancelado"
            )

        if status == "RETORNADO":
            raise HTTPException(
                status_code=400,
                detail="El alquiler ya fue retornado"
            )

        cursor.execute("""
            UPDATE rental
            SET
                return_date = %s,
                status = %s,
                last_update = %s
            WHERE rental_id = %s
        """, (
            datetime.now(),
            "CANCELADO",
            datetime.now(),
            rental_id
        ))

        sync_inventory(
            inventory_id=inventory_id,
            status="available"
        )

        cursor.execute("""
            SELECT COALESCE(SUM(amount), 0)
            FROM payment
            WHERE rental_id = %s
        """, (rental_id,))

        total_refund = cursor.fetchone()[0]

        if total_refund > 0:

            cursor.execute("""
                INSERT INTO payment (
                    customer_id,
                    fullname,
                    staff_id,
                    rental_id,
                    amount,
                    status,
                    payment_date,
                    last_update
                )
                VALUES (
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s
                )
            """, (
                customer_id,
                fullname,
                staff_id,
                rental_id,
                -abs(total_refund),
                "REEMBOLSO",
                datetime.now(),
                datetime.now()
            ))

        conn.commit()

        return {
            "status_code": 200,
            "message": "Alquiler cancelado con éxito",
            "data": {
                "rental_id": rental_id,
                "inventory_id": inventory_id,
                "status": "CANCELADO",
                "refund_amount": float(total_refund)
            }
        }
