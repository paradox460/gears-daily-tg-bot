defmodule GearsDaily.Daily do
  use Ecto.Schema
  import Ecto.Changeset

  @type t :: %__MODULE__{}

  schema "dailies" do
    field :day, :integer

    belongs_to :map, GearsDaily.Map
    belongs_to :horde_reward, GearsDaily.Reward
    belongs_to :escape_reward, GearsDaily.Reward
    belongs_to :mutator, GearsDaily.Mutator
    belongs_to :escape, GearsDaily.Escape
  end

  def changeset(params), do: changeset(%__MODULE__{}, params)

  def changeset(daily, params) do
    daily
    |> cast(params, [:day, :map, :horde_reward, :escape_reward, :mutator, :escape])
    |> validate_required([:day])
    |> unique_constraint(:day)
  end
end
