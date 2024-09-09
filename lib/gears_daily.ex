defmodule GearsDaily do
  import Ecto.Query
  alias GearsDaily.Repo
  alias GearsDaily.Daily

  @epoch ~D[2024-03-13]
  def today_daily do
    day = Date.utc_today() |> Date.diff(@epoch)

    from(d in Daily, where: d.day == ^day, preload: ^~w[map horde_reward escape_reward mutator escape]a) |> Repo.one!()

  end
end
