"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Plus, Trash2, X, RefreshCw, AlertCircle } from "lucide-react";
import { CONTRIBUTION_STATUSES, validateContributionRecord } from "@/services/contributionValidation";
import { createContribution, listContributions, putContribution, removeContribution } from "@/services/contributionApiClient";

const EMPTY_FORM = { title: "", repositoryUrl: "", issueUrl: "", status: "Saved", prUrl: "", personalNotes: "" };
const SUMMARY_ITEMS = [
  { label: "Saved issues", status: "Saved" },
  { label: "In progress", status: "In Progress" },
  { label: "PR submitted", status: "PR Submitted" },
  { label: "Merged", status: "Merged" },
];

export default function ContributionsTracker() {
  const [username, setUsername] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [storageNotice, setStorageNotice] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    let profile = null;
    try {
      profile = JSON.parse(localStorage.getItem("developerEligibilityProfile") || "null");
    } catch {
      profile = null;
    }
    const owner = profile?.username || "";
    setUsername(owner);
    setError("");
    setStorageNotice("");
    setProfileLoaded(true);
    if (!owner) {
      setRecords([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      setRecords(await listContributions());
    } catch {
      setRecords([]);
      setStorageNotice("Your contribution records could not be loaded. Check the database migration and connection, then retry.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    window.addEventListener("osmatcher-profile-change", load);
    window.addEventListener("storage", load);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("osmatcher-profile-change", load);
      window.removeEventListener("storage", load);
    };
  }, [load]);

  useEffect(() => {
    if (!modalOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [modalOpen]);

  const counts = useMemo(() => Object.fromEntries(
    CONTRIBUTION_STATUSES.map((status) => [status, records.filter((item) => item.status === status).length]),
  ), [records]);

  async function addContribution(event) {
    event.preventDefault();
    if (saving) return;
    setError("");
    try {
      validateContributionRecord(form);
      setFieldErrors({});
    } catch (validationError) {
      const message = validationError.message || "Check the issue details and try again.";
      const field = /repository link/i.test(message) && !/issue and repository/i.test(message)
        ? "repositoryUrl"
        : /pull request url/i.test(message) ? "prUrl" : "issueUrl";
      setFieldErrors({ [field]: message });
      return;
    }
    setSaving(true);
    try {
      const contribution = await createContribution({ repository: form.repositoryUrl, issue_url: form.issueUrl, title: form.title, status: form.status, pr_url: form.prUrl, notes: form.personalNotes });
      if (!contribution?.id) throw new Error("The save response did not include the persisted contribution. Please refresh and try again.");
      setRecords((previous) => [contribution, ...previous.filter((item) => item.id !== contribution.id)]);
      setForm(EMPTY_FORM);
      setFieldErrors({});
      setModalOpen(false);
      window.dispatchEvent(new Event("osmatcher-contribution-saved"));
    } catch (err) {
      setError(err.message || "Unable to save contribution.");
    } finally {
      setSaving(false);
    }
  }

  async function updateContribution(record) {
    setSaving(true);
    setError("");
    try {
      const updated = await putContribution(record);
      setRecords((previous) => previous.map((item) => item.id === record.id ? updated : item));
    } catch (err) {
      const message = err.message || "Unable to update contribution.";
      await load();
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteContribution(record) {
    if (!window.confirm("Remove this contribution from your tracker?")) return;
    setError("");
    try {
      await removeContribution(record.id);
      setRecords((previous) => previous.filter((item) => item.id !== record.id));
    } catch (err) {
      setError(err.message || "Unable to remove contribution.");
    }
  }

  function editRecord(id, field, value) {
    setRecords((previous) => previous.map((item) => item.id === id ? { ...item, [field]: value } : item));
  }

  function editForm(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
    setFieldErrors((previous) => ({ ...previous, [field]: "" }));
  }

  function openAddModal() {
    setError("");
    setFieldErrors({});
    setModalOpen(true);
  }

  const pageTitle = <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#ededef]">My Contributions</h1>;

  if (!profileLoaded) {
    return <div className="max-w-5xl mx-auto space-y-7"><header className="pb-6 border-b border-glass">{pageTitle}</header><p role="status" className="text-sm text-muted">Loading your contribution tracker…</p></div>;
  }

  if (!username) {
    return (
      <div className="max-w-5xl mx-auto space-y-7">
        <header className="pb-6 border-b border-glass">{pageTitle}</header>
        <section className="glass-panel rounded-2xl p-8 sm:p-10 space-y-4">
          <h2 className="text-xl font-semibold text-primary">Set up your GitHub username to start tracking contributions.</h2>
          <p className="text-base text-secondary">Your tracker is associated with the username in your local developer profile. It works without a Supabase Auth session.</p>
          <Link href="/profile" className="inline-flex items-center gap-2 rounded-xl bg-[#ea6c33] px-5 py-3 text-sm font-semibold text-white">Set up profile <ArrowRight className="w-4 h-4" /></Link>
        </section>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-7">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-glass">
        {pageTitle}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={load} disabled={loading} aria-label="Refresh contributions" className="control-button rounded-xl p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ea6c33]">
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button type="button" onClick={openAddModal} className="rounded-xl bg-[#ea6c33] px-5 py-3 text-sm font-semibold text-white hover:bg-[#d45f28]">
            <Plus className="inline w-4 h-4 mr-1.5" />Manually Add Issue
          </button>
        </div>
      </header>

      <Link href="/community-milestones" className="inline-flex items-center gap-2 text-sm font-semibold text-[#ea6c33] hover:text-[#f47b45]">
        Community interactions &amp; project milestones <ArrowRight className="w-4 h-4" />
      </Link>

      <p className="text-sm text-secondary">Tracking contributions for @{username}.</p>
      <section aria-label="Contribution summary" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {SUMMARY_ITEMS.map((item) => (
          <div key={item.status} className="glass-card rounded-2xl p-5 sm:p-6">
            <p className="text-3xl font-bold text-[#ededef]">{counts[item.status] || 0}</p>
            <p className="text-sm font-medium text-secondary mt-2">{item.label}</p>
          </div>
        ))}
      </section>

      {error && !modalOpen && <p role="alert" className="rounded-xl border border-rose-900/40 bg-rose-950/20 p-4 text-sm text-rose-200">{error}</p>}
      {storageNotice && <div role="status" className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm text-[#a1a1aa]"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><p className="flex-1">{storageNotice}</p><button type="button" onClick={load} className="font-semibold text-[#ea6c33] hover:text-[#f47b45]">Retry</button></div>}

      {loading ? (
        <p role="status" className="text-sm text-muted">Loading contributions…</p>
      ) : records.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {records.map((record) => (
            <article key={record.id} className="glass-card rounded-2xl p-5 sm:p-6 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 space-y-1.5">
                  <a href={record.issueUrl} target="_blank" rel="noreferrer" className="break-all text-lg font-semibold text-primary hover:text-[#ea6c33]">{record.title || record.issueUrl}</a>
                  {record.title && <a href={record.issueUrl} target="_blank" rel="noreferrer" className="block break-all text-sm text-muted hover:text-primary">{record.issueUrl}</a>}
                  <a href={record.repositoryUrl} target="_blank" rel="noreferrer" className="block break-all text-sm text-muted hover:text-primary">{record.repo_name || record.repositoryUrl}</a>
                  {record.prUrl && <a href={record.prUrl} target="_blank" rel="noreferrer" className="inline-block break-all text-sm font-medium text-[#ea6c33] hover:underline">Open pull request</a>}
                </div>
                <div className="flex items-center gap-2"><span className="inline-flex rounded-full border border-[#ea6c33]/30 bg-[#ea6c33]/10 px-3 py-1 text-xs font-semibold text-[#f5a078]">{record.status}</span><button type="button" aria-label="Remove contribution" onClick={() => deleteContribution(record)} className="control-button p-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ea6c33]"><Trash2 className="w-5 h-5" /></button></div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <label className="text-sm font-medium text-secondary">Status
                  <select value={record.status} onChange={(event) => editRecord(record.id, "status", event.target.value)} className="app-input block w-full mt-2 rounded-xl p-3 text-base">
                    {CONTRIBUTION_STATUSES.map((status) => <option key={status}>{status}</option>)}
                  </select>
                </label>
                <label className="text-sm font-medium text-secondary">PR URL
                  <input value={record.prUrl || ""} onChange={(event) => editRecord(record.id, "prUrl", event.target.value)} placeholder="https://github.com/org/repo/pull/123" className="app-input block w-full mt-2 rounded-xl p-3 text-base" />
                </label>
              </div>

              <label className="block text-sm font-medium text-secondary">Personal notes
                <textarea value={record.personalNotes || ""} onChange={(event) => editRecord(record.id, "personalNotes", event.target.value)} rows={3} className="app-input block w-full mt-2 rounded-xl p-3 text-base resize-y" />
              </label>
              <button type="button" disabled={saving} onClick={() => updateContribution(record)} className="rounded-xl border border-glass px-4 py-2.5 text-sm font-semibold text-secondary hover:text-primary disabled:opacity-50">Save changes</button>
            </article>
          ))}
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-8 sm:p-10 text-center space-y-3">
          <h2 className="text-xl font-semibold text-primary">No issues tracked yet</h2>
          <p className="text-base text-muted">Save an issue from Recommendations or add a GitHub issue manually.</p>
          <button type="button" onClick={openAddModal} className="mt-2 rounded-xl bg-[#ea6c33] px-5 py-3 text-sm font-semibold text-white">Manually Add Issue</button>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setModalOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="manual-issue-title" aria-describedby="manual-issue-subtitle" style={{ backgroundColor: "var(--bg-dialog)" }} className="dialog-surface relative z-[101] flex max-h-[calc(100dvh-1.5rem)] min-h-0 w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/[0.12] bg-zinc-900 bg-opacity-100 shadow-2xl sm:max-h-[calc(100dvh-3rem)]">
            <header className="flex shrink-0 items-start justify-between gap-4 border-b border-white/[0.08] px-5 py-5 sm:px-7 sm:py-6">
              <div>
                <h2 id="manual-issue-title" className="text-xl font-bold tracking-tight text-primary sm:text-2xl">Add Issue to Contributions</h2>
                <p id="manual-issue-subtitle" className="mt-1.5 text-sm text-secondary">Track an issue you&apos;re planning to work on.</p>
              </div>
              <button type="button" aria-label="Close dialog" onClick={() => !saving && setModalOpen(false)} disabled={saving} className="control-button rounded-lg p-2 transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ea6c33] disabled:opacity-50">
                <X className="h-5 w-5" />
              </button>
            </header>

            <form onSubmit={addContribution} noValidate className="flex min-h-0 flex-1 flex-col">
              {error && <p role="alert" className="mx-5 mt-4 rounded-xl border border-rose-900/50 bg-rose-950/30 px-4 py-3 text-sm text-rose-200 sm:mx-7">{error}</p>}
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
                <label className="block text-sm font-semibold text-secondary" htmlFor="contribution-title">Issue title <span className="font-normal text-muted">(optional)</span>
                  <input id="contribution-title" value={form.title} onChange={(event) => editForm("title", event.target.value)} placeholder="A concise issue title" className="app-input mt-2 block h-12 w-full rounded-xl px-4 text-base" />
                </label>
                <label className="block text-sm font-semibold text-secondary" htmlFor="contribution-repository">Repository URL <span className="text-[#ea6c33]">*</span>
                  <input id="contribution-repository" autoFocus type="url" inputMode="url" value={form.repositoryUrl} onChange={(event) => editForm("repositoryUrl", event.target.value)} aria-invalid={Boolean(fieldErrors.repositoryUrl)} aria-describedby={fieldErrors.repositoryUrl ? "repository-error" : "repository-hint"} placeholder="https://github.com/owner/repository" className="app-input mt-2 block h-12 w-full rounded-xl px-4 text-base" />
                  {fieldErrors.repositoryUrl ? <span id="repository-error" className="mt-1.5 block text-sm text-rose-300">{fieldErrors.repositoryUrl}</span> : <span id="repository-hint" className="mt-1.5 block text-xs font-normal text-muted">Use the repository&apos;s GitHub URL.</span>}
                </label>

                <label className="block text-sm font-semibold text-secondary" htmlFor="contribution-issue">GitHub Issue URL <span className="text-[#ea6c33]">*</span>
                  <input id="contribution-issue" type="url" inputMode="url" value={form.issueUrl} onChange={(event) => editForm("issueUrl", event.target.value)} aria-invalid={Boolean(fieldErrors.issueUrl)} aria-describedby={fieldErrors.issueUrl ? "issue-error" : "issue-hint"} placeholder="https://github.com/owner/repository/issues/123" className="app-input mt-2 block h-12 w-full rounded-xl px-4 text-base" />
                  {fieldErrors.issueUrl ? <span id="issue-error" className="mt-1.5 block text-sm text-rose-300">{fieldErrors.issueUrl}</span> : <span id="issue-hint" className="mt-1.5 block text-xs font-normal text-muted">The issue must belong to the repository above.</span>}
                </label>

                <label className="block text-sm font-semibold text-secondary" htmlFor="contribution-status">Contribution Status
                  <select id="contribution-status" value={form.status} onChange={(event) => editForm("status", event.target.value)} className="app-input mt-2 block h-12 w-full rounded-xl px-4 text-base">
                    {CONTRIBUTION_STATUSES.map((status) => <option key={status}>{status}</option>)}
                  </select>
                </label>

                <label className="block text-sm font-semibold text-secondary" htmlFor="contribution-pr">Pull Request URL <span className="font-normal text-muted">(optional)</span>
                  <input id="contribution-pr" type="url" inputMode="url" value={form.prUrl} onChange={(event) => editForm("prUrl", event.target.value)} aria-invalid={Boolean(fieldErrors.prUrl)} aria-describedby={fieldErrors.prUrl ? "pr-error" : undefined} placeholder="https://github.com/owner/repository/pull/123" className="app-input mt-2 block h-12 w-full rounded-xl px-4 text-base" />
                  {fieldErrors.prUrl && <span id="pr-error" className="mt-1.5 block text-sm text-rose-300">{fieldErrors.prUrl}</span>}
                </label>

                <label className="block text-sm font-semibold text-secondary" htmlFor="contribution-notes">Personal Notes <span className="font-normal text-muted">(optional)</span>
                  <textarea id="contribution-notes" value={form.personalNotes} onChange={(event) => editForm("personalNotes", event.target.value)} rows={4} placeholder="Add context, next steps, or questions for maintainers…" className="app-input mt-2 block min-h-28 w-full resize-y rounded-xl px-4 py-3 text-base" />
                </label>
              </div>

              <footer className="sticky bottom-0 z-10 flex shrink-0 justify-end gap-3 border-t border-white/[0.08] bg-[var(--bg-dialog)] px-5 py-4 sm:px-7">
                <button type="button" onClick={() => !saving && setModalOpen(false)} disabled={saving} className="rounded-xl border border-glass px-5 py-3 text-sm font-semibold text-secondary transition-colors hover:bg-white/[0.05] disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={saving} className="inline-flex min-w-32 items-center justify-center gap-2 rounded-xl bg-[#ea6c33] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#d45f28] disabled:cursor-not-allowed disabled:opacity-60">
                  {saving && <RefreshCw className="h-4 w-4 animate-spin" />}{saving ? "Adding…" : "Add Issue"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
