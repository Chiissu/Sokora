import {
  EmbedBuilder,
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { genColor } from "utils/colorGen.ts";
import { pfpCheck } from "utils/pfpCheck.ts";

export const data = new SlashCommandSubcommandBuilder()
  .setName("coin")
  .setDescription("Flip a coin.");

export async function run(interaction: ChatInputCommandInteraction) {
  const avatar = interaction.user.displayAvatarURL();
  const embed = new EmbedBuilder()
    .setAuthor({ name: `${pfpCheck(avatar)}Coin flip`, iconURL: avatar })
    .setDescription(Math.random() >= 0.5 ? "Tails!" : "Heads!")
    .setColor(genColor(120));

  await interaction.reply({ embeds: [embed] });
}
