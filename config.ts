const configPath = Deno.env.get("CONFIG_PATH") ?? "./config.json";

export interface Chat {
  chat_id: string;
  thread_id?: string;
  silent?: boolean;
  forward?: boolean;
}

export interface Config {
  chats: Chat[];
  token?: string;
  offset?: number;
}

export default function getConfig(): Config {
  const rawConfig = Deno.readTextFileSync(configPath);
  const config = JSON.parse(rawConfig) as Config;
  const token = Deno.env.get("BOT_TOKEN");
  if (token) {
    config.token = token;
  }
  return config;
}
