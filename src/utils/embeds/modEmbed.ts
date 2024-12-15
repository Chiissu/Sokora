import {
  EmbedBuilder,
  type PermissionResolvable,
  type ChatInputCommandInteraction,
  type User
} from "discord.js";
import ms from "ms";
import { genColor } from "../colorGen";
import { getModeration, addModeration, editModeration, type modType } from "../database/moderation";
import { logChannel } from "../logChannel";
import { errorEmbed } from "./errorEmbed";

type Options = {
  interaction: ChatInputCommandInteraction;
  user: User;
  action: string;
  duration?: string | null;
  dm?: boolean;
  dbAction?: modType;
  expiresAt?: number;
  previousID?: number;
};

type ErrorOptions = {
  allErrors: boolean;
  botError: boolean;
  ownerError?: boolean;
  outsideError?: boolean;
  unbanError?: boolean;
};

export async function errorCheck(
  permission: PermissionResolvable,
  options: Options,
  errorOptions: ErrorOptions,
  permissionAction: string
) {
  const { interaction, user, action } = options;
  const { allErrors, botError, ownerError, outsideError, unbanError } = errorOptions;
  const guild = interaction.guild!;
  const members = guild.members.cache!;
  const member = members.get(interaction.user.id)!;
  const client = members.get(interaction.client.user.id)!;

  if (botError)
    if (!client.permissions.has(permission))
      return await errorEmbed(
        interaction,
        "The bot can't execute this command.",
        `The bot is missing the **${permissionAction}** permission.`
      );

  if (!member.permissions.has(permission))
    return await errorEmbed(
      interaction,
      "You can't execute this command.",
      `You're missing the **${permissionAction}** permission.`
    );
  const name = user.displayName;

  if (unbanError)
    if (!user)
      return await errorEmbed(
        interaction,
        `You can't unban **${name}**.`,
        "The user was never banned."
      );

  if (!allErrors) return;
  const target = members.get(user.id)!;
  const highestModPos = member.roles.highest.position;
  const highestTargetPos = target.roles.highest.position;

  if (!target) return;
  if (target == member)
    return await errorEmbed(interaction, `You can't ${action.toLowerCase()} yourself.`);

  if (target.id == interaction.client.user.id)
    return await errorEmbed(interaction, `You can't ${action.toLowerCase()} Sokora.`);

  if (!target.manageable)
    return await errorEmbed(
      interaction,
      `You can't ${action.toLowerCase()} ${name}.`,
      `The member has a higher (or the same) role position than Sokora.`
    );

  if (highestModPos <= highestTargetPos)
    return await errorEmbed(
      interaction,
      `You can't ${action.toLowerCase()} ${name}.`,
      `The member has ${
        highestModPos == highestTargetPos ? "the same" : "a higher"
      } role position ${highestModPos == highestTargetPos ? "as" : "than"} you.`
    );

  if (ownerError) {
    if (target.id == guild.ownerId)
      return await errorEmbed(
        interaction,
        `You can't ${action.toLowerCase()} ${name}.`,
        "The member owns the server."
      );
  }

  if (outsideError)
    if (
      !(await guild.members
        .fetch(user.id)
        .then(() => true)
        .catch(() => false))
    )
      return await errorEmbed(
        interaction,
        `You can't ${action.toLowerCase()} ${name}.`,
        "This user isn't in this server."
      );
}

export async function modEmbed(
  options: Options,
  reason?: string | null,
  showModerator: boolean = false
) {
  const { interaction, user, action, duration, dm, dbAction, expiresAt, previousID } = options;
  const guild = interaction.guild!;
  const name = user.displayName;
  const generalValues = [`**Moderator**: ${interaction.user.displayName}`];
  let author = `• ${previousID ? "Edited a" : ""} ${
    previousID ? dbAction?.toLowerCase() : action
  } ${previousID ? "on" : ""} ${name}`;
  reason ? generalValues.push(`**Reason**: ${reason}`) : generalValues.push("*No reason provided*");
  if (duration) generalValues.push(`**Duration**: ${ms(ms(duration), { long: true })}`);
  if (previousID) {
    let previousCase = getModeration(guild.id, user.id, `${previousID}`);
    if (!previousCase.length || previousCase[0].user != user.id || previousCase[0].type != dbAction)
      return await errorEmbed(
        interaction,
        `You can't edit this ${dbAction?.toLowerCase()}.`,
        `The ${dbAction?.toLowerCase()} doesn't exist.`
      );

    try {
      editModeration(guild.id, `${previousID}`, reason ?? "", expiresAt ?? null);
    } catch (error) {
      console.error(error);
    }
    author = author.concat(`  •  #${previousID}`);
  }

  if (!dbAction) return;
  try {
    const id: number = addModeration(
      guild.id,
      user.id,
      dbAction,
      guild.members.cache.get(interaction.user.id)?.id!,
      reason ?? undefined,
      expiresAt ?? undefined
    );
    author = author.concat(`  •  #${id}`);
  } catch (error) {
    console.error(error);
  }

  const embed = new EmbedBuilder()
    .setAuthor({ name: author, iconURL: user.displayAvatarURL() })
    .setDescription(generalValues.join("\n"))
    .setFooter({ text: `User ID: ${user.id}` })
    .setColor(genColor(100));

  await logChannel(guild, embed);
  if (interaction.replied) await interaction.followUp({ embeds: [embed] });
  else await interaction.reply({ embeds: [embed] });

  if (!dm) return;
  const dmChannel = await user.createDM().catch(() => null);
  if (!dmChannel || !guild.members.cache.get(user.id) || user.bot) return;
  try {
    await dmChannel
      .send({
        embeds: [
          embed
            .setAuthor({
              name: `•  You got ${action.toLowerCase()}.`,
              iconURL: user.displayAvatarURL()
            })
            .setDescription(generalValues.slice(+!showModerator, generalValues.length).join("\n"))
            .setColor(genColor(0))
        ]
      })
      .catch(() => null);
  } catch (e) {
    return console.log(e);
  }
}
