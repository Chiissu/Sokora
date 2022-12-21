const { Client, ActivityType, Collection } = require("discord.js");
const Events = require("./handlers/events");
const Commands = require("./handlers/commands");
const Subcommands = require("./handlers/subcommands");
const chalk = require("chalk");
require("dotenv").config();

const client = new Client({
  presence: {
    activities: [{ name: 'everyone!', type: ActivityType.Listening }]
  },
  intents: [
    "Guilds",
    "GuildMembers",
    "GuildMessages",
    "GuildEmojisAndStickers"
  ]
});

client.commands = new Collection();
client.subcommands = new Collection();
client.on("ready", () => {
  const commands = new Commands(client);
  const subcommands = new Subcommands(client)
  new Events(client, commands, subcommands);
  
  console.log(chalk.green("Start completed. Bot has been alive'd."));
});

client.login(process.env.ENTITY_CANARY);
