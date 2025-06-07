import { getGuildLeaderboard } from "database/leveling";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { genColor } from "utils/colorGen";

export const data = new SlashCommandBuilder()
  .setName("leaderboard")
  .setDescription("Displays the guild leaderboard.")
  .addNumberOption(option => option.setName("page").setDescription("Page number to display."));

export async function run(interaction: ChatInputCommandInteraction) {
  const guildID = interaction.guild?.id;
  if (!guildID)
    return await errorEmbed({ interaction, title: "This command can only be used in a server." });

  const leaderboardData = getGuildLeaderboard(guildID);
  if (!leaderboardData.length)
    return await errorEmbed({
      interaction,
      title: "No data found.",
      reason: "There is no leveling data for this server yet.",
    });

  leaderboardData.sort((a, b) => {
    if (b.level != a.level) return b.level - a.level;
    else return b.xp - a.xp;
  });

  const totalPages = Math.ceil(leaderboardData.length / 6);
  let page = interaction.options.getNumber("page") || 1;
  page = Math.max(1, Math.min(page, totalPages));
  const generateEmbed = async () => {
    const start = (page - 1) * 6;
    const end = start + 6;
    const pageData = leaderboardData.slice(start, end);
    const embed = new EmbedBuilder()
      .setAuthor({ name: "Leaderboard" })
      .setColor(genColor(200))
      .setFooter({ text: `Page ${page}/${totalPages}` });

    for (let i = 0; i < pageData.length; i++) {
      const userData = pageData[i];
      const user = await interaction.client.users.fetch(userData.user);
      embed.addFields({
        name: `#${start + i + 1} • ${user.tag}`,
        value: `Level **${Math.floor(userData.level)}** • **${Math.floor(userData.xp)}** XP`,
      });
    }

    return embed;
  };

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
    embeds: [await generateEmbed()],
    components: totalPages > 1 ? [row] : [],
  });

  if (totalPages <= 1) return;
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
        title: "You are not the person who executed this command.",
      });

    collector.resetTimer({ time: 30000 });
    if (i.customId == "left") page = page > 1 ? page - 1 : totalPages;
    else page = page < totalPages ? page + 1 : 1;

    await i.update({
      embeds: [await generateEmbed()],
      components: [row],
    });
  });

  collector.on("end", async () => await interaction.editReply({ components: [] }));
}
