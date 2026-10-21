import { FontLoader, type FontData } from "three/examples/jsm/loaders/FontLoader.js";
// Michroma (SIL OFL 1.1, see michroma.OFL.txt), subset to A–Z, 0–9 and a little punctuation.
import michroma from "../assets/michroma.typeface.json";

/** The brand typeface as a three.js Font, for extruded 3D lettering. */
export const brandFont = new FontLoader().parse(michroma as unknown as FontData);
