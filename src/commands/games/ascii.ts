import { SlashCommandSubcommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import figlet from "figlet";
import { randomize } from "utils/randomize";

export const data = new SlashCommandSubcommandBuilder()
  .setName("ascii")
  .setDescription("Converts text you send into ASCII art.")
  .addStringOption(option =>
    option
      .setName("text")
      .setDescription("The text you want to convert into ASCII art.")
      .setRequired(true),
  );

export async function run(interaction: ChatInputCommandInteraction) {
  const text = interaction.options.getString("text", true);
  let ascii: string;

  try {
    ascii = figlet.textSync(text, {
      font: randomize(["Standard", "Univers", "Train", "Stop", "Roman"]) as "Standard",
    });
  } catch (error) {
    return await errorEmbed({ interaction, error, forward: true });
  }

  if (!ascii)
    return await errorEmbed({
      interaction,
      title: `You can't create ASCII art from \`${text}\`.`,
      reason: "This text is either empty or only contains invalid characters.",
    });

  if (ascii.length > 1990) ascii = ascii.substring(0, 1987) + "...";
  await interaction.reply({ content: `\`\`\`${ascii}\`\`\`` });
}
