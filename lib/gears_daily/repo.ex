defmodule GearsDaily.Repo do
  use Ecto.Repo,
    otp_app: :gears_daily,
    adapter: Ecto.Adapters.SQLite3
end
