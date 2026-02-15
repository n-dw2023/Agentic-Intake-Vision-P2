/**
 * Checklist engine: given project flags, revealed parents, and persisted items, return visible tree with statuses (Story 3).
 */

import {
  CHECKLIST_RULES,
  type ChecklistRule,
  type ChecklistStatus,
  evaluateRootCondition,
} from "./checklistRules.js";

export type ChecklistItemPayload = {
  itemId: string;
  label: string;
  questionForUser?: string;
  expandedText?: string;
  type: "document" | "intake";
  status: ChecklistStatus;
  parentId: string | null;
  artifactId: string | null;
  intakePayloadId: string | null;
  /** True if this item has sub-items (revealed or not). */
  hasChildren: boolean;
  /** True if user marked this item as not needed (show read-only / struck-through). */
  notNeeded?: boolean;
  children?: ChecklistItemPayload[];
};

type PersistedItem = {
  item_id: string;
  status: string;
  artifact_id: string | null;
  intake_payload_id: string | null;
  not_needed?: boolean;
};

export function evaluateChecklist(
  flags: { interventional: boolean; cancer_related: boolean },
  persistedItems: PersistedItem[]
): ChecklistItemPayload[] {
  const byId = new Map<string, ChecklistRule>();
  for (const r of CHECKLIST_RULES) byId.set(r.id, r);

  const statusByItemId = new Map<string, PersistedItem>();
  for (const p of persistedItems) statusByItemId.set(p.item_id, p);

  const rootRules = CHECKLIST_RULES.filter((r) => r.parentId === null);
  const result: ChecklistItemPayload[] = [];
  const childRulesByParent = new Map<string, ChecklistRule[]>();
  for (const r of CHECKLIST_RULES) {
    if (r.parentId) {
      const list = childRulesByParent.get(r.parentId) ?? [];
      list.push(r);
      childRulesByParent.set(r.parentId, list);
    }
  }

  for (const rule of rootRules) {
    if (!evaluateRootCondition(rule.condition, flags)) continue;

    const persisted = statusByItemId.get(rule.id);
    const status = (persisted?.status as ChecklistStatus) ?? "not_started";
    const childRules = childRulesByParent.get(rule.id) ?? [];
    const children: ChecklistItemPayload[] = [];

    for (const child of childRules) {
      const cPersisted = statusByItemId.get(child.id);
      const childChildRules = childRulesByParent.get(child.id) ?? [];
      children.push({
        itemId: child.id,
        label: child.label,
        questionForUser: child.questionForUser,
        expandedText: child.expandedText,
        type: child.type,
        status: (cPersisted?.status as ChecklistStatus) ?? "not_started",
        parentId: child.parentId,
        artifactId: cPersisted?.artifact_id ?? null,
        intakePayloadId: cPersisted?.intake_payload_id ?? null,
        hasChildren: childChildRules.length > 0,
        notNeeded: cPersisted?.not_needed ?? false,
      });
    }

    result.push({
      itemId: rule.id,
      label: rule.label,
      questionForUser: rule.questionForUser,
      expandedText: rule.expandedText,
      type: rule.type,
      status,
      parentId: null,
      artifactId: persisted?.artifact_id ?? null,
      intakePayloadId: persisted?.intake_payload_id ?? null,
      hasChildren: childRules.length > 0,
      notNeeded: persisted?.not_needed ?? false,
      children: children.length > 0 ? children : undefined,
    });
  }

  return result;
}
