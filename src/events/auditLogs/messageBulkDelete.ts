import { AuditLogEvent, GuildAuditLogsEntry } from "discord.js";

export async function run(auditEntry: GuildAuditLogsEntry<AuditLogEvent.MessageBulkDelete>) {
  // console.log("heyy");
  const executor = auditEntry.executor;
  // console.log(executor?.displayName);
  if (!executor) return;

  const target = auditEntry.target.id;
  // console.log(target);
  if (!target) return;
}
