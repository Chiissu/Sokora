import { ChartConfiguration } from "chart.js";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import {
  AttachmentBuilder,
  EmbedBuilder,
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import * as math from "mathjs";
import { genColor } from "utils/colorGen";

export const data = new SlashCommandSubcommandBuilder()
  .setName("graph")
  .setDescription("Graph a mathematical function")
  .addStringOption(option =>
    option
      .setName("function")
      .setDescription("The function to graph (e.g., 'x^2' or 'sin(x)')")
      .setRequired(true),
  )
  .addNumberOption(option => option.setName("xmin").setDescription("Minimum x value"))
  .addNumberOption(option => option.setName("xmax").setDescription("Maximum x value"))
  .addNumberOption(option => option.setName("ymin").setDescription("Minimum y value"))
  .addNumberOption(option => option.setName("ymax").setDescription("Maximum y value"));

export async function run(interaction: ChatInputCommandInteraction) {
  const func = interaction.options.getString("function", true);
  const xmin = interaction.options.getNumber("xmin") ?? -10;
  const xmax = interaction.options.getNumber("xmax") ?? 10;
  const ymin = interaction.options.getNumber("ymin") ?? -10;
  const ymax = interaction.options.getNumber("ymax") ?? 10;

  try {
    const compiled = math.compile(func);
    compiled.evaluate({ x: 0 });

    const chartJSNodeCanvas = new ChartJSNodeCanvas({
      width: 800,
      height: 600,
      backgroundColour: "#151515",
    });

    const points = 1000;
    const data = [];

    for (let i = 0; i <= points; i++) {
      const x = xmin + (i * (xmax - xmin)) / points;
      try {
        const y = compiled.evaluate({ x });
        if (typeof y == "number" && isFinite(y)) data.push({ x, y });
      } catch {
        continue;
      }
    }

    const configuration: ChartConfiguration = {
      type: "line",
      data: {
        datasets: [
          {
            label: `f(x) = ${func}`,
            data: data,
            borderColor: "#ff0000",
            borderWidth: 4,
            pointRadius: 0,
            fill: false,
            tension: 0,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          x: {
            type: "linear" as const,
            position: "center" as const,
            min: xmin,
            max: xmax,
            grid: {
              color: "#ffffff",
              lineWidth: 2,
            },
            ticks: {
              color: "#ffffff",
            },
          },
          y: {
            type: "linear" as const,
            position: "center" as const,
            min: ymin,
            max: ymax,
            grid: {
              color: "#ffffff",
              lineWidth: 2,
            },
            ticks: {
              color: "#ffffff",
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
        },
      },
    };

    const attachment = new AttachmentBuilder(
      await chartJSNodeCanvas.renderToBuffer(configuration),
      { name: "graph.png" },
    );

    const embed = new EmbedBuilder()
      .setAuthor({ name: "Function graph" })
      .setDescription(`\`f(x) = ${func}\``)
      .setImage("attachment://graph.png")
      .setColor(genColor(200));

    await interaction.reply({ embeds: [embed], files: [attachment] });
  } catch {
    return await errorEmbed({
      interaction,
      title: "Invalid function.",
      reason: 'Please provide a valid mathematical function. Examples: "x^2", "sin(x)", "2*x + 1".',
    });
  }
}
