import { SlashCommandSubcommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { errorCheck, modEmbed } from "embeds/modEmbed";

export const data = new SlashCommandSubcommandBuilder()
  .setName("unban")
  .setDescription("Unbans a user.")
  .addStringOption(string =>
    string
      .setName("id")
      .setDescription("The ID of the user that you want to unban.")
      .setRequired(true),
  )
  .addStringOption(string => string.setName("reason").setDescription("The reason for the unban."));

export async function run(interaction: ChatInputCommandInteraction) {
  const id = interaction.options.getString("id")!;
  const reason = interaction.options.getString("reason")!;
  const guild = interaction.guild;
  if (!guild)
    return await errorEmbed({
      interaction,
      title: "Error unbanning user.",
      reason: "Couldn't find the guild.",
    });

  const member = (await guild.bans.fetch()).get(id);
  if (!member)
    return await errorEmbed({
      interaction,
      title: "Error unbanning user.",
      reason: "Couldn't find the user in the ban list.",
    });

  const target = member.user;
  if (
    await errorCheck(
      "BanMembers",
      { interaction, user: target, action: "Unban" },
      { allErrors: false, botError: true, ownerError: true, unbanError: true },
      "Ban Members",
    )
  )
    return;

  await Promise.all([
    modEmbed({ interaction, user: target, action: "Unbanned", dbAction: "UNBAN" }, reason),
    guild.members
      .unban(id, reason ?? undefined)
      .catch(async error => await errorEmbed({ interaction, error, forward: true })),
  ]);
}
