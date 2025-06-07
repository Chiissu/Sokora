import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { errorEmbed } from "embeds/errorEmbed.ts";
import { genColor } from "utils/colorGen.ts";
import { pfpCheck } from "utils/pfpCheck.ts";
import { randomize } from "utils/randomize.ts";

type RPSChoice = "rock" | "paper" | "scissors";
const rpsChoices: RPSChoice[] = ["rock", "paper", "scissors"];
const rpsEmojis: Record<RPSChoice, string> = {
  rock: "🪨",
  paper: "📄",
  scissors: "✂️",
};

export const data = new SlashCommandSubcommandBuilder()
  .setName("rps")
  .setDescription("Play rock paper scissors.")
  .addUserOption(option => option.setName("opponent").setDescription("The user to play against."));

function getWinner(choice1: RPSChoice, choice2: RPSChoice): 0 | 1 | 2 {
  if (choice1 == choice2) return 0;
  if (
    (choice1 == "rock" && choice2 == "scissors") ||
    (choice1 == "paper" && choice2 == "rock") ||
    (choice1 == "scissors" && choice2 == "paper")
  )
    return 1;
  return 2;
}

export async function run(interaction: ChatInputCommandInteraction) {
  let opponent = interaction.options.getUser("opponent");
  if (!opponent) opponent = interaction.client.user;
  const user = interaction.user;
  const userAvatar = user.displayAvatarURL();
  const optionsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    ...rpsChoices.map((choice: RPSChoice) =>
      new ButtonBuilder()
        .setCustomId(`rps_${choice}`)
        .setEmoji(rpsEmojis[choice])
        .setStyle(ButtonStyle.Primary),
    ),
  );

  const baseEmbed = new EmbedBuilder()
    .setAuthor({ name: `${pfpCheck(userAvatar)}An invitation to play!`, iconURL: userAvatar })
    .setDescription(
      opponent.bot
        ? `Choose your weapon!`
        : `${user.username} has challenged ${opponent.username} to a game!\nBoth players, make your choice!`,
    )
    .setColor(genColor(60));

  if (opponent.id == user.id)
    return await errorEmbed({
      interaction,
      title: "Invalid opponent.",
      reason: "You cannot play against yourself.",
    });

  // todo: prevent unknown error when deleting
  const reply = await interaction.reply({ embeds: [baseEmbed], components: [optionsRow] });
  const playerChoices = new Map<string, RPSChoice>();
  const collector = reply.createMessageComponentCollector({ time: 60000 });

  collector.on("collect", async (i: ButtonInteraction) => {
    if (!reply) return;
    if (i.message.id != (await reply.fetch()).id)
      return await errorEmbed({
        interaction: i,
        title:
          "For some reason, this click would've caused the bot to error. Thankfully, this message right here prevents that.",
      });

    if (i.user.id != opponent.id && i.user.id != user.id)
      return await errorEmbed({ interaction: i, title: "You aren't participating.." });

    playerChoices.set(i.user.id, i.customId.split("_")[1] as RPSChoice);
    if (!opponent.bot) {
      await i.reply({
        embeds: [new EmbedBuilder().setTitle("Choice recorded!").setColor(genColor(120))],
        flags: "Ephemeral",
      });
      if (playerChoices.size == 2) collector.stop("game-complete");
    } else collector.stop("game-complete");
  });

  collector.on("end", async (_, reason) => {
    if (reason == "time")
      return await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setAuthor({ name: "Game timed out" })
            .setDescription("The game has been canceled due to inactivity.")
            .setColor(genColor(0)),
        ],
        components: [],
      });

    const p1Choice = playerChoices.get(user.id)!;
    const p2Choice = opponent.bot ? randomize(rpsChoices) : playerChoices.get(opponent.id)!;
    const winner = getWinner(p1Choice, p2Choice);
    const avatar = winner == 1 ? userAvatar : opponent.displayAvatarURL();
    const resultEmbed = new EmbedBuilder()
      .setAuthor({ name: `${pfpCheck(avatar)}Game results`, iconURL: avatar })
      .setDescription(
        [
          `**${user.username}**: ${rpsEmojis[p1Choice]}`,
          `**${opponent.username}**: ${rpsEmojis[p2Choice]}\n`,
          `${winner == 0 ? "**It's a tie!**" : winner == 1 ? `The winner is **${user.username}**!` : `The winner is **${opponent.username}**!`}`,
        ].join("\n"),
      )
      .setColor(winner == 0 ? genColor(60) : genColor(120));

    await interaction.editReply({ embeds: [resultEmbed], components: [] });
  });
}
