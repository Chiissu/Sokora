import { SlashCommandSubcommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { errorCheck, modEmbed } from "embeds/modEmbed";
import ms from "ms";

export const data = new SlashCommandSubcommandBuilder()
  .setName("mute")
  .setDescription("Mutes a user.")
  .addUserOption(user =>
    user.setName("user").setDescription("The user that you want to mute.").setRequired(true),
  )
  .addStringOption(string =>
    string
      .setName("duration")
      .setDescription("The duration of the mute (e.g 30m, 1d, 2h).")
      .setRequired(true),
  )
  .addStringOption(string => string.setName("reason").setDescription("The reason for the mute."));

export async function run(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser("user")!;
  const duration = interaction.options.getString("duration")!;
  const reason = interaction.options.getString("reason");
  if (
    await errorCheck(
      "ModerateMembers",
      { interaction, user, action: "Mute" },
      { allErrors: true, botError: true, ownerError: true, outsideError: true },
      "Moderate Members",
    )
  )
    return;

  if (!ms(duration) || ms(duration) > ms("28d") || ms(duration) <= 0)
    return await errorEmbed({
      interaction,
      title: `You can't mute ${user.username}.`,
      reason: "The duration is invalid or is above the 28 day limit.",
    });

  const time = new Date(
    Date.parse(new Date().toISOString()) + Date.parse(new Date(ms(duration)).toISOString()),
  ).toISOString();

  await Promise.all([
    modEmbed(
      { interaction, user, action: "Muted", duration, dm: true, dbAction: "MUTE" },
      reason,
      true,
    ),
    interaction.guild?.members.cache
      .get(user.id)
      ?.edit({ communicationDisabledUntil: time, reason: reason ?? undefined })
      .catch(async error => await errorEmbed({ interaction, error, forward: true })),
  ]);
}
