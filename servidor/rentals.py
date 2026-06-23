from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from datetime import datetime

from database import get_db_connection

# =============================
# consume el servicio cliente
# =============================
from services.customer_service import (
    obtener_cliente_por_dni,
    CustomerException
)

router = APIRouter(prefix="/api/v1/rentals", tags=["Rentals"])


# =========================
# DTOs
# =========================

class CreateRentalRequest(BaseModel):
    inventory_id: int
    numberDni: str
    staff_id: int


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

    try:

        customer = obtener_cliente_por_dni(
            request.numberDni
        )

    except CustomerException as ex:

        raise HTTPException(
            status_code=400,
            detail=str(ex)
        )

    customer_id = customer["customer_id"]

    full_name = customer["fullName"]

    with get_db_connection() as (_, cursor):

        # Verificar inventario

        cursor.execute("""
            SELECT inventory_id
            FROM inventory
            WHERE inventory_id = %s
        """, (request.inventory_id,))

        if not cursor.fetchone():
            raise HTTPException(
                status_code=404,
                detail="Inventory not found"
            )

        # Obtener información de la película

        cursor.execute("""
            SELECT
                f.film_id,
                f.title,
                f.rental_rate
            FROM inventory i
            INNER JOIN film f
                ON f.film_id = i.film_id
            WHERE i.inventory_id = %s
        """, (request.inventory_id,))

        film = cursor.fetchone()

        if not film:
            raise HTTPException(
                status_code=404,
                detail="Film not found"
            )

        film_id, title, rental_rate = film

        # Registrar alquiler

        cursor.execute("""
            INSERT INTO rental (
                rental_date,
                inventory_id,
                customer_id,
                staff_id,
                last_update,
                status,
                fullname,
                title
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
            RETURNING
                rental_id,
                rental_date,
                last_update
        """, (
            datetime.now(),
            request.inventory_id,
            customer_id,
            request.staff_id,
            datetime.now(),
            "ALQUILADO",
            full_name,
            title
        ))

        rental_id, rental_date, last_update = cursor.fetchone()

        # Registrar pago

        cursor.execute("""
            INSERT INTO payment (
                customer_id,
                fullName,
                staff_id,
                rental_id,
                amount,
                status,
                payment_date
            )
            VALUES (
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
            full_name,
            request.staff_id,
            rental_id,
            rental_rate,
            "PAGADO",
            datetime.now()
        ))

        return {
            "status_code": 200,
            "message": "Alquiler creado con éxito",
            "data": {
                "rental_id": rental_id,
                "inventory_id": request.inventory_id,
                "title": title,
                "customer_id": customer_id,
                "fullName": full_name,
                "staff_id": request.staff_id,
                "status": "ALQUILADO",
                "rental_date": rental_date.isoformat(),
                "last_update": last_update.isoformat(),
                "return_date": None,
                "rental_rate": float(rental_rate)
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
    numberDni: str | None = None,
    status: str | None = None,
    day: bool = False,
    week: bool = False
):

    VALID_STATUS = {
        "ALQUILADO",
        "CANCELADO",
        "RETORNADO"
    }

    customer_id = None

    if numberDni:

        try:

            customer = obtener_cliente_por_dni(
                numberDni
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
                AND DATE(rental_date) = CURRENT_DATE
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
                    "status": r[6],
                    "rental_date": r[7],
                    "return_date": r[8]
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