import { check } from "database/blocklist";
import { SlashCommandSubcommandBuilder } from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { commands, subCommands } from "handlers/commands";
import { noErrorsPlease } from "utils/noErrorsPlease";
import type { Event } from "utils/types";

export default (async function run(interaction) {
  if (!interaction.isChatInputCommand() && !interaction.isAutocomplete()) return;
  let command;
  const subCommand = subCommands.filter(subCommand =>
    subCommand.data instanceof SlashCommandSubcommandBuilder
      ? subCommand.data.name == interaction.options.getSubcommand(false)
      : subCommand.data.name == interaction.options.getSubcommandGroup(false),
  )[0];

  if (!subCommand)
    command = commands.filter(command => command.data.name == interaction.commandName)[0];
  else command = subCommand;

  if (!command) return;
  if (interaction.isChatInputCommand()) {
    if (!interaction.member || !check(interaction.member.user.id!))
      return await errorEmbed({
        interaction,
        title: "The bot has experienced an internal error.",
        reason: "Please try again later.",
      });

    await noErrorsPlease(interaction);
    command.run(interaction);
  }
  if (command.autocomplete) command.autocomplete(interaction);
} as Event<"interactionCreate">);
