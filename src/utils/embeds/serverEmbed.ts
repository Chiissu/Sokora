import { EmbedBuilder, Invite, type Guild } from "discord.js";
import { genColor, genImageColor } from "../colorGen";
import { mention } from "../mention";
import { pfpCheck } from "../pfpCheck";
import { pluralOrNot } from "../pluralOrNot";

type Options = {
  guild: Guild;
  invite?: {
    show: boolean;
    channel: string | null;
  };
  roles?: boolean;
  page?: number;
  pages?: number;
};

/**
 * Sends an embed containing information about the guild.
 * @param options Options of the embed.
 * @returns Embed that contains the guild info.
 */
export async function serverEmbed(options: Options) {
  const { page, pages, guild } = options;
  const { premiumTier: boostTier, premiumSubscriptionCount: boostCount } = guild;
  const boosters = guild.members.cache.filter(member => member.premiumSince);
  const icon = guild.iconURL()!;

  const roles = guild.roles.cache;
  const sortedRoles = [...roles].sort((role1, role2) => role2[1].position - role1[1].position);
  sortedRoles.pop();
  const rolesLength = sortedRoles.length;

  const channels = guild.channels.cache;
  const channelSizes = {
    text: channels.filter(channel => channel.type == 0 || channel.type == 15 || channel.type == 5)
      .size,
    voice: channels.filter(channel => channel.type == 2 || channel.type == 13).size,
  };
  const channelCount = channelSizes.text + channelSizes.voice;

  const generalValues = [
    `Owned by **${(await guild.fetchOwner()).user.displayName}**`,
    `Created on **<t:${Math.round(guild.createdAt.valueOf() / 1000)}:D>**`,
  ];

  const VL = guild.verificationLevel;
  const TFA = guild.mfaLevel;
  const NSFW = guild.nsfwLevel;

  const safetyValues: (string | null)[] = [
    `**${VL == 0 ? "Unrestricted" : VL == 1 ? "Low" : VL == 2 ? "Mid" : VL == 3 ? "High" : "Very high"}** level`,
    `**${TFA == 1 ? "No" : "Has"}** 2FA`,
  ];

  if (NSFW != 0)
    safetyValues.push(`**${NSFW == 1 ? "Explicit" : NSFW == 2 ? "Safe" : "Age restricted"}**`);

  const statValues: (string | null)[] = [
    `**${guild.memberCount?.toLocaleString("en-US")}** members`,
    `**${channelCount}** ${pluralOrNot("channel", channelCount)} • **${channelSizes.text}** text and **${channelSizes.voice}** voice`,
  ];

  if (boostTier)
    statValues.push(
      `${!boostTier ? "**No** level" : `Level **${boostTier}**`} • **${boostCount}**${
        !boostTier ? "/2" : boostTier == 1 ? "/7" : boostTier == 2 ? "/14" : ""
      } ${pluralOrNot("boost", boostCount!)} • **${boosters.size}** ${pluralOrNot("booster", boosters.size)}`,
    );

  if (options.roles)
    statValues.push(
      `**${roles.size - 1}** ${pluralOrNot("role", roles.size - 1)} • ${
        roles.size == 1
          ? "*None*"
          : `${(
              await Promise.all(
                sortedRoles.slice(0, 5).map(async role => await mention(role[0], "ROLE")),
              )
            ).join("  •  ")}${rolesLength > 5 ? ` and **${rolesLength - 5}** more` : ""}`
      }`,
    );

  const embed = new EmbedBuilder()
    .setAuthor({
      name: `${pages ? `#${page}  •  ` : pfpCheck(icon)}${guild.name}`,
      iconURL: icon,
    })
    .setDescription(guild.description ? `> ${guild.description}` : null)
    .setFields(
      {
        name: "📃 • General",
        value: generalValues.join("\n"),
        inline: true,
      },
      {
        name: "🛡 • Safety setup",
        value: safetyValues.join("\n"),
        inline: true,
      },
      {
        name: "📈 • Stats",
        value: statValues.join("\n"),
      },
    )
    .setFooter({ text: `${pages ? `Page ${page}/${pages} • ` : ""}Server ID: ${guild.id}` })
    .setColor((await genImageColor(icon)) ?? genColor(200));

  if (options.invite?.show) {
    const previousInvite: Invite | undefined = (await options.guild.invites.fetch()).find(
      invite =>
        invite.inviter?.id == guild.client.user.id &&
        invite.maxUses == null &&
        invite.expiresAt == null,
    );

    const possiblyFetchedInviteChannel = await options.guild.channels.fetch(
      options.invite.channel ?? "hi",
    );

    const inviteChannel =
      possiblyFetchedInviteChannel &&
      possiblyFetchedInviteChannel.isTextBased() &&
      !possiblyFetchedInviteChannel.isThread()
        ? possiblyFetchedInviteChannel
        : options.guild.rulesChannel;

    if (!inviteChannel) return embed;

    const inviteUrl = previousInvite
      ? previousInvite.url
      : await inviteChannel.createInvite({
          maxAge: undefined,
          maxUses: undefined,
          reason: "Serverboard invite",
          temporary: false,
          unique: true,
        });

    embed.addFields({
      name: `🚪 • Join in!`,
      value: `This server allows you to join from here! ${inviteUrl}`,
    });
  }

  return embed;
}
