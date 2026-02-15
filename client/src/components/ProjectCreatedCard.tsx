/**
 * Project Created card: display study project ID, title, sponsor, tags, participating orgs.
 * Story 2: Study Project ID and entities.
 */

import { Button } from "@/components/ui/button";
import type { StudyProject } from "../api";

type Props = {
  project: StudyProject;
  onDone: () => void;
  onViewChecklist?: (projectId: string) => void;
};

export function ProjectCreatedCard({ project, onDone, onViewChecklist }: Props) {
  const tags: string[] = [];
  if (project.interventional) tags.push("Interventional");
  if (project.cancerRelated) tags.push("Cancer-related");

  return (
    <div className="project-created-card" role="region" aria-labelledby="project-created-heading">
      <h3 id="project-created-heading" className="project-created-heading">
        Study project created
      </h3>
      <dl className="project-created-list">
        <div className="project-created-row">
          <dt className="project-created-label">Project ID</dt>
          <dd className="project-created-value project-created-id">{project.id}</dd>
        </div>
        <div className="project-created-row">
          <dt className="project-created-label">Title</dt>
          <dd className="project-created-value">{project.title}</dd>
        </div>
        <div className="project-created-row">
          <dt className="project-created-label">Sponsor</dt>
          <dd className="project-created-value">{project.sponsor}</dd>
        </div>
        {tags.length > 0 && (
          <div className="project-created-row">
            <dt className="project-created-label">Tags</dt>
            <dd className="project-created-value">
              <span className="project-created-tags">
                {tags.map((t) => (
                  <span key={t} className="project-created-tag">
                    {t}
                  </span>
                ))}
              </span>
            </dd>
          </div>
        )}
        {project.participatingOrgs.length > 0 && (
          <div className="project-created-row">
            <dt className="project-created-label">Participating organizations</dt>
            <dd className="project-created-value">
              <ul className="project-created-orgs">
                {project.participatingOrgs.map((org, i) => (
                  <li key={i}>{org}</li>
                ))}
              </ul>
            </dd>
          </div>
        )}
      </dl>
      <div className="project-created-actions">
        {onViewChecklist && (
          <Button type="button" variant="primary" onClick={() => onViewChecklist(project.id)}>
            View checklist
          </Button>
        )}
        <Button type="button" variant="default" onClick={onDone}>
          Done
        </Button>
      </div>
    </div>
  );
}
