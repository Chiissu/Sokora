import { SlashCommandSubcommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { errorCheck, modEmbed } from "embeds/modEmbed";
import ms from "ms";
import { scheduleUnban } from "utils/unbanScheduler";

export const data = new SlashCommandSubcommandBuilder()
  .setName("ban")
  .setDescription("Bans a user.")
  .addUserOption(user =>
    user.setName("user").setDescription("The user that you want to ban.").setRequired(true),
  )
  .addStringOption(string => string.setName("reason").setDescription("The reason for the ban."))
  .addStringOption(string =>
    string.setName("duration").setDescription("The duration of the ban (e.g 2mo, 1y)."),
  );

export async function run(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser("user")!;
  const guild = interaction.guild!;
  const duration = interaction.options.getString("duration");
  const reason = interaction.options.getString("reason");
  if (
    await errorCheck(
      "BanMembers",
      { interaction, user, action: "Ban" },
      { allErrors: true, botError: true, ownerError: true },
      "Ban Members",
    )
  )
    return;

  if ((await guild.bans.fetch()).get(user.id))
    return await errorEmbed({
      interaction,
      title: `You can't ban ${user.username}.`,
      reason: "This user is already banned.",
    });

  let expiresAt: number | undefined;
  if (duration) {
    const durationMs = ms(duration);
    if (!durationMs || durationMs <= 0)
      return await errorEmbed({
        interaction,
        title: `You can't ban ${user.username} temporarily.`,
        reason: "The duration is invalid.",
      });

    expiresAt = Date.now() + durationMs;
    scheduleUnban(interaction.client, guild.id, user.id, interaction.member!.user.id, durationMs);
  }

  try {
    // todo: do this in most of the places that have lots of await functions and where order of things done doesn't matter
    await Promise.all([
      modEmbed(
        { interaction, user, action: "Banned", duration, dm: true, dbAction: "BAN", expiresAt },
        reason,
      ),
      guild.members.ban(user.id, { reason: reason ?? undefined }),
    ]);
  } catch (error) {
    return await errorEmbed({ interaction, error, forward: true });
  }
}
