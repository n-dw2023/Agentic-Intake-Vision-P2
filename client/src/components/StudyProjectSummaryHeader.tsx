/**
 * Study project summary header: same data and tags as the intake confirmation,
 * shown above the checklist for context.
 */

import type { StudyProject } from "../api";

type Props = {
  project: StudyProject & { status?: string; updatedAt?: string };
};

export function StudyProjectSummaryHeader({ project }: Props) {
  const { id, title, sponsor, interventional, cancerRelated, participatingOrgs } = project;

  return (
    <header className="study-project-summary-header" role="region" aria-labelledby="study-project-summary-heading">
      <h3 id="study-project-summary-heading" className="study-project-summary-heading">
        Study summary
      </h3>
      <dl className="study-project-summary-list">
        <div className="study-project-summary-row">
          <dt className="study-project-summary-label">Study ID</dt>
          <dd className="study-project-summary-value">
            <span className="study-project-summary-id">{id}</span>
          </dd>
        </div>
        <div className="study-project-summary-row">
          <dt className="study-project-summary-label">Study Title</dt>
          <dd className="study-project-summary-value">{title || "—"}</dd>
        </div>
        <div className="study-project-summary-row">
          <dt className="study-project-summary-label">Sponsor</dt>
          <dd className="study-project-summary-value">{sponsor || "—"}</dd>
        </div>
      </dl>
      <div className="study-project-summary-tags">
        <span className={`study-project-summary-tag study-project-summary-tag--meta`}>
          Interventional: {interventional ? "Yes" : "No"}
        </span>
        <span className={`study-project-summary-tag study-project-summary-tag--meta`}>
          Cancer-related: {cancerRelated ? "Yes" : "No"}
        </span>
        {Array.isArray(participatingOrgs) &&
          participatingOrgs.length > 0 &&
          participatingOrgs.map((org, i) => (
            <span key={i} className="study-project-summary-tag study-project-summary-tag--org">
              {org}
            </span>
          ))}
      </div>
    </header>
  );
}
