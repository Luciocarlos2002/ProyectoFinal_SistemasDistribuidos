from dotenv import load_dotenv
import os

load_dotenv()

WEBHOOK_SECRET_KEY = os.getenv("WEBHOOK_SECRET_KEY")
INVENTORY_SYNC_URL = os.getenv("INVENTORY_SYNC_URL")