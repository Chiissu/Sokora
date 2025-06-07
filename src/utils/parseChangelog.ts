/**
 * Takes a MarkDown string that follows Sokora's CHANGELOG format and turns it into an array of Discord's-limited-markdown-friendly strings containing the changelog of each release.
 *
 * @export
 * @param {string} string MarkDown string.
 * @returns {{ ver: string, changelog: string }[]} Parsed strings.
 */
export function parseChangelogString(string: string): { ver: string; changelog: string }[] {
  const array = string
    .split(/(?=^##\s+\d+\.\d+\.\d+)/gm) // this regexp delimits versions
    .map(s => s.trim());

  const versions: { ver: string; changelog: string }[] = [];

  for (const version of array) {
    if (version.includes("Sokora Changelog")) continue; // skip heading

    const cleanArray = version
      .split("\n")
      .filter(s => Boolean(s) && s.trim() != "" && !s.trim().startsWith("<!--"))
      .map(s => s.replace("##", "#"));

    versions.push({
      ver: cleanArray.join("\n").split("##")[0].trim().replace("# ", ""),
      changelog: cleanArray.join("\n"),
    });
  }

  return versions;
}
