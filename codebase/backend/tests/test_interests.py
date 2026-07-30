import uuid

import pytest
from fastapi import HTTPException

from app.api.routes.interests import (
    MAX_INTERESTED_COMPANIES,
    _enforce_interest_limit,
)
from app.models import CompanyInterest


def test_interest_table_has_one_record_per_user_and_company() -> None:
    primary_keys = {column.name for column in CompanyInterest.__table__.primary_key}
    assert primary_keys == {"user_id", "company_id"}


def test_interest_limit_allows_first_three_and_blocks_fourth() -> None:
    assert MAX_INTERESTED_COMPANIES == 3
    for current_count in range(3):
        _enforce_interest_limit(current_count)

    with pytest.raises(HTTPException) as error:
        _enforce_interest_limit(3)

    assert error.value.status_code == 409
    assert error.value.detail == "INTEREST_LIMIT_REACHED"


def test_interest_model_accepts_durable_identifiers() -> None:
    record = CompanyInterest(user_id=uuid.uuid4(), company_id=uuid.uuid4())
    assert record.user_id != record.company_id
