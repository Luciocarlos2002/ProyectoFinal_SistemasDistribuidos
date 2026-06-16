from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from database import get_db_connection

router = APIRouter(prefix="/api/v1/rentals", tags=["Rentals"])


# =========================
# DTOs
# =========================

class CreateRentalRequest(BaseModel):
    inventory_id: int
    customer_id: int
    staff_id: int


class ReturnRentalRequest(BaseModel):
    staff_id: int


class PenaltyPaymentRequest(BaseModel):
    staff_id: int

class CancelRentalRequest(BaseModel):
    staff_id: int

# =========================
# UTIL
# =========================

def now_peru():
    return datetime.now(ZoneInfo("America/Lima")).replace(tzinfo=None)


# =========================
# 1. CREATE RENTAL
# =========================

@router.post("")
def create_rental(request: CreateRentalRequest):

    with get_db_connection() as (_, cursor):

        cursor.execute("""
            SELECT inventory_id
            FROM inventory
            WHERE inventory_id = %s
        """, (request.inventory_id,))

        if not cursor.fetchone():
            raise HTTPException(404, "Inventory not found")

        cursor.execute("""
            SELECT rental_id
            FROM rental
            WHERE inventory_id = %s
              AND return_date IS NULL
        """, (request.inventory_id,))

        if cursor.fetchone():
            raise HTTPException(409, "Item already rented")

        cursor.execute("""
            SELECT f.film_id, f.title, f.rental_duration, f.rental_rate
            FROM inventory i
            JOIN film f ON f.film_id = i.film_id
            WHERE i.inventory_id = %s
        """, (request.inventory_id,))

        film = cursor.fetchone()

        if not film:
            raise HTTPException(404, "Film not found")

        film_id, title, duration, rate = film

        cursor.execute("""
            INSERT INTO rental (
                rental_date,
                inventory_id,
                customer_id,
                staff_id,
                last_update
            )
            VALUES (NOW(), %s, %s, %s, NOW())
            RETURNING rental_id, rental_date
        """, (
            request.inventory_id,
            request.customer_id,
            request.staff_id
        ))

        rental_id, rental_date = cursor.fetchone()

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
            request.customer_id,
            request.staff_id,
            rental_id,
            rate,
            now_peru()
        ))

        return {
            "message": "Rental created successfully",
            "data": {
                "rental_id": rental_id,
                "film_id": film_id,
                "film_title": title,
                "rental_date": rental_date.isoformat(),
                "rental_rate": rate,
                "status": "ACTIVE"
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
            "message": "Penalty calculated",
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

        cursor.execute("""
            UPDATE rental
            SET return_date = NOW(),
                last_update = NOW()
            WHERE rental_id = %s
        """, (rental_id,))

        return {
            "message": "Rental returned successfully",
            "data": {
                "rental_id": rental_id,
                "inventory_id": inventory_id,
                "days_late": days_late,
                "penalty": penalty,
                "status": "RETURNED"
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
                "message": "No penalty to pay",
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
            now_peru()
        ))

        return {
            "message": "Penalty payment registered",
            "data": {
                "rental_id": rental_id,
                "penalty_paid": penalty,
                "status": "PAID"
            }
        }
        
# =========================
# 5. Obtener Renta por filtro(día, semana, cliente)
# =========================

@router.get("")
def get_rentals(
    customer_id: int = None,
    day: bool = False,
    week: bool = False
):

    with get_db_connection() as (_, cursor):

        base_query = """
            SELECT rental_id, customer_id, inventory_id, rental_date, return_date
            FROM rental
            WHERE 1=1
        """

        params = []

        # 🔍 por cliente
        if customer_id:
            base_query += " AND customer_id = %s"
            params.append(customer_id)

        # 📅 por día
        if day:
            base_query += " AND DATE(rental_date) = CURRENT_DATE"

        # 📅 por semana
        if week:
            base_query += """
                AND rental_date >= CURRENT_DATE - INTERVAL '7 days'
            """

        base_query += " ORDER BY rental_date DESC"

        cursor.execute(base_query, tuple(params))
        rows = cursor.fetchall()

        return {
            "message": "Rentals retrieved successfully",
            "data": [
                {
                    "rental_id": r[0],
                    "customer_id": r[1],
                    "inventory_id": r[2],
                    "rental_date": r[3],
                    "return_date": r[4]
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
                r.rental_id,
                r.customer_id,
                r.inventory_id,
                r.rental_date,
                r.return_date,
                c.first_name,
                c.last_name
            FROM rental r
            JOIN customer c ON c.customer_id = r.customer_id
            WHERE r.rental_id = %s
        """, (rental_id,))

        row = cursor.fetchone()

        if not row:
            raise HTTPException(404, "Rental not found")

        return {
            "message": "Rental retrieved successfully",
            "data": {
                "rental_id": row[0],
                "customer_id": row[1],
                "inventory_id": row[2],
                "rental_date": row[3],
                "return_date": row[4],
                "customer_name": f"{row[5]} {row[6]}"
            }
        }
        
# =========================
# 7. Cancelar una renta
# =========================

@router.put("/{rental_id}/cancel")
def cancel_rental(rental_id: int, request: CancelRentalRequest):

    with get_db_connection() as (conn, cursor):

        # 1. obtener rental
        cursor.execute("""
            SELECT customer_id, inventory_id, return_date
            FROM rental
            WHERE rental_id = %s
        """, (rental_id,))

        rental = cursor.fetchone()

        if not rental:
            raise HTTPException(404, "Rental not found")

        customer_id, inventory_id, return_date = rental

        # ❌ no se puede cancelar si ya fue devuelto
        if return_date:
            raise HTTPException(400, "Rental already returned, cannot cancel")

        # 2. marcar como cancelado (cerrar rental)
        cursor.execute("""
            UPDATE rental
            SET return_date = NOW(),
                last_update = NOW()
            WHERE rental_id = %s
        """, (rental_id,))

        # 3. buscar pagos asociados
        cursor.execute("""
            SELECT payment_id, amount
            FROM payment
            WHERE rental_id = %s
        """, (rental_id,))

        payments = cursor.fetchall()

        total_refund = sum(p[1] for p in payments)

        # 4. registrar devolución de dinero si aplica
        if total_refund > 0:

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
                -total_refund,
                now_peru()
            ))

        conn.commit()

        return {
            "message": "Rental cancelled successfully",
            "data": {
                "rental_id": rental_id,
                "inventory_id": inventory_id,
                "refund": total_refund,
                "staff_id": request.staff_id,
                "status": "CANCELLED"
            }
        }