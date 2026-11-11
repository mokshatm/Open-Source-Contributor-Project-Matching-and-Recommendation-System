"use client";

import { useState } from "react";
import { BookmarkPlus, Check, LoaderCircle } from "lucide-react";
import { createContribution } from "@/services/contributionApiClient";

export default function SaveIssueButton({ issue }) {
  const [state, setState] = useState("idle");
  const [message, setMessage] = useState("");

  async function save() {
    setState("saving");
    setMessage("");
    try {
      const repository = issue.repoUrl || `https://github.com/${issue.repoFullName || ""}`;
      await createContribution({ repository, issue_url: issue.url, repo_name: issue.repoFullName || "", title: issue.title || "", status: "Saved", notes: "" });
      setState("saved");
      setMessage("Issue saved.");
      window.dispatchEvent(new Event("osmatcher-contribution-saved"));
    } catch (error) {
      setState("idle");
      setMessage(error.message || "Unable to save issue.");
    }
  }

  return <span className="inline-flex flex-col items-start">
    <button type="button" onClick={save} disabled={state === "saving" || state === "saved"} aria-label={state === "saved" ? "Issue saved" : "Save issue"}
      className="inline-flex items-center gap-1.5 rounded-lg border border-glass px-3 py-2 text-xs font-medium text-secondary hover:text-primary disabled:opacity-70">
      {state === "saving" ? <LoaderCircle className="w-4 h-4 animate-spin" /> : state === "saved" ? <Check className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
      {state === "saving" ? "Saving…" : state === "saved" ? "Saved" : "Save issue"}
    </button>
    {message && <span role={state === "idle" ? "alert" : "status"} className="mt-1 text-[11px] text-muted">{message}</span>}
  </span>;
}
