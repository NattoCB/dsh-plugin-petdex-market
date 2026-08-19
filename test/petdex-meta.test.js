// @ts-check
import { test } from "node:test";
import assert from "node:assert/strict";
import {
	PetdexManifestPet,
	PetdexPetMeta,
	PetdexInstalledPet,
	PETDEX_STATE_ROWS,
	stateRowIndex,
} from "../src/petdex.js";

test("PETDEX_STATE_ROWS covers the nine canonical spritesheet rows", () => {
	assert.equal(PETDEX_STATE_ROWS.length, 9);
	assert.equal(PETDEX_STATE_ROWS[0], "idle");
	assert.ok(PETDEX_STATE_ROWS.includes("running-right"));
	assert.ok(PETDEX_STATE_ROWS.includes("running-left"));
});

test("PetdexManifestPet maps fields and defaults submittedBy to null", () => {
	const pet = new PetdexManifestPet({
		slug: "slime",
		displayName: "Slime",
		kind: "mascot",
		submittedBy: undefined,
		spritesheetUrl: "https://a/s.png",
		petJsonUrl: "https://a/p.json",
		zipUrl: "https://a/z.zip",
	});
	assert.equal(pet.slug, "slime");
	assert.equal(pet.displayName, "Slime");
	assert.equal(pet.kind, "mascot");
	assert.equal(pet.submittedBy, null);
});

test("PetdexPetMeta defaults to the canonical 8x9 192x208 geometry", () => {
	const meta = new PetdexPetMeta();
	assert.equal(meta.cols, 8);
	assert.equal(meta.rows, 9);
	assert.equal(meta.frameWidth, 192);
	assert.equal(meta.frameHeight, 208);
	assert.equal(meta.fps, 6);
	assert.equal(meta.states.length, 9);
	assert.equal(meta.states[3].name, "waving");
});

test("stateRowIndex resolves custom rows and falls back to canonical ones", () => {
	const meta = new PetdexPetMeta();
	meta.states = [
		{ name: "idle", row: 0, frames: 6 },
		{ name: "dance", row: 5, frames: 3 },
	];
	assert.equal(stateRowIndex(meta, "dance"), 5);
	assert.equal(stateRowIndex(meta, "jumping"), 4);
	assert.equal(stateRowIndex(meta, "unknown"), 0);
});

test("PetdexInstalledPet initializes enabled and stamps installedAt", () => {
	const pet = new PetdexInstalledPet();
	assert.equal(pet.enabled, true);
	assert.ok(!Number.isNaN(Date.parse(pet.installedAt)));
});
