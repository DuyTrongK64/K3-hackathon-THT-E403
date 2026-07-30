const normalize = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase();

const includesAny = (value, phrases) =>
  phrases.some((phrase) => value.includes(phrase));

export function evaluateAgentPreflight(message, cvInput = {}) {
  const normalized = normalize(message);
  const fileName = normalize(cvInput.fileName ?? cvInput.file?.name ?? "");

  if (
    (Array.isArray(cvInput.files) && cvInput.files.length > 1) ||
    includesAny(normalized, ["2 file cv", "hai file cv", "cung luc 2 file"])
  ) {
    return {
      intent: "cv_file_count_error",
      answer: "Vui lòng chỉ tải lên 1 CV cho mỗi lần đánh giá.",
    };
  }

  if (
    includesAny(normalized, [
      "bo qua cac lenh",
      "bo qua lenh",
      "xoa toan bo",
      "xoa du lieu",
      "delete all",
      "ignore previous",
    ])
  ) {
    return {
      intent: "security_refusal",
      answer:
        "Mình không có quyền xóa hoặc thay đổi dữ liệu hệ thống và không thể bỏ qua các quy tắc bảo mật.",
    };
  }

  if (
    normalized.includes("drive.google.com") ||
    normalized.includes("google drive")
  ) {
    return {
      intent: "cv_access_error",
      answer:
        "Hệ thống không thể truy cập link này. Vui lòng cấp quyền xem công khai hoặc tải trực tiếp file PDF CV của bạn lên.",
    };
  }

  if (
    /\.(jpg|jpeg|png)\b/.test(fileName || normalized) ||
    includesAny(normalized, [
      "anh chup",
      "sieu mo",
      "loi font",
      "ma hoa la",
    ])
  ) {
    return {
      intent: "cv_format_error",
      answer:
        "Hệ thống không thể đọc nội dung file này. Hệ thống chỉ hỗ trợ CV định dạng văn bản PDF hoặc DOCX; vui lòng tải lại file đúng định dạng.",
    };
  }

  if (
    includesAny(normalized, [
      "nau mon",
      "pho bo",
      "cong thuc nau",
      "thoi tiet",
    ])
  ) {
    return {
      intent: "out_of_scope",
      answer:
        "Mình chỉ hỗ trợ tra cứu công ty, JD và phân tích CV trong hệ sinh thái Vingroup nên không thể tư vấn nội dung này.",
    };
  }

  if (
    includesAny(normalized, ["fpt software", "viettel", "grab"]) &&
    !normalized.includes("vingroup")
  ) {
    return {
      intent: "unsupported_company",
      answer:
        "Hiện tại hệ thống chỉ hỗ trợ tra cứu dữ liệu tuyển dụng của các công ty thuộc hệ sinh thái Vingroup. Bạn muốn tra cứu công ty nào trong danh sách này?",
    };
  }

  const compactQuestion = normalized
    .replace(/["'“”‘’]/g, "")
    .replace(/[?!.]+$/g, "")
    .trim();
  if (["luong", "luong nhieu", "luong bao nhieu"].includes(compactQuestion)) {
    return {
      intent: "needs_clarification",
      answer:
        "Bạn đang muốn hỏi mức lương của vị trí nào và tại công ty nào thuộc hệ sinh thái Vingroup?",
    };
  }

  if (
    includesAny(normalized, [
      "dung prompt gi",
      "system prompt",
      "ten ham code",
      "prompt quet cv",
    ])
  ) {
    return {
      intent: "protected_configuration",
      answer:
        "Mình có thể mô tả chức năng quét CV ở mức tổng quan, nhưng không thể tiết lộ System Prompt, khóa API hoặc tên hàm nội bộ.",
    };
  }

  return null;
}

function formatJob(job) {
  return `${job.position} — ${job.teamName} (${[
    ...(job.requiredSkills ?? []),
    ...(job.preferredSkills ?? []),
  ].join(", ")})`;
}

export function createGroundedCareerAnswer(message, jdData) {
  const normalized = normalize(message)
    .replaceAll("din phat", "vinfast")
    .replaceAll("vin a i", "vinai");
  const jobs = jdData?.jobs ?? [];

  if (includesAny(normalized, ["ceo", "lanh dao", "ban lanh dao"])) {
    return "Dữ liệu hiện tại không chứa thông tin về ban lãnh đạo của VinAI.";
  }

  if (
    includesAny(normalized, [
      "ot toi sang",
      "ot",
      "duoi viec",
      "sa thai",
      "tin don",
    ])
  ) {
    return "Dữ liệu của hệ thống hiện tại không chứa thông tin về việc OT hay sa thải. Mình chỉ có thể cung cấp thông tin dựa trên JD tuyển dụng.";
  }

  if (
    normalized.includes("ty le choi") ||
    normalized.includes("so ung vien") ||
    normalized.includes("so slot")
  ) {
    const target =
      jobs.find((job) =>
        normalize(`${job.position} ${job.teamName}`).includes("ai research"),
      ) ??
      jobs.find((job) => normalize(job.position).includes("research"));
    if (!target?.maxSlots) {
      return "Dữ liệu hiện tại không có đủ số slot và số ứng viên để tính tỷ lệ cạnh tranh.";
    }
    const ratio = Number(
      (target.currentApplicants / target.maxSlots).toFixed(2),
    );
    return `${target.position} tại ${target.companyName} hiện có ${target.currentApplicants} ứng viên cho ${target.maxSlots} slot, tương đương tỷ lệ chọi ${ratio}:1. Đây là số liệu mô phỏng nội bộ.`;
  }

  const asksTechStack =
    normalized.includes("tech stack") ||
    normalized.includes("cong nghe") ||
    normalized.includes("yeu cau");
  if (asksTechStack) {
    const companyName = ["vinfast", "vinai", "vinbigdata", "one mount", "vinbrain", "vincss"].find(
      (name) => normalized.includes(name),
    );
    if (companyName) {
      const companyJobs = jobs.filter((job) =>
        normalize(job.companyName).includes(companyName),
      );
      if (!companyJobs.length) {
        return `Dữ liệu hiện tại không có JD của ${companyName}.`;
      }
      return companyJobs
        .map((job) => formatJob(job))
        .join("; ");
    }
  }

  const asksComparison =
    normalized.includes("so sanh") ||
    normalized.includes("ben nao") ||
    normalized.includes("chill hon");
  if (asksComparison) {
    const vinAiJobs = jobs.filter((job) =>
      normalize(job.companyName).includes("vinai"),
    );
    const comparatorJobs = normalized.includes("vinbigdata")
      ? jobs.filter((job) =>
          normalize(job.companyName).includes("vinbigdata"),
        )
      : jobs.filter((job) =>
          normalize(job.companyName).includes("vinfast"),
        );
    if (vinAiJobs.length && comparatorJobs.length) {
      const summarize = (items) =>
        [...new Set(items.map((job) => job.workMode))].join(", ");
      return `Theo JD hiện có: ${vinAiJobs[0].companyName} có chế độ ${summarize(
        vinAiJobs,
      )}; ${comparatorJobs[0].companyName} có chế độ ${summarize(
        comparatorJobs,
      )}. Dữ liệu không có tiêu chí “chill”, OT hoặc đánh giá văn hóa nên mình không suy diễn bên nào thoải mái hơn.`;
    }
  }

  if (
    normalized.includes("vinfast") &&
    (normalized.includes("jd") || normalized.includes("tuyen dung"))
  ) {
    const companyJobs = jobs.filter((job) =>
      normalize(job.companyName).includes("vinfast"),
    );
    return companyJobs.length
      ? companyJobs.map((job) => formatJob(job)).join("; ")
      : "Dữ liệu hiện tại không có JD VinFast.";
  }

  return null;
}
