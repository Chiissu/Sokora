import { get, updateNews } from "database/news";
import { getSetting } from "database/settings";
import {
  ActionRowBuilder,
  EmbedBuilder,
  ModalBuilder,
  SlashCommandSubcommandBuilder,
  TextInputBuilder,
  TextInputStyle,
  type ChatInputCommandInteraction,
  type Role,
  type TextChannel,
} from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { genColor } from "utils/colorGen";
import { mention } from "utils/mention";
import { pfpCheck } from "utils/pfpCheck";
import { sendChannelNews } from "utils/sendChannelNews";

export const data = new SlashCommandSubcommandBuilder()
  .setName("edit")
  .setDescription("Edits the news of your guild.")
  .addStringOption(string =>
    string.setName("id").setDescription("The ID of the news you want to edit.").setRequired(true),
  );

export async function run(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild!;
  if (!guild.members.cache.get(interaction.user.id)?.permissions.has("ManageGuild"))
    return await errorEmbed({
      interaction,
      title: "You can't execute this command.",
      reason: "You need the **Manage Server** permission.",
    });

  const id = interaction.options.getString("id")!;
  const news = get(guild.id, id);
  if (!news) return await errorEmbed({ interaction, title: "The specified news don't exist." });

  const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    new TextInputBuilder()
      .setCustomId("title")
      .setMaxLength(100)
      .setStyle(TextInputStyle.Short)
      .setLabel("Title")
      .setValue(news.title)
      .setRequired(true),
  );

  const secondActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    new TextInputBuilder()
      .setCustomId("body")
      .setMaxLength(4000)
      .setStyle(TextInputStyle.Paragraph)
      .setLabel("Content (supports Markdown)")
      .setValue(news.body)
      .setRequired(true),
  );

  const editModal = new ModalBuilder()
    .setCustomId("editnews")
    .setTitle(`Edit news: ${news.title}`)
    .addComponents(firstActionRow, secondActionRow);

  await interaction
    .showModal(editModal)
    .catch(async error => await errorEmbed({ interaction, error, forward: true }));

  interaction.client.once("interactionCreate", async i => {
    if (!i.isModalSubmit()) return;

    const role = (await getSetting(guild.id, "news", "role_id")) as string;
    let roleToSend: Role | undefined;
    if (role) roleToSend = guild.roles.cache.get(role);
    const title = i.fields.getTextInputValue("title");
    const body = i.fields.getTextInputValue("body");
    const avatar = news.authorPFP;

    if (!(await getSetting(guild.id, "news", "edit_original_message")))
      await sendChannelNews(guild, id, interaction, title, body);

    const embed = new EmbedBuilder()
      .setAuthor({ name: `${pfpCheck(avatar)}${news.author}`, iconURL: avatar })
      .setTitle(title)
      .setDescription(body)
      .setTimestamp(parseInt(news.updatedAt.toString()) ?? null)
      .setFooter({ text: `Edited news from ${guild.name}\nID: ${news.id}` })
      .setColor(genColor(200));

    const channel = guild.channels.cache.get(
      ((await getSetting(guild.id, "news", "channel_id")) as string) ?? interaction.channel?.id,
    ) as TextChannel;

    await channel.messages.edit(news.messageID, {
      embeds: [embed],
      content: roleToSend ? await mention(roleToSend.id, "ROLE") : undefined,
    });

    updateNews(guild.id, id, title, body);
    await i.reply({
      embeds: [new EmbedBuilder().setTitle("News edited.").setColor(genColor(100))],
      flags: "Ephemeral",
    });
  });
}
