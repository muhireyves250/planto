def calculate_deficits(required: dict, current: dict):
    """
    Computes deficits: required - current
    Only returns positive deficits.
    """
    deficits = {
        "N": max(0, required["n"] - current["n"]),
        "P": max(0, required["p"] - current["p"]),
        "K": max(0, required["k"] - current["k"])
    }
    return deficits
