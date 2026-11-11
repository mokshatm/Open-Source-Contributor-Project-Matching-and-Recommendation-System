export const ACTIVE_PERSONA_KEY = "osMatcherActivePersona";

export const DEVELOPER_PERSONAS = [
  { id: "my-profile", label: "My developer profile", demo: false },
  {
    id: "full-stack-demo",
    label: "Full-Stack Developer · demo",
    demo: true,
    skills: ["JavaScript", "TypeScript", "React", "Node.js", "REST APIs", "Docker"],
    experienceLevel: "Intermediate",
    selectedDomains: ["Web Frameworks & APIs", "Frontend & UI Engineering"],
  },
  {
    id: "systems-cpp-demo",
    label: "Systems / C++ Developer · demo",
    demo: true,
    skills: ["C++", "Rust", "Linux", "Concurrency", "Networking", "Git"],
    experienceLevel: "Advanced",
    selectedDomains: ["Distributed Systems", "Security & Cryptography"],
  },
  {
    id: "newcomer-demo",
    label: "Newcomer Profile · demo",
    demo: true,
    skills: [],
    experienceLevel: "Beginner",
    selectedDomains: ["Web Frameworks & APIs", "Developer Tooling"],
  },
];

export function getActivePersonaId() {
  if (typeof window === "undefined") return "my-profile";
  const value = localStorage.getItem(ACTIVE_PERSONA_KEY);
  return DEVELOPER_PERSONAS.some((persona) => persona.id === value) ? value : "my-profile";
}

export function getDeveloperPersona(personaId) {
  return DEVELOPER_PERSONAS.find((persona) => persona.id === personaId) || DEVELOPER_PERSONAS[0];
}

export function applyDeveloperPersona(profile, personaId = getActivePersonaId()) {
  const persona = getDeveloperPersona(personaId);
  if (!persona.demo) return { ...profile, personaId: persona.id, personaLabel: persona.label, isDemoPersona: false };
  return {
    ...profile,
    skills: [...persona.skills],
    experienceLevel: persona.experienceLevel,
    selectedDomains: [...persona.selectedDomains],
    personaId: persona.id,
    personaLabel: persona.label,
    isDemoPersona: true,
  };
}

export function setActivePersona(personaId) {
  const persona = getDeveloperPersona(personaId);
  localStorage.setItem(ACTIVE_PERSONA_KEY, persona.id);
  window.dispatchEvent(new Event("osmatcher-persona-change"));
}
