import { ColorResolvable } from "discord.js";
import Vibrant from "node-vibrant";
import sharp from "sharp";
import { kominator } from "./kominator";

/**
 * Randomizes a color and outputs HEX.
 * @param hue Hue of the color to randomize. `0` and `360` are red, `120` is green, `240` is blue. Value should be between `0` and `360`.
 * @returns Color in HEX.
 */
export function genColor(hue: number): ColorResolvable {
  return Bun.color(
    `hsl(${hue + 15 * Math.random()}, ${80 + 20 * Math.random()}%, ${60 + 15 * Math.random()}%)`,
    "hex",
  ) as ColorResolvable;
}

/**
 * Outputs the most vibrant color from the image.
 * @param {?string} guildURL Guild image URL.
 * @param {?string} memberURL Member image URL.
 * @returns {Promise<ColorResolvable | undefined>} The color in HEX, or undefined if both URLs are missing.
 */
export async function genImageColor(
  guildURL?: string,
  memberURL?: string,
): Promise<ColorResolvable | undefined> {
  if (!guildURL || !memberURL) return;

  const imageBuffer = await (await fetch(guildURL ?? memberURL)).arrayBuffer();
  const { r, g, b } = (
    await new Vibrant(await sharp(imageBuffer).toFormat("jpg").toBuffer()).getPalette()
  ).Vibrant!;
  const hsl = kominator(Bun.color([r, g, b], "hsl")!);
  const h = Math.round(parseInt(hsl[0].replace("hsl(", "")) + 15 * Math.random());
  const l = Math.round(parseFloat(hsl[2].replace(")", "")) * 100 + 15 * Math.random());

  return Bun.color(`hsl(${h}, 100%, ${l}%)`, "hex") as ColorResolvable;
}
