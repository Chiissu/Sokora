import {
  ChannelType,
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { modActionEmbed } from "embeds/modActionEmbed";
import { errorCheck } from "embeds/modEmbed";
import { mention } from "utils/mention";

export const data = new SlashCommandSubcommandBuilder()
  .setName("unlock")
  .setDescription("Unlocks a channel.")
  .addChannelOption(channel =>
    channel
      .setName("channel")
      .setDescription("The channel that you want to unlock.")
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
      "ManageRoles",
      { interaction, channel },
      { allErrors: false, botError: true, channelError: true },
      "Manage Roles",
    )
  )
    return;

  if (channel.permissionsFor(guild.id)?.has("SendMessages"))
    return await errorEmbed({
      interaction,
      title: "You can't execute this command.",
      reason: "The channel is not locked.",
    });

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
      title: "You have provided a channel that can't be locked in the first place.",
    });

  await Promise.all([
    channel.permissionOverwrites
      .create(guild.id, {
        SendMessages: null,
        SendMessagesInThreads: null,
        CreatePublicThreads: null,
        CreatePrivateThreads: null,
      })
      .catch(async error => await errorEmbed({ interaction, error, forward: true })),
    modActionEmbed(
      {
        title: "Unlocked a channel.",
        body: [
          `**Moderator**: ${interaction.user.username}`,
          `**Channel**: ${channelOption ?? (await mention(channel.id, "CHANNEL"))}`,
        ],
      },
      guild,
      interaction,
    ),
  ]);
}
