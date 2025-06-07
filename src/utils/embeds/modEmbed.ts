import { addModeration, editModeration, getModeration, type modType } from "database/moderation";
import {
  EmbedBuilder,
  type ChatInputCommandInteraction,
  type GuildBasedChannel,
  type PermissionResolvable,
  type User,
} from "discord.js";
import ms from "ms";
import { reply } from "utils/reply";
import { genColor } from "../colorGen";
import { logChannel } from "../logChannel";
import { pfpCheck } from "../pfpCheck";
import { errorEmbed } from "./errorEmbed";

type Options = {
  interaction: ChatInputCommandInteraction;
  action?: string;
  channel?: GuildBasedChannel;
  user?: User;
  duration?: string | null;
  dm?: boolean;
  dbAction?: modType;
  expiresAt?: number;
  previousID?: number;
};

type ErrorOptions = {
  allErrors: boolean;
  botError: boolean;
  channelError?: boolean;
  ownerError?: boolean;
  outsideError?: boolean;
  unbanError?: boolean;
};

export async function errorCheck(
  permission: PermissionResolvable,
  options: Options,
  errorOptions: ErrorOptions,
  permissionAction: string,
) {
  const { interaction, user, channel, action } = options;
  const { allErrors, botError, channelError, ownerError, outsideError, unbanError } = errorOptions;
  const guild = interaction.guild!;
  const members = guild.members.cache!;
  const member = members.get(interaction.user.id)!;
  const client = members.get(interaction.client.user.id)!;

  if (botError)
    if (!client.permissions.has(permission))
      return await errorEmbed({
        interaction,
        title: "The bot can't execute this command.",
        reason: `The bot is missing the **${permissionAction}** permission. If you want to run this command, you might want to give the bot this permission.`,
      });

  if (channelError)
    if (!channel?.permissionsFor(client).has("ViewChannel"))
      return await errorEmbed({
        interaction,
        title: "The bot can't execute this command.",
        reason: `The bot is missing the **View Channel** permission. If you want to run this command, you might want to give the bot this permission from the channel settings.`,
      });

  if (!member.permissions.has(permission))
    return await errorEmbed({
      interaction,
      title: "You can't execute this command.",
      reason: `You're missing the **${permissionAction}** permission.`,
    });

  if (unbanError)
    if (!user)
      return await errorEmbed({
        interaction,
        title: "You can't unban this user.",
        reason: "This user isn't currently banned.",
      });

  if (!allErrors || !user || !action) return;
  const target = members.get(user.id)!;
  const name = user.displayName;
  const highestModPos = member.roles.highest.position;

  if (outsideError)
    if (
      !(await guild.members
        .fetch(user.id)
        .then(() => true)
        .catch(() => false))
    )
      return await errorEmbed({
        interaction,
        title: `You can't ${action.toLowerCase()} ${name}.`,
        reason: "This user isn't in this server.",
      });

  if (!target) return;
  const highestTargetPos = target.roles.highest.position;

  if (target == member)
    return await errorEmbed({ interaction, title: `You can't ${action.toLowerCase()} yourself.` });

  if (target.id == interaction.client.user.id)
    return await errorEmbed({ interaction, title: `You can't ${action.toLowerCase()} Sokora.` });

  if (!target.manageable)
    return await errorEmbed({
      interaction,
      title: `You can't ${action.toLowerCase()} ${name}.`,
      reason: "The member has a higher (or the same) role position than Sokora.",
    });

  const same: boolean = highestModPos == highestTargetPos;

  if (highestModPos <= highestTargetPos)
    return await errorEmbed({
      interaction,
      title: `You can't ${action.toLowerCase()} ${name}.`,
      reason: `The member has ${same ? "the same" : "a higher"} role position ${same ? "as" : "than"} you.`,
    });

  if (ownerError) {
    if (target.id == guild.ownerId)
      return await errorEmbed({
        interaction,
        title: `You can't ${action.toLowerCase()} ${name}.`,
        reason: "The member owns the server.",
      });
  }
}

export async function modEmbed(
  options: Options,
  reason?: string | null,
  showModerator: boolean = false,
) {
  const { interaction, user, action, duration, dm, dbAction, expiresAt, previousID } = options;
  if (!user || !action) return;
  const guild = interaction.guild!;
  const name = user.displayName;
  const generalValues = [`**Moderator**: ${interaction.user.displayName}`];
  const avatar = user.displayAvatarURL();
  let author = `${pfpCheck(avatar)}${previousID ? "Edited a " : ""}${previousID ? dbAction?.toLowerCase() : action}${previousID ? " on" : ""} ${name}`;
  if (reason) generalValues.push(`**Reason**: ${reason}`);
  else generalValues.push("*No reason provided*");

  if (duration) generalValues.push(`**Duration**: ${ms(ms(duration), { long: true })}`);
  if (previousID) {
    const previousCase = getModeration(guild.id, user.id, `${previousID}`);
    if (
      (!previousCase.length && previousCase[0].user != user.id) ||
      previousCase[0].type != dbAction
    )
      return await errorEmbed({
        interaction,
        title: `You can't edit this ${dbAction?.toLowerCase()}.`,
        reason: `The ${dbAction?.toLowerCase()} doesn't exist.`,
      });

    try {
      editModeration(guild.id, `${previousID}`, reason ?? "", expiresAt ?? null);
    } catch (error) {
      return await errorEmbed({ interaction, error, log: true, forward: true });
    }
    author = author.concat(`  •  #${previousID}`);
  } else if (!dbAction) return;

  try {
    const moderator = guild.members.cache.get(interaction.user.id);
    if (!moderator)
      return await errorEmbed({
        interaction,
        title: `Failed to ${action.toLowerCase()}.`,
        reason: "Cannot find moderator.",
      });

    const id = addModeration(
      guild.id,
      user.id,
      dbAction,
      moderator.id,
      reason ?? undefined,
      expiresAt ?? undefined,
    );
    author = author.concat(`  •  #${id}`);
  } catch (error) {
    return await errorEmbed({ interaction, error, log: true, forward: true });
  }

  const embed = new EmbedBuilder()
    .setAuthor({ name: author, iconURL: avatar })
    .setDescription(generalValues.join("\n"))
    .setFooter({ text: `User ID: ${user.id}` })
    .setColor(genColor(100));

  await Promise.all([
    logChannel(guild, { embeds: [embed] }),
    reply(interaction, { embeds: [embed] }),
  ]);

  if (!dm) return;
  const dmChannel = await user.createDM().catch(() => null);
  if (!dmChannel || !guild.members.cache.get(user.id) || user.bot) return;
  try {
    const serverAvatar = guild.icon ? guild.iconURL()! : undefined;
    await dmChannel.send({
      embeds: [
        embed
          .setAuthor({
            name: `${pfpCheck(serverAvatar)}You got ${action.toLowerCase()} from ${guild.name}`,
            iconURL: serverAvatar,
          })
          .setDescription(generalValues.slice(+!showModerator, generalValues.length).join("\n"))
          .setColor(genColor(0)),
      ],
    });
  } catch (error) {
    return await errorEmbed({ interaction, error, log: true, forward: true });
  }
}
