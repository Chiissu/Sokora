import { Guild, User } from "discord.js";
import { mention } from "./mention";
import { randomize } from "./randomize";
import { Replacements } from "./types";

let emojis = ["💖", "💝", "💓", "💗", "💘", "💟", "💕", "💞"];
if (Math.round(Math.random() * 100) <= 5) emojis = ["⌨️", "💻", "🖥️"];

export const replacements = [
  { text: "(madeWith)", replacement: `Made with ${randomize(emojis)} by the Sokora team` },
];

export function replace(
  text: string,
  replaceText?: { text: string; replacement: string | number }[],
) {
  for (const mention of replaceText ? replaceText || replacements : replacements)
    if (text?.includes(mention.text))
      text = text.replaceAll(mention.text, mention.replacement.toString());

  return text;
}

/**
 * Takes a string with dynamic `(variables)` and replaces them with the string they represent.
 *
 * @async
 * @param {string} text String to have its variables replaced.
 * @param {Guild} guild Guild.
 * @param {User} user User.
 * @returns {Promise<string>} String with values replaced. The function is async because it depends on `fetchOwner()`.
 */
export async function replaceVariables(text: string, guild: Guild, user: User): Promise<string> {
  const replacementVariables: Replacements = [
    { text: "(name)", replacement: user.displayName },
    { text: "(username)", replacement: user.username },
    { text: "(count)", replacement: guild.memberCount },
    { text: "(servername)", replacement: guild.name },
    { text: "(serverowner)", replacement: (await guild.fetchOwner()).displayName },
    { text: "(currentdate)", replacement: await mention(Date.now(), "DEFAULT_TIMESTAMP") },
    { text: "(currentdate, simple)", replacement: await mention(Date.now(), "SIMPLE_TIMESTAMP") },
    {
      text: "(currentdate, detailed)",
      replacement: await mention(Date.now(), "DETAILED_TIMESTAMP"),
    },
  ];

  return replace(text, replacementVariables);
}
