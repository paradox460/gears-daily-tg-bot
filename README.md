# Gears 5 Daily Telegram Bot

Lazy little bot for getting the Gears 5 daily post by [DrShwazzy92 on reddit](https://www.reddit.com/user/drshwazzy92) and posting it to a telegram channel/topic.

Written in Deno because I didn't want to think about it too hard, just wanted something that would work

## Configuration

Write a config file at `./config.json`, relative to the bots path. The file should look something like this:

```json
{
  "token": "your_telegram_token_here (optionally, you can use envar too)",
  "chats": [
    {
      "chat_id": "12345",
      "thread_id": "67890"
    },
    {
      "chat_id": "3456",
      "thread_id": "9876",
      "silent": true,
      "forward": true
    }
  ]
}
```

[A json-schema is provided for your reference](https://raw.githubusercontent.com/paradox460/gears-daily-tg-bot/master/config-schema.json)

You can change the path the bot will look for the config file by setting the `CONFIG_PATH` envar.

You _must_ also provide a telegram bot token. You can do so in the config file, under the `token` key, or you can set the `BOT_TOKEN` envar.

## SystemD timers example

Dr.Shwazzy doesn't post the dailies too far in advance, so if you run the bot every day a few hours before the daily turn-over (1800 UTC), you'll get a nice message telling you what awaits you. You can do this rather simply using systemd timers:

```service
[Unit]
Description="Gears of war posting bot"

[Service]
ExecStart=/home/gearsbot/gears_bot
EnvironmentFile=/home/gearsbot/gears_bot_env
User=gearsbot
Group=gearsbot
WorkingDirectory=~
```

```service
[Unit]
Description="Run Gears Bot Daily"

[Timer]
OnCalendar=*-*-* 11:00:00

[Install]
WantedBy=timers.target
```

Edit those as appropriate, stick those in `/etc/systemd/system/`, enable the timer, and then relax. The `EnvironmentFile` key is particularly useful, lets you keep the bot envars close to the bot itself.

## Building

Pretty simple Deno builds, but to prevent having to remember all the `--allow-`s, I wrote a few [mise](https://mise.jdx.dev/tasks/) tasks. Read the mise docs on how to enable them, and then you can run

```sh
mise run build:default
```

You can also just run it as a script, which is lighter-weight:

```sh
deno run bot.ts
```
