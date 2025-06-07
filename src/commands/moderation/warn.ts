import { SlashCommandSubcommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { errorCheck, modEmbed } from "embeds/modEmbed";

export const data = new SlashCommandSubcommandBuilder()
  .setName("warn")
  .setDescription("Warns a user.")
  .addUserOption(user =>
    user.setName("user").setDescription("The user that you want to warn.").setRequired(true),
  )
  .addStringOption(string => string.setName("reason").setDescription("The reason for the warn."))
  .addBooleanOption(bool =>
    bool
      .setName("show_moderator")
      .setDescription(
        "Inform the warned user of the moderator that took the action. Defaults to false.",
      ),
  );

export async function run(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser("user")!;
  const reason = interaction.options.getString("reason");
  const showModerator = interaction.options.getBoolean("show_moderator") ?? false;
  if (
    await errorCheck(
      "ModerateMembers",
      { interaction, user, action: "Warn" },
      { allErrors: true, botError: false, ownerError: true, outsideError: true },
      "Moderate Members",
    )
  )
    return;

  await modEmbed(
    { interaction, user, action: "Warned", dm: true, dbAction: "WARN" },
    reason,
    showModerator,
  );
}
