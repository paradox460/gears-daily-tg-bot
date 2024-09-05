# Gears 5 Daily Telegram Bot

Lazy little bot for getting the Gears 5 daily post by [DrShwazzy92 on reddit](https://www.reddit.com/user/drshwazzy92) and posting it to a telegram channel/topic.

Written in Deno because I didn't want to think about it too hard, just wanted something that would work

## Configuration

Configuration is done _entirely_ through envars. You will need to bring a telegram bot token, a channel id, and a topic id. Then, using whatever system you want to set envars, set the following:

| Envar       | Description                                             |
| ----------- | ------------------------------------------------------- |
| `BOT_TOKEN` | Telegram BotFather bot token                            |
| `CHAT_ID`   | The ID of the chat you want the bot to send messages to |
| `THREAD_ID` | The thread/topic you want the messages to appear in     |

Upon running, the bot will boot up, scan for _new_ posts, update a file indicating its last scan time, send any new images to Telegram, and exit.

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
