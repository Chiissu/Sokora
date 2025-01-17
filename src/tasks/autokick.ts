import { Client, EmbedBuilder, Guild, GuildMember } from "discord.js";
import { getAutokickSettings, trackActivityAdd, getAutokickData } from "../utils/database/autokick";
import { logChannel } from "../utils/logChannel";
import { genColor } from "../utils/colorGen";

export async function checkAutokicks(client: Client) {
  for (const guild of client.guilds.cache.values()) {
    const autokickSettings = await getAutokickSettings(guild);
    if (!autokickSettings) continue;

    try {
      await processInactivityAutokicks(guild, autokickSettings.threshold);
    } catch (error) {
      console.error(`Error processing autokicks for guild ${guild.id}:`, error);
    }
  }
}

async function processInactivityAutokicks(guild: Guild, threshold: number) {
  const delayMs = threshold * 24 * 60 * 60 * 1000;
  const now = Date.now();

  try {
    const members = await guild.members.fetch();
    const inactiveMembers = members.filter(member => !member.presence?.status);

    for (const member of inactiveMembers.values()) {
      const autokickData = getAutokickData(guild.id, member.id);
      if (!autokickData) continue;

      const joinDate = member.joinedTimestamp;
      if (joinDate && (now - joinDate >= delayMs)) {
        try {
          await kickMember(member, `Was inactive for ${threshold} days`, joinDate);
        } catch (error) {
          console.error(`Failed to auto-kick member ${member.id} from guild ${guild.id}:`, error);
        }
      }
    }

    for (const member of members.values()) {
      await trackActivityAdd(member);
    }
  } catch (error) {
    console.error(`Error processing activity checks for guild ${guild.id}:`, error);
  }
}

async function kickMember(member: GuildMember, reason: string, timestamp: number) {
  await member.kick(reason);

  const embed = new EmbedBuilder()
    .setAuthor({ name: "Member Auto-kicked" })
    .setDescription(
      [
        `**Member**: ${member.user.tag}`,
        `**Reason**: ${reason}`,
        `**Join Date**: <t:${Math.floor(timestamp / 1000)}:F>`
      ].join("\n")
    )
    .setColor(genColor(100));

  await logChannel(member.guild, embed);
}