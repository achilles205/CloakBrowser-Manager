import type { Profile, ProfileCreateData } from "./api";

function nextCloneName(sourceName: string, existingNames: Iterable<string>) {
  const names = new Set(Array.from(existingNames, (name) => name.trim().toLowerCase()));
  const firstName = `${sourceName} (Clone)`;
  if (!names.has(firstName.toLowerCase())) return firstName;

  let suffix = 2;
  while (names.has(`${sourceName} (Clone ${suffix})`.toLowerCase())) suffix += 1;
  return `${sourceName} (Clone ${suffix})`;
}

/** Copy configuration only. Runtime state and browser data are deliberately excluded. */
export function profileToCloneData(
  source: Profile,
  existingNames: Iterable<string>,
): ProfileCreateData {
  return {
    name: nextCloneName(source.name, existingNames),
    fingerprint_seed: source.fingerprint_seed,
    proxy: source.proxy,
    timezone: source.timezone,
    locale: source.locale,
    platform: source.platform,
    user_agent: source.user_agent,
    screen_width: source.screen_width,
    screen_height: source.screen_height,
    gpu_vendor: source.gpu_vendor,
    gpu_renderer: source.gpu_renderer,
    hardware_concurrency: source.hardware_concurrency,
    humanize: source.humanize,
    human_preset: source.human_preset,
    headless: source.headless,
    geoip: source.geoip,
    clipboard_sync: source.clipboard_sync,
    auto_launch: source.auto_launch,
    color_scheme: source.color_scheme,
    launch_args: [...source.launch_args],
    notes: source.notes,
    tags: source.tags.map((tag) => ({ ...tag })),
  };
}
