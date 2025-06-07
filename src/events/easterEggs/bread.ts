import type { Message, TextChannel } from "discord.js";
import { multiReact } from "utils/multiReact";

export async function run(message: Message) {
  if (!message.content.trim().toLowerCase().includes("bread")) return;

  if (Math.round(Math.random() * 100) <= 0.25)
    await (message.channel as TextChannel).send("https://tenor.com/bOMAb.gif");
  else await multiReact(message, "🍞🇧🇷🇪🇦🇩👍");
}
