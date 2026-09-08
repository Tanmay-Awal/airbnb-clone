from datetime import date
from app.core.config import settings
from app.schemas.booking import PriceBreakdown

def calculate_price_breakdown(price_per_night: int, check_in: date, check_out: date) -> PriceBreakdown:
    nights = (check_out - check_in).days
    if nights <= 0:
        nights = 1
    
    base_price = price_per_night * nights
    cleaning_fee = settings.CLEANING_FEE_FIXED
    service_fee = int(base_price * settings.SERVICE_FEE_PERCENTAGE)
    total_price = base_price + cleaning_fee + service_fee

    return PriceBreakdown(
        nights=nights,
        price_per_night=price_per_night,
        base_price=base_price,
        cleaning_fee=cleaning_fee,
        service_fee=service_fee,
        total_price=total_price
    )
