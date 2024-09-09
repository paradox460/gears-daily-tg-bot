defmodule GearsDaily.Repo.Migrations.CreateMapsTable do
  use Ecto.Migration

  def change do
    create table(:maps) do
      add :name, :string
    end

    create unique_index(:maps, [:name])
  end
end
