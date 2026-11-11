"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, MessageCircle, Plus, Trash2 } from "lucide-react";
import {
  createCommunityInteraction,
  createProjectMilestone,
  deleteCommunityItem,
  getCommunityMilestoneData,
  linkContributionToMilestone,
  unlinkContributionFromMilestone,
  updateCommunityInteraction,
  updateProjectMilestone,
} from "@/services/communityMilestoneService";

const INTERACTION_TYPES = ["Discord / Matrix", "Mailing list", "Maintainer discussion", "Issue discussion", "Other"];
const EMPTY_INTERACTION = { organization: "", interactionType: INTERACTION_TYPES[0], link: "", date: "", notes: "" };
const EMPTY_MILESTONE = { projectPhase: "", title: "", startDate: "", endDate: "", notes: "" };

export default function CommunityMilestones() {
  const [username, setUsername] = useState("");
  const [tab, setTab] = useState("community");
  const [interactions, setInteractions] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [linkSelection, setLinkSelection] = useState({});
  const [interactionForm, setInteractionForm] = useState(EMPTY_INTERACTION);
  const [milestoneForm, setMilestoneForm] = useState(EMPTY_MILESTONE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    let profile = null;
    try { profile = JSON.parse(localStorage.getItem("developerEligibilityProfile") || "null"); } catch { profile = null; }
    const owner = profile?.username || "";
    setUsername(owner);
    if (!owner) {
      setInteractions([]);
      setMilestones([]);
      setContributions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await getCommunityMilestoneData(owner);
      setInteractions(data.interactions);
      setMilestones(data.milestones);
      setContributions(data.contributions);
    } catch (err) {
      setError(err.message || "Unable to load community and milestone data.");
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

  async function addInteraction(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const interaction = await createCommunityInteraction(username, interactionForm);
      setInteractions((items) => [interaction, ...items]);
      setInteractionForm(EMPTY_INTERACTION);
    } catch (err) {
      setError(err.message || "Unable to save this interaction to Supabase.");
    } finally {
      setSaving(false);
    }
  }

  async function addMilestone(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const milestone = await createProjectMilestone(username, milestoneForm);
      setMilestones((items) => [...items, milestone]);
      setMilestoneForm(EMPTY_MILESTONE);
    } catch (err) {
      setError(err.message || "Unable to save this milestone to Supabase.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(kind, id, issueUrl) {
    setError("");
    try {
      if (kind === "milestone-link") {
        await unlinkContributionFromMilestone(username, id, issueUrl);
        setMilestones((items) => items.map((item) => item.id === String(id)
          ? { ...item, linkedContributions: item.linkedContributions.filter((linked) => linked.issueUrl !== issueUrl) }
          : item));
      } else {
        await deleteCommunityItem(username, kind, id);
        if (kind === "interaction") setInteractions((items) => items.filter((item) => item.id !== String(id)));
        if (kind === "milestone") setMilestones((items) => items.filter((item) => item.id !== String(id)));
      }
    } catch (err) {
      setError(err.message || "Unable to remove this item from Supabase.");
    }
  }

  async function saveInteractionNotes(interaction) {
    try {
      const updated = await updateCommunityInteraction(username, interaction);
      setInteractions((items) => items.map((item) => item.id === String(interaction.id) ? updated : item));
    } catch (err) {
      setError(err.message || "Unable to save interaction notes.");
    }
  }

  async function saveMilestone(milestone) {
    setSaving(true);
    setError("");
    try {
      const updated = await updateProjectMilestone(username, milestone);
      setMilestones((items) => items.map((item) => item.id === String(milestone.id) ? updated : item));
    } catch (err) {
      setError(err.message || "Unable to update this milestone.");
    } finally {
      setSaving(false);
    }
  }

  async function linkIssue(milestone) {
    const issueUrl = linkSelection[milestone.id];
    if (!issueUrl) return;
    setSaving(true);
    setError("");
    try {
      await linkContributionToMilestone(username, milestone.id, issueUrl);
      const contribution = contributions.find((item) => item.issueUrl === issueUrl);
      if (contribution) {
        setMilestones((items) => items.map((item) => item.id === milestone.id
          ? { ...item, linkedContributions: [...item.linkedContributions, contribution] }
          : item));
      }
      setLinkSelection((previous) => ({ ...previous, [milestone.id]: "" }));
    } catch (err) {
      setError(err.message || "Unable to link this contribution.");
    } finally {
      setSaving(false);
    }
  }

  if (!username) return <div className="max-w-5xl mx-auto space-y-6">
    <header className="pb-6 border-b border-glass"><h1 className="text-3xl font-bold text-primary">Community &amp; Milestones</h1></header>
    <div className="glass-panel rounded-2xl p-6"><p className="text-base font-semibold text-primary">Set up your GitHub username to save workflow notes.</p><Link href="/profile" className="inline-flex items-center gap-2 mt-4 text-base font-semibold text-[#ea6c33]">Set up profile <ArrowRight className="w-4 h-4" /></Link></div>
  </div>;

  const milestoneEligible = contributions.filter((item) => ["saved", "merged"].includes(String(item.status).toLowerCase()));
  return <div className="max-w-5xl mx-auto space-y-7">
    <header className="pb-6 border-b border-glass"><h1 className="text-3xl font-bold tracking-tight text-[#ededef]">Community &amp; Milestones</h1></header>
    <div className="flex gap-3 border-b border-glass">
      <button type="button" onClick={() => setTab("community")} aria-pressed={tab === "community"} className={`inline-flex items-center gap-2 px-4 py-3 text-base font-semibold border-b-2 ${tab === "community" ? "border-[#ea6c33] text-primary" : "border-transparent text-muted"}`}><MessageCircle className="w-5 h-5" />Community log</button>
      <button type="button" onClick={() => setTab("milestones")} aria-pressed={tab === "milestones"} className={`inline-flex items-center gap-2 px-4 py-3 text-base font-semibold border-b-2 ${tab === "milestones" ? "border-[#ea6c33] text-primary" : "border-transparent text-muted"}`}><CalendarDays className="w-5 h-5" />Milestone timeline</button>
    </div>
    {error && <p role="alert" className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-sm text-amber-300">{error}</p>}
    {loading ? <p role="status" className="text-base text-muted">Loading saved workflow data…</p> : tab === "community" ? <section className="space-y-5">
      <form onSubmit={addInteraction} className="glass-panel rounded-2xl p-6 space-y-4">
        <h2 className="text-xl font-bold text-primary">Log a community interaction</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="text-sm font-medium text-secondary">Organization (optional)<input value={interactionForm.organization} onChange={(event) => setInteractionForm({ ...interactionForm, organization: event.target.value })} placeholder="Organization name" className="app-input block w-full mt-1.5 rounded-lg p-3 text-base" /></label>
          <label className="text-sm font-medium text-secondary">Interaction type<select value={interactionForm.interactionType} onChange={(event) => setInteractionForm({ ...interactionForm, interactionType: event.target.value })} className="app-input block w-full mt-1.5 rounded-lg p-3 text-base">{INTERACTION_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
          <label className="text-sm font-medium text-secondary">Link<input required type="url" value={interactionForm.link} onChange={(event) => setInteractionForm({ ...interactionForm, link: event.target.value })} placeholder="https://example.com/thread" className="app-input block w-full mt-1.5 rounded-lg p-3 text-base" /></label>
          <label className="text-sm font-medium text-secondary">Date<input required type="date" value={interactionForm.date} onChange={(event) => setInteractionForm({ ...interactionForm, date: event.target.value })} className="app-input block w-full mt-1.5 rounded-lg p-3 text-base" /></label>
        </div>
        <label className="block text-sm font-medium text-secondary">Notes<textarea value={interactionForm.notes} onChange={(event) => setInteractionForm({ ...interactionForm, notes: event.target.value })} rows={3} className="app-input block w-full mt-1.5 rounded-lg p-3 text-base resize-y" /></label>
        <button type="submit" disabled={saving} className="rounded-xl bg-[#ea6c33] px-5 py-3 text-base font-bold text-white disabled:opacity-50"><Plus className="inline w-5 h-5 mr-1" />{saving ? "Saving…" : "Add interaction"}</button>
      </form>
      {interactions.length ? <div className="space-y-4">{interactions.map((interaction) => <article key={interaction.id} className="glass-card rounded-2xl p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-lg font-bold text-primary">{interaction.interactionType}{interaction.organization ? ` · ${interaction.organization}` : ""}</p><p className="text-sm text-muted mt-1">{interaction.date}</p></div><div className="flex items-center gap-4"><a href={interaction.link} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[#ea6c33]">Open link <ArrowRight className="inline w-4 h-4" /></a><button type="button" aria-label="Delete interaction" onClick={() => remove("interaction", interaction.id)} className="text-muted hover:text-primary"><Trash2 className="w-5 h-5" /></button></div></div>
        <textarea aria-label="Interaction notes" value={interaction.notes} onChange={(event) => setInteractions((items) => items.map((item) => item.id === interaction.id ? { ...item, notes: event.target.value } : item))} rows={2} className="app-input block w-full rounded-lg p-3 text-base resize-y" />
        <button type="button" onClick={() => saveInteractionNotes(interaction)} className="text-base font-semibold text-secondary hover:text-primary">Save notes</button>
      </article>)}</div> : <p className="glass-panel rounded-2xl p-6 text-base text-muted">No community interactions logged yet.</p>}
    </section> : <section className="space-y-5">
      <form onSubmit={addMilestone} className="glass-panel rounded-2xl p-6 space-y-4">
        <h2 className="text-xl font-bold text-primary">Add a project phase or milestone</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="text-sm font-medium text-secondary">Project phase<input required value={milestoneForm.projectPhase} onChange={(event) => setMilestoneForm({ ...milestoneForm, projectPhase: event.target.value })} placeholder="Planning, implementation, review" className="app-input block w-full mt-1.5 rounded-lg p-3 text-base" /></label>
          <label className="text-sm font-medium text-secondary">Milestone<input required value={milestoneForm.title} onChange={(event) => setMilestoneForm({ ...milestoneForm, title: event.target.value })} placeholder="Milestone title" className="app-input block w-full mt-1.5 rounded-lg p-3 text-base" /></label>
          <label className="text-sm font-medium text-secondary">Start date<input type="date" value={milestoneForm.startDate} onChange={(event) => setMilestoneForm({ ...milestoneForm, startDate: event.target.value })} className="app-input block w-full mt-1.5 rounded-lg p-3 text-base" /></label>
          <label className="text-sm font-medium text-secondary">End date<input type="date" value={milestoneForm.endDate} onChange={(event) => setMilestoneForm({ ...milestoneForm, endDate: event.target.value })} className="app-input block w-full mt-1.5 rounded-lg p-3 text-base" /></label>
        </div>
        <label className="block text-sm font-medium text-secondary">Notes<textarea value={milestoneForm.notes} onChange={(event) => setMilestoneForm({ ...milestoneForm, notes: event.target.value })} rows={3} className="app-input block w-full mt-1.5 rounded-lg p-3 text-base resize-y" /></label>
        <button type="submit" disabled={saving} className="rounded-xl bg-[#ea6c33] px-5 py-3 text-base font-bold text-white disabled:opacity-50"><Plus className="inline w-5 h-5 mr-1" />{saving ? "Saving…" : "Add milestone"}</button>
      </form>
      {!milestoneEligible.length && <p className="text-sm text-muted">Save or merge an issue to link it to a milestone.</p>}
      {milestones.length ? <div className="space-y-4">{milestones.map((milestone) => <MilestoneCard key={milestone.id} milestone={milestone} availableIssues={milestoneEligible} selectedIssue={linkSelection[milestone.id] || ""} onSelect={(value) => setLinkSelection((previous) => ({ ...previous, [milestone.id]: value }))} onLink={() => linkIssue(milestone)} onRemoveIssue={(issueUrl) => remove("milestone-link", milestone.id, issueUrl)} onDelete={() => remove("milestone", milestone.id)} onSave={saveMilestone} saving={saving} />)}</div> : <p className="glass-panel rounded-2xl p-6 text-base text-muted">No project milestones have been created yet.</p>}
    </section>}
  </div>;
}

function MilestoneCard({ milestone, availableIssues, selectedIssue, onSelect, onLink, onRemoveIssue, onDelete, onSave, saving }) {
  const [draft, setDraft] = useState(milestone);

  return <article className="glass-card rounded-2xl p-5 space-y-4 border-l-2 border-l-[#ea6c33]">
    <div className="flex justify-between gap-3"><div className="min-w-0"><p className="text-sm font-bold uppercase tracking-wide text-[#ea6c33]">{milestone.projectPhase}</p><h3 className="text-lg font-bold text-primary mt-1">{milestone.title}</h3><p className="text-sm text-muted mt-1">{milestone.startDate || "Start date unset"}{milestone.endDate ? ` — ${milestone.endDate}` : ""}</p></div><button type="button" aria-label="Delete milestone" onClick={onDelete} className="control-button p-2.5 rounded-lg"><Trash2 className="w-5 h-5" /></button></div>
    <details><summary className="cursor-pointer text-base font-semibold text-secondary">Edit phase, dates, and notes</summary>
      <div className="grid sm:grid-cols-2 gap-3 pt-4"><input aria-label="Project phase" value={draft.projectPhase} onChange={(event) => setDraft({ ...draft, projectPhase: event.target.value })} className="app-input rounded-lg p-3 text-base" /><input aria-label="Milestone title" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className="app-input rounded-lg p-3 text-base" /><input aria-label="Start date" type="date" value={draft.startDate || ""} onChange={(event) => setDraft({ ...draft, startDate: event.target.value })} className="app-input rounded-lg p-3 text-base" /><input aria-label="End date" type="date" value={draft.endDate || ""} onChange={(event) => setDraft({ ...draft, endDate: event.target.value })} className="app-input rounded-lg p-3 text-base" /></div>
      <textarea aria-label="Milestone notes" value={draft.notes || ""} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} rows={3} className="app-input block w-full rounded-lg p-3 text-base mt-3" />
      <button type="button" onClick={() => onSave(draft)} disabled={saving} className="mt-3 rounded-lg border border-glass px-4 py-2.5 text-sm font-semibold text-secondary disabled:opacity-50">Save milestone</button>
    </details>
    <div className="border-t border-glass pt-4"><p className="text-sm font-semibold text-muted mb-3">Linked saved or merged issues</p>
      {milestone.linkedContributions.length > 0 ? <ul className="space-y-3 mb-4">{milestone.linkedContributions.map((item) => <li key={item.issueUrl} className="flex items-start justify-between gap-3 text-sm"><a href={item.issueUrl} target="_blank" rel="noreferrer" className="text-[#ea6c33] underline break-all">{item.issueUrl}</a><button type="button" aria-label="Remove issue from milestone" onClick={() => onRemoveIssue(item.issueUrl)} className="text-muted hover:text-primary"><Trash2 className="w-4 h-4" /></button></li>)}</ul> : <p className="text-sm text-muted mb-3">No issues linked yet.</p>}
      <div className="flex flex-col sm:flex-row gap-3"><select value={selectedIssue} onChange={(event) => onSelect(event.target.value)} className="app-input min-w-0 flex-1 rounded-lg p-3 text-sm"><option value="">Choose a saved or merged issue</option>{availableIssues.map((item) => <option key={item.id} value={item.issueUrl}>{item.status} · {item.issueUrl}</option>)}</select><button type="button" disabled={!selectedIssue || saving} onClick={onLink} className="rounded-lg bg-[#ea6c33] px-4 py-3 text-sm font-bold text-white disabled:opacity-50">Link issue</button></div>
    </div>
  </article>;
}
