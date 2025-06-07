import { AuditLogEvent, Client, GuildAuditLogsEntry } from "discord.js";
import { errorEmbed } from "embeds/errorEmbed.ts";
import { auditEvents } from "handlers/events.ts";
import { capitalize } from "utils/capitalize.ts";
import { Event } from "utils/types";

export default function createAuditLogHandler(client: Client) {
  return async function (auditEntry: GuildAuditLogsEntry) {
    const auditEventPos = auditEvents.findIndex(
      event =>
        AuditLogEvent[capitalize(event.name) as keyof typeof AuditLogEvent] == auditEntry.action,
    );

    if (auditEventPos == -1) return;
    const auditEventName = auditEvents[auditEventPos].name;
    try {
      if (typeof auditEvents[auditEventPos].run != "function")
        return await errorEmbed({
          client,
          title: `Audit log event ${auditEventName} does not have a valid run function.`,
          log: true,
          forward: true,
        });

      await auditEvents[auditEventPos].run(auditEntry, client);
    } catch (error) {
      return await errorEmbed({
        client,
        error,
        title: `Error running audit log event ${auditEventName}.`,
        log: true,
        forward: true,
      });
    }
  } as Event<"guildAuditLogEntryCreate">;
}
