import { addNews, listAllQuery } from "database/news";
import {
  ActionRowBuilder,
  EmbedBuilder,
  ModalBuilder,
  SlashCommandSubcommandBuilder,
  TextInputBuilder,
  TextInputStyle,
  type ChatInputCommandInteraction,
} from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { genColor } from "utils/colorGen";
import { replaceVariables } from "utils/replace";
import { sendChannelNews } from "utils/sendChannelNews";

export const data = new SlashCommandSubcommandBuilder()
  .setName("add")
  .setDescription("Add your news.");

export async function run(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild!;
  if (!guild.members.cache.get(interaction.user.id)?.permissions.has("ManageGuild"))
    return await errorEmbed({
      interaction,
      title: "You can't execute this command.",
      reason: "You need the **Manage Server** permission.",
    });

  const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    new TextInputBuilder()
      .setCustomId("title")
      .setPlaceholder("Write a title")
      .setMaxLength(100)
      .setStyle(TextInputStyle.Short)
      .setLabel("Title")
      .setRequired(true),
  );

  const secondActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    new TextInputBuilder()
      .setCustomId("body")
      .setPlaceholder("Insert your content here")
      .setMaxLength(4000)
      .setStyle(TextInputStyle.Paragraph)
      .setLabel("Content (supports Markdown)")
      .setRequired(true),
  );

  const newsModal = new ModalBuilder()
    .setCustomId("addnews")
    .setTitle("Write your news.")
    .addComponents(firstActionRow, secondActionRow);

  await interaction
    .showModal(newsModal)
    .catch(async error => await errorEmbed({ interaction, error, forward: true }));

  interaction.client.once("interactionCreate", async i => {
    if (!i.isModalSubmit()) return;

    const title = await replaceVariables(
      i.fields.getTextInputValue("title"),
      interaction.guild!,
      interaction.user,
    );

    const body = await replaceVariables(
      i.fields.getTextInputValue("body"),
      interaction.guild!,
      interaction.user,
    );

    const id = (listAllQuery.all(guild.id).length + 1).toString();
    addNews(guild.id, title, body, i.user.displayName, i.user.avatarURL()!, null!, id);

    await sendChannelNews(guild, id, interaction).catch(
      async error => await errorEmbed({ interaction, error, forward: true }),
    );

    await i.reply({
      embeds: [new EmbedBuilder().setTitle("News added.").setColor(genColor(100))],
      flags: "Ephemeral",
    });
  });
}
