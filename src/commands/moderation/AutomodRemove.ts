import {
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction,
  EmbedBuilder
} from "discord.js";
import { errorEmbed } from "../../utils/embeds/errorEmbed";
import { genColor } from "../../utils/colorGen";
import { logChannel } from "../../utils/logChannel";
import { getAutomodRules, removeAutomodRule } from "../../utils/database/automod";

export default class AutomodRemove {
  data: SlashCommandSubcommandBuilder;
  constructor() {
    this.data = new SlashCommandSubcommandBuilder()
      .setName("automodremove")
      .setDescription("Remove an automod rule")
      .addStringOption(option =>
        option
          .setName("pattern")
          .setDescription("The regex pattern to remove")
          .setRequired(true)
      );
  }

  async run(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild!;
    if (!guild.members.cache.get(interaction.user.id)?.permissions.has("ManageGuild"))
      return await errorEmbed(
        interaction,
        "You can't execute this command.",
        "You need the **Manage Server** permission."
      );

    const pattern = interaction.options.getString("pattern", true);
    const rules = getAutomodRules(guild.id);

    if (!rules.some(rule => rule.pattern === pattern)) {
      return await errorEmbed(
        interaction,
        "Rule not found",
        "No automod rule found with this pattern."
      );
    }

    removeAutomodRule(guild.id, pattern);

    const embed = new EmbedBuilder()
      .setAuthor({ name: "Automod Rule Removed" })
      .setDescription(`**Pattern**: \`${pattern}\``)
      .setColor(genColor(100));

    await logChannel(guild, embed);
    await interaction.reply({ embeds: [embed] });
  }
}