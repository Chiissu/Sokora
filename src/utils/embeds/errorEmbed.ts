import {
  AttachmentBuilder,
  Client,
  EmbedBuilder,
  codeBlock,
  type ButtonInteraction,
  type ChatInputCommandInteraction,
} from "discord.js";
import { genColor } from "../colorGen";
import { errorType } from "../errorType";
import { reply } from "../reply";

/**
 * Sends the embed containing an error.
 * @param interaction The interaction (slash command).
 * @param title The error.
 * @param reason The reason of the error.
 * @param forward Whether or not should the error embed be forwarded to the error log channel.
 * @returns Embed with the error description.
 */
export async function errorEmbed(options: {
  interaction?: ChatInputCommandInteraction | ButtonInteraction;
  client?: Client;
  error?: unknown | Error;
  title?: string;
  reason?: string;
  log?: boolean;
  forward?: boolean;
}) {
  const { interaction, title, reason, log, forward } = options;
  const client = options.client ? options.client : interaction ? interaction.client : null;
  if (!client && !interaction)
    return console.error(
      "You need to provide either a client or an interaction for errorEmbed to work.",
    );

  const error = errorType(options.error);
  const stack = error.stack;
  const content = [];
  if (title) content.push(`**${title}**`);
  if (reason) content.push(reason);
  if (!title && !reason)
    content.push(
      "The bot has experienced an internal error.\nThe team has been informed. If you keep encountering this issue, you can go to our [support server](https://discord.gg/c6C25P4BuY) to report it.",
    );

  const embed = new EmbedBuilder()
    .setAuthor({ name: "Something went wrong!" })
    .setDescription(content.join("\n"))
    .setColor(genColor(0));

  if (options.error) {
    embed.addFields(
      { name: "💬 • Error message", value: codeBlock(error.message) },
      {
        name: "📜 • Error stack",
        value: stack
          ? stack.length <= 4096
            ? codeBlock(stack)
            : "The error stacktrace is an attachment below this embed due to it being too large."
          : "No error stacktrace.",
      },
    );
  }

  const files: AttachmentBuilder[] = [];
  if (stack && stack.length >= 1024)
    files.push(new AttachmentBuilder(Buffer.from(stack, "utf8"), { name: "error.txt" }));

  if (forward) {
    const channel = (client ? client : interaction!.client).channels.cache.get(
      process.env.DEV_ERROR_CHANNEL_ID || "1343140645132308532",
    );
    if (!channel?.isTextBased() || !channel.isSendable()) return;
    await channel.send({ embeds: [embed], files: files });
  }

  if (log) console.error(error);
  if (interaction)
    return await reply(interaction, { embeds: [embed], files: files, flags: "Ephemeral" });
}
