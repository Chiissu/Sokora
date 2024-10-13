import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type SlashCommandOptionsOnlyBuilder
} from "discord.js";
import { genColor } from "../utils/colorGen";
import { getLevel, setLevel } from "../utils/database/levelling";
import { getSetting } from "../utils/database/settings";
import { errorEmbed } from "../utils/embeds/errorEmbed";
import { imageColor } from "../utils/imageColor";

export default class User {
  data: SlashCommandOptionsOnlyBuilder;
  constructor() {
    this.data = new SlashCommandBuilder()
      .setName("user")
      .setDescription("Shows your (or another user's) info.")
      .addUserOption(user => user.setName("user").setDescription("Select the user."));
  }

  async run(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild!;
    const target = guild.members.cache.get(
      interaction.options.getUser("user")?.id ?? interaction.user.id
    )!;

    const user = await target.user.fetch();
    let serverInfo = [`Joined on **<t:${Math.round(target.joinedAt?.valueOf()! / 1000)}:D>**`];
    const guildRoles = guild.roles.cache.filter(role => target.roles.cache.has(role.id))!;
    const avatar = target.displayAvatarURL();
    const memberRoles = [...guildRoles].sort(
      (role1, role2) => role2[1].position - role1[1].position
    );
    memberRoles.pop();
    const rolesLength = memberRoles.length;

    if (target.premiumSinceTimestamp)
      serverInfo.push(`Boosting since **${target.premiumSinceTimestamp}**`);

    if (memberRoles.length)
      serverInfo.push(
        `**${guildRoles.filter(role => target.roles.cache.has(role.id)).size! - 1}** ${
          memberRoles.length == 1 ? "role" : "roles"
        } • ${memberRoles
          .slice(0, 5)
          .map(role => `<@&${role[1].id}>`)
          .join(", ")}${rolesLength > 3 ? ` and **${rolesLength - 3}** more` : ""}`
      );

    const embedColor =
      user.hexAccentColor ?? (await imageColor(undefined, target)) ?? genColor(200);

    let embed = new EmbedBuilder()
      .setAuthor({
        name: `${avatar ? "•  " : ""}${target.nickname ?? user.displayName}`,
        iconURL: avatar
      })
      .setFields(
        {
          name: `<:discord:1266797021126459423> • Discord info`,
          value: [
            `Username is **${user.username}**`,
            `Display name is ${
              user.displayName == user.username ? "*not there*" : `**${user.displayName}**`
            }`,
            `Created on **<t:${Math.round(user.createdAt.valueOf() / 1000)}:D>**`
          ].join("\n")
        },
        {
          name: "📒 • Server info",
          value: serverInfo.join("\n")
        }
      )
      .setFooter({ text: `User ID: ${target.id}` })
      .setThumbnail(avatar)
      .setColor(embedColor);

    const enabled = getSetting(`${guild.id}`, "levelling", "enabled");
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("general")
        .setLabel("•  General")
        .setEmoji("📃")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("level")
        .setLabel("•  Level")
        .setEmoji("⚡")
        .setStyle(ButtonStyle.Primary)
    );
    row.components[0].setDisabled(true);
    const reply = await interaction.reply({
      embeds: [embed],
      components: enabled ? [row] : []
    });

    console.log(enabled);
    console.log(!enabled);
    if (!enabled && user.bot) return;
    const [guildLevel, guildExp] = getLevel(`${guild.id}`, `${target.id}`)!;
    const [globalLevel, globalExp] = getLevel("0", `${target.id}`)!;
    if (!guildLevel && !guildExp) setLevel(`${guild.id}`, `${target.id}`, 0, 0);
    if (!globalLevel && !globalExp) setLevel("0", `${target.id}`, 0, 0);

    const nextLevelExp = Math.floor(100 * 1.15 * ((guildLevel ?? 0) + 1))?.toLocaleString("en-US");
    const globalNextLevelExp = Math.floor(100 * 1.15 * ((globalLevel ?? 0) + 1))?.toLocaleString(
      "en-US"
    );

    const collector = reply.createMessageComponentCollector({ time: 60000 });
    collector.on("collect", async (i: ButtonInteraction) => {
      if (i.message.id != (await reply.fetch()).id)
        return await errorEmbed(
          i,
          "For some reason, this click would've caused the bot to error. Thankfully, this message right here prevents that."
        );

      if (i.user.id != interaction.user.id)
        return await errorEmbed(i, "You aren't the person who executed this command.");

      i.customId == "general"
        ? row.components[0].setDisabled(true)
        : row.components[1].setDisabled(true);

      const levelEmbed = new EmbedBuilder()
        .setAuthor({
          name: `•  ${target.nickname ?? user.displayName}`,
          iconURL: target.displayAvatarURL()
        })
        .setFields(
          {
            name: `⚡ • Guild level ${guildLevel ?? 0}`,
            value: [
              `**${guildExp.toLocaleString("en-US") ?? 0}/${nextLevelExp}** EXP`,
              `**Next level**: ${(guildLevel ?? 0) + 1}`
            ].join("\n"),
            inline: true
          },
          {
            name: `⛈️ • Global level ${globalLevel ?? 0}`,
            value: [
              `**${globalExp.toLocaleString("en-US") ?? 0}/${globalNextLevelExp}** EXP`,
              `**Next level**: ${(globalLevel ?? 0) + 1}`
            ].join("\n"),
            inline: true
          }
        )
        .setFooter({ text: `User ID: ${target.id}` })
        .setThumbnail(target.displayAvatarURL())
        .setColor(embedColor);

      switch (i.customId) {
        case "general":
          row.components[1].setDisabled(false);
          await i.update({ embeds: [embed], components: [row] });
          break;
        case "level":
          row.components[0].setDisabled(false);
          await i.update({ embeds: [levelEmbed], components: [row] });
          break;
      }
    });

    collector.on("end", async () => await interaction.editReply({ components: [] }));
  }
}
