"use client";

import { motion } from "motion/react";
import {
  Building2,
  Check,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Settings2,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { careerApi } from "../services/apiClient";

const EMPTY_COMPANY = {
  slug: "",
  name: "",
  division: "",
  description: "",
  locations: "",
  tech_stack: "",
  work_environment: "Hybrid",
  fresher_score: 4,
  open_roles: 0,
  active: true,
};

const EMPTY_CRITERION = {
  key: "",
  label: "",
  description: "",
  weight: 0.1,
  max_score: 100,
  display_order: 0,
  active: true,
};

const splitValues = (value) =>
  value.split(",").map((item) => item.trim()).filter(Boolean);

export default function AdminPage({ notify, onCompaniesChanged }) {
  const [activeTab, setActiveTab] = useState("companies");
  const [companies, setCompanies] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [companyForm, setCompanyForm] = useState(EMPTY_COMPANY);
  const [criterionForm, setCriterionForm] = useState(EMPTY_CRITERION);
  const [editingCompanyId, setEditingCompanyId] = useState("");
  const [editingCriterionId, setEditingCriterionId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [companyData, criterionData] = await Promise.all([
        careerApi.listCompanies({ includeInactive: true }),
        careerApi.listCriteria({ includeInactive: true }),
      ]);
      setCompanies(companyData || []);
      setCriteria(criterionData || []);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Không tải được dữ liệu Admin.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const saveCompany = async (event) => {
    event.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    const payload = {
      ...companyForm,
      locations: splitValues(companyForm.locations),
      tech_stack: splitValues(companyForm.tech_stack),
      fresher_score: Number(companyForm.fresher_score),
      open_roles: Number(companyForm.open_roles),
      ...(editingCompanyId ? {} : { jd_data: [] }),
    };
    try {
      if (editingCompanyId) await careerApi.updateCompany(editingCompanyId, payload);
      else await careerApi.createCompany(payload);
      notify(editingCompanyId ? "Đã cập nhật công ty." : "Đã thêm công ty.", "success");
      setCompanyForm(EMPTY_COMPANY);
      setEditingCompanyId("");
      await load();
      onCompaniesChanged();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Không lưu được công ty.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const editCompany = (company) => {
    setEditingCompanyId(company.id);
    setCompanyForm({
      slug: company.slug,
      name: company.name,
      division: company.division,
      description: company.description || "",
      locations: (company.locations || []).join(", "),
      tech_stack: (company.tech_stack || []).join(", "),
      work_environment: company.work_environment || "",
      fresher_score: company.fresher_score || 0,
      open_roles: company.open_roles || 0,
      active: company.active,
    });
    window.scrollTo({ top: 150, behavior: "smooth" });
  };

  const removeCompany = async (company) => {
    if (!window.confirm(`Xóa ${company.name}? Thao tác này không thể hoàn tác.`)) return;
    try {
      await careerApi.deleteCompany(company.id);
      notify("Đã xóa công ty.", "success");
      await load();
      onCompaniesChanged();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Không xóa được công ty.", "error");
    }
  };

  const saveCriterion = async (event) => {
    event.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    const payload = {
      ...criterionForm,
      weight: Number(criterionForm.weight),
      max_score: Number(criterionForm.max_score),
      display_order: Number(criterionForm.display_order),
    };
    try {
      if (editingCriterionId) await careerApi.updateCriterion(editingCriterionId, payload);
      else await careerApi.createCriterion(payload);
      notify(editingCriterionId ? "Đã cập nhật tiêu chí." : "Đã thêm tiêu chí.", "success");
      setCriterionForm(EMPTY_CRITERION);
      setEditingCriterionId("");
      await load();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Không lưu được tiêu chí.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const editCriterion = (criterion) => {
    setEditingCriterionId(criterion.id);
    setCriterionForm({
      key: criterion.key,
      label: criterion.label,
      description: criterion.description || "",
      weight: Number(criterion.weight),
      max_score: criterion.max_score,
      display_order: criterion.display_order,
      active: criterion.active,
    });
  };

  const removeCriterion = async (criterion) => {
    if (!window.confirm(`Xóa tiêu chí “${criterion.label}”?`)) return;
    try {
      await careerApi.deleteCriterion(criterion.id);
      notify("Đã xóa tiêu chí.", "success");
      await load();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Không xóa được tiêu chí.", "error");
    }
  };

  const updateCompanyForm = (key, value) =>
    setCompanyForm((current) => ({ ...current, [key]: value }));
  const updateCriterionForm = (key, value) =>
    setCriterionForm((current) => ({ ...current, [key]: value }));

  return (
    <motion.section className="page-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="shell">
        <div className="page-hero">
          <div>
            <span className="eyebrow">ADMIN CONTROL CENTER</span>
            <h1>Quản trị dữ liệu tuyển dụng</h1>
            <p>CRUD công ty và cấu hình trọng số Matching bằng tài khoản Admin.</p>
          </div>
          <span className="page-hero__icon"><ShieldCheck size={29} /></span>
        </div>

        <div className="admin-tabs">
          <button
            type="button"
            className={activeTab === "companies" ? "is-active" : ""}
            onClick={() => setActiveTab("companies")}
          >
            <Building2 size={15} /> Công ty
          </button>
          <button
            type="button"
            className={activeTab === "criteria" ? "is-active" : ""}
            onClick={() => setActiveTab("criteria")}
          >
            <Settings2 size={15} /> Tiêu chí đánh giá
          </button>
          <button type="button" onClick={load} disabled={isLoading}>
            <RefreshCw size={14} /> Làm mới
          </button>
        </div>

        {activeTab === "companies" ? (
          <div className="admin-layout">
            <form className="admin-form-card" onSubmit={saveCompany}>
              <header>
                <span><Plus size={17} /></span>
                <div><small>COMPANY EDITOR</small><h3>{editingCompanyId ? "Sửa công ty" : "Thêm công ty"}</h3></div>
              </header>
              <div className="admin-form-grid">
                <label><span>Tên công ty</span><input required value={companyForm.name} onChange={(e) => updateCompanyForm("name", e.target.value)} /></label>
                <label><span>Slug</span><input required value={companyForm.slug} onChange={(e) => updateCompanyForm("slug", e.target.value)} /></label>
                <label><span>Khối</span><input required value={companyForm.division} onChange={(e) => updateCompanyForm("division", e.target.value)} /></label>
                <label><span>Môi trường</span><input value={companyForm.work_environment} onChange={(e) => updateCompanyForm("work_environment", e.target.value)} /></label>
                <label><span>Địa điểm, phân cách dấu phẩy</span><input value={companyForm.locations} onChange={(e) => updateCompanyForm("locations", e.target.value)} /></label>
                <label><span>Tech stack, phân cách dấu phẩy</span><input value={companyForm.tech_stack} onChange={(e) => updateCompanyForm("tech_stack", e.target.value)} /></label>
                <label><span>Fresher score</span><input type="number" min="0" max="5" step="0.5" value={companyForm.fresher_score} onChange={(e) => updateCompanyForm("fresher_score", e.target.value)} /></label>
                <label><span>Open slots</span><input type="number" min="0" value={companyForm.open_roles} onChange={(e) => updateCompanyForm("open_roles", e.target.value)} /></label>
                <label className="admin-form-wide"><span>Mô tả</span><textarea value={companyForm.description} onChange={(e) => updateCompanyForm("description", e.target.value)} /></label>
                <label className="admin-checkbox"><input type="checkbox" checked={companyForm.active} onChange={(e) => updateCompanyForm("active", e.target.checked)} /><span><Check size={12} /> Đang hoạt động</span></label>
              </div>
              <div className="admin-form-actions">
                {editingCompanyId && (
                  <button type="button" onClick={() => { setEditingCompanyId(""); setCompanyForm(EMPTY_COMPANY); }}>
                    <X size={13} /> Hủy
                  </button>
                )}
                <button className="button-primary" type="submit" disabled={isSaving}>
                  <Save size={14} /> {isSaving ? "Đang lưu..." : "Lưu công ty"}
                </button>
              </div>
            </form>

            <div className="admin-table-card">
              <header><strong>{companies.length} công ty</strong><small>PostgreSQL</small></header>
              {companies.map((company) => (
                <div className="admin-row" key={company.id}>
                  <span className="company-mini-logo company-logo--api">{company.name.slice(0, 2).toUpperCase()}</span>
                  <div><strong>{company.name}</strong><small>{company.division} · {company.active ? "Active" : "Hidden"}</small></div>
                  <button type="button" onClick={() => editCompany(company)} aria-label="Sửa"><Pencil size={14} /></button>
                  <button className="is-danger" type="button" onClick={() => removeCompany(company)} aria-label="Xóa"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="admin-layout">
            <form className="admin-form-card" onSubmit={saveCriterion}>
              <header>
                <span><Settings2 size={17} /></span>
                <div><small>MATCHING WEIGHT</small><h3>{editingCriterionId ? "Sửa tiêu chí" : "Thêm tiêu chí"}</h3></div>
              </header>
              <div className="admin-form-grid">
                <label><span>Key</span><input required value={criterionForm.key} onChange={(e) => updateCriterionForm("key", e.target.value)} /></label>
                <label><span>Tên hiển thị</span><input required value={criterionForm.label} onChange={(e) => updateCriterionForm("label", e.target.value)} /></label>
                <label><span>Trọng số (0–1)</span><input type="number" min="0" max="1" step="0.01" value={criterionForm.weight} onChange={(e) => updateCriterionForm("weight", e.target.value)} /></label>
                <label><span>Thứ tự</span><input type="number" value={criterionForm.display_order} onChange={(e) => updateCriterionForm("display_order", e.target.value)} /></label>
                <label className="admin-form-wide"><span>Mô tả</span><textarea value={criterionForm.description} onChange={(e) => updateCriterionForm("description", e.target.value)} /></label>
                <label className="admin-checkbox"><input type="checkbox" checked={criterionForm.active} onChange={(e) => updateCriterionForm("active", e.target.checked)} /><span><Check size={12} /> Đang áp dụng</span></label>
              </div>
              <div className="admin-form-actions">
                {editingCriterionId && (
                  <button type="button" onClick={() => { setEditingCriterionId(""); setCriterionForm(EMPTY_CRITERION); }}>
                    <X size={13} /> Hủy
                  </button>
                )}
                <button className="button-primary" type="submit" disabled={isSaving}>
                  <Save size={14} /> {isSaving ? "Đang lưu..." : "Lưu tiêu chí"}
                </button>
              </div>
            </form>
            <div className="admin-table-card">
              <header><strong>{criteria.length} tiêu chí</strong><small>Tổng trọng số {criteria.reduce((sum, item) => sum + Number(item.weight), 0).toFixed(2)}</small></header>
              {criteria.map((criterion) => (
                <div className="admin-row" key={criterion.id}>
                  <span className="criterion-admin-weight">{Math.round(Number(criterion.weight) * 100)}%</span>
                  <div><strong>{criterion.label}</strong><small>{criterion.key} · {criterion.active ? "Active" : "Hidden"}</small></div>
                  <button type="button" onClick={() => editCriterion(criterion)} aria-label="Sửa"><Pencil size={14} /></button>
                  <button className="is-danger" type="button" onClick={() => removeCriterion(criterion)} aria-label="Xóa"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.section>
  );
}
