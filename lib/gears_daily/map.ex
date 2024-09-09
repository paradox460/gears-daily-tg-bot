defmodule GearsDaily.Map do
  use Ecto.Schema
  import Ecto.Changeset

  @type t :: %__MODULE__{}

  schema "maps" do
    field(:name, :string)

    has_many :dailies, GearsDaily.Daily
  end

  def changeset(params), do: changeset(%__MODULE__{}, params)

  def changeset(map, params) do
    map
    |> cast(params, [:name])
    |> validate_required([:name])
    |> unique_constraint(:name)
  end
end
