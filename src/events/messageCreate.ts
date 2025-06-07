import { add, check, remove } from "database/blocklist";
import { getLevel, setLevel } from "database/leveling";
import { getSetting } from "database/settings";
import { EmbedBuilder, type TextChannel } from "discord.js";
import { errorEmbed } from "embeds/errorEmbed.ts";
import { easterEggs } from "handlers/events.ts";
import { genColor } from "utils/colorGen";
import { kominator } from "utils/kominator";
import { leavePlease } from "utils/leavePlease";
import { mention } from "utils/mention.ts";
import { pfpCheck } from "utils/pfpCheck.ts";
import { Event } from "utils/types";

const cooldowns = new Map<string, number>();
export default (async function run(message) {
  const client = message.client;
  if (message.content.startsWith("!SYSTEM")) {
    if (message.author.id != process.env.OWNER) return;
    const args = message.content.split(" ");
    if (!args[2]) return message.reply("ERROR: Expected three arguments.");
    const username = (await client.users.fetch(args[2])).username;

    switch (args[1]) {
      case "add": {
        add(args[2]);
        await message.reply(`${username} has been blocklisted from Sokora.`);

        const guilds = client.guilds.cache;
        for (const id of guilds.keys()) {
          const guild = guilds.get(id);
          if (!guild) {
            await errorEmbed({
              client,
              title: "Failed to blocklist guild.",
              reason: `Guild ${id} not found`,
            });
            continue;
          }
          await leavePlease(guild, await guild.fetchOwner(), "No.");
        }
        break;
      }
      case "remove":
        remove(args[2]);
        await message.reply(`${username} has been removed from the Sokora blocklist.`);
        break;
      case "check":
        await message.reply(`${!check(args[2])}`);
        break;
      default:
        await message.reply(
          "Hello, this is the system interface to control top level Sokora moderation utilities.",
        );
    }
  }

  const author = message.author;
  if (author.bot) return;
  if (!check(author.id)) return;
  const guild = message.guild!;
  const avatar = author.displayAvatarURL();

  if (await getSetting(guild.id, "easter", "enabled")) {
    const enabledEggs = (await getSetting(guild.id, "easter", "enabled_eggs")) as string;
    const allowedChannels = (await getSetting(guild.id, "easter", "allowed_channels")) as string;
    const isChannelAllowed =
      !allowedChannels ||
      allowedChannels
        .split(",")
        .map(id => id.trim())
        .includes(message.channel.id);

    if (isChannelAllowed) {
      for (const easterEgg of easterEggs) {
        const shouldRunEgg =
          !enabledEggs ||
          enabledEggs
            .split(",")
            .map(egg => egg.trim())
            .includes(easterEgg.name);

        if (!shouldRunEgg) continue;
        try {
          if (typeof easterEgg.run != "function") {
            await errorEmbed({
              client,
              title: `Easter egg ${easterEgg.name} does not have a valid run function: ${easterEgg}.`,
              log: true,
              forward: true,
            });
            continue;
          }

          await easterEgg.run(message);
        } catch (error) {
          return await errorEmbed({
            client,
            error,
            title: `Error running easter egg ${easterEgg.name}`,
            log: true,
            forward: true,
          });
        }
      }
    }
  }

  if (!(await getSetting(guild.id, "leveling", "enabled"))) return;
  const blockedChannels = (await getSetting(guild.id, "leveling", "block_channels")) as string;
  if (blockedChannels != undefined)
    for (const channelID of kominator(blockedChannels)) if (message.channelId == channelID) return;

  const cooldown = (await getSetting(guild.id, "leveling", "cooldown")) as number;
  if (cooldown > 0) {
    const key = `${guild.id}-${author.id}`;
    const lastExpTime = cooldowns.get(key) || 0;
    const now = Date.now();

    if (now - lastExpTime < cooldown * 1000) return;
    cooldowns.set(key, now);
  }

  const xpGain = (await getSetting(guild.id, "leveling", "xp_gain")) as number;
  const levelChannelId = await getSetting(guild.id, "leveling", "channel");
  const difficulty = (await getSetting(guild.id, "leveling", "difficulty")) as number;
  const [level, xp] = getLevel(guild.id, author.id);
  const newLevelData = { level: level ?? 0, xp: xp + xpGain };

  while (
    newLevelData.xp <
    100 * difficulty * (newLevelData.level + 1) ** 2 - 80 * difficulty * newLevelData.level ** 2
  )
    newLevelData.level--;

  while (
    newLevelData.xp >=
    100 * difficulty * (newLevelData.level + 1) ** 2 - 80 * difficulty * newLevelData.level ** 2
  )
    newLevelData.level++;

  setLevel(guild.id, author.id, newLevelData.level, newLevelData.xp);
  if (newLevelData.level == level || newLevelData.level < level) return;
  const embed = new EmbedBuilder()
    .setAuthor({
      name: `${pfpCheck(avatar)}${author.displayName} leveled up!`,
      iconURL: avatar,
    })
    .setDescription(
      [
        `**Congratulations, ${author.displayName}**!`,
        `You made it to **level ${newLevelData.level}**.`,
        `You need ${
          100 * difficulty * (newLevelData.level + 1) ** 2 -
          80 * difficulty * newLevelData.level ** 2
        } XP to level up again.`,
      ].join("\n"),
    )
    .setTimestamp()
    .setColor(genColor(200));

  if (levelChannelId)
    await (guild.channels.cache.get(`${levelChannelId}`) as TextChannel).send({
      embeds: [embed],
      content: await mention(author.id, "USER"),
    });
} as Event<"messageCreate">);
