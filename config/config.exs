import Config

config :gears_daily, ecto_repos: [GearsDaily.Repo]

config :gears_daily, GearsDaily.Repo, database: "priv/database.db"
