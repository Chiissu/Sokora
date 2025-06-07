import { AuditLogEvent, GuildAuditLogsEntry, PartialUser, User } from "discord.js";

export let executor: User | PartialUser | null;
export let date: number;
export async function run(auditEntry: GuildAuditLogsEntry<AuditLogEvent.MessageDelete>) {
  date = Date.now();
  executor = auditEntry.executor;
  if (!executor) return;

  const target = auditEntry.target;
  if (!target) return;
  if (target.bot) return;
  if (target.id == executor.id) return;
}
