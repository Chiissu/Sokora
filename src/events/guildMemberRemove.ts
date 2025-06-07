import { getSetting } from "database/settings";
import { EmbedBuilder, type GuildMember, type TextChannel } from "discord.js";
import { genColor, genImageColor } from "utils/colorGen";
import { pfpCheck } from "utils/pfpCheck";
import { replaceVariables } from "utils/replace";
import { Event } from "utils/types";

export default (async function run(member: GuildMember) {
  const guildID = member.guild.id;
  const id =
    ((await getSetting(guildID, "welcome", "leave_channel")) as string) ??
    ((await getSetting(guildID, "welcome", "join_channel")) as string);
  if (!id) return;
  const avatar = member.user.displayAvatarURL();
  const channel = (await member.guild.channels.cache
    .find(channel => channel.id == id)
    ?.fetch()) as TextChannel;

  const embed = new EmbedBuilder()
    .setAuthor({ name: `${pfpCheck(avatar)}${member.user.displayName} left`, iconURL: avatar })
    .setDescription(
      await replaceVariables(
        (await getSetting(guildID, "welcome", "leave_text")) as string,
        member.guild,
        member.user,
      ),
    )
    .setFooter({ text: `User ID: ${member.id}` })
    .setColor(
      member.user.hexAccentColor ?? (await genImageColor(undefined, avatar)) ?? genColor(200),
    );

  await channel.send({ embeds: [embed] });
} as Event<"guildMemberRemove">);
