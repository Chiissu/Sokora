import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { version } from "package";
import { genColor, genImageColor } from "utils/colorGen";
import { pfpCheck } from "utils/pfpCheck";
import { pluralOrNot } from "utils/pluralOrNot";
import { replace } from "utils/replace";

export const data = new SlashCommandBuilder()
  .setName("about")
  .setDescription("Shows information about Sokora.");

export async function run(interaction: ChatInputCommandInteraction) {
  const client = interaction.client;
  const user = client.user;
  const guilds = client.guilds.cache;
  const members = guilds.map(guild => guild.memberCount).reduce((a, b) => a + b);
  const shards = client.shard?.count;
  const avatar = user.displayAvatarURL();
  const allMembers = await Promise.all(guilds.map(guild => guild.members.fetch()));
  const uniqueIDs = new Set<string>();

  for (const col of allMembers) for (const member of col.values()) uniqueIDs.add(member.id);
  const uniqueUsers = Array.from(uniqueIDs).length;

  const embed = new EmbedBuilder()
    .setAuthor({ name: `${pfpCheck(avatar)}About Sokora`, iconURL: avatar })
    .setDescription(
      "Sokora is a multipurpose Discord bot that lets you manage your servers easily.",
    )
    .setFields(
      {
        name: "📃 • General",
        value: [
          `Version **${version}**, *Antei*`,
          `**${members}** ${pluralOrNot("member", members)} • **${uniqueUsers}** ${pluralOrNot("unique user", uniqueUsers)} • **${guilds.size}** ${pluralOrNot(
            "guild",
            guilds.size,
          )}${!shards ? "" : ` • **${shards}** ${pluralOrNot("shard", shards)}`}`,
        ].join("\n"),
      },
      {
        name: "🔗 • Links",
        value: [
          "[Discord](https://discord.gg/c6C25P4BuY) • [GitHub](https://www.github.com/SokoraDesu) • [YouTube](https://www.youtube.com/@SokoraDesu) • [Mastodon](https://mastodon.online/@NebulaTheBot@mastodon.social) • [Matrix](https://matrix.to/#/#sokora:matrix.org) • [Revolt](https://rvlt.gg/28TS9aXy)",
          "Also, please read the [ToS](https://sokora.org/terms) and the [privacy policy](https://sokora.org/privacy).",
        ].join("\n"),
      },
    )
    .setFooter({ text: replace("(madeWith)") })
    .setColor(user.hexAccentColor ?? (await genImageColor(undefined, avatar)) ?? genColor(270));

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel("•  Vote")
      .setURL(`https://top.gg/bot/${user.id}/vote`)
      .setEmoji("🗳️")
      .setStyle(ButtonStyle.Link),
    new ButtonBuilder()
      .setLabel("•  Donate")
      .setURL("https://paypal.me/SokoraTheBot")
      .setEmoji("⭐")
      .setStyle(ButtonStyle.Link),
  );

  await interaction.reply({ embeds: [embed], components: [row] });
}
