import { getPendingBans, removeModeration } from "database/moderation";
import { Client, EmbedBuilder } from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { genColor } from "./colorGen";
import { logChannel } from "./logChannel";
import { pfpCheck } from "./pfpCheck";

export function scheduleUnban(
  client: Client,
  guildID: string,
  userID: string,
  modID: string,
  delay: number,
) {
  const scheduledUnbans = new Map<string, Timer>();
  const key = `${guildID}-${userID}`;
  if (scheduledUnbans.has(key)) clearTimeout(scheduledUnbans.get(key)!);

  const timeout = setTimeout(async () => {
    try {
      const guild = await client.guilds.fetch(guildID);
      const user = guild.bans.cache.get(userID)?.user;
      if (!user)
        return await errorEmbed({
          client,
          title: `Failed to unban user ${userID} in guild ${guildID}.`,
          reason: "User not found in the guild's ban list's cache.",
          log: true,
          forward: true,
        });

      const moderator = guild.members.cache.get(modID);
      if (!moderator)
        return await errorEmbed({
          client,
          title: `Failed to unban user ${userID} in guild ${guildID}.`,
          reason: "Moderator not found in the guild cache.",
          log: true,
          forward: true,
        });

      const avatar = user.displayAvatarURL();
      const embed = new EmbedBuilder()
        .setAuthor({ name: `${pfpCheck(avatar)}Unbanned ${user.displayName}`, iconURL: avatar })
        .setDescription(
          [`**Moderator**: ${moderator.displayName}`, "*Temporary ban has expired*"].join("\n"),
        )
        .setFooter({ text: `User ID: ${user.id}` })
        .setColor(genColor(100));

      await logChannel(guild, { embeds: [embed] });
      await guild.members.unban(userID, "Temporary ban has expired");
      removeModeration(guildID, userID);
      scheduledUnbans.delete(key);
    } catch (error) {
      return await errorEmbed({
        client,
        error,
        title: `Failed to unban user ${userID} in guild ${guildID}`,
        log: true,
        forward: true,
      });
    }
  }, delay);

  return scheduledUnbans.set(key, timeout);
}

export async function rescheduleUnbans(client: Client) {
  const now = Date.now();

  for (const ban of getPendingBans(now)) {
    if (!ban.expiresAt) continue;
    if (typeof ban.expiresAt != "number" || isNaN(ban.expiresAt)) {
      await errorEmbed({
        client,
        title: `Invalid expiresAt value for ban: ${ban.expiresAt}.`,
        log: true,
        forward: true,
      });
      continue;
    }

    const delay = ban.expiresAt - now;
    if (delay > 0) scheduleUnban(client, ban.guild, ban.user, ban.moderator, delay);
    else removeModeration(ban.guild, ban.id);
  }
}
