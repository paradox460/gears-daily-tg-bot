defmodule GearsDaily.Escape do
  use Ecto.Schema
  import Ecto.Changeset

  @type t :: %__MODULE__{}

  schema "escapes" do
    field(:name, :string)
    has_many :dailies, GearsDaily.Daily
  end

  def changeset(params), do: changeset(%__MODULE__{}, params)

  def changeset(escape, params) do
    escape
    |> cast(params, [:name])
    |> validate_required([:name])
    |> unique_constraint(:name)
  end
end
