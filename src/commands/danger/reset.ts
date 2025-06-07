import { setSetting, settingsDefinition } from "database/settings.ts";
import {
  EmbedBuilder,
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { errorEmbed } from "embeds/errorEmbed.ts";
import { genColor } from "utils/colorGen.ts";

export const data = new SlashCommandSubcommandBuilder()
  .setName("reset")
  .setDescription("Reset a setting to its default value.")
  .addStringOption(o =>
    o
      .setName("category")
      .setDescription("Category of the setting ('moderation', 'easter', etc...)")
      .setRequired(true)
      .setChoices(
        Object.keys(settingsDefinition).map(o => {
          return { name: o, value: o };
        }),
      ),
  )
  // TODO - autocomplete
  .addStringOption(o =>
    o
      .setName("setting")
      .setDescription("Setting itself to change ('join_text', 'enabled', etc...)")
      .setRequired(false),
  );

export async function run(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild!;
  if (!guild.members.cache?.get(interaction.user.id)?.permissions.has("Administrator"))
    return await errorEmbed({
      interaction,
      title: "You can't execute this command.",
      reason: "You need the **Administrator** permission.",
    });

  const category = interaction.options.getString("category");
  const setting = interaction.options.getString("setting");

  if (!category)
    return await errorEmbed({
      interaction,
      title: "Cannot reset settings.",
      reason: "You didn't specify a category!",
    });

  if (!setting) {
    for (const setting of Object.entries(settingsDefinition[category].settings))
      await setSetting(guild.id, category, setting[0], setting[1].val ?? null);

    const embed = new EmbedBuilder()
      .setAuthor({ name: `Reset all ${category} settings` })
      .setDescription(
        "All settings from the category have been reset to their default values successfully.",
      )
      .setColor(genColor(0));

    return await interaction.reply({ embeds: [embed] });
  }

  if (!settingsDefinition[category].settings[setting])
    return await errorEmbed({
      interaction,
      title: "Cannot reset settings.",
      reason: `There's no **${setting}** setting inside of **${category}**.`,
    });

  await setSetting(guild.id, category, setting, null);
  const embed = new EmbedBuilder()
    .setAuthor({ name: `Reset ${category}.${setting}` })
    .setDescription(`Setting ${setting} was reset to its default value successfully.`)
    .setColor(genColor(0));

  await interaction.reply({ embeds: [embed] });
}
