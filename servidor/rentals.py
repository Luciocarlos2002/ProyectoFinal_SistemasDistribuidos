from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

from database import get_db_connection

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


router = APIRouter(prefix="/api/v1/rentals", tags=["Rentals"])


# =========================
# DTOs
# =========================

class CreateRentalRequest(BaseModel):
    inventory_id: int
    film_id: int
    title: str
    customer_id: int
    full_name: str


class ReturnRentalRequest(BaseModel):
    staff_id: int


class PenaltyPaymentRequest(BaseModel):
    staff_id: int

class CancelRentalRequest(BaseModel):
    staff_id: int


# =========================
# 1. CREATE RENTAL
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
            datetime.now()
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
# 2. PENALTY PREVIEW
# =========================

@router.get("/{rental_id}/penalty-preview")
def penalty_preview(rental_id: int):

    with get_db_connection() as (_, cursor):

        cursor.execute("""
            SELECT
                r.rental_id,
                r.rental_date,
                f.rental_duration
            FROM rental r
            JOIN inventory i ON i.inventory_id = r.inventory_id
            JOIN film f ON f.film_id = i.film_id
            WHERE r.rental_id = %s
        """, (rental_id,))

        data = cursor.fetchone()

        if not data:
            raise HTTPException(404, "Rental not found")

        rental_id, rental_date, duration = data

        days_elapsed = (datetime.utcnow().date() - rental_date.date()).days
        days_late = max(0, days_elapsed - duration)

        penalty = days_late * 1.00

        return {
            "status_code": 200,
            "message": "Penalización calculada",
            "data": {
                "rental_id": rental_id,
                "days_elapsed": days_elapsed,
                "days_late": days_late,
                "penalty_per_day": 1.00,
                "penalty_amount": penalty
            }
        }


# =========================
# 3. RETURN RENTAL
# =========================

@router.put("/{rental_id}/return")
def return_rental(rental_id: int, request: ReturnRentalRequest):

    with get_db_connection() as (_, cursor):

        cursor.execute("""
            SELECT
                r.inventory_id,
                r.status
            FROM rental r
            JOIN inventory i
                ON i.inventory_id = r.inventory_id
            WHERE r.rental_id = %s
        """, (rental_id,))

        data = cursor.fetchone()

        if not data:
            raise HTTPException(
                status_code=404,
                detail="Alquiler no encontrado"
            )

        inventory_id, status = data

        if status == "RETORNADO":
            raise HTTPException(
                status_code=400,
                detail="El alquiler ya fue retornado"
            )

        if status == "CANCELADO":
            raise HTTPException(
                status_code=400,
                detail="El alquiler fue cancelado"
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
            "RETORNADO",
            datetime.now(),
            rental_id
        ))

        return {
            "status_code": 200,
            "message": "El alquiler se devolvió correctamente",
            "data": {
                "rental_id": rental_id,
                "inventory_id": inventory_id,
                "status": "RETORNADO"
            }
        }



# =========================
# 4. PENALTY PAYMENT
# =========================

@router.post("/{rental_id}/penalty-payment")
def penalty_payment(rental_id: int, request: PenaltyPaymentRequest):

    with get_db_connection() as (_, cursor):

        cursor.execute("""
            SELECT
                r.customer_id,
                r.inventory_id,
                r.rental_date,
                f.rental_duration
            FROM rental r
            JOIN inventory i ON i.inventory_id = r.inventory_id
            JOIN film f ON f.film_id = i.film_id
            WHERE r.rental_id = %s
        """, (rental_id,))

        data = cursor.fetchone()

        if not data:
            raise HTTPException(404, "Rental not found")

        customer_id, inventory_id, rental_date, duration = data

        days_elapsed = (datetime.utcnow().date() - rental_date.date()).days
        days_late = max(0, days_elapsed - duration)

        penalty = days_late * 1.00

        if penalty == 0:
            return {
                "message": "Sin penalización",
                "data": {
                    "rental_id": rental_id,
                    "penalty": 0.0
                }
            }

        cursor.execute("""
            INSERT INTO payment (
                customer_id,
                staff_id,
                rental_id,
                amount,
                payment_date
            )
            VALUES (%s, %s, %s, %s, %s)
        """, (
            customer_id,
            request.staff_id,
            rental_id,
            penalty,
            datetime.now()
        ))

        return {
            "status_code": 200,
            "message": "Pago de multa registrado",
            "data": {
                "rental_id": rental_id,
                "penalty_paid": penalty,
                "status": "PAGADO"
            }
        }


# =========================
# 5. Obtener Renta por filtro(día, semana, numeroDni, status)
# =========================

@router.get("")
def get_rentals(
    customer_id: Optional[int] = None,
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
                return_date
            FROM rental
            WHERE 1=1
        """

        params = []

        if customer_id:
            base_query += " AND customer_id = %s"
            params.append(customer_id)

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
                    "return_date": r[9]
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
                staff_id,
                status,
                rental_date,
                return_date
            FROM rental
            WHERE rental_id = %s
        """, (rental_id,))

        row = cursor.fetchone()

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
                "fullName": row[4],
                "staff_id": row[5],
                "status": row[6],
                "rental_date": row[7].isoformat() if row[7] else None,
                "return_date": row[8].isoformat() if row[8] else None
            }
        }


# =========================
# 7. Cancelar una renta
# =========================

@router.put("/{rental_id}/cancel")
def cancel_rental(rental_id: int, request: CancelRentalRequest):

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

        current_date = datetime.now()

        cursor.execute("""
            UPDATE rental
            SET
                return_date = %s,
                status = %s,
                last_update = %s
            WHERE rental_id = %s
        """, (
            current_date,
            "CANCELADO",
            current_date,
            rental_id
        ))

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
                request.staff_id,
                rental_id,
                -abs(total_refund),
                "REEMBOLSO",
                current_date,
                current_date
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