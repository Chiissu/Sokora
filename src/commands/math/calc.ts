import {
  EmbedBuilder,
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import * as math from "mathjs";
import { genColor } from "utils/colorGen";

export const data = new SlashCommandSubcommandBuilder()
  .setName("calc")
  .setDescription("Calculate the result of a mathematical expression")
  .addStringOption(option =>
    option
      .setName("expression")
      .setDescription("The mathematical expression to calculate (e.g., 'sin(pi/4)', '10*2+(6/3)')")
      .setRequired(true),
  );

export async function run(interaction: ChatInputCommandInteraction) {
  const expr = interaction.options.getString("expression", true);

  let result: number;
  try {
    result = math.evaluate(expr);
    if (typeof result != "number" || Number.isNaN(result) || !Number.isFinite(result))
      throw new Error("Invalid result");
  } catch {
    return await errorEmbed({
      interaction,
      title: "Invalid expression.",
      reason:
        "Please provide a valid mathematical expression. Examples: 'sin(pi/4)', '10*2+(6/3)', 'sqrt(25)'",
    });
  }

  const embed = new EmbedBuilder()
    .setAuthor({ name: "Calculation result" })
    .setDescription(`\`${expr}\` = **${result}**`)
    .setColor(genColor(200));

  await interaction.reply({ embeds: [embed] });
}
