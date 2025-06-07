import {
  EmbedBuilder,
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { genColor } from "utils/colorGen";
import { replaceVariables } from "utils/replace";

export const data = new SlashCommandSubcommandBuilder()
  .setName("variables")
  .setDescription("Show a list of (variables) used to dynamically show data on certain messages");

export async function run(interaction: ChatInputCommandInteraction) {
  const example = `Welcome to (servername), **(name)**!`;
  const exampleTwo = `Hi **(username)**! Thanks for joining *(servername)* at (currentdate, simple), **(serverowner)** and the ***(count)*** members are happy to meet you!`;
  const embed = new EmbedBuilder()
    .setAuthor({ name: "Dynamic (variables)" })
    .setDescription(
      "You can write the following variables in some places to dynamically show certain pieces of data. Data like 'current time' or 'member count' always refer to what that value is at the moment of sending the specific message. Dynamic variables are currently supported for **join messages, leave messages, join DMs, and news.**",
    )
    .setColor(genColor(200))
    .setFields([
      {
        name: "Simple example",
        value: [
          `A simple example: \`${example}\` will result in:\n`,
          `> ${await replaceVariables(example, interaction.guild!, interaction.user)}`,
        ].join("\n"),
      },
      {
        name: "Another example",
        value: [
          `Adding more stuff: \`${exampleTwo}\` will result in:\n`,
          `> ${await replaceVariables(exampleTwo, interaction.guild!, interaction.user)}`,
        ].join("\n"),
      },
      {
        name: "All variables",
        value: [
          `\`(name)\` - display name of the user who joined`,
          `\`(username)\` - username of the user who joined`,
          `\`(count)\` - member count`,
          `\`(servername)\` - name of this server`,
          `\`(serverowner)\` - ${
            interaction.member?.user.id == interaction.guild?.ownerId
              ? "your name!"
              : "name of this server's owner"
          }`,
          `\`(currentdate)\` - current date in the 'July 10, 2025' format`,
          `\`(currentdate, simple)\` - current date in the '7/10/25' format`,
          `\`(currentdate, detailed)\` - current date in the 'July 10, 2025, at 1:11 PM' format`,
        ].join("\n"),
      },
    ]);

  await interaction.reply({ embeds: [embed] });
}
