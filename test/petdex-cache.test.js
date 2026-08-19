// @ts-check
import { test } from "node:test";
import assert from "node:assert/strict";
import {
	setCachedMarketSprite,
	getCachedMarketSprite,
	clearPetdexCaches,
	marketSpriteSrc,
	installedSpriteSrc,
	fetchPetMeta,
	PetdexPetMeta,
} from "../src/petdex.js";

test("market sprite cache round-trips bytes and content type", () => {
	setCachedMarketSprite("slime", new Uint8Array([1, 2, 3]), "image/png");
	const hit = getCachedMarketSprite("slime");
	assert.equal(hit.contentType, "image/png");
	assert.deepEqual([...hit.bytes], [1, 2, 3]);
	assert.equal(getCachedMarketSprite("nope"), null);
	clearPetdexCaches();
	assert.equal(getCachedMarketSprite("slime"), null);
});

test("proxy src helpers URL-encode slugs and ids", () => {
	assert.equal(marketSpriteSrc("a b"), "/petdex-market/sprite/a%20b");
	assert.equal(installedSpriteSrc("id/1"), "/petdex-market/installed/id%2F1/sprite");
});

test("fetchPetMeta falls back to default geometry when the fetch fails", async () => {
	const meta = await fetchPetMeta("not-a-url://nope");
	assert.ok(meta instanceof PetdexPetMeta);
	assert.equal(meta.frameWidth, 192);
	assert.equal(meta.frameHeight, 208);
	assert.equal(meta.states.length, 9);
});
