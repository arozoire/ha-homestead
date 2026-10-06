from custom_components.homestead.crops import cropgraph_traits, full_table, load_cropgraph, load_defaults

TOMATO = {"c": "vegetable", "s": "warm", "d": [55, 90], "w": [["i", "s", -56, -28], ["t", "s", 7, 84]]}


def test_months_follow_the_local_frosts():
    early = cropgraph_traits(TOMATO, {"last_spring": "03-15", "first_fall": "11-15"})
    late = cropgraph_traits(TOMATO, {"last_spring": "05-01", "first_fall": "10-10"})
    assert early["sow_indoor"] == [1, 2] and early["plant_out"] == [3, 4, 5, 6]
    assert late["sow_indoor"] == [3, 4] and late["plant_out"] == [5, 6, 7]
    # Warm crops are harvested until the first frost, not after.
    assert max(late["harvest"]) == 10 and early["warm"] is True
    # Without history: typical northern Italy dates.
    assert cropgraph_traits(TOMATO, None)["plant_out"] == [4, 5, 6, 7]
    lettuce = cropgraph_traits({"c": "vegetable", "s": "cool", "w": [["s", "s", -28, 28]]}, None)
    assert lettuce["heat_max_c"] == 30 and "warm" not in lettuce


def test_built_in_values_win_and_cropgraph_completes():
    table = full_table(load_defaults(), load_cropgraph(), None)
    tomato = table["solanum lycopersicum"]
    assert tomato["source"] == "builtin" and tomato["sow_indoor"] == [2, 3, 4]  # Italian table kept
    assert tomato["family"] == "Solanaceae" and "ocimum basilicum" in tomato["good"]
    assert tomato["end"] == [10] and tomato["warm"] is True
    okra = table["abelmoschus esculentus"]
    assert okra["source"] == "cropgraph" and okra["species"] == "Abelmoschus esculentus"
    assert okra["sow_outdoor"] and okra["end"]
    assert table["prunus avium"]["pruning"] == [7, 8]
    assert len(table) > 1000
