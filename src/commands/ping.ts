import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { genColor, genImageColor } from "utils/colorGen";
import { pfpCheck } from "utils/pfpCheck";
import { replace } from "utils/replace";

export const data = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Shows the current ping and uptime of Sokora.");

export async function run(interaction: ChatInputCommandInteraction) {
  const client = interaction.client;
  const user = client.user;
  const avatar = user.displayAvatarURL();
  const embed = new EmbedBuilder()
    .setAuthor({ name: `${pfpCheck(avatar)}Pong!`, iconURL: avatar })
    .setDescription(
      [
        `\`Latency\` **${Date.now() - interaction.createdTimestamp}ms**.`,
        `\`API Latency\` **${client.ws.ping}ms**.`,
        `\`Bot uptime\` **${(client.uptime / (1000 * 60)).toFixed(2)} minutes**.`,
      ].join("\n"),
    )
    .setFooter({ text: replace("(madeWith)") })
    .setColor(user.hexAccentColor ?? (await genImageColor(undefined, avatar)) ?? genColor(270));

  await interaction.reply({ embeds: [embed] });
}
