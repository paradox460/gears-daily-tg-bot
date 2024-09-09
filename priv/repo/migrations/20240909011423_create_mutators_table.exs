defmodule GearsDaily.Repo.Migrations.CreateMutatorsTable do
  use Ecto.Migration

  def change do
    create table(:mutators) do
      add :mutators, :string
    end

    create unique_index(:mutators, [:mutators])
  end
end
