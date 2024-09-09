defmodule GearsDaily.Repo.Migrations.CreateEscapesTable do
  use Ecto.Migration

  def change do
    create table(:escapes) do
      add :name, :string
    end

    create unique_index(:escapes, [:name])
  end
end
