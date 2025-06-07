import { pathToFileURL } from "bun";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { version } from "package";
import { join } from "path";
import { genColor, genImageColor } from "utils/colorGen";
import { parseChangelogString } from "utils/parseChangelog";
import { pfpCheck } from "utils/pfpCheck";
import { replace } from "utils/replace";

export const data = new SlashCommandBuilder()
  .setName("changelog")
  .setDescription(`Shows what's changed in Sokora's latest version, ${version}`);

export async function run(interaction: ChatInputCommandInteraction) {
  const user = interaction.client.user;
  const avatar = user.displayAvatarURL();
  const versions = parseChangelogString(
    await Bun.file(pathToFileURL(join(process.cwd(), "CHANGELOG.md"))).text(),
  );

  const row: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder();
  for (const version of versions)
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(version.ver)
        .setLabel(version.ver)
        .setStyle(ButtonStyle.Primary),
    );

  const embed = new EmbedBuilder()
    .setAuthor({ name: `${pfpCheck(avatar)}Changelog for ${version}`, iconURL: avatar })
    .setDescription(
      [
        versions[0].changelog,
        "-# See older versions [here](https://github.com/SokoraDesu/Sokora/blob/dev/CHANGELOG.md).",
      ].join("\n"),
    )
    .setFooter({ text: replace("(madeWith)") })
    .setColor(user.hexAccentColor ?? (await genImageColor(undefined, avatar)) ?? genColor(270));

  // todo: prevent unknown error when deleting
  const reply = await interaction.reply({ embeds: [embed], components: [row] });
  const collector = reply.createMessageComponentCollector({ time: 30000 });
  collector.on("collect", async (i: ButtonInteraction) => {
    if (i.message.id != (await reply.fetch()).id)
      return await errorEmbed({
        interaction: i,
        title:
          "For some reason, this click would've caused the bot to error. Thankfully, this message right here prevents that.",
      });

    if (i.user.id != interaction.user.id)
      return await errorEmbed({
        interaction: i,
        title: "You aren't the person who executed this command.",
      });

    collector.resetTimer({ time: 30000 });
    const version = versions.find(v => v.ver == i.customId);
    if (version) {
      embed
        .setAuthor({ name: `${pfpCheck(avatar)}Changelog for ${version.ver}`, iconURL: avatar })
        .setDescription(
          [
            version.changelog,
            "-# See older versions [here](https://github.com/SokoraDesu/Sokora/blob/dev/CHANGELOG.md).",
          ].join("\n"),
        );

      await i.update({ embeds: [embed], components: [row] });
    }
  });

  collector.on("end", async () => await interaction.editReply({ components: [] }));
}
