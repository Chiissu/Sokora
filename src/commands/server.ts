import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { serverEmbed } from "embeds/serverEmbed";

export const data = new SlashCommandBuilder()
  .setName("server")
  .setDescription("Shows this server's info.");

export async function run(interaction: ChatInputCommandInteraction) {
  const embed = await serverEmbed({ guild: interaction.guild!, roles: true });
  await interaction.reply({ embeds: [embed] });
}
