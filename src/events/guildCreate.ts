import { check } from "database/blocklist";
import { EmbedBuilder } from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { commands } from "handlers/commands";
import { genColor } from "utils/colorGen";
import { leavePlease } from "utils/leavePlease";
import { pfpCheck } from "utils/pfpCheck";
import { replace } from "utils/replace";
import type { Event } from "utils/types";

export default (async function run(guild) {
  const owner = await guild.fetchOwner();
  if (!check(owner.id)) return await leavePlease(guild, owner, "No.");

  const client = guild.client;
  const avatar = client.user.displayAvatarURL();
  const embed = new EmbedBuilder()
    .setAuthor({
      name: `${pfpCheck(avatar)}Welcome to ${client.user.username}!`,
      iconURL: avatar,
    })
    .setDescription(
      [
        "Sokora is a multipurpose Discord bot that lets you manage your servers easily.",
        "To configure the bot, use the **/settings** command.\n",
        "Sokora is in an early stage of development. If you find bugs, please go to our [official server](https://discord.gg/c6C25P4BuY).",
      ].join("\n"),
    )
    .setFooter({ text: replace("(madeWith)") })
    .setColor(genColor(200));

  await guild.commands.set(commands.map(command => command.data));
  try {
    const welcomeChannel = guild.systemChannel;
    if (!welcomeChannel) return;
    if (!welcomeChannel.permissionsFor(guild.client.user)?.has("SendMessages")) return;
    await welcomeChannel.send({ embeds: [embed] });
  } catch (error) {
    return await errorEmbed({ client, error, log: true, forward: true });
  }
} as Event<"guildCreate">);
