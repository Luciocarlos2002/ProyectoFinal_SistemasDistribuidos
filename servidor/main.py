from fastapi import FastAPI

from rentals import router as rentals_router

app = FastAPI(
    title="Módulo de Alquileres y Devoluciones (Rental POS)"
)

app.include_router(rentals_router)