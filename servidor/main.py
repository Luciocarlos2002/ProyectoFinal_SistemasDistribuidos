from fastapi import FastAPI

from customer import router as customer_router
from inventory import router as inventory_router
from rentals import router as rentals_router

app = FastAPI(
    title="Módulo de Alquileres y Devoluciones (Rental POS)"
)

app.include_router(customer_router)
app.include_router(inventory_router)
app.include_router(rentals_router)