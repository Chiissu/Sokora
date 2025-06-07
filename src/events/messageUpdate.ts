import { getSetting } from "database/settings";
import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import { genColor } from "utils/colorGen";
import { logChannel } from "utils/logChannel";
import { pfpCheck } from "utils/pfpCheck";
import type { Event } from "utils/types";

// todo: make links work
const MESSAGE_LENGTH_CAP = 1024;
export default (async function run(oldMessage, newMessage) {
  if (oldMessage.partial) return;
  const author = oldMessage.author!;
  if (author.bot) return;

  const guild = oldMessage.guild!;
  if (!(await getSetting(guild.id, "moderation", "log_messages"))) return;

  const oldContent = oldMessage.content!;
  const newContent = newMessage.content!;
  if (oldContent == newContent) return;
  const oldLength = oldContent.length;
  const newLength = newContent.length;
  const avatar = author.displayAvatarURL();
  const embed = new EmbedBuilder()
    .setAuthor({
      name: `${pfpCheck(avatar)}${author.username} edited a message`,
      iconURL: avatar,
    })
    .setTimestamp(new Date())
    .addFields(
      {
        name: "🖋️ • Old message",
        value:
          oldLength <= MESSAGE_LENGTH_CAP
            ? oldContent
            : "*The old content of the message is an attachment below this embed due to it being too large.*",
      },
      {
        name: "🖊️ • New message",
        value:
          newLength <= MESSAGE_LENGTH_CAP
            ? newContent
            : `*The old content of the message is${oldContent.length > 4096 ? " also" : ""} an attachment below this embed due to it being too large.*`,
      },
    )
    .setFooter({ text: `User ID: ${author.id}` })
    .setColor(genColor(60));

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel("• Jump to message")
      .setURL(oldMessage.url)
      .setEmoji("🔗")
      .setStyle(ButtonStyle.Link),
  );

  const files: AttachmentBuilder[] = [];
  if (oldLength >= MESSAGE_LENGTH_CAP)
    files.push(new AttachmentBuilder(Buffer.from(oldContent, "utf8"), { name: "oldContent.txt" }));
  if (newLength >= MESSAGE_LENGTH_CAP)
    files.push(new AttachmentBuilder(Buffer.from(newContent, "utf8"), { name: "newContent.txt" }));

  await logChannel(guild, { embeds: [embed], files: files, components: [row] });
} as Event<"messageUpdate">);
