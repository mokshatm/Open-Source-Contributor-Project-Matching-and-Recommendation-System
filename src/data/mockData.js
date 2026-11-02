/**
 * Mock Data aligned with research paper:
 * "Open-Source Contributor-Project Matching and Recommendation System"
 */

export const mockDeveloperProfile = {
  id: "dev_01",
  github_username: "alex-contributor",
  name: "Alex Rivera",
  avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  bio: "Full-stack contributor focusing on backend scalability, async Python architectures, and developer tooling.",
  experience_level: "Intermediate",
  preferred_issue_difficulty: ["Easy", "Medium"],
  weekly_commitment_hours: 8,
  
  // 1. Developer Profiling
  skills: [
    { name: "Python", proficiency: 92, source: "GitHub Activity & Repos" },
    { name: "FastAPI", proficiency: 88, source: "GitHub Commits" },
    { name: "AsyncIO", proficiency: 90, source: "Merged Pull Requests" },
    { name: "JavaScript", proficiency: 85, source: "GitHub Activity" },
    { name: "React", proficiency: 82, source: "User Profile" },
    { name: "PostgreSQL", proficiency: 76, source: "GitHub Activity" },
    { name: "Docker", proficiency: 68, source: "Repository Configs" },
  ],
  interest_domains: [
    "Web Frameworks & APIs",
    "Developer Tooling",
    "Distributed Systems",
    "Database Internals",
    "Open Science"
  ],
  github_stats: {
    total_commits: 412,
    prs_merged: 34,
    repositories_contributed: 9,
    starred_repos: 128,
    active_streak_days: 14
  }
};

export const mockRecommendedIssues = [
  {
    id: "iss_101",
    issue_number: 482,
    title: "Implement connection pooling retry logic with exponential backoff",
    repository: "fastapi-contrib/async-pg-pool",
    repository_stars: 3200,
    repository_activity_score: "High (Active in last 24h)",
    language: "Python",
    difficulty: "Medium",
    labels: ["enhancement", "good first issue", "performance"],
    url: "https://github.com/fastapi-contrib/async-pg-pool/issues/482",
    
    // 2. NLP-Based Extraction of Technical Requirements
    nlp_extracted_requirements: {
      primary_technologies: ["Python", "FastAPI", "PostgreSQL", "AsyncIO"],
      concept_keywords: ["connection pooling", "backoff retry", "async/await", "database error handling"],
      estimated_effort_hours: 6
    },

    // 3. Candidate Filtering
    eligibility_check: {
      status: "Eligible",
      language_prerequisite_met: true,
      difficulty_within_bounds: true,
      repository_license_valid: true
    },

    // 4. Content-Based Ranking Scores (0 to 100)
    matching_scores: {
      overall_rank_score: 93,
      skill_compatibility: 91,
      interest_alignment: 95,
      experience_fit: 88,
      difficulty_suitability: 96,
      semantic_similarity: 92,
      repository_activity: 94
    },

    // 5. Explainable Recommendation (XAI)
    explainability: {
      matched_skills: ["Python", "FastAPI", "PostgreSQL", "AsyncIO"],
      skill_gaps: ["Advanced AsyncIO internals", "uvloop extensions"],
      relevant_experience: "3 merged PRs in asynchronous Python web services with connection pooling",
      interest_alignment_notes: "Strong alignment with your preferred domain 'Web Frameworks & APIs'"
    }
  },
  {
    id: "iss_102",
    issue_number: 129,
    title: "Add dark mode toggle and preserve user preference in local storage",
    repository: "dev-toolkit/ui-components",
    repository_stars: 1840,
    repository_activity_score: "Moderate (Active this week)",
    language: "JavaScript",
    difficulty: "Easy",
    labels: ["good first issue", "frontend", "ui"],
    url: "https://github.com/dev-toolkit/ui-components/issues/129",
    
    nlp_extracted_requirements: {
      primary_technologies: ["JavaScript", "React", "CSS", "HTML"],
      concept_keywords: ["dark theme", "local storage state", "CSS variables", "UI toggle"],
      estimated_effort_hours: 3
    },

    eligibility_check: {
      status: "Eligible",
      language_prerequisite_met: true,
      difficulty_within_bounds: true,
      repository_license_valid: true
    },

    matching_scores: {
      overall_rank_score: 88,
      skill_compatibility: 94,
      interest_alignment: 82,
      experience_fit: 90,
      difficulty_suitability: 98,
      semantic_similarity: 86,
      repository_activity: 80
    },

    explainability: {
      matched_skills: ["JavaScript", "React"],
      skill_gaps: ["Basic React state management and browser storage APIs."],
      relevant_experience: "Requires frontend UI changes and local storage handling.",
      interest_alignment_notes: "Matches 'Developer Tooling' and frontend styling preference"
    }
  },
  {
    id: "iss_103",
    issue_number: 78,
    title: "Support JSON Schema validation for request payload filters",
    repository: "rest-station/api-validator",
    repository_stars: 950,
    repository_activity_score: "High (Active in last 48h)",
    language: "Python",
    difficulty: "Medium",
    labels: ["help wanted", "backend", "validation"],
    url: "https://github.com/rest-station/api-validator/issues/78",
    
    nlp_extracted_requirements: {
      primary_technologies: ["Python", "JSON Schema", "FastAPI"],
      concept_keywords: ["schema validation", "error formatting", "serialization"],
      estimated_effort_hours: 8
    },

    eligibility_check: {
      status: "Eligible",
      language_prerequisite_met: true,
      difficulty_within_bounds: true,
      repository_license_valid: true
    },

    matching_scores: {
      overall_rank_score: 85,
      skill_compatibility: 87,
      interest_alignment: 89,
      experience_fit: 82,
      difficulty_suitability: 84,
      semantic_similarity: 88,
      repository_activity: 85
    },

    explainability: {
      matched_skills: ["Python", "FastAPI"],
      skill_gaps: ["Draft-7 JSON Schema specs"],
      relevant_experience: "API schema definitions in previous personal repositories",
      interest_alignment_notes: "Direct match with 'API Development'"
    }
  }
];

export const mockDashboardMetrics = {
  profile_completeness_percent: 88,
  total_candidate_issues_analyzed: 1420,
  eligible_issues_filtered: 184,
  personalized_recommendations_count: 12,
  average_skill_match_rate: "89%",
  top_matching_domain: "Web Frameworks & APIs"
};
