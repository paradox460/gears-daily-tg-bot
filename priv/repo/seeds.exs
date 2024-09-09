if Mix.env() == :dev do
  alias NimbleCSV.RFC4180, as: CSV
  import Ecto.Query

  dailies =
    File.read!("priv/dailies.csv")
    |> CSV.parse_string()
    |> Enum.with_index()
    |> Enum.map(fn {[_date, map, horde_rewards, mutators, escape, escape_rewards | _], idx} ->
      %{
        day: idx,
        map: map,
        horde_reward: horde_rewards,
        mutator: mutators,
        escape: escape,
        escape_reward: escape_rewards
      }
    end)
    # This massive ugly bit of string manipulation is what emojifies everything It
    # could probably be optimized a lot, but its going to be run once, so don't
    # worry about it this is simple and easy to fowllow, if a bit repetetive
    |> Enum.map(fn daily ->
      daily
      |> Map.update!(:mutator, fn mutator ->
        mutator
        |> String.replace(~r/(Ultra Stopping Power)(?=, More)/, "\\1 🛑")
        |> String.replace(~r/(Ultra Stopping Power)(?=, Surv)/, "\\1 🟢")
        |> then(
          &Regex.replace(~r/(\s?[\w\s]+?)(?=[,.])/, &1, fn _, word ->
            emoji =
              case String.trim(word) do
                "Aggressive Enemies" -> "😡"
                "Bobblehead Enemies" -> "🗿"
                "Close Range Gambit" -> "🤏"
                "Confetti Headshot" -> "🎊"
                "Double Headshot Damage" -> "👥"
                "Even Stronger Enemies" -> "💪"
                "Even Tougher Enemies" -> "🪨"
                "Execution Rules" -> "☠️"
                "Frag Rejects" -> "🧨"
                "Freezing Grenadiers" -> "❄️"
                "Freezing Rifles" -> "❄️"
                "Freezing Sniper Bullets" -> "❄️"
                "Ghost Drones" -> "👻"
                "Ghost Enemies" -> "👻"
                "Ghost Flushers" -> "👻"
                "Ghost Heavies" -> "👻"
                "Heads Up" -> "🆙"
                "Healing Heavies" -> "👨‍⚕️"
                "Increased Accuracy" -> "🔫"
                "Instant Reload" -> "⏩"
                "Long Range Gambit" -> "🔭"
                "More Health" -> "⛑️"
                "More Lethal" -> "💀"
                "More Melee Damage" -> "👊"
                "Must Active Reload" -> "🔄"
                "Only Regen in Cover" -> "🫣"
                "Poison Drones" -> "🤮"
                "Poison Flushers" -> "🤮"
                "Power Boost" -> "🔌"
                "Power Drain" -> "🪫"
                "Reduced Bleeding Damage" -> "❤️‍🩹"
                "Reduced Explosive Damage" -> "💥"
                "Reduced Heavy Damage" -> "🪖"
                "Reflective Shell Grenadiers" -> "🐢"
                "Reflective Shell Heavies" -> "🐢"
                "Regen Penalty" -> "💔"
                "Regeneration" -> "🫀"
                "Shielded Grenadiers" -> "🛡️"
                "Shielded Heavies" -> "🛡️"
                "Shock Grenadiers" -> "⚡️"
                "Shock Rifle Drones" -> "⚡️"
                "Shock Snipers" -> "⚡️"
                "Super Charged" -> "🔋"
                "Super Energy" -> "🤑"
                "Survivor" -> "🪦"
                "Triple Headshot Damage" -> "🤯"
                "Triple Melee Damage" -> "🥊"
                "Ultra Power Drain" -> "🪫"
                "Ultra Slow Recharge" -> "🐌"
                "Vampire" -> "🧛"
                "Vampiric Drones" -> "🩸"
                "Zero Gravity Gore" -> "🪽"
                _ -> nil
              end

            "#{word} #{emoji}"
          end)
        )
      end)
      |> Map.update!(:map, fn map ->
        emoji =
          case map do
            "Abyss" -> "🕳️"
            "Allfathers Arena" -> "🏟"
            "Asylum" -> "🏥"
            "Atrium" -> "🚪"
            "Blood Drive" -> "🩸"
            "Bunker" -> "⛰"
            "Canals" -> "💧"
            "Checkout" -> "💸"
            "Clocktower" -> "🏫"
            "Command" -> "🫵"
            "Dam" -> "🦫"
            "Dawn" -> "🌅"
            "District" -> "🕹"
            "Ephyra" -> "🏨"
            "Exhibit" -> "🏛"
            "Forge" -> "🔥"
            "Foundation" -> "🧱"
            "Gridlock" -> "🚘"
            "Harbor" -> "⚓"
            "Icebound" -> "☃"
            "Lift" -> "🏗"
            "Mercy" -> "⛪"
            "Nexus" -> "🌋"
            "Overload" -> "⚙"
            "Pahanu" -> "💩"
            "Rail Line" -> "🚂"
            "Reactor" -> "☢"
            "Reclaimed" -> "👨‍🌾"
            "Regency" -> "👑"
            "Ritual" -> "🦚"
            "River" -> "🏞️"
            "Speyer" -> "🏢"
            "Tomb" -> "🪦"
            "Training Grounds" -> "👟"
            "Turbine" -> "🪜"
            "Vasgar" -> "🛫"
            "Village" -> "🛖"
          end

        "#{map} #{emoji}"
      end)
      |> Map.update!(:escape, fn escape ->
        emoji =
          case String.trim(escape) do
            "Forever" -> "♾️"
            "Ice Queen" -> "🥶"
            "Last Stand" -> "🤺"
            "Lethal Engagements" -> "💀"
            "Melee Brawl" -> "🥊"
            "The Ambush" -> "🐇"
            "The Barracks" -> "🪖"
            "The Blight" -> "🥴"
            "The Choke" -> "🥵"
            "The Clock" -> "⏰"
            "The Corruption" -> "👹"
            "The Descent" -> "⬇️"
            "The Detour" -> "🚧"
            "The End" -> "🔚"
            "The Gatekeepers" -> "🌉"
            "The Gauntlet" -> "🦾"
            "The Hive" -> "🐝"
            "The Hunters" -> "🏹"
            "The Labyrinth" -> "🐂"
            "The Line" -> "😐"
            "The Link" -> "⛓️"
            "The Malfunction" -> "⛓️‍💥"
            "The Mines" -> "⛏️"
            "The Mist" -> "😶‍🌫️"
            "The Onslaught" -> "🦴"
            "The Split" -> "🖖"
            "The Surge" -> "⚡️"
            "The Trap" -> "🪤"
            "The Wanderer" -> "🥾"
            "The Warren" -> "🐰"
            "Venom Run" -> "🐍"
          end

        "#{String.trim(escape)} #{emoji}"
      end)
    end)

  # MARK: Add Mutators
  dailies
  |> Enum.map(&Map.get(&1, :mutator))
  |> Enum.uniq()
  |> Enum.sort()
  |> Enum.map(fn mutator_set ->
    %{mutators: mutator_set}
  end)
  |> then(&GearsDaily.Repo.insert_all(GearsDaily.Mutator, &1))

  # MARK: Add Maps
  dailies
  |> Enum.map(&Map.get(&1, :map))
  |> Enum.uniq()
  |> Enum.sort()
  |> Enum.map(fn map ->
    %{name: map}
  end)
  |> then(&GearsDaily.Repo.insert_all(GearsDaily.Map, &1))

  # MARK: Add Rewards
  dailies
  |> Enum.map(&Map.get(&1, :horde_reward))
  |> Enum.uniq()
  |> Enum.sort()
  |> Enum.map(fn reward ->
    %{reward: reward}
  end)
  |> then(&GearsDaily.Repo.insert_all(GearsDaily.Reward, &1))

  # MARK: Add Escapes
  dailies
  |> Enum.map(&Map.get(&1, :escape))
  |> Enum.uniq()
  |> Enum.sort()
  |> Enum.map(fn escape ->
    %{name: escape}
  end)
  |> then(&GearsDaily.Repo.insert_all(GearsDaily.Escape, &1))

  # Mark: Set dailies

  maps =
    from(m in "maps", select: {m.name, m.id})
    |> GearsDaily.Repo.all()
    |> Enum.into(%{})

  rewards =
    from(r in "rewards", select: {r.reward, r.id})
    |> GearsDaily.Repo.all()
    |> Enum.into(%{})

  escapes =
    from(e in "escapes", select: {e.name, e.id})
    |> GearsDaily.Repo.all()
    |> Enum.into(%{})

  mutators =
    from(m in "mutators", select: {m.mutators, m.id})
    |> GearsDaily.Repo.all()
    |> Enum.into(%{})

  dailies
  |> Enum.map(fn event ->
    %{
      map_id: maps[event.map],
      horde_reward_id: rewards[event.horde_reward],
      escape_reward_id: rewards[event.escape_reward],
      mutator_id: mutators[event.mutator],
      escape_id: escapes[event.escape],
      day: event.day
    }
  end)
  |> then(&GearsDaily.Repo.insert_all("dailies", &1))
end
