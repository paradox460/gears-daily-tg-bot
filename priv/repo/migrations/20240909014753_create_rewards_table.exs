defmodule GearsDaily.Repo.Migrations.CreateRewardsTable do
  use Ecto.Migration

  def change do
    create table(:rewards) do
      add :reward, :string
    end

    create unique_index(:rewards, [:reward])
  end
end
