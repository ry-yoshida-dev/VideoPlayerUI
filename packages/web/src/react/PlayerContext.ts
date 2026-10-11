import { createContext } from "react";
import type { Context } from "react";

import type { PlayerContextValue } from "./PlayerContextValue.js";

/**
 * Services of the enclosing {@link VideoPlayer}, available to its children once the player exists.
 */
export const PlayerContext: Context<PlayerContextValue | null> = createContext<PlayerContextValue | null>(null);
