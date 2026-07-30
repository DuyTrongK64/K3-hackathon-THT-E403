"use client";

import {
  ArrowLeftRight,
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Code2,
  Command,
  ExternalLink,
  FileText,
  Gauge,
  GraduationCap,
  HeartHandshake,
  Layers3,
  Menu,
  MessageCircleMore,
  Moon,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Target,
  TrendingUp,
  UploadCloud,
  Users,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import CareerJourneyFeatures from "./CareerJourneyFeatures";
import { useCareerAgent } from "../hooks/useCareerAgent";

type TabId = "home" | "compare" | "chat" | "fit";

type Company = {
  id: string;
  name: string;
  shortName: string;
  monogram: string;
  division: string;
  accent: string;
  accentSoft: string;
  location: string;
  fresherScore: number;
  openRoles: number;
  summary: string;
  tech: string[];
  languages: string;
  workStyle: string;
  fresherRequirement: string;
  benefits: string;
  jd: string[];
  interview: { title: string; detail: string }[];
  pros: string[];
  cons: string[];
  fitSkills: string[];
};

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
  resultCompanyId?: string;
  fitScore?: number;
  agentTrace?: string[];
};

type AgentStep = {
  id: string;
  tool: string;
  state: "running" | "done" | "error";
  message: string;
};

type AgentChatResult = {
  intent: string;
  answer: string;
  matches?: {
    companyId: string;
    score: number;
  }[];
  toolTrace?: AgentStep[];
};

type UploadedCv = {
  name: string;
  size: string;
  status: "analyzing" | "ready";
};

const companies: Company[] = [
  {
    id: "vinfast",
    name: "VinFast Software",
    shortName: "VinFast",
    monogram: "VF",
    division: "Automotive",
    accent: "#06b6d4",
    accentSoft: "rgba(6, 182, 212, .13)",
    location: "Hà Nội · Hải Phòng",
    fresherScore: 4.5,
    openRoles: 18,
    summary:
      "Xây dựng nền tảng phần mềm cho ô tô điện: infotainment, cloud vehicle và ứng dụng người dùng.",
    tech: ["C++", "React", "Kotlin", "AWS"],
    languages: "C++, Java/Kotlin, TypeScript",
    workStyle: "Product scale lớn · Agile · Cross-functional",
    fresherRequirement: "DSA khá, OOP chắc, tiếng Anh đọc hiểu tốt",
    benefits: "Trợ cấp cạnh tranh · Xe đưa đón · Mentoring",
    jd: [
      "Phát triển và kiểm thử module phần mềm trên hệ thống xe điện.",
      "Làm việc cùng Firmware, Cloud và Mobile để tích hợp tính năng.",
      "Viết unit test, review code và theo dõi chất lượng qua CI/CD.",
    ],
    interview: [
      { title: "Screening 30 phút", detail: "CV, dự án nổi bật và động lực với automotive." },
      { title: "Technical 60–90 phút", detail: "OOP, DSA, debugging và bài toán theo vị trí." },
      { title: "Culture & Offer", detail: "Ownership, tốc độ học và khả năng phối hợp." },
    ],
    pros: ["Quy mô sản phẩm toàn cầu", "Được va chạm hệ thống phức tạp", "Nhiều team để luân chuyển"],
    cons: ["Nhịp độ nhanh", "Một số team yêu cầu onsite", "Domain automotive cần thời gian học"],
    fitSkills: ["C++", "React", "Git", "OOP", "English"],
  },
  {
    id: "vinai",
    name: "VinAI",
    shortName: "VinAI",
    monogram: "AI",
    division: "AI Research",
    accent: "#8b5cf6",
    accentSoft: "rgba(139, 92, 246, .13)",
    location: "Hà Nội · TP.HCM",
    fresherScore: 4,
    openRoles: 11,
    summary:
      "Nghiên cứu và sản phẩm AI ứng dụng trong thị giác máy tính, lái xe thông minh và GenAI.",
    tech: ["Python", "PyTorch", "C++", "CUDA"],
    languages: "Python, C++, CUDA",
    workStyle: "Research-driven · Paper club · High ownership",
    fresherRequirement: "Nền tảng ML tốt, đọc paper, có project/research rõ",
    benefits: "Mentor nghiên cứu · GPU lab · Hỗ trợ conference",
    jd: [
      "Thử nghiệm mô hình deep learning trên dữ liệu hình ảnh và video.",
      "Tối ưu pipeline huấn luyện, đánh giá và suy luận trên edge device.",
      "Đọc paper, tái hiện kết quả và trình bày insight cho nhóm nghiên cứu.",
    ],
    interview: [
      { title: "Portfolio Review", detail: "Project ML, GitHub, paper hoặc cuộc thi liên quan." },
      { title: "AI Technical", detail: "ML fundamentals, coding Python và deep learning." },
      { title: "Research Fit", detail: "Tư duy thử nghiệm, phản biện và hướng phát triển." },
    ],
    pros: ["Mentor mạnh về AI", "Bài toán khó, có chiều sâu", "Tiếp cận hạ tầng nghiên cứu tốt"],
    cons: ["Bar kỹ thuật cao", "Cần chủ động đọc paper", "Ít phù hợp nếu chỉ thích UI/product"],
    fitSkills: ["Python", "PyTorch", "Math", "Research", "English"],
  },
  {
    id: "vinbigdata",
    name: "VinBigData",
    shortName: "VinBigData",
    monogram: "VD",
    division: "Data & AI",
    accent: "#f59e0b",
    accentSoft: "rgba(245, 158, 11, .13)",
    location: "Hà Nội",
    fresherScore: 4.5,
    openRoles: 9,
    summary:
      "Nền tảng dữ liệu lớn và AI tiếng Việt cho doanh nghiệp: ViGPT, speech và computer vision.",
    tech: ["Python", "Spark", "K8s", "LLM"],
    languages: "Python, Java/Scala, SQL",
    workStyle: "Data-centric · Platform team · Learning culture",
    fresherRequirement: "Python/SQL chắc, hiểu data pipeline hoặc ML cơ bản",
    benefits: "Lab AI · Khóa học nội bộ · Bảo hiểm mở rộng",
    jd: [
      "Xây dựng pipeline xử lý dữ liệu có khả năng mở rộng.",
      "Hỗ trợ fine-tune, đánh giá và triển khai mô hình ngôn ngữ.",
      "Quan sát hệ thống, tối ưu chi phí và độ tin cậy của dịch vụ.",
    ],
    interview: [
      { title: "HR Fit", detail: "Mục tiêu nghề nghiệp và trải nghiệm thực tập." },
      { title: "Data Challenge", detail: "Python/SQL, xử lý dữ liệu và system thinking." },
      { title: "Team Interview", detail: "Trình bày solution, nhận feedback và culture fit." },
    ],
    pros: ["Bài toán tiếng Việt thực tế", "Data scale đa dạng", "Lộ trình học rõ"],
    cons: ["Cần chắc nền tảng dữ liệu", "Debug pipeline có thể phức tạp", "Một số role thiên backend"],
    fitSkills: ["Python", "SQL", "Docker", "Data", "English"],
  },
  {
    id: "onemount",
    name: "One Mount Group",
    shortName: "One Mount",
    monogram: "OM",
    division: "Fintech",
    accent: "#ec4899",
    accentSoft: "rgba(236, 72, 153, .13)",
    location: "Hà Nội",
    fresherScore: 5,
    openRoles: 23,
    summary:
      "Hệ sinh thái công nghệ tiêu dùng, tài chính và bất động sản với nhịp product nhanh.",
    tech: ["React", "Java", "Go", "GCP"],
    languages: "TypeScript, Java, Go",
    workStyle: "Product-first · Agile · Open feedback",
    fresherRequirement: "Web fundamentals, clean code, tư duy sản phẩm",
    benefits: "Hybrid linh hoạt · Tech talks · Review lương định kỳ",
    jd: [
      "Phát triển giao diện web có hiệu năng và khả năng mở rộng tốt.",
      "Phối hợp Product, Design, Backend để ship tính năng theo sprint.",
      "Theo dõi metric, A/B test và cải thiện trải nghiệm người dùng.",
    ],
    interview: [
      { title: "Talent Call", detail: "Kỳ vọng, dự án gần nhất và khả năng bắt đầu." },
      { title: "Live Coding", detail: "JavaScript, React, API flow và problem solving." },
      { title: "Product & Culture", detail: "Ownership, customer thinking và teamwork." },
    ],
    pros: ["Rất thân thiện với fresher", "Product mindset rõ", "Văn hóa feedback cởi mở"],
    cons: ["Nhịp release nhanh", "Cần giao tiếp chủ động", "Domain fintech cần độ chính xác cao"],
    fitSkills: ["React", "JavaScript", "Git", "Product", "English"],
  },
  {
    id: "vinbrain",
    name: "VinBrain",
    shortName: "VinBrain",
    monogram: "VB",
    division: "HealthTech",
    accent: "#22c55e",
    accentSoft: "rgba(34, 197, 94, .13)",
    location: "Hà Nội · TP.HCM",
    fresherScore: 4,
    openRoles: 7,
    summary:
      "Ứng dụng AI vào chẩn đoán hình ảnh và vận hành y tế với tiêu chuẩn sản phẩm nghiêm ngặt.",
    tech: ["Python", "React", "PyTorch", "Azure"],
    languages: "Python, TypeScript, C#",
    workStyle: "Mission-driven · Quality-first · Multidisciplinary",
    fresherRequirement: "Nền tảng tốt, cẩn thận, quan tâm HealthTech",
    benefits: "Mentor chuyên sâu · Bảo hiểm · Sản phẩm có tác động",
    jd: [
      "Phát triển tính năng AI hoặc dashboard hỗ trợ quy trình y tế.",
      "Làm việc với dữ liệu nhạy cảm theo tiêu chuẩn bảo mật nghiêm ngặt.",
      "Viết tài liệu, kiểm thử và phối hợp với chuyên gia y khoa.",
    ],
    interview: [
      { title: "Motivation Call", detail: "Mối quan tâm HealthTech và dự án phù hợp." },
      { title: "Technical Deep-dive", detail: "Coding, ML/web foundation và quality mindset." },
      { title: "Mission Fit", detail: "Tính cẩn trọng, empathy và khả năng cộng tác." },
    ],
    pros: ["Sản phẩm tạo tác động xã hội", "Chú trọng chất lượng", "Học domain y tế độc đáo"],
    cons: ["Quy trình kiểm thử chặt", "Domain mới và nhiều thuật ngữ", "Tốc độ ship cân bằng compliance"],
    fitSkills: ["Python", "React", "Testing", "Empathy", "English"],
  },
];

