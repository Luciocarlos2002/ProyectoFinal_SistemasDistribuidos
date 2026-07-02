from database import get_db_connection
from typing import Optional
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/payments", tags=["Payments"])


# =========================
# 1. Listar todo los pagos de la renta
# =========================

@router.get("/view-payments")
def get_payments(
    rental_id: Optional[int] = None,
    status: Optional[str] = None,
    day: bool = False,
    week: bool = False
):

    VALID_STATUS = {
        "PAGADO",
        "REEMBOLSO"
    }

    if status:

        status = status.upper()

        if status not in VALID_STATUS:

            raise HTTPException(
                status_code=400,
                detail="El estado debe ser PAGADO o REEMBOLSO"
            )

    with get_db_connection() as (_, cursor):

        query = """
            SELECT
                payment_id,
                customer_id,
                fullname,
                staff_id,
                rental_id,
                amount,
                status,
                payment_date
            FROM payment
            WHERE 1=1
        """

        params = []

        if rental_id:
            query += " AND rental_id = %s"
            params.append(rental_id)

        if status:
            query += " AND status = %s"
            params.append(status)

        if day:
            query += """
                AND payment_date >= NOW() - INTERVAL '1 day'
            """

        if week:
            query += """
                AND payment_date >= NOW() - INTERVAL '7 days'
            """

        query += """
            ORDER BY payment_date DESC
        """

        cursor.execute(
            query,
            tuple(params)
        )

        rows = cursor.fetchall()

        return {
            "status_code": 200,
            "message": "Pagos recuperados con éxito",
            "data": [
                {
                    "payment_id": r[0],
                    "customer_id": r[1],
                    "fullname": r[2],
                    "staff_id": r[3],
                    "rental_id": r[4],
                    "amount": float(r[5]),
                    "status": r[6],
                    "payment_date": r[7]
                }
                for r in rows
            ]
        }