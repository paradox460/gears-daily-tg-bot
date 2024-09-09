# Gears 5 Daily Telegram Bot

Little bot that posts the next Gears 5 Horde and Escape daily to a telegram
channel: https://t.me/gearsdaily

Written in Deno because I didn't want to think about it too hard, just wanted
something that would work.

## How it works

The Gears 5 Daily horde and escape events follow a 401 day long rotation. Within
that rotation, they are psuedo-randomly distributed, and there are no emergent
patterns. But after 401 days, the cycle resets.

This bot contains a SQLite database that has these 401 unique combos, and just
calculates the current date's offset from the epoch of its database.

## Configuration

Write a config file at `./config.json`, relative to the bots path. The file
should look something like this:

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

You can change the path the bot will look for the config file by setting the
`CONFIG_PATH` envar.

You _must_ also provide a telegram bot token. You can do so in the config file,
under the `token` key, or you can set the `BOT_TOKEN` envar.

## SystemD timers example

Set this to run whenever you want the bot to actually run. You might have to
fudge timezones a bit, depending on what part of the world you're in, as it
tries to fetch the _next_ daily, which starts/turns over at 1900 UTC

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
OnCalendar=*-*-* 00:00:00

[Install]
WantedBy=timers.target
```

Edit those as appropriate, stick those in `/etc/systemd/system/`, enable the
timer, and then relax. The `EnvironmentFile` key is particularly useful, lets
you keep the bot envars close to the bot itself.

## Building

Pretty simple Deno builds, since the sqlite uses unsafe-ffi, I allow-all. I
wrote a few [mise](https://mise.jdx.dev/tasks/) tasks to make it easier to run
the compiler. Read the mise docs on how to enable them, and then you can run

```sh
mise run build:default
```

You can also just run it as a script, which is lighter-weight:

```sh
deno run bot.ts
```

## SQL Database

The SQLite3 database, located under `database.db`, was created using some custom
code on the `elixir` branch of this repo, and would not have been possible
without Dr.Shwazz providing me with the excel sheet of the daily rotations.