const navItems: { id: TabId; label: string; shortLabel: string; icon: typeof Search }[] = [
  { id: "home", label: "Trang chủ", shortLabel: "Trang chủ", icon: Building2 },
  { id: "compare", label: "So sánh Tech Stack", shortLabel: "So sánh", icon: ArrowLeftRight },
  { id: "chat", label: "Trợ lý AI Hỏi-Đáp", shortLabel: "Trợ lý AI", icon: MessageCircleMore },
  { id: "fit", label: "Đánh giá độ phù hợp", shortLabel: "Fit Score", icon: Gauge },
];

const suggestions = [
  "Tìm công ty hợp với CV của tôi",
  "Cập nhật dữ liệu công ty mới nhất",
  "So sánh VinFast và One Mount?",
  "Thực tập xong nộp VinAI cần kỹ năng gì?",
  "Công ty nào thân thiện nhất với Fresher?",
];

const skillOptions = [
  "React",
  "JavaScript",
  "Python",
  "C++",
  "PyTorch",
  "SQL",
  "Git",
  "English",
  "Product",
  "Research",
];

const initialMessages: ChatMessage[] = [
  {
    id: 1,
    role: "assistant",
    content:
      "Chào bạn! Mình là VinCareer AI. Hãy tải CV lên để nhận phân tích cá nhân hóa, hoặc hỏi mình về công ty, JD và phỏng vấn.",
  },
];

function getMockAnswer(question: string) {
  const q = question.toLowerCase();
  if (q.includes("vinfast") && q.includes("one mount")) {
    return "Nếu bạn thích hệ thống quy mô lớn, C++ và domain ô tô điện, VinFast là lựa chọn giàu thử thách. Nếu thiên về web/product, React và muốn ship tính năng nhanh, One Mount phù hợp hơn. Với fresher Frontend, mình nghiêng 60% về One Mount; với Embedded/Backend, VinFast nổi bật hơn.";
  }
  if (q.includes("vinai")) {
    return "Để nộp VinAI sau kỳ thực tập, hãy ưu tiên 4 mảng: Python chắc, nền tảng ML/DL, khả năng đọc paper tiếng Anh và một project có số liệu đánh giá rõ. Điểm cộng lớn là GitHub sạch, biết PyTorch và có thể giải thích vì sao bạn chọn kiến trúc mô hình.";
  }
  if (q.includes("fresher") || q.includes("thân thiện")) {
    return "Theo dữ liệu mô phỏng, One Mount đang thân thiện nhất với fresher (5/5), sau đó là VinFast và VinBigData (4.5/5). Tuy nhiên, lựa chọn tốt nhất còn phụ thuộc tech stack: Frontend → One Mount, Data → VinBigData, C++/Automotive → VinFast.";
  }
  if (q.includes("phỏng vấn") || q.includes("interview")) {
    return "Phần lớn quy trình gồm 3 vòng: screening CV, technical 60–90 phút và culture/team fit. Bạn nên chuẩn bị một câu chuyện dự án theo STAR, ôn DSA ở mức cơ bản–trung bình và luyện giải thích trade-off thay vì chỉ đưa ra đáp án.";
  }
  if (q.includes("lương") || q.includes("trợ cấp")) {
    return "Prototype này không dùng dữ liệu lương thật. Mức mock tham khảo cho intern/fresher nằm trong khoảng 5–15 triệu/tháng tùy vị trí và năng lực. Khi trao đổi thật, hãy hỏi rõ gross/net, phụ cấp, bảo hiểm và chu kỳ review.";
  }
  return "Dựa trên dữ liệu mô phỏng, mình khuyên bạn chọn 2 công ty phù hợp tech stack nhất, đối chiếu yêu cầu fresher rồi chuẩn bị một project có thể demo trong 5 phút. Bạn có thể mở mục “So sánh Tech Stack” để mình giúp thu hẹp lựa chọn.";
}

function LogoMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand-lockup" aria-label="VinCareer AI">
      <div className={`brand-mark ${compact ? "brand-mark--compact" : ""}`}>
        <span>V</span>
        <Sparkles size={compact ? 10 : 12} strokeWidth={2.5} />
      </div>
      {!compact && (
        <div className="brand-copy">
          <strong>
            VinCareer <em>AI</em>
          </strong>
          <span>Sinh Viên Edition</span>
        </div>
      )}
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="section-heading">
      <span className="eyebrow">{eyebrow}</span>
      <div className="section-heading__row">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"jd" | "interview" | "insight">("jd");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialMessages);
  const [isTyping, setIsTyping] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [heroQuestion, setHeroQuestion] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [compareA, setCompareA] = useState("vinfast");
  const [compareB, setCompareB] = useState("vinai");
  const [fitCompany, setFitCompany] = useState("onemount");
  const [selectedSkills, setSelectedSkills] = useState<string[]>(["React", "JavaScript", "Git"]);
  const [experience, setExperience] = useState(1);
  const [toast, setToast] = useState("");
  const [uploadedCv, setUploadedCv] = useState<UploadedCv | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const cvInputRef = useRef<HTMLInputElement | null>(null);
  const messageIdRef = useRef(2);
  const chatBusyRef = useRef(false);
  const {
    isRunning: agentRunning,
    agentSteps,
    runAgent,
    resetAgent,
  } = useCareerAgent() as {
    isRunning: boolean;
    agentSteps: AgentStep[];
    runAgent: (
      message: string,
      options?: { cvInput?: { file?: File | null; text?: string } },
    ) => Promise<AgentChatResult | null>;
    resetAgent: () => void;
  };

  const compareCompanyA = companies.find((company) => company.id === compareA) ?? companies[0];
  const compareCompanyB = companies.find((company) => company.id === compareB) ?? companies[1];
  const fitTarget = companies.find((company) => company.id === fitCompany) ?? companies[0];

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    return companies.filter((company) =>
      [
        company.name,
        company.division,
        company.languages,
        company.summary,
        ...company.tech,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [searchQuery]);

  const fitScore = useMemo(() => {
    const matches = fitTarget.fitSkills.filter((skill) => selectedSkills.includes(skill)).length;
    const base = 44 + matches * 9 + experience * 4;
    return Math.min(96, base);
  }, [experience, fitTarget, selectedSkills]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [agentSteps, chatMessages, isTyping]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const navigateTo = (tab: TabId) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    setShowSearch(false);
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 20);
  };

  const openCompany = (company?: Company | null) => {
    if (!company) {
      setToast("Không tìm thấy dữ liệu công ty. Hãy thử lại.");
      return;
    }
    setSelectedCompany(company);
    setModalTab("jd");
    setIsModalOpen(true);
  };

  const closeCompany = () => {
    setIsModalOpen(false);
    window.setTimeout(() => setSelectedCompany(null), 220);
  };

  const handleCvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !["pdf", "doc", "docx"].includes(extension)) {
      setToast("CV cần có định dạng PDF, DOC hoặc DOCX.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setToast("CV cần nhỏ hơn 10 MB.");
      return;
    }

    setUploadedCv({
      name: file.name,
      size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
      status: "analyzing",
    });
    window.setTimeout(() => {
      setUploadedCv({
        name: file.name,
        size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
        status: "ready",
      });
      setSelectedSkills(["React", "JavaScript", "Git", "English"]);
      setExperience(1);
      setToast("Phân tích CV hoàn tất — đã nhận diện 4 kỹ năng nổi bật.");
    }, 900);
  };

  const sendChat = async (question?: string) => {
    const value = (question ?? chatInput).trim();
    if (!value || chatBusyRef.current || isTyping || agentRunning) {
      if (!value) setToast("Hãy nhập câu hỏi trước khi gửi.");
      return;
    }
    chatBusyRef.current = true;
    messageIdRef.current += 1;
    const userMessage: ChatMessage = {
      id: messageIdRef.current,
      role: "user",
      content: value,
    };
    setChatMessages((current) => [...current, userMessage]);
    setChatInput("");
    setIsTyping(true);
    try {
      const hasCvContext = uploadedCv?.status === "ready";
      const agentResult = await runAgent(value, {
        cvInput: hasCvContext
          ? {
              text:
                "Frontend Intern 4 tháng. Kỹ năng React TypeScript JavaScript Git Python SQL. Mong muốn frontend product hybrid và có mentor.",
            }
          : {},
      });
      const topMatch = agentResult?.matches?.[0];
      const responseContent =
        agentResult?.intent === "career_question"
          ? getMockAnswer(value)
          : agentResult?.answer ?? getMockAnswer(value);
      messageIdRef.current += 1;
      setChatMessages((current) => [
        ...current,
        {
          id: messageIdRef.current,
          role: "assistant",
          content: responseContent,
          resultCompanyId: topMatch?.companyId,
          fitScore: topMatch?.score,
          agentTrace: agentResult?.toolTrace?.map((step) => step.message),
        },
      ]);
    } finally {
      chatBusyRef.current = false;
      setIsTyping(false);
    }
  };

  const submitHeroQuestion = (event: FormEvent) => {
    event.preventDefault();
    const value = heroQuestion.trim();
    if (uploadedCv?.status === "analyzing") {
      setToast("AI đang đọc CV, vui lòng chờ thêm một chút.");
      return;
    }
    if (!value) {
      setToast("Chọn một gợi ý hoặc nhập câu hỏi của bạn.");
      return;
    }
    setHeroQuestion("");
    navigateTo("chat");
    window.setTimeout(() => sendChat(value), 160);
  };

  const chooseSuggestion = (question: string) => {
    navigateTo("chat");
    window.setTimeout(() => sendChat(question), 160);
  };

  const swapCompanies = () => {
    setCompareA(compareB);
    setCompareB(compareA);
  };

  const selectCompanyFromSearch = (company: Company) => {
    setSearchQuery("");
    setShowSearch(false);
    openCompany(company);
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((current) =>
      current.includes(skill) ? current.filter((item) => item !== skill) : [...current, skill],
    );
  };

  return (
    <main className={isDark ? "app app--dark" : "app"}>
      <div className="ambient ambient--one" />
      <div className="ambient ambient--two" />
      <input
        ref={cvInputRef}
        data-testid="cv-file-input"
        className="sr-only-file"
        type="file"
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleCvUpload}
        aria-label="Chọn tệp CV"
      />

      {/* Header / global navigation */}
      <header className="topbar">
        <div className="topbar__inner shell">
          <button className="logo-button" onClick={() => navigateTo("home")} aria-label="Về trang chủ">
            <LogoMark />
          </button>

          <nav className="desktop-nav" aria-label="Điều hướng chính">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={activeTab === item.id ? "nav-item nav-item--active" : "nav-item"}
                onClick={() => navigateTo(item.id)}
              >
                {item.label}
                {activeTab === item.id && (
                  <motion.span layoutId="nav-underline" className="nav-underline" />
                )}
              </button>
            ))}
          </nav>

          <div className="topbar__actions">
            <div className="global-search">
              <Search size={17} />
              <input
                aria-label="Tìm công ty hoặc vị trí"
                placeholder="Tìm công ty, kỹ năng..."
                value={searchQuery}
                onFocus={() => setShowSearch(true)}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setShowSearch(true);
                }}
              />
              <span className="search-shortcut">
                <Command size={11} /> K
              </span>
              <AnimatePresence>
                {showSearch && searchQuery && (
                  <motion.div
                    className="search-results"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                  >
                    {searchResults.length ? (
                      searchResults.map((company) => (
                        <button key={company.id} onClick={() => selectCompanyFromSearch(company)}>
                          <span
                            className="search-result__mark"
                            style={{ color: company.accent, background: company.accentSoft }}
                          >
                            {company.monogram}
                          </span>
                          <span>
                            <strong>{company.name}</strong>
                            <small>{company.division} · {company.tech.slice(0, 2).join(", ")}</small>
                          </span>
                          <ChevronRight size={16} />
                        </button>
                      ))
                    ) : (
                      <div className="search-empty">
                        <Search size={18} />
                        Không có kết quả cho “{searchQuery}”
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button
              className="icon-button theme-toggle"
              onClick={() => setIsDark((current) => !current)}
              aria-label={isDark ? "Bật giao diện sáng" : "Bật giao diện tối"}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              className="icon-button mobile-menu-button"
              onClick={() => setMobileMenuOpen((current) => !current)}
              aria-label="Mở menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.nav
              className="mobile-nav"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    className={activeTab === item.id ? "mobile-nav__item is-active" : "mobile-nav__item"}
                    onClick={() => navigateTo(item.id)}
                  >
                    <Icon size={18} /> {item.label}
                  </button>
                );
              })}
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      {/* Animated page switcher */}
      <AnimatePresence mode="wait">
        {activeTab === "home" && (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28 }}
          >
            {/* Hero */}
            <section className="hero shell">
              <div className="hero__copy">
                <motion.div
                  className="live-pill"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <span className="live-dot" />
                  Dữ liệu nghề nghiệp được phân tích bởi AI
                  <Sparkles size={14} />
                </motion.div>
                <h1>
                  Khởi đầu sự nghiệp
                  <br />
                  <span>đúng nơi, đúng hướng.</span>
                </h1>
                <p className="hero__tagline">
                  Gia nhập hệ sinh thái Vingroup: Chọn đúng công ty con,
                  <br className="desktop-break" /> làm chủ mọi vòng phỏng vấn.
                </p>

                <div className="cv-flow-card">
                  <div className="cv-flow-card__top">
                    <button
                      className={uploadedCv ? "cv-upload-button cv-upload-button--ready" : "cv-upload-button"}
                      type="button"
                      onClick={() => cvInputRef.current?.click()}
                      data-testid="upload-cv-button"
                    >
                      {uploadedCv?.status === "analyzing" ? (
                        <span className="cv-spinner" />
                      ) : uploadedCv ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        <UploadCloud size={18} />
                      )}
                      <span>
                        <strong>
                          {uploadedCv?.status === "analyzing"
                            ? "Đang phân tích CV..."
                            : uploadedCv
                              ? uploadedCv.name
                              : "Tải CV để AI hiểu bạn"}
                        </strong>
                        <small>
                          {uploadedCv
                            ? `${uploadedCv.size} · ${uploadedCv.status === "ready" ? "Đã nhận diện React, JavaScript, Git, English" : "Khoảng 1 giây"}`
                            : "PDF, DOC, DOCX · Tối đa 10 MB"}
                        </small>
                      </span>
                    </button>
                    <div className="flow-steps" aria-label="Quy trình phân tích CV">
                      <span className={uploadedCv ? "is-done" : "is-active"}>1</span>
                      <i />
                      <span className={uploadedCv?.status === "ready" ? "is-active" : ""}>2</span>
                      <i />
                      <span>3</span>
                    </div>
                  </div>
                  <form className="hero-chat" onSubmit={submitHeroQuestion}>
                    <div className="hero-chat__icon">
                      <Bot size={21} />
                    </div>
                    <input
                      aria-label="Hỏi VinCareer AI"
                      data-testid="hero-question-input"
                      placeholder={
                        uploadedCv?.status === "ready"
                          ? "Hỏi: “CV của mình phù hợp công ty nào nhất?”"
                          : "Hỏi AI: “Vị trí nào phù hợp với kỹ năng React của mình?”"
                      }
                      value={heroQuestion}
                      onChange={(event) => setHeroQuestion(event.target.value)}
                    />
                    <button
                      type="submit"
                      aria-label="Gửi câu hỏi"
                      data-testid="hero-send-button"
                      disabled={isTyping || agentRunning}
                    >
                      Gửi <ArrowRight size={17} />
                    </button>
                  </form>
                </div>

                <div className="suggestion-row">
                  <span>Gợi ý:</span>
                  {suggestions.slice(0, 2).map((suggestion) => (
                    <button key={suggestion} onClick={() => chooseSuggestion(suggestion)}>
                      {suggestion}
                    </button>
                  ))}
                </div>

                <div className="hero__proof">
                  <div>
                    <strong>5</strong>
                    <span>Công ty công nghệ</span>
                  </div>
                  <i />
                  <div>
                    <strong>68</strong>
                    <span>Vị trí đang mở</span>
                  </div>
                  <i />
                  <div>
                    <strong>4.6/5</strong>
                    <span>Độ thân thiện Fresher</span>
                  </div>
                </div>
              </div>

              <motion.div
                className="hero-dashboard"
                initial={{ opacity: 0, x: 24, scale: 0.97 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.12 }}
              >
                <div className="dashboard-top">
                  <div>
                    <span className="micro-label">CAREER SNAPSHOT</span>
                    <h3>Cơ hội dành cho bạn</h3>
                  </div>
                  <div className="dashboard-status">
                    <span /> Cập nhật hôm nay
                  </div>
                </div>

                <div className="match-card">
                  <div className="match-card__visual">
                    <svg viewBox="0 0 120 120" aria-label="Điểm phù hợp 86%">
                      <circle cx="60" cy="60" r="49" className="ring-base" />
                      <circle cx="60" cy="60" r="49" className="ring-value" />
                    </svg>
                    <div>
                      <strong>86</strong>
                      <span>Fit score</span>
                    </div>
                  </div>
                  <div className="match-card__copy">
                    <span>TOP MATCH CỦA BẠN</span>
                    <h4>Frontend Engineer</h4>
                    <p>One Mount Group · Hà Nội</p>
                    <div>
                      <span>React</span><span>TypeScript</span><span>GCP</span>
                    </div>
                  </div>
                  <button onClick={() => openCompany(companies.find((item) => item.id === "onemount"))}>
                    <ExternalLink size={17} />
                  </button>
                </div>

                <div className="dashboard-section-title">
                  <span>Công ty đang tuyển</span>
                  <button onClick={() => document.getElementById("companies")?.scrollIntoView({ behavior: "smooth" })}>
                    Xem tất cả <ChevronRight size={14} />
                  </button>
                </div>
                <div className="dashboard-company-list">
                  {companies.slice(0, 3).map((company, index) => (
                    <button key={company.id} onClick={() => openCompany(company)}>
                      <span
                        className="company-mini-logo"
                        style={{ background: company.accentSoft, color: company.accent }}
                      >
                        {company.monogram}
                      </span>
                      <span>
                        <strong>{company.name}</strong>
                        <small>{company.openRoles} vị trí · {company.location}</small>
                      </span>
                      <span className={index === 0 ? "trend trend--hot" : "trend"}>
                        {index === 0 ? <Zap size={11} /> : <TrendingUp size={11} />}
                        {index === 0 ? "HOT" : `+${12 - index * 3}%`}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="floating-note floating-note--one">
                  <CheckCircle2 size={18} />
                  <span><strong>CV đã sẵn sàng!</strong>87% tương thích ATS</span>
                </div>
                <div className="floating-note floating-note--two">
                  <Sparkles size={18} />
                  <span><strong>AI Insight</strong>3 kỹ năng nên bổ sung</span>
                </div>
              </motion.div>
            </section>

            {/* Company directory */}
            <section className="companies-section shell" id="companies">
              <SectionHeading
                eyebrow="KHÁM PHÁ HỆ SINH THÁI"
                title="Tìm nơi bạn thuộc về"
                description="Dữ liệu mock được tổng hợp theo góc nhìn của sinh viên mới ra trường — rõ tech stack, quy trình và độ phù hợp."
              />
              <div className="company-grid">
                {companies.map((company) => (
                  <motion.button
                    key={company.id}
                    className="company-card"
                    onClick={() => openCompany(company)}
                    whileHover={{ y: -7 }}
                    transition={{ duration: 0.2 }}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    style={{ "--company-accent": company.accent } as React.CSSProperties}
                  >
                    <div className="company-card__top">
                      <span
                        className="company-logo"
                        style={{ background: company.accentSoft, color: company.accent }}
                      >
                        {company.monogram}
                      </span>
                      <span className="division-badge">{company.division}</span>
                      <span className="card-arrow"><ArrowRight size={18} /></span>
                    </div>
                    <h3>{company.name}</h3>
                    <p>{company.summary}</p>
                    <div className="tech-stack">
                      {company.tech.map((tech) => <span key={tech}>{tech}</span>)}
                    </div>
                    <div className="company-card__footer">
                      <span className="fresher-rating">
                        <Star size={15} fill="currentColor" />
                        <strong>{company.fresherScore}</strong>
                        <small>Fresher friendly</small>
                      </span>
                      <span className="role-count">{company.openRoles} vị trí</span>
                    </div>
                  </motion.button>
                ))}
                <button className="company-card company-card--explore" onClick={() => navigateTo("compare")}>
                  <div className="explore-icon"><ArrowLeftRight size={24} /></div>
                  <h3>Chưa biết chọn nơi nào?</h3>
                  <p>Đặt hai công ty cạnh nhau và tìm ra lựa chọn phù hợp trong 2 phút.</p>
                  <span>So sánh ngay <ArrowRight size={16} /></span>
                </button>
              </div>
            </section>

            {/* Internship journey: teams, CV analyzer & mock registration */}
            <CareerJourneyFeatures />

            {/* Tool shortcuts */}
            <section className="tool-strip">
              <div className="shell tool-strip__inner">
                <div>
                  <span className="eyebrow eyebrow--light">BỘ CÔNG CỤ SINH VIÊN</span>
                  <h2>Từ “chưa biết chọn gì” đến<br />“sẵn sàng ứng tuyển”.</h2>
                </div>
                <div className="tool-cards">
                  {[
                    { tab: "compare" as TabId, icon: ArrowLeftRight, title: "So sánh Tech Stack", text: "Đặt 2 công ty cạnh nhau", index: "01" },
                    { tab: "chat" as TabId, icon: Bot, title: "Hỏi VinCareer AI", text: "Hỏi nhanh, đáp đúng trọng tâm", index: "02" },
                    { tab: "fit" as TabId, icon: Target, title: "Đo Fit Score", text: "Biết bạn đang thiếu kỹ năng gì", index: "03" },
                  ].map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <motion.button key={tool.tab} onClick={() => navigateTo(tool.tab)} whileHover={{ y: -5 }}>
                        <span className="tool-index">{tool.index}</span>
                        <Icon size={26} />
                        <strong>{tool.title}</strong>
                        <small>{tool.text}</small>
                        <ChevronRight className="tool-arrow" size={18} />
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </section>
          </motion.div>
        )}

        {activeTab === "compare" && (
          <motion.section
            key="compare"
            className="page-section shell"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <div className="page-hero">
              <div>
                <span className="eyebrow">DECISION TOOLKIT</span>
                <h1>So sánh Tech Stack</h1>
                <p>Nhìn rõ điểm khác biệt giữa hai môi trường trước khi dành thời gian chuẩn bị hồ sơ.</p>
              </div>
              <div className="page-hero__icon"><ArrowLeftRight size={30} /></div>
            </div>

            <div className="compare-picker">
              <label>
                <span>Công ty thứ nhất</span>
                <div className="select-wrap">
                  <select value={compareA} onChange={(event) => setCompareA(event.target.value)}>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={18} />
                </div>
              </label>
              <button className="swap-button" onClick={swapCompanies} aria-label="Đổi vị trí hai công ty">
                <ArrowLeftRight size={20} />
              </button>
              <label>
                <span>Công ty thứ hai</span>
                <div className="select-wrap">
                  <select value={compareB} onChange={(event) => setCompareB(event.target.value)}>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={18} />
                </div>
              </label>
            </div>

            {compareA === compareB ? (
              <div className="empty-state">
                <ArrowLeftRight size={30} />
                <h3>Hãy chọn hai công ty khác nhau</h3>
                <p>Bảng so sánh sẽ xuất hiện ngay khi bạn đổi một trong hai lựa chọn.</p>
              </div>
            ) : (
              <motion.div className="comparison-card" layout>
                <div className="comparison-head comparison-grid-row">
                  <div><span>TIÊU CHÍ</span></div>
                  {[compareCompanyA, compareCompanyB].map((company) => (
                    <div key={company.id}>
                      <span
                        className="company-logo"
                        style={{ background: company.accentSoft, color: company.accent }}
                      >
                        {company.monogram}
                      </span>
                      <div>
                        <h3>{company.name}</h3>
                        <p>{company.division}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {[
                  { icon: Code2, label: "Ngôn ngữ chính", key: "languages" as const },
                  { icon: Users, label: "Môi trường làm việc", key: "workStyle" as const },
                  { icon: GraduationCap, label: "Yêu cầu Fresher", key: "fresherRequirement" as const },
                  { icon: HeartHandshake, label: "Lương & chế độ mock", key: "benefits" as const },
                ].map((row) => {
                  const Icon = row.icon;
                  return (
                    <div className="comparison-grid-row comparison-data-row" key={row.key}>
                      <div><Icon size={18} /><span>{row.label}</span></div>
                      <div>{compareCompanyA?.[row.key] ?? "Chưa có dữ liệu"}</div>
                      <div>{compareCompanyB?.[row.key] ?? "Chưa có dữ liệu"}</div>
                    </div>
                  );
                })}
                <div className="comparison-grid-row comparison-data-row rating-row">
                  <div><Star size={18} /><span>Fresher friendly</span></div>
                  {[compareCompanyA, compareCompanyB].map((company) => (
                    <div key={company.id}>
                      <strong>{company.fresherScore}/5</strong>
                      <span className="rating-track">
                        <i style={{ width: `${company.fresherScore * 20}%`, background: company.accent }} />
                      </span>
                    </div>
                  ))}
                </div>
                <div className="comparison-actions comparison-grid-row">
                  <div />
                  {[compareCompanyA, compareCompanyB].map((company) => (
                    <button key={company.id} onClick={() => openCompany(company)}>
                      Xem hồ sơ chi tiết <ArrowRight size={16} />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            <div className="insight-banner">
              <div><Sparkles size={22} /></div>
              <span>
                <strong>AI Insight</strong>
                {compareCompanyA.fresherScore > compareCompanyB.fresherScore
                  ? `${compareCompanyA.shortName} có chỉ số thân thiện với Fresher cao hơn; ${compareCompanyB.shortName} nổi bật nếu bạn ưu tiên ${compareCompanyB.tech[0]}.`
                  : `${compareCompanyB.shortName} có chỉ số thân thiện với Fresher cao hơn; ${compareCompanyA.shortName} nổi bật nếu bạn ưu tiên ${compareCompanyA.tech[0]}.`}
              </span>
              <button onClick={() => navigateTo("fit")}>Kiểm tra Fit Score <ArrowRight size={15} /></button>
            </div>
          </motion.section>
        )}

        {activeTab === "chat" && (
          <motion.section
            key="chat"
            className="page-section shell"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <div className="page-hero page-hero--compact">
              <div>
                <span className="eyebrow">MOCK AI ASSISTANT</span>
                <h1>Trợ lý định hướng nghề nghiệp</h1>
                <p>Hỏi về công ty, JD, kỹ năng hoặc phỏng vấn. Câu trả lời được mô phỏng từ bộ dữ liệu trong ứng dụng.</p>
              </div>
              <div className="ai-online"><span /> AI đang trực tuyến</div>
            </div>

            <div className="chat-layout">
              <aside className="chat-sidebar">
                <button
                  className={uploadedCv ? "chat-cv-card chat-cv-card--ready" : "chat-cv-card"}
                  onClick={() => cvInputRef.current?.click()}
                  data-testid="chat-upload-cv-button"
                >
                  {uploadedCv ? <FileText size={18} /> : <UploadCloud size={18} />}
                  <span>
                    <strong>{uploadedCv?.name ?? "Tải CV của bạn"}</strong>
                    <small>
                      {uploadedCv?.status === "ready"
                        ? "Đã phân tích · Nhấn để thay"
                        : uploadedCv?.status === "analyzing"
                          ? "AI đang đọc CV..."
                          : "Nhận tư vấn cá nhân hóa"}
                    </small>
                  </span>
                  {uploadedCv?.status === "ready" ? <CheckCircle2 size={16} /> : <ChevronRight size={15} />}
                </button>
                <div className="chat-sidebar__title">
                  <Sparkles size={18} />
                  <span><strong>Câu hỏi nên thử</strong><small>Nhấn để hỏi ngay</small></span>
                </div>
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => sendChat(suggestion)}
                    disabled={isTyping || agentRunning}
                  >
                    <MessageCircleMore size={16} />
                    {suggestion}
                    <ChevronRight size={15} />
                  </button>
                ))}
                <div className="chat-tip">
                  <ShieldCheck size={20} />
                  <p><strong>Prototype 100% mock</strong>Thông tin chỉ dùng để trải nghiệm sản phẩm, không phải dữ liệu tuyển dụng chính thức.</p>
                </div>
              </aside>

              <div className="chat-window">
                <div className="chat-window__top">
                  <div className="assistant-avatar"><Bot size={21} /></div>
                  <span><strong>VinCareer Assistant</strong><small>Hiểu hệ sinh thái công nghệ Vin</small></span>
                  {uploadedCv?.status === "ready" && (
                    <div className="chat-cv-context">
                      <FileText size={14} />
                      <span>Đang dùng CV</span>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setChatMessages(initialMessages);
                      resetAgent();
                      setToast("Đã bắt đầu cuộc trò chuyện mới.");
                    }}
                    disabled={isTyping || agentRunning}
                  >
                    Cuộc trò chuyện mới
                  </button>
                </div>
                <div className="chat-messages" aria-live="polite">
                  {chatMessages.map((message) => {
                    const resultCompany = message.resultCompanyId
                      ? companies.find((company) => company.id === message.resultCompanyId)
                      : null;
                    return (
                      <motion.div
                        key={message.id}
                        className={`message message--${message.role}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {message.role === "assistant" && <div className="message-avatar"><Bot size={17} /></div>}
                        <div>
                          <span>{message.role === "assistant" ? "VinCareer AI" : "Bạn"}</span>
                          <p>{message.content}</p>
                          {message.agentTrace?.length ? (
                            <div className="message-agent-trace">
                              <span>
                                <Sparkles size={12} /> Agent & Tools đã sử dụng
                              </span>
                              {message.agentTrace.map((trace, index) => (
                                <small key={`${message.id}-trace-${index}`}>
                                  <CheckCircle2 size={11} /> {trace}
                                </small>
                              ))}
                            </div>
                          ) : null}
                          {resultCompany && (
                            <motion.div
                              className="cv-result-card"
                              data-testid="cv-analysis-result"
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.12 }}
                            >
                              <div className="cv-result-card__head">
                                <span
                                  style={{ background: resultCompany.accentSoft, color: resultCompany.accent }}
                                >
                                  {resultCompany.monogram}
                                </span>
                                <div>
                                  <small>TOP MATCH TỪ CV</small>
                                  <strong>{resultCompany.name}</strong>
                                </div>
                                <em>{message.fitScore ?? 80}% phù hợp</em>
                              </div>
                              <div className="cv-result-card__skills">
                                <span><Check size={13} /> React</span>
                                <span><Check size={13} /> Git</span>
                                <span><Check size={13} /> English</span>
                                <span className="is-gap">+ {resultCompany.fitSkills.find((skill) => !selectedSkills.includes(skill)) ?? "System Design"}</span>
                              </div>
                              <p>
                                CV có nền tảng phù hợp cho vị trí Fresher. Nên làm rõ kết quả dự án và bổ sung kỹ năng còn thiếu trước vòng technical.
                              </p>
                              <button
                                data-testid="view-application-plan"
                                onClick={() => {
                                  setFitCompany(resultCompany.id);
                                  navigateTo("fit");
                                }}
                              >
                                Xem kế hoạch ứng tuyển <ArrowRight size={15} />
                              </button>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                  {isTyping && (
                    <motion.div className="message message--assistant" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <div className="message-avatar"><Bot size={17} /></div>
                      <div>
                        <span>
                          {agentSteps.at(-1)?.message ??
                            "VinCareer AI đang phân tích..."}
                        </span>
                        <div className="typing-dots"><i /><i /><i /></div>
                        {agentSteps.length > 0 && (
                          <div className="agent-live-trace">
                            {agentSteps.slice(-4).map((step) => (
                              <small
                                key={step.id}
                                className={
                                  step.state === "done" ? "is-done" : ""
                                }
                              >
                                {step.state === "done" ? (
                                  <CheckCircle2 size={11} />
                                ) : (
                                  <span className="agent-live-dot" />
                                )}
                                {step.message}
                              </small>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <form
                  className="chat-composer"
                  onSubmit={(event) => {
                    event.preventDefault();
                    sendChat();
                  }}
                >
                  <button
                    className={uploadedCv ? "composer-upload composer-upload--ready" : "composer-upload"}
                    type="button"
                    onClick={() => cvInputRef.current?.click()}
                    aria-label={uploadedCv ? "Thay CV" : "Tải CV"}
                  >
                    {uploadedCv ? <FileText size={17} /> : <UploadCloud size={17} />}
                  </button>
                  <input
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    placeholder={
                      uploadedCv?.status === "ready"
                        ? "Hỏi về độ phù hợp của CV, công ty hoặc phỏng vấn..."
                        : "Nhập câu hỏi về công ty, JD hoặc phỏng vấn..."
                    }
                    aria-label="Tin nhắn cho VinCareer AI"
                    data-testid="chat-question-input"
                    disabled={isTyping || agentRunning}
                  />
                  <button type="submit" disabled={isTyping || agentRunning} aria-label="Gửi tin nhắn" data-testid="chat-send-button">
                    <Send size={18} />
                  </button>
                  <span>Enter để gửi · AI có thể đưa ra thông tin chưa chính xác</span>
                </form>
              </div>
            </div>
          </motion.section>
        )}

        {activeTab === "fit" && (
          <motion.section
            key="fit"
            className="page-section shell"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <div className="page-hero">
              <div>
                <span className="eyebrow">PERSONALIZED ASSESSMENT</span>
                <h1>Đo độ phù hợp của bạn</h1>
                <p>Chọn công ty và kỹ năng hiện có. Hệ thống sẽ tính điểm mock và gợi ý khoảng trống nên ưu tiên.</p>
              </div>
              <div className="page-hero__icon"><Target size={30} /></div>
            </div>

            <div className="fit-layout">
              <div className="fit-form-card">
                <div className="fit-step">
                  <span className="step-index">01</span>
                  <div>
                    <h3>Bạn muốn ứng tuyển vào đâu?</h3>
                    <p>Chọn một công ty mục tiêu</p>
                  </div>
                </div>
                <div className="fit-company-options">
                  {companies.map((company) => (
                    <button
                      key={company.id}
                      className={fitCompany === company.id ? "is-selected" : ""}
                      onClick={() => setFitCompany(company.id)}
                    >
                      <span style={{ color: company.accent, background: company.accentSoft }}>{company.monogram}</span>
                      {company.shortName}
                      {fitCompany === company.id && <Check size={15} />}
                    </button>
                  ))}
                </div>

                <div className="fit-divider" />

                <div className="fit-step">
                  <span className="step-index">02</span>
                  <div>
                    <h3>Kỹ năng bạn đã tự tin</h3>
                    <p>Chọn tất cả kỹ năng phù hợp</p>
                  </div>
                </div>
                <div className="skill-options">
                  {skillOptions.map((skill) => (
                    <button
                      key={skill}
                      className={selectedSkills.includes(skill) ? "is-selected" : ""}
                      onClick={() => toggleSkill(skill)}
                    >
                      {selectedSkills.includes(skill) && <Check size={14} />}
                      {skill}
                    </button>
                  ))}
                </div>

                <div className="fit-divider" />

                <div className="fit-step">
                  <span className="step-index">03</span>
                  <div>
                    <h3>Kinh nghiệm thực tế</h3>
                    <p>{experience === 0 ? "Chưa có" : `${experience} kỳ thực tập / dự án lớn`}</p>
                  </div>
                </div>
                <input
                  className="experience-range"
                  type="range"
                  min="0"
                  max="4"
                  value={experience}
                  onChange={(event) => setExperience(Number(event.target.value))}
                  aria-label="Số kỳ thực tập hoặc dự án lớn"
                />
                <div className="range-labels"><span>Chưa có</span><span>4+ kỳ / dự án</span></div>
              </div>

              <motion.div className="score-card" layout>
                <span className="micro-label">FIT SCORE VỚI {fitTarget.shortName.toUpperCase()}</span>
                <div className="score-ring" style={{ "--score": `${fitScore * 3.6}deg` } as React.CSSProperties}>
                  <div><strong>{fitScore}</strong><span>/100</span></div>
                </div>
                <h2>{fitScore >= 80 ? "Rất phù hợp!" : fitScore >= 65 ? "Khá phù hợp" : "Có tiềm năng"}</h2>
                <p>
                  Hồ sơ của bạn khớp <strong>{fitTarget.fitSkills.filter((skill) => selectedSkills.includes(skill)).length}/{fitTarget.fitSkills.length}</strong> kỹ năng ưu tiên.
                </p>
                <div className="score-breakdown">
                  <div><span>Kỹ năng nền tảng</span><strong>{Math.min(95, 50 + selectedSkills.length * 5)}%</strong></div>
                  <div><span>Domain phù hợp</span><strong>{fitScore >= 75 ? "Tốt" : "Khá"}</strong></div>
                  <div><span>Kinh nghiệm</span><strong>{experience >= 2 ? "Nổi bật" : experience === 1 ? "Đủ dùng" : "Cần bổ sung"}</strong></div>
                </div>
                <div className="gap-list">
                  <span>Kỹ năng nên bổ sung</span>
                  <div>
                    {fitTarget.fitSkills
                      .filter((skill) => !selectedSkills.includes(skill))
                      .slice(0, 3)
                      .map((skill) => <em key={skill}>+ {skill}</em>)}
                    {!fitTarget.fitSkills.some((skill) => !selectedSkills.includes(skill)) && <em>Đã đủ kỹ năng cốt lõi</em>}
                  </div>
                </div>
                <button onClick={() => openCompany(fitTarget)}>
                  Xem lộ trình phỏng vấn <ArrowRight size={17} />
                </button>
                <small>* Điểm số mang tính mô phỏng cho mục đích trải nghiệm.</small>
              </motion.div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Company detail modal */}
      <AnimatePresence>
        {isModalOpen && selectedCompany && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeCompany();
            }}
          >
            <motion.div
              className="company-modal"
              role="dialog"
              aria-modal="true"
              aria-label={`Chi tiết ${selectedCompany?.name ?? "công ty"}`}
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.24 }}
            >
              <button className="modal-close" onClick={closeCompany} aria-label="Đóng">
                <X size={20} />
              </button>
              <div className="modal-hero">
                <span
                  className="modal-company-logo"
                  style={{ color: selectedCompany.accent, background: selectedCompany.accentSoft }}
                >
                  {selectedCompany.monogram}
                </span>
                <div>
                  <span className="division-badge">{selectedCompany.division}</span>
                  <h2>{selectedCompany.name}</h2>
                  <p><Building2 size={15} /> {selectedCompany.location} <i /> <BriefcaseBusiness size={15} /> {selectedCompany.openRoles} vị trí mock</p>
                </div>
                <div className="modal-rating">
                  <Star size={17} fill="currentColor" />
                  <strong>{selectedCompany.fresherScore}</strong>
                  <span>Fresher friendly</span>
                </div>
              </div>

              <div className="modal-tabs">
                {[
                  { id: "jd" as const, label: "Bóc tách JD", icon: Layers3 },
                  { id: "interview" as const, label: "3 vòng phỏng vấn", icon: Users },
                  { id: "insight" as const, label: "Điểm cộng & trừ", icon: Gauge },
                ].map((tabItem) => {
                  const Icon = tabItem.icon;
                  return (
                    <button
                      key={tabItem.id}
                      className={modalTab === tabItem.id ? "is-active" : ""}
                      onClick={() => setModalTab(tabItem.id)}
                    >
                      <Icon size={17} /> {tabItem.label}
                      {modalTab === tabItem.id && <motion.i layoutId="modal-tab-line" />}
                    </button>
                  );
                })}
              </div>

              <AnimatePresence mode="wait">
                {modalTab === "jd" && (
                  <motion.div
                    key="jd"
                    className="modal-content"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                  >
                    <div className="jd-layout">
                      <div>
                        <span className="content-label">MÔ TẢ CÔNG VIỆC ĐÃ ĐƯỢC AI TÓM TẮT</span>
                        <h3>Bạn sẽ làm gì?</h3>
                        <ul className="check-list">
                          {selectedCompany.jd?.map((item) => (
                            <li key={item}><CheckCircle2 size={18} />{item}</li>
                          )) ?? <li>Chưa có dữ liệu JD.</li>}
                        </ul>
                      </div>
                      <aside>
                        <span className="content-label">TECH STACK</span>
                        <div className="modal-tech">
                          {selectedCompany.tech?.map((tech) => <span key={tech}>{tech}</span>)}
                        </div>
                        <span className="content-label">YÊU CẦU FRESHER</span>
                        <p>{selectedCompany.fresherRequirement ?? "Đang cập nhật"}</p>
                      </aside>
                    </div>
                  </motion.div>
                )}
                {modalTab === "interview" && (
                  <motion.div
                    key="interview"
                    className="modal-content"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                  >
                    <span className="content-label">LỘ TRÌNH PHỎNG VẤN MÔ PHỎNG</span>
                    <div className="interview-timeline">
                      {selectedCompany.interview?.map((round, index) => (
                        <div key={round.title}>
                          <span>{index + 1}</span>
                          <i />
                          <div>
                            <small>VÒNG {index + 1}</small>
                            <h3>{round.title}</h3>
                            <p>{round.detail}</p>
                          </div>
                        </div>
                      )) ?? <div>Chưa có dữ liệu phỏng vấn.</div>}
                    </div>
                  </motion.div>
                )}
                {modalTab === "insight" && (
                  <motion.div
                    key="insight"
                    className="modal-content"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                  >
                    <div className="pros-cons">
                      <div className="pros">
                        <span><CheckCircle2 size={19} /> ĐIỂM CỘNG</span>
                        {selectedCompany.pros?.map((item) => <p key={item}><Check size={15} />{item}</p>)}
                      </div>
                      <div className="cons">
                        <span><XCircle size={19} /> CẦN CÂN NHẮC</span>
                        {selectedCompany.cons?.map((item) => <p key={item}><X size={15} />{item}</p>)}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="modal-footer">
                <span><ShieldCheck size={15} /> Dữ liệu mock dùng cho mục đích trải nghiệm</span>
                <div>
                  <button className="button-secondary" onClick={() => {
                    closeCompany();
                    navigateTo("compare");
                    setCompareA(selectedCompany.id);
                  }}>
                    So sánh
                  </button>
                  <button className="button-primary" onClick={() => {
                    closeCompany();
                    navigateTo("fit");
                    setFitCompany(selectedCompany.id);
                  }}>
                    Đo Fit Score <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast & footer */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="toast"
            initial={{ opacity: 0, y: 20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 12, x: "-50%" }}
          >
            <CheckCircle2 size={17} /> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="footer">
        <div className="shell footer__inner">
          <LogoMark />
          <p>Prototype dành cho sinh viên · Dữ liệu tuyển dụng 100% mô phỏng</p>
          <button onClick={() => navigateTo("chat")}>Hỏi trợ lý AI <ArrowRight size={15} /></button>
        </div>
      </footer>

      <nav className="bottom-nav" aria-label="Điều hướng di động">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={activeTab === item.id ? "is-active" : ""}
              onClick={() => navigateTo(item.id)}
            >
              <Icon size={20} />
              <span>{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </main>
  );
}
