defmodule GearsDaily.Mutator do
  use Ecto.Schema
  import Ecto.Changeset

  @type t :: %__MODULE__{}

  schema "mutators" do
    field(:mutators, :string)

    has_many :dailies, GearsDaily.Daily
  end

  def changeset(params), do: changeset(%__MODULE__{}, params)

  def changeset(mutator, params) do
    mutator
    |> cast(params, [:mutators])
    |> validate_required([:mutators])
    |> unique_constraint(:mutators)
  end
end
