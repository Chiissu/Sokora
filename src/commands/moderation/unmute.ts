import { SlashCommandSubcommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { errorCheck, modEmbed } from "embeds/modEmbed";

export const data = new SlashCommandSubcommandBuilder()
  .setName("unmute")
  .setDescription("Unmutes a user.")
  .addUserOption(user =>
    user.setName("user").setDescription("The user that you want to unmute.").setRequired(true),
  )
  .addStringOption(reason =>
    reason.setName("reason").setDescription("The reason for unmuting the user."),
  );

export async function run(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser("user")!;
  const target = interaction.guild?.members.cache.get(user.id);
  const reason = interaction.options.getString("reason");

  if (
    await errorCheck(
      "ModerateMembers",
      { interaction, user, action: "Unmute" },
      { allErrors: false, botError: true, outsideError: true },
      "Moderate Members",
    )
  )
    return;

  if (!target?.communicationDisabledUntil)
    return await errorEmbed({
      interaction,
      title: "You can't unmute this user.",
      reason: "The user was never muted.",
    });

  await Promise.all([
    modEmbed({ interaction, user, action: "Unmuted", dm: true, dbAction: "UNMUTE" }, reason),
    target
      ?.edit({ communicationDisabledUntil: null })
      .catch(async error => await errorEmbed({ interaction, error, forward: true })),
  ]);
}
