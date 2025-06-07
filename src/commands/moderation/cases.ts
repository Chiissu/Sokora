import { getModeration, listUserModeration } from "database/moderation";
import {
  EmbedBuilder,
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { genColor } from "utils/colorGen";
import { pfpCheck } from "utils/pfpCheck";
import { randomize } from "utils/randomize";

export const data = new SlashCommandSubcommandBuilder()
  .setName("cases")
  .setDescription("Moderation cases in a server.")
  .addUserOption(user =>
    user.setName("user").setDescription("The user that you want to see.").setRequired(true),
  )
  .addStringOption(string =>
    string.setName("id").setDescription("The ID of a specific moderation case you want to see."),
  );

export async function run(interaction: ChatInputCommandInteraction) {
  const actionsEmojis: { [key: string]: string } = {
    WARN: "⚠️",
    MUTE: "🔇",
    KICK: "📤",
    BAN: "🔨",
    UNBAN: "🔓",
  };

  const nothingMsg = [
    "Nothing to see here...",
    "Ayay, no cases on this horizon cap'n!",
    "Clean as a whistle!",
    "0 + 0 = ?",
  ];

  const guild = interaction.guild!;
  if (!guild.members.cache.get(interaction.user.id)?.permissions.has("ModerateMembers"))
    return await errorEmbed({
      interaction,
      title: "You can't execute this command.",
      reason: "You need the **Moderate Members** permission.",
    });

  const user = interaction.options.getUser("user")!;
  // const warns = listUserModeration(guild.id, user.id, "WARN");
  // const mutes = listUserModeration(guild.id, user.id, "MUTE");
  // const kicks = listUserModeration(guild.id, user.id, "KICK");
  // const bans = listUserModeration(guild.id, user.id, "BAN");
  let actionID = interaction.options.getString("id");
  if (actionID && actionID?.startsWith("#")) actionID = actionID.slice(1);
  const actions = actionID
    ? getModeration(guild.id, user.id, actionID)
    : listUserModeration(guild.id, user.id);

  const avatar = user.displayAvatarURL();
  const embed = new EmbedBuilder()
    .setAuthor({
      name: `${pfpCheck(avatar)}Cases of ${user.username}`,
      iconURL: avatar,
    })
    .setFields(
      actions.length > 0
        ? actions.map(action => {
            const actionValues = [
              `**Moderator**: <@${action.moderator}>`,
              action.reason ? `**Reason**: ${action.reason}` : "*No reason provided*",
              `**Time of action**: <t:${Math.floor(Number(action.timestamp) / 1000)}:d>`,
            ];

            return {
              name: `${actionsEmojis[action.type]} • ${action.type} #${action.id}`, // Include durations ? needs to add a db column
              value: actionValues.join("\n"),
            };
          })
        : [
            {
              name: `💨 • ${randomize(nothingMsg)}`,
              value: "*No actions have been taken on this user*",
            },
          ],
    )
    .setFooter({ text: `User ID: ${user.id}` })
    .setColor(genColor(200));

  await interaction.reply({ embeds: [embed] });
}
