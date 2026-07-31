from fastapi import APIRouter

from app.api.routes import (
    agent,
    auth,
    companies,
    criteria,
    health,
    interests,
    matches,
    portfolios,
    users,
)


api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(companies.router)
api_router.include_router(criteria.router)
api_router.include_router(portfolios.router)
api_router.include_router(matches.router)
api_router.include_router(interests.router)
api_router.include_router(agent.router)
