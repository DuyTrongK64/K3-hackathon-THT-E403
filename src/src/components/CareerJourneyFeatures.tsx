"use client";

import {
  AlertTriangle,
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardPaste,
  Clock3,
  Code2,
  FileText,
  Layers3,
  Link2,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  UploadCloud,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  ChangeEvent,
  FormEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import { useCareerAgent } from "../hooks/useCareerAgent";

type FeatureTab = "explore" | "analyzer" | "competition";
type CvInputMode = "upload" | "paste";
type PreferenceLevel = "1" | "2";

type ProjectTeam = {
  id: string;
  companyId: string;
  name: string;
  department: string;
  description: string;
  tech: string[];
  environment: string;
  workMode: string;
  location: string;
  openRoles: string[];
};

type MockCompany = {
  id: string;
  name: string;
  monogram: string;
  division: string;
  accent: string;
  accentSoft: string;
};

type Opportunity = {
  id: string;
  companyId: string;
  teamId: string;
  department: string;
  position: string;
  maxSlots: number;
  currentApplicants: number;
  workMode: string;
  deadline: string;
};

type RegistrationForm = {
  fullName: string;
  phone: string;
  cvLink: string;
  preference: PreferenceLevel;
};

type AgentStep = {
  id: string;
  tool: string;
  state: "running" | "done" | "error";
  message: string;
};

type AgentMatch = {
  id: string;
  companyId: string;
  companyName: string;
  teamId: string;
  teamName: string;
  position: string;
  score: number;
  reasons: string[];
  scoreDetail?: {
    internWishes: number;
    employerRequirements: number;
    preferredSkills: number;
  };
};

/**
 * Toàn bộ dữ liệu của module thực tập là mock data.
 * Có thể thay object này bằng API thật trong giai đoạn triển khai sau.
 */
export const CAREER_JOURNEY_MOCK_DATA = {
  companies: [
    {
      id: "vinfast",
      name: "VinFast Software",
      monogram: "VF",
      division: "Automotive",
      accent: "#06b6d4",
      accentSoft: "rgba(6, 182, 212, .13)",
    },
    {
      id: "vinai",
      name: "VinAI",
      monogram: "AI",
      division: "AI Research",
      accent: "#8b5cf6",
      accentSoft: "rgba(139, 92, 246, .13)",
    },
    {
      id: "vinbigdata",
      name: "VinBigData",
      monogram: "VD",
      division: "Data & AI",
      accent: "#f59e0b",
      accentSoft: "rgba(245, 158, 11, .13)",
    },
    {
      id: "onemount",
      name: "One Mount Group",
      monogram: "OM",
      division: "Fintech",
      accent: "#ec4899",
      accentSoft: "rgba(236, 72, 153, .13)",
    },
    {
      id: "vinbrain",
      name: "VinBrain",
      monogram: "VB",
      division: "HealthTech",
      accent: "#22c55e",
      accentSoft: "rgba(34, 197, 94, .13)",
    },
  ] satisfies MockCompany[],
  teams: [
    {
      id: "vf-connected-car",
      companyId: "vinfast",
      name: "Connected Vehicle Platform",
      department: "Vehicle Cloud",
      description:
        "Phát triển dịch vụ kết nối xe, đồng bộ telemetry và trải nghiệm điều khiển xe từ xa.",
      tech: ["C++", "Kotlin", "AWS", "Kafka"],
      environment:
        "Agile quy mô lớn, phối hợp chặt với Firmware, Mobile và đội kiểm thử xe.",
      workMode: "Onsite 4 ngày/tuần",
      location: "Hà Nội",
      openRoles: ["Backend Intern", "C++ Software Intern"],
    },
    {
      id: "vf-infotainment",
      companyId: "vinfast",
      name: "Infotainment Experience",
      department: "Digital Cockpit",
      description:
        "Xây dựng giao diện màn hình trung tâm, hệ thống giải trí và trải nghiệm người dùng trên xe.",
      tech: ["React", "TypeScript", "Android", "Kotlin"],
      environment:
        "Product team đa chức năng, prototype nhanh, review UX cùng đội thiết kế quốc tế.",
      workMode: "Hybrid",
      location: "Hà Nội",
      openRoles: ["Frontend Intern", "Android Intern"],
    },
    {
      id: "vinai-smart-mobility",
      companyId: "vinai",
      name: "Smart Mobility Research",
      department: "Computer Vision",
      description:
        "Nghiên cứu perception, driver monitoring và mô hình thị giác máy tính cho phương tiện thông minh.",
      tech: ["Python", "PyTorch", "C++", "CUDA"],
      environment:
        "Research-driven, paper reading hằng tuần, thử nghiệm trên GPU và dữ liệu thực tế.",
      workMode: "Onsite",
      location: "Hà Nội · TP.HCM",
      openRoles: ["AI Research Intern", "ML Engineer Intern"],
    },
    {
      id: "vinai-genai",
      companyId: "vinai",
      name: "Generative AI Platform",
      department: "Foundation Models",
      description:
        "Xây dựng pipeline đánh giá, fine-tune và triển khai mô hình ngôn ngữ cho sản phẩm doanh nghiệp.",
      tech: ["Python", "LLM", "Docker", "Kubernetes"],
      environment:
        "High ownership, thử nghiệm liên tục, chia sẻ kết quả qua research review.",
      workMode: "Hybrid",
      location: "Hà Nội",
      openRoles: ["GenAI Intern", "MLOps Intern"],
    },
    {
      id: "vbd-data-platform",
      companyId: "vinbigdata",
      name: "Enterprise Data Platform",
      department: "Data Engineering",
      description:
        "Thiết kế pipeline dữ liệu lớn, lớp quan sát hệ thống và nền tảng dữ liệu dùng chung.",
      tech: ["Python", "SQL", "Spark", "Kubernetes"],
      environment:
        "Platform team, mentoring theo sprint, chú trọng độ tin cậy và khả năng mở rộng.",
      workMode: "Hybrid",
      location: "Hà Nội",
      openRoles: ["Data Engineer Intern", "Platform Intern"],
    },
    {
      id: "om-consumer-platform",
      companyId: "onemount",
      name: "Consumer Experience Platform",
      department: "Digital Product",
      description:
        "Phát triển hành trình người dùng, hệ thống loyalty và các tính năng fintech trên nền tảng tiêu dùng.",
      tech: ["React", "TypeScript", "Java", "GCP"],
      environment:
        "Product-first, feedback mở, ship theo sprint và theo dõi metric sau phát hành.",
      workMode: "Hybrid linh hoạt",
      location: "Hà Nội",
      openRoles: ["Frontend Intern", "Product Analyst Intern"],
    },
    {
      id: "vb-medical-imaging",
      companyId: "vinbrain",
      name: "Medical Imaging AI",
      department: "Clinical AI",
      description:
        "Phát triển và kiểm định mô hình hỗ trợ chẩn đoán hình ảnh trong quy trình y tế.",
      tech: ["Python", "PyTorch", "React", "Azure"],
      environment:
        "Quality-first, làm việc cùng chuyên gia y khoa, quy trình kiểm thử và tài liệu chặt chẽ.",
      workMode: "Hybrid",
      location: "Hà Nội · TP.HCM",
      openRoles: ["AI Engineer Intern", "Frontend Intern"],
    },
  ] satisfies ProjectTeam[],
  opportunities: [
    {
      id: "opp-vf-cpp",
      companyId: "vinfast",
      teamId: "vf-connected-car",
      department: "Connected Vehicle Platform",
      position: "C++ Software Intern",
      maxSlots: 8,
      currentApplicants: 5,
      workMode: "Onsite",
      deadline: "15/08",
    },
    {
      id: "opp-vf-fe",
      companyId: "vinfast",
      teamId: "vf-infotainment",
      department: "Infotainment Experience",
      position: "Frontend Intern",
      maxSlots: 6,
      currentApplicants: 9,
      workMode: "Hybrid",
      deadline: "15/08",
    },
    {
      id: "opp-vinai-research",
      companyId: "vinai",
      teamId: "vinai-smart-mobility",
      department: "Smart Mobility Research",
      position: "AI Research Intern",
      maxSlots: 5,
      currentApplicants: 12,
      workMode: "Onsite",
      deadline: "12/08",
    },
    {
      id: "opp-vinai-genai",
      companyId: "vinai",
      teamId: "vinai-genai",
      department: "Generative AI Platform",
      position: "GenAI Intern",
      maxSlots: 4,
      currentApplicants: 7,
      workMode: "Hybrid",
      deadline: "12/08",
    },
    {
      id: "opp-vbd-data",
      companyId: "vinbigdata",
      teamId: "vbd-data-platform",
      department: "Enterprise Data Platform",
      position: "Data Engineer Intern",
      maxSlots: 7,
      currentApplicants: 4,
      workMode: "Hybrid",
      deadline: "18/08",
    },
    {
      id: "opp-om-fe",
      companyId: "onemount",
      teamId: "om-consumer-platform",
      department: "Consumer Experience Platform",
      position: "Frontend Intern",
      maxSlots: 10,
      currentApplicants: 8,
      workMode: "Hybrid",
      deadline: "20/08",
    },
    {
      id: "opp-vb-ai",
      companyId: "vinbrain",
      teamId: "vb-medical-imaging",
      department: "Medical Imaging AI",
      position: "AI Engineer Intern",
      maxSlots: 5,
      currentApplicants: 3,
      workMode: "Hybrid",
      deadline: "18/08",
    },
  ] satisfies Opportunity[],
  cvMatches: [
    {
      teamId: "om-consumer-platform",
      position: "Frontend Intern",
      match: 91,
      reasons: [
        "Kinh nghiệm ReactJS và TypeScript tương đồng với Consumer Experience Platform.",
        "Dự án e-commerce thể hiện tư duy sản phẩm phù hợp môi trường One Mount.",
      ],
    },
    {
      teamId: "vf-infotainment",
      position: "Frontend Intern",
      match: 86,
      reasons: [
        "Nền tảng React phù hợp với giao diện Digital Cockpit.",
        "Kinh nghiệm làm việc theo Agile là điểm cộng cho team đa chức năng.",
      ],
    },
    {
      teamId: "vbd-data-platform",
      position: "Data Engineer Intern",
      match: 78,
      reasons: [
        "Python và SQL trong CV đáp ứng phần nền tảng của vị trí.",
        "Cần bổ sung Spark và kiến thức xử lý dữ liệu phân tán.",
      ],
    },
  ],
  cvProfile: {
    fullName: "Nguyễn Minh Anh",
    phone: "0987 654 321",
    cvLink: "https://drive.google.com/mock/vincareer-cv",
    skills: ["React", "TypeScript", "JavaScript", "Python", "SQL", "Git"],
    experience: "Frontend Intern · 4 tháng",
  },
};

const EMPTY_FORM: RegistrationForm = {
  fullName: "",
  phone: "",
  cvLink: "",
  preference: "1",
};

function getCompetitionTone(opportunity: Opportunity) {
  const ratio = opportunity.currentApplicants / Math.max(opportunity.maxSlots, 1);
  if (ratio > 1) return "high";
  if (ratio >= 0.75) return "medium";
  return "low";
}

function getCompetitionLabel(opportunity: Opportunity) {
  const tone = getCompetitionTone(opportunity);
  if (tone === "high") return "Cạnh tranh cao";
  if (tone === "medium") return "Đang tăng";
  return "Còn nhiều cơ hội";
}

export default function CareerJourneyFeatures() {
  const [activeTab, setActiveTab] = useState<FeatureTab>("explore");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [teamSearch, setTeamSearch] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<ProjectTeam | null>(null);
  const [cvMode, setCvMode] = useState<CvInputMode>("upload");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvFileName, setCvFileName] = useState("");
  const [cvText, setCvText] = useState("");
  const [analysisReady, setAnalysisReady] = useState(false);
  const [opportunities, setOpportunities] = useState<Opportunity[]>(
    CAREER_JOURNEY_MOCK_DATA.opportunities,
  );
  const [competitionTeamFilter, setCompetitionTeamFilter] = useState("");
  const [registrationTarget, setRegistrationTarget] =
    useState<Opportunity | null>(null);
  const [registrationForm, setRegistrationForm] =
    useState<RegistrationForm>(EMPTY_FORM);
  const [registeredOpportunityIds, setRegisteredOpportunityIds] = useState<
    string[]
  >([]);
  const [toast, setToast] = useState("");
  const toastTimerRef = useRef<number | null>(null);
  const {
    isRunning: isAnalyzing,
    agentSteps,
    matches: agentMatches,
    analyzeCv,
  } = useCareerAgent() as {
    isRunning: boolean;
    agentSteps: AgentStep[];
    matches: AgentMatch[];
    analyzeCv: (input: {
      file: File | null;
      text: string;
    }) => Promise<{ matches?: AgentMatch[]; answer?: string } | null>;
  };

  const filteredTeams = useMemo(() => {
    const query = teamSearch.trim().toLowerCase();
    return CAREER_JOURNEY_MOCK_DATA.teams.filter((team) => {
      const matchesCompany =
        companyFilter === "all" || team.companyId === companyFilter;
      const searchableText = [
        team.name,
        team.department,
        team.description,
        team.environment,
        ...team.tech,
        ...team.openRoles,
      ]
        .join(" ")
        .toLowerCase();
      return matchesCompany && (!query || searchableText.includes(query));
    });
  }, [companyFilter, teamSearch]);

  const visibleOpportunities = useMemo(() => {
    if (!competitionTeamFilter) return opportunities;
    return opportunities.filter(
      (opportunity) => opportunity.teamId === competitionTeamFilter,
    );
  }, [competitionTeamFilter, opportunities]);

  const totalSlots = opportunities.reduce(
    (sum, opportunity) => sum + opportunity.maxSlots,
    0,
  );
  const totalApplicants = opportunities.reduce(
    (sum, opportunity) => sum + opportunity.currentApplicants,
    0,
  );

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(""), 2800);
  };

  const findCompany = (companyId?: string) =>
    CAREER_JOURNEY_MOCK_DATA.companies.find(
      (company) => company.id === companyId,
    );

  const findTeam = (teamId?: string) =>
    CAREER_JOURNEY_MOCK_DATA.teams.find((team) => team.id === teamId);

  const handleCvFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !["pdf", "doc", "docx"].includes(extension)) {
      showToast("Vui lòng chọn CV định dạng PDF, DOC hoặc DOCX.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast("Dung lượng CV tối đa là 10 MB.");
      return;
    }
    setCvFile(file);
    setCvFileName(file.name);
    setAnalysisReady(false);
    showToast("Đã nhận CV. Bạn có thể bắt đầu phân tích.");
  };

  const startCvAnalysis = async () => {
    const hasInput =
      cvMode === "upload" ? Boolean(cvFile) : cvText.trim().length >= 20;
    if (!hasInput) {
      showToast(
        cvMode === "upload"
          ? "Hãy tải CV lên trước khi phân tích."
          : "Nội dung CV cần có ít nhất 20 ký tự.",
      );
      return;
    }

    setAnalysisReady(false);
    const result = await analyzeCv({
      file: cvMode === "upload" ? cvFile : null,
      text: cvMode === "paste" ? cvText : "",
    });
    if (result?.matches?.length) {
      setAnalysisReady(true);
      showToast("Phân tích hoàn tất — đã tìm thấy Top 3 kết quả phù hợp.");
      return;
    }
    showToast(result?.answer ?? "Không thể phân tích CV mock. Hãy thử lại.");
  };

  const openCompetitionForTeam = (teamId: string) => {
    setSelectedTeam(null);
    setCompetitionTeamFilter(teamId);
    setActiveTab("competition");
  };

  const openRegistration = (opportunity?: Opportunity | null) => {
    if (!opportunity) {
      showToast("Không tìm thấy dữ liệu vị trí. Vui lòng thử lại.");
      return;
    }
    if (registeredOpportunityIds.includes(opportunity.id)) {
      showToast("Bạn đã đăng ký nguyện vọng cho vị trí này.");
      return;
    }
    setRegistrationTarget(opportunity);
    setRegistrationForm(EMPTY_FORM);
  };

  const closeRegistration = () => {
    setRegistrationTarget(null);
    setRegistrationForm(EMPTY_FORM);
  };

  const aiFillRegistration = () => {
    const profile = CAREER_JOURNEY_MOCK_DATA.cvProfile;
    setRegistrationForm((current) => ({
      ...current,
      fullName: profile.fullName,
      phone: profile.phone,
      cvLink: profile.cvLink,
    }));
    showToast(
      analysisReady
        ? "AI đã điền thông tin từ CV vừa phân tích."
        : "AI đã điền dữ liệu từ hồ sơ CV mock.",
    );
  };

  const updateRegistrationField = <K extends keyof RegistrationForm,>(
    field: K,
    value: RegistrationForm[K],
  ) => {
    setRegistrationForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const submitRegistration = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!registrationTarget) {
      showToast("Vị trí đăng ký không còn khả dụng.");
      return;
    }
    if (
      !registrationForm.fullName.trim() ||
      !registrationForm.phone.trim() ||
      !registrationForm.cvLink.trim()
    ) {
      showToast("Vui lòng điền đầy đủ Họ tên, SĐT và Link CV.");
      return;
    }

    setOpportunities((current) =>
      current.map((opportunity) =>
        opportunity.id === registrationTarget.id
          ? {
              ...opportunity,
              currentApplicants: opportunity.currentApplicants + 1,
            }
          : opportunity,
      ),
    );
    setRegisteredOpportunityIds((current) => [
      ...current,
      registrationTarget.id,
    ]);
    setRegistrationTarget(null);
    setRegistrationForm(EMPTY_FORM);
    showToast(
      `Đăng ký nguyện vọng ${registrationForm.preference} thành công!`,
    );
  };

  return (
    <section className="journey-section" id="internship-journey">
      <div className="shell">
        <div className="journey-heading">
          <div>
            <span className="eyebrow">HÀNH TRÌNH THỰC TẬP 6 TUẦN</span>
            <h2>Khám phá team. Đo độ phù hợp. Chọn nguyện vọng.</h2>
          </div>
          <p>
            Một không gian chung giúp học viên hiểu rõ cơ hội, chuẩn bị hồ sơ và
            đăng ký team phù hợp bằng dữ liệu mô phỏng.
          </p>
        </div>

        <div className="journey-tabs" role="tablist">
          {[
            {
              id: "explore" as const,
              label: "Công ty & Project Teams",
              icon: Layers3,
              count: CAREER_JOURNEY_MOCK_DATA.teams.length,
            },
            {
              id: "analyzer" as const,
              label: "CV Fit Analyzer",
              icon: Target,
              count: 3,
            },
            {
              id: "competition" as const,
              label: "Cạnh tranh & Nguyện vọng",
              icon: Trophy,
              count: opportunities.length,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={activeTab === tab.id ? "is-active" : ""}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={17} />
                <span>{tab.label}</span>
                <em>{tab.count}</em>
                {activeTab === tab.id && (
                  <motion.i layoutId="journey-active-tab" />
                )}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "explore" && (
            <motion.div
              key="explore"
              className="journey-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.24 }}
            >
              <div className="team-toolbar">
                <div className="team-search">
                  <Search size={17} />
                  <input
                    value={teamSearch}
                    onChange={(event) => setTeamSearch(event.target.value)}
                    placeholder="Tìm team, vị trí hoặc tech stack..."
                    aria-label="Tìm nhóm dự án"
                  />
                  {teamSearch && (
                    <button
                      type="button"
                      onClick={() => setTeamSearch("")}
                      aria-label="Xóa tìm kiếm"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
                <div className="company-filter">
                  <button
                    type="button"
                    className={companyFilter === "all" ? "is-active" : ""}
                    onClick={() => setCompanyFilter("all")}
                  >
                    Tất cả
                  </button>
                  {CAREER_JOURNEY_MOCK_DATA.companies.map((company) => (
                    <button
                      key={company.id}
                      type="button"
                      className={
                        companyFilter === company.id ? "is-active" : ""
                      }
                      onClick={() => setCompanyFilter(company.id)}
                    >
                      {company.monogram}
                    </button>
                  ))}
                </div>
              </div>

              {filteredTeams.length ? (
                <div className="project-team-grid">
                  {filteredTeams.map((team) => {
                    const company = findCompany(team.companyId);
                    return (
                      <motion.button
                        key={team.id}
                        type="button"
                        className="project-team-card"
                        onClick={() => setSelectedTeam(team)}
                        whileHover={{ y: -5 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="project-team-card__head">
                          <span
                            style={{
                              color: company?.accent ?? "#0878e6",
                              background:
                                company?.accentSoft ??
                                "rgba(8,120,230,.09)",
                            }}
                          >
                            {company?.monogram ?? "TM"}
                          </span>
                          <div>
                            <small>{company?.name ?? "Đang cập nhật"}</small>
                            <strong>{team.name}</strong>
                          </div>
                          <ChevronRight size={18} />
                        </div>
                        <span className="project-team-card__department">
                          <Building2 size={13} /> {team.department}
                        </span>
                        <p>{team.description}</p>
                        <div className="project-team-card__tech">
                          {team.tech.map((tech) => (
                            <span key={tech}>{tech}</span>
                          ))}
                        </div>
                        <div className="project-team-card__meta">
                          <span>
                            <Users size={13} /> {team.environment}
                          </span>
                          <span>
                            <MapPin size={13} /> {team.location}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              ) : (
                <div className="journey-empty-state">
                  <Search size={27} />
                  <h3>Không tìm thấy Project Team phù hợp</h3>
                  <p>Thử đổi từ khóa hoặc chọn lại bộ lọc công ty.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setTeamSearch("");
                      setCompanyFilter("all");
                    }}
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "analyzer" && (
            <motion.div
              key="analyzer"
              className="journey-panel cv-analyzer-layout"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.24 }}
            >
              <div className="cv-analyzer-input">
                <div className="journey-panel-title">
                  <div>
                    <span>
                      <Sparkles size={18} />
                    </span>
                    <div>
                      <small>BƯỚC 1</small>
                      <h3>Cung cấp CV của bạn</h3>
                    </div>
                  </div>
                  <span className="mock-badge">
                    <ShieldCheck size={13} /> Mock Analysis
                  </span>
                </div>

                <div className="cv-mode-switch">
                  <button
                    type="button"
                    className={cvMode === "upload" ? "is-active" : ""}
                    onClick={() => {
                      setCvMode("upload");
                      setAnalysisReady(false);
                    }}
                  >
                    <UploadCloud size={15} /> Tải lên CV
                  </button>
                  <button
                    type="button"
                    className={cvMode === "paste" ? "is-active" : ""}
                    onClick={() => {
                      setCvMode("paste");
                      setAnalysisReady(false);
                    }}
                  >
                    <ClipboardPaste size={15} /> Dán text CV
                  </button>
                </div>

                {cvMode === "upload" ? (
                  <label
                    className={
                      cvFileName
                        ? "journey-upload-zone has-file"
                        : "journey-upload-zone"
                    }
                  >
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleCvFile}
                    />
                    {cvFileName ? (
                      <>
                        <CheckCircle2 size={29} />
                        <strong>{cvFileName}</strong>
                        <span>CV đã sẵn sàng · Nhấn để chọn file khác</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud size={30} />
                        <strong>Kéo thả hoặc chọn CV từ thiết bị</strong>
                        <span>Hỗ trợ PDF, DOC, DOCX · Tối đa 10 MB</span>
                      </>
                    )}
                  </label>
                ) : (
                  <div className="journey-cv-text">
                    <textarea
                      value={cvText}
                      onChange={(event) => {
                        setCvText(event.target.value);
                        setAnalysisReady(false);
                      }}
                      placeholder="Ví dụ: Frontend Intern 4 tháng. Kỹ năng React, TypeScript, JavaScript, Python, SQL..."
                      aria-label="Nội dung CV"
                    />
                    <span>{cvText.length} ký tự</span>
                  </div>
                )}

                <button
                  type="button"
                  className="analyze-cv-button"
                  onClick={startCvAnalysis}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <span className="journey-spinner" /> AI đang phân tích...
                    </>
                  ) : (
                    <>
                      <Sparkles size={17} /> Phân tích CV và tìm Top 3
                    </>
                  )}
                </button>

                <div className="cv-analyzer-notes">
                  <span>
                    <Check size={13} /> Không lưu file thật
                  </span>
                  <span>
                    <Clock3 size={13} /> Kết quả sau khoảng 2 giây
                  </span>
                  <span>
                    <Bot size={13} /> 100% dữ liệu mock
                  </span>
                </div>
              </div>

              <div className="cv-analyzer-result">
                <AnimatePresence mode="wait">
                  {isAnalyzing ? (
                    <motion.div
                      key="loading"
                      className="analysis-loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="analysis-orbit">
                        <FileText size={28} />
                        <span />
                      </div>
                      <h3>Đang đọc hồ sơ và đối chiếu cơ hội...</h3>
                      <p>
                        {agentSteps.at(-1)?.message ??
                          "AI mock đang nhận diện kỹ năng, kinh nghiệm và domain."}
                      </p>
                      <div className="agent-tool-trace">
                        {agentSteps.slice(-3).map((step) => (
                          <span
                            key={step.id}
                            className={step.state === "done" ? "is-done" : ""}
                          >
                            {step.state === "done" ? (
                              <CheckCircle2 size={12} />
                            ) : (
                              <span className="journey-spinner" />
                            )}
                            {step.message}
                          </span>
                        ))}
                      </div>
                      <div className="analysis-progress">
                        <motion.i
                          initial={{ width: "6%" }}
                          animate={{ width: "92%" }}
                          transition={{ duration: 2.35, ease: "easeInOut" }}
                        />
                      </div>
                    </motion.div>
                  ) : analysisReady ? (
                    <motion.div
                      key="results"
                      className="match-result-list"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                    >
                      <div className="match-result-header">
                        <div>
                          <small>BƯỚC 2 · KẾT QUẢ PHÂN TÍCH</small>
                          <h3>Top 3 cơ hội dành cho bạn</h3>
                        </div>
                        <span>
                          <CheckCircle2 size={14} /> Đã phân tích
                        </span>
                      </div>
                      {agentMatches.map(
                        (match, index) => {
                          const team = findTeam(match.teamId);
                          const company =
                            findCompany(match.companyId) ??
                            findCompany(team?.companyId);
                          return (
                            <motion.div
                              key={match.id}
                              className="match-result-card"
                              initial={{ opacity: 0, x: 12 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                            >
                              <span className="match-rank">#{index + 1}</span>
                              <div
                                className="match-score"
                                style={
                                  {
                                    "--match-score": `${match.score * 3.6}deg`,
                                    "--match-color":
                                      company?.accent ?? "#0878e6",
                                  } as React.CSSProperties
                                }
                              >
                                <span>{match.score}%</span>
                              </div>
                              <div className="match-result-card__body">
                                <small>
                                  {match.companyName ??
                                    company?.name ??
                                    "Công ty"}{" "}
                                  · {match.teamName ?? team?.name ?? "Project Team"}
                                </small>
                                <h4>{match.position}</h4>
                                {match.reasons.map((reason) => (
                                  <p key={reason}>
                                    <Check size={12} /> {reason}
                                  </p>
                                ))}
                                <div className="match-score-detail">
                                  <span>
                                    Mong muốn{" "}
                                    <strong>
                                      {match.scoreDetail?.internWishes ?? 0}/42
                                    </strong>
                                  </span>
                                  <span>
                                    Yêu cầu{" "}
                                    <strong>
                                      {match.scoreDetail
                                        ?.employerRequirements ?? 0}
                                      /38
                                    </strong>
                                  </span>
                                  <span>
                                    Kỹ năng cộng{" "}
                                    <strong>
                                      {match.scoreDetail?.preferredSkills ?? 0}
                                      /10
                                    </strong>
                                  </span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  if (match.teamId) {
                                    openCompetitionForTeam(match.teamId);
                                  } else {
                                    showToast(
                                      "Chưa tìm thấy Project Team tương ứng.",
                                    );
                                  }
                                }}
                              >
                                Xem vị trí <ArrowRight size={14} />
                              </button>
                            </motion.div>
                          );
                        },
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      className="analysis-empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div>
                        <Target size={34} />
                        <i />
                        <Trophy size={23} />
                      </div>
                      <h3>Kết quả Top 3 sẽ xuất hiện tại đây</h3>
                      <p>
                        Tải CV hoặc dán nội dung CV để tìm Project Team phù hợp
                        nhất với hồ sơ của bạn.
                      </p>
                      <div className="mock-profile-preview">
                        <span>Kỹ năng AI có thể nhận diện</span>
                        <div>
                          {CAREER_JOURNEY_MOCK_DATA.cvProfile.skills.map(
                            (skill) => (
                              <em key={skill}>{skill}</em>
                            ),
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {activeTab === "competition" && (
            <motion.div
              key="competition"
              className="journey-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.24 }}
            >
              <div className="competition-summary">
                <div>
                  <span>
                    <BriefcaseBusiness size={18} />
                  </span>
                  <p>
                    <strong>{opportunities.length}</strong>
                    <small>Vị trí đang mở</small>
                  </p>
                </div>
                <div>
                  <span>
                    <Users size={18} />
                  </span>
                  <p>
                    <strong>{totalSlots}</strong>
                    <small>Tổng chỉ tiêu</small>
                  </p>
                </div>
                <div>
                  <span>
                    <UserPlus size={18} />
                  </span>
                  <p>
                    <strong>{totalApplicants}</strong>
                    <small>Nguyện vọng hiện tại</small>
                  </p>
                </div>
                <div className="competition-legend">
                  <span>
                    <i className="is-low" /> Còn cơ hội
                  </span>
                  <span>
                    <i className="is-medium" /> Đang tăng
                  </span>
                  <span>
                    <i className="is-high" /> Cạnh tranh cao
                  </span>
                </div>
              </div>

              {competitionTeamFilter && (
                <div className="active-competition-filter">
                  <span>
                    Đang xem:{" "}
                    <strong>
                      {findTeam(competitionTeamFilter)?.name ??
                        "Project Team đã chọn"}
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setCompetitionTeamFilter("")}
                  >
                    Xem tất cả <X size={13} />
                  </button>
                </div>
              )}

              <div className="competition-table">
                <div className="competition-table__head">
                  <span>PHÒNG BAN / VỊ TRÍ</span>
                  <span>CHỈ TIÊU</span>
                  <span>MỨC ĐỘ CẠNH TRANH</span>
                  <span>HẠN ĐĂNG KÝ</span>
                  <span />
                </div>
                {visibleOpportunities.map((opportunity) => {
                  const company = findCompany(opportunity.companyId);
                  const tone = getCompetitionTone(opportunity);
                  const rawRatio =
                    opportunity.currentApplicants /
                    Math.max(opportunity.maxSlots, 1);
                  const visualPercent = Math.min(rawRatio * 100, 100);
                  const isRegistered = registeredOpportunityIds.includes(
                    opportunity.id,
                  );
                  return (
                    <motion.div
                      layout
                      key={opportunity.id}
                      className="competition-row"
                    >
                      <div className="competition-position">
                        <span
                          style={{
                            color: company?.accent ?? "#0878e6",
                            background:
                              company?.accentSoft ??
                              "rgba(8,120,230,.09)",
                          }}
                        >
                          {company?.monogram ?? "IN"}
                        </span>
                        <div>
                          <small>
                            {company?.name ?? "Công ty"} ·{" "}
                            {opportunity.department}
                          </small>
                          <strong>{opportunity.position}</strong>
                          <em>{opportunity.workMode}</em>
                        </div>
                      </div>
                      <div className="competition-slots">
                        <strong>{opportunity.currentApplicants}</strong>
                        <span>/ {opportunity.maxSlots} ứng viên</span>
                      </div>
                      <div className={`competition-meter is-${tone}`}>
                        <span>
                          <strong>{getCompetitionLabel(opportunity)}</strong>
                          <em>{Math.round(rawRatio * 100)}%</em>
                        </span>
                        <div>
                          <motion.i
                            initial={{ width: 0 }}
                            whileInView={{ width: `${visualPercent}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                      <div className="competition-deadline">
                        <Clock3 size={14} /> {opportunity.deadline}
                      </div>
                      <button
                        type="button"
                        className={
                          isRegistered
                            ? "register-button is-registered"
                            : "register-button"
                        }
                        onClick={() => openRegistration(opportunity)}
                        disabled={isRegistered}
                      >
                        {isRegistered ? (
                          <>
                            <CheckCircle2 size={15} /> Đã đăng ký
                          </>
                        ) : (
                          <>
                            <UserPlus size={15} /> Đăng ký nguyện vọng
                          </>
                        )}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedTeam && (
          <motion.div
            className="journey-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setSelectedTeam(null);
            }}
          >
            <motion.div
              className="team-detail-modal"
              role="dialog"
              aria-modal="true"
              aria-label={`Chi tiết ${selectedTeam.name}`}
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
            >
              <button
                type="button"
                className="journey-modal-close"
                onClick={() => setSelectedTeam(null)}
                aria-label="Đóng chi tiết Project Team"
              >
                <X size={19} />
              </button>
              {(() => {
                const company = findCompany(selectedTeam.companyId);
                return (
                  <>
                    <div className="team-modal-hero">
                      <span
                        style={{
                          color: company?.accent ?? "#0878e6",
                          background:
                            company?.accentSoft ?? "rgba(8,120,230,.09)",
                        }}
                      >
                        {company?.monogram ?? "TM"}
                      </span>
                      <div>
                        <small>
                          {company?.name ?? "Công ty"} ·{" "}
                          {selectedTeam.department}
                        </small>
                        <h3>{selectedTeam.name}</h3>
                        <p>
                          <MapPin size={13} /> {selectedTeam.location}
                          <i />
                          <Users size={13} /> {selectedTeam.workMode}
                        </p>
                      </div>
                    </div>
                    <div className="team-modal-body">
                      <div>
                        <span className="content-label">NHÓM LÀM GÌ?</span>
                        <p>{selectedTeam.description}</p>
                      </div>
                      <div>
                        <span className="content-label">
                          MÔI TRƯỜNG LÀM VIỆC
                        </span>
                        <p>{selectedTeam.environment}</p>
                      </div>
                      <div>
                        <span className="content-label">TECH STACK</span>
                        <div className="team-modal-tech">
                          {selectedTeam.tech.map((tech) => (
                            <span key={tech}>
                              <Code2 size={12} /> {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="content-label">VỊ TRÍ MỞ</span>
                        <div className="team-modal-roles">
                          {selectedTeam.openRoles.map((role) => (
                            <span key={role}>
                              <BriefcaseBusiness size={13} /> {role}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="team-modal-footer">
                      <span>
                        <ShieldCheck size={14} /> Thông tin mô phỏng cho
                        prototype
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          openCompetitionForTeam(selectedTeam.id)
                        }
                      >
                        Xem vị trí và mức cạnh tranh{" "}
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}

        {registrationTarget && (
          <motion.div
            className="journey-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeRegistration();
            }}
          >
            <motion.div
              className="registration-modal"
              role="dialog"
              aria-modal="true"
              aria-label={`Đăng ký ${registrationTarget.position}`}
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
            >
              <button
                type="button"
                className="journey-modal-close"
                onClick={closeRegistration}
                aria-label="Đóng form đăng ký"
              >
                <X size={19} />
              </button>

              <div className="registration-modal__head">
                <span>
                  <UserPlus size={22} />
                </span>
                <div>
                  <small>ĐĂNG KÝ NGUYỆN VỌNG MOCK</small>
                  <h3>{registrationTarget.position}</h3>
                  <p>
                    {findCompany(registrationTarget.companyId)?.name ??
                      "Công ty"}{" "}
                    · {registrationTarget.department}
                  </p>
                </div>
              </div>

              <form onSubmit={submitRegistration}>
                <button
                  type="button"
                  className="ai-fill-button"
                  onClick={aiFillRegistration}
                >
                  <Sparkles size={17} />
                  <span>
                    <strong>AI hỗ trợ điền form</strong>
                    <small>
                      Tự động lấy Họ tên, SĐT và Link từ CV mock
                    </small>
                  </span>
                  <ChevronRight size={16} />
                </button>

                <div className="registration-fields">
                  <label>
                    <span>Họ và tên *</span>
                    <div>
                      <Users size={15} />
                      <input
                        value={registrationForm.fullName}
                        onChange={(event) =>
                          updateRegistrationField(
                            "fullName",
                            event.target.value,
                          )
                        }
                        placeholder="Nguyễn Văn A"
                      />
                    </div>
                  </label>
                  <label>
                    <span>Số điện thoại *</span>
                    <div>
                      <Phone size={15} />
                      <input
                        value={registrationForm.phone}
                        onChange={(event) =>
                          updateRegistrationField("phone", event.target.value)
                        }
                        placeholder="09xx xxx xxx"
                        inputMode="tel"
                      />
                    </div>
                  </label>
                  <label className="is-full">
                    <span>Link CV *</span>
                    <div>
                      <Link2 size={15} />
                      <input
                        value={registrationForm.cvLink}
                        onChange={(event) =>
                          updateRegistrationField("cvLink", event.target.value)
                        }
                        placeholder="https://drive.google.com/..."
                        inputMode="url"
                      />
                    </div>
                  </label>
                  <label className="is-full">
                    <span>Mức độ ưu tiên</span>
                    <div>
                      <Trophy size={15} />
                      <select
                        value={registrationForm.preference}
                        onChange={(event) =>
                          updateRegistrationField(
                            "preference",
                            event.target.value as PreferenceLevel,
                          )
                        }
                      >
                        <option value="1">Nguyện vọng 1 — Ưu tiên cao nhất</option>
                        <option value="2">Nguyện vọng 2 — Lựa chọn bổ sung</option>
                      </select>
                      <ChevronDown size={15} />
                    </div>
                  </label>
                </div>

                <div className="registration-warning">
                  <AlertTriangle size={15} />
                  Đây là form mô phỏng. Dữ liệu sẽ không được gửi đến công ty.
                </div>

                <div className="registration-actions">
                  <button type="button" onClick={closeRegistration}>
                    Hủy
                  </button>
                  <button type="submit">
                    Gửi đăng ký <ArrowRight size={15} />
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            className="journey-toast"
            initial={{ opacity: 0, y: 16, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 10, x: "-50%" }}
          >
            <CheckCircle2 size={16} /> {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
