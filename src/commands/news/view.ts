import { listAllNews } from "database/news";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { genColor } from "utils/colorGen";
import { pfpCheck } from "utils/pfpCheck";

export const data = new SlashCommandSubcommandBuilder()
  .setName("view")
  .setDescription("View the news of this server.")
  .addNumberOption(number =>
    number.setName("page").setDescription("The page of the news that you want to see."),
  );

export async function run(interaction: ChatInputCommandInteraction) {
  let page = interaction.options.getNumber("page") ?? 1;
  if (!interaction.guild)
    return await errorEmbed({
      interaction,
      title: "Error viewing news.",
      reason: "This command can only be used in a server.",
    });

  const news = listAllNews(interaction.guild.id);
  const sortedNews = (Object.values(news) as any[])?.sort((a, b) => b.createdAt - a.createdAt);

  if (!news || !sortedNews || !sortedNews.length)
    return await errorEmbed({
      interaction,
      title: "No news found.",
      reason: "Admins can add news with the **/news add** command.",
    });

  if (page > sortedNews.length) page = sortedNews.length;
  if (page < 1) page = 1;

  function getEmbed() {
    const currentNews = sortedNews[page - 1];
    const avatar = currentNews.authorPFP;
    return new EmbedBuilder()
      .setAuthor({ name: `${pfpCheck(avatar)}${currentNews.author}`, iconURL: avatar })
      .setTitle(currentNews.title)
      .setDescription(currentNews.body)
      .setImage(currentNews.imageURL || null)
      .setTimestamp(parseInt(currentNews.updatedAt))
      .setFooter({ text: `Page ${page} of ${sortedNews.length} • ID: ${currentNews.id}` })
      .setColor(genColor(200));
  }

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("left")
      .setEmoji("1298708251256291379")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("right")
      .setEmoji("1298708281493160029")
      .setStyle(ButtonStyle.Primary),
  );

  // todo: prevent unknown error when deleting
  const reply = await interaction.reply({
    embeds: [getEmbed()],
    components: page >= 1 ? [row] : [],
  });

  if (page < 1) return;
  const collector = reply.createMessageComponentCollector({ time: 30000 });
  collector.on("collect", async (i: ButtonInteraction) => {
    if (i.message.id != (await reply.fetch()).id)
      return await errorEmbed({
        interaction: i,
        title:
          "For some reason, this click would've caused the bot to error. Thankfully, this message right here prevents that.",
      });

    if (i.user.id != interaction.user.id)
      return await errorEmbed({
        interaction: i,
        title: "You aren't the person who executed this command.",
      });

    collector.resetTimer({ time: 30000 });
    switch (i.customId) {
      case "left":
        page--;
        if (page < 1) page = sortedNews.length;
        await i.update({ embeds: [getEmbed()], components: [row] });
        break;
      case "right":
        page++;
        if (page > sortedNews.length) page = 1;
        await i.update({ embeds: [getEmbed()], components: [row] });
        break;
    }
  });

  collector.on("end", async () => await interaction.editReply({ components: [] }));
}
