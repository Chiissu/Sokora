import { ShardingManager } from "discord.js";

const manager = new ShardingManager("./src/bot.ts", { token: process.env.TOKEN });
manager.on("shardCreate", shard => {
  shard.on("error", error => console.error(error));
  console.log(`Launched shard ${shard.id}!`);
});

await manager.spawn();
