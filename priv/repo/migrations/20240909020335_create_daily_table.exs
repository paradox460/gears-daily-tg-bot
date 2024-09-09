defmodule GearsDaily.Repo.Migrations.CreateDailyTable do
  use Ecto.Migration

  def change do
    create table(:dailies) do
      add :day, :integer

      add :map_id, references("maps")
      add :horde_reward_id, references("rewards")
      add :mutator_id, references("mutators")
      add :escape_id, references("escapes")
      add :escape_reward_id, references("rewards")
    end

    create unique_index(:dailies, [:day])
  end
end
