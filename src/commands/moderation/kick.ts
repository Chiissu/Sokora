import { SlashCommandSubcommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { errorCheck, modEmbed } from "embeds/modEmbed";

export const data = new SlashCommandSubcommandBuilder()
  .setName("kick")
  .setDescription("Kicks a user.")
  .addUserOption(user =>
    user.setName("user").setDescription("The user that you want to kick.").setRequired(true),
  )
  .addStringOption(string => string.setName("reason").setDescription("The reason for the kick."));

export async function run(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser("user")!;
  if (
    await errorCheck(
      "KickMembers",
      { interaction, user, action: "Kick" },
      { allErrors: true, botError: true, ownerError: true, outsideError: true },
      "Kick Members",
    )
  )
    return;

  if (!interaction.guild?.members.cache.get(user.id))
    return await errorEmbed({
      interaction,
      title: `You can't kick ${user.username}.`,
      reason: "This user is not in the server.",
    });

  const reason = interaction.options.getString("reason");
  await Promise.all([
    modEmbed({ interaction, user, action: "Kicked", dm: true, dbAction: "KICK" }, reason),
    interaction.guild?.members.cache
      .get(user.id)
      ?.kick(reason ?? undefined)
      .catch(
        async error =>
          await errorEmbed({
            interaction,
            error,
            forward: true,
          }),
      ),
  ]);
}
