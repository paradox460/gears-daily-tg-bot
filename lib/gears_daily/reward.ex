defmodule GearsDaily.Reward do
  use Ecto.Schema
  import Ecto.Changeset

  @type t :: %__MODULE__{}

  schema "rewards" do
    field(:reward, :string)
    has_many :horde_dailies, GearsDaily.Daily, foreign_key: :horde_reward_id
    has_many :escape_dailies, GearsDaily.Daily, foreign_key: :escape_reward_id
  end

  def changeset(params), do: changeset(%__MODULE__{}, params)

  def changeset(reward, params) do
    reward
    |> cast(params, [:reward])
    |> validate_required([:reward])
    |> unique_constraint(:reward)
  end
end
