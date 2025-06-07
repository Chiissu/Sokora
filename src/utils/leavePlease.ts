import { check } from "database/blocklist";
import { EmbedBuilder, type DMChannel, type Guild, type GuildMember } from "discord.js";
import { genColor } from "./colorGen";

export async function leavePlease(guild: Guild, owner: GuildMember, embedText?: string) {
  if (check(owner.id)) return;
  if (embedText) {
    const dmChannel = (await owner.createDM().catch(() => null)) as DMChannel | undefined;
    if (dmChannel)
      await dmChannel.send({
        embeds: [new EmbedBuilder().setTitle(embedText).setColor(genColor(0))],
      });
  }

  return await guild.leave();
}
