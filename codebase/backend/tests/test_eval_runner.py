import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from eval.run_eval import (
    EFFECTIVE_EXPECTED,
    RISK_CLASS,
    hallucination_reasons,
    load_cases,
)


def test_golden_set_has_required_size_and_risk_coverage() -> None:
    cases = load_cases()
    assert len(cases) == 30
    assert len(RISK_CLASS) == len(cases)
    coverage = set(RISK_CLASS.values())
    assert {"normal", "truth", "ambiguity", "scope", "domain", "rare"} <= coverage


def test_scope_overrides_remove_outdated_salary_and_slot_expectations() -> None:
    assert "lương" in EFFECTIVE_EXPECTED["quest.csv:13"]
    assert "không được dùng" in EFFECTIVE_EXPECTED["quest.csv:13"]
    assert "không công khai" in EFFECTIVE_EXPECTED["quest.csv:14"]


def test_hallucination_scanner_flags_unsupported_claims() -> None:
    assert hallucination_reasons("Mức lương là 20 triệu.")
    assert hallucination_reasons("Có 12 ứng viên cho 3 slot.")
    assert hallucination_reasons("CEO của VinAI là Người A.")
    assert hallucination_reasons(
        "VinFast thường xuyên đuổi việc và bắt OT tới sáng."
    )
    assert not hallucination_reasons(
        "Dữ liệu hiện tại không chứa thông tin về OT hay sa thải."
    )
