import { getSetting } from "database/settings";
import {
  ChannelType,
  type Channel,
  type Guild,
  type MessageCreateOptions,
  type MessagePayload,
  type TextChannel,
} from "discord.js";

/**
 * Sends a message in the log channel. (if there is one set)
 * @param guild The guild where the log channel is located.
 * @param options Reply options of the log.
 * @returns Log message.
 */
export async function logChannel(
  guild: Guild,
  options: string | MessagePayload | MessageCreateOptions,
) {
  const logChannel = await getSetting(guild.id, "moderation", "channel");
  if (!logChannel) return;

  const channel = await guild.channels.cache
    .get(`${logChannel}`)
    ?.fetch()
    .then((channel: Channel) => {
      if (
        channel.type != ChannelType.GuildText &&
        ChannelType.PublicThread &&
        ChannelType.PrivateThread &&
        ChannelType.GuildVoice
      )
        return null;

      return channel as TextChannel;
    })
    .catch(() => null);

  if (!channel) return;
  if (!channel.permissionsFor(guild.client.user)?.has("ViewChannel")) return;
  return await channel.send(options);
}
