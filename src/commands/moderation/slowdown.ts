import {
  ChannelType,
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { modActionEmbed } from "embeds/modActionEmbed";
import { errorCheck } from "embeds/modEmbed";
import ms from "ms";
import { mention } from "utils/mention";

export const data = new SlashCommandSubcommandBuilder()
  .setName("slowdown")
  .setDescription("Slows a channel down.")
  .addStringOption(string =>
    string
      .setName("time")
      .setDescription("Time to slow the channel down to (e.g 30m, 1d, 2h). 0 to remove slowdown.")
      .setRequired(true),
  )
  .addStringOption(string =>
    string.setName("reason").setDescription("The reason for the slowdown."),
  )
  .addChannelOption(channel =>
    channel
      .setName("channel")
      .setDescription("The channel that you want to slowdown.")
      .addChannelTypes(
        ChannelType.GuildText,
        ChannelType.PublicThread,
        ChannelType.PrivateThread,
        ChannelType.GuildVoice,
        ChannelType.GuildStageVoice,
      ),
  );

export async function run(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild!;
  const channelOption = interaction.options.getChannel("channel")!;
  const channel = guild.channels.cache.get(interaction.channel?.id ?? channelOption.id)!;
  if (
    await errorCheck(
      "ManageChannels",
      { interaction, channel },
      { allErrors: false, botError: true, channelError: true },
      "Manage Channels",
    )
  )
    return;

  const time = interaction.options.getString("time")!;
  const reason = interaction.options.getString("reason");
  let title = `Set a slowdown of ${channelOption ?? `${channel.name}`} to ${ms(ms(time), {
    long: true,
  })}.`;
  if (!ms(time)) title = `Removed the slowdown from ${channelOption ?? `${channel.name}`}.`;

  if (
    !(
      channel.type == ChannelType.GuildText &&
      ChannelType.PublicThread &&
      ChannelType.PrivateThread &&
      ChannelType.GuildVoice &&
      ChannelType.GuildStageVoice
    )
  )
    return await errorEmbed({
      interaction,
      title: "You have provided a channel that can't be slowed down.",
    });

  await Promise.all([
    channel.setRateLimitPerUser(ms(time) / 1000, interaction.options.getString("reason")!),
    modActionEmbed(
      {
        title,
        body: [
          `**Moderator**: ${interaction.user.username}`,
          reason ? `**Reason**: ${reason}` : "*No reason provided*",
          `**Channel**: ${channelOption ?? (await mention(channel.id, "CHANNEL"))}`,
        ],
      },
      guild,
      interaction,
    ),
  ]);
}
