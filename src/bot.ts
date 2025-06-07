import { Chart, registerables } from "chart.js";
import { ActivityType, Client, Partials } from "discord.js";
import { registerGuildCommands } from "handlers/commands";
import { loadAuditEvents, loadEasterEggs, loadEvents } from "handlers/events";
import { leavePlease } from "utils/leavePlease";
import { rescheduleUnbans } from "utils/unbanScheduler";

export const client = new Client({
  presence: {
    activities: [{ name: "your feedback!", type: ActivityType.Listening }],
  },
  partials: [Partials.Message, Partials.Reaction, Partials.User],
  intents: [
    "Guilds",
    "GuildMembers",
    "GuildMessages",
    "GuildModeration",
    "GuildEmojisAndStickers",
    "GuildBans",
    "GuildMessageReactions",
    "MessageContent",
  ],
});

client.once("ready", async () => {
  const guilds = client.guilds.cache;
  for (const id of guilds.keys())
    await leavePlease(guilds.get(id)!, await guilds.get(id)!.fetchOwner()!, "Not like that.");

  await Promise.all([
    loadEvents(client),
    loadEasterEggs(),
    loadAuditEvents(client),
    registerGuildCommands(client),
    rescheduleUnbans(client),
  ]).then(() =>
    console.log(Math.random() < 0.001 ? "こんにちは! (konichi whats upppppppp)" : "ちーっす！"),
  );

  // if you want to register/remove guild/global commands, replace registerGuildCommands() with:
  // removeGuildCommands(client)
  // removeGlobalCommands(client)
  // registerGlobalCommands(client)
  Chart.register(...registerables);
});

await client.login(process.env.TOKEN);
